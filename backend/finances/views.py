from collections import Counter, defaultdict
from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from base.models import Match, Tournament, Team, ZoneTeam
from .models import (
    Partner, StaffRate, TournamentFee, TeamRegistration, TeamAccountAdjustment,
    RateChange, FinancialDay, DayIncome, DayExpense, GeneralMovement
)
from .serializers import (
    PartnerSerializer, StaffRateSerializer, TeamRegistrationSerializer,
    TeamAccountAdjustmentSerializer, RateChangeSerializer,
    FinancialDaySerializer, FinancialDayDetailSerializer,
    DayIncomeSerializer, DayExpenseSerializer,
    GeneralMovementSerializer, day_totals, get_team_total_debt_map
)

ZERO = Decimal('0')


class IsAdmin(permissions.BasePermission):
    """Solo administradores (superusuarios)."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_superuser)


def fee_for(tournament_id, date):
    """Arancel vigente de un torneo en una fecha (según historial de aumentos)."""
    rc = RateChange.objects.filter(kind='equipo', tournament_id=tournament_id,
                                   effective_from__lte=date).first()
    if rc:
        return rc.new_amount
    tf = TournamentFee.objects.filter(tournament_id=tournament_id).first()
    return tf.amount if tf else ZERO


def _log_change(request, kind, old, new, **kw):
    if Decimal(str(old)) == Decimal(str(new)):
        return
    RateChange.objects.create(
        kind=kind, old_amount=old, new_amount=new, changed_by=request.user,
        effective_from=request.data.get('effective_from') or timezone.localdate(),
        note=request.data.get('note', ''), **kw)


def sync_tournament_registrations():
    """
    Asegura que todo equipo actualmente asignado a una zona de un torneo (ZoneTeam)
    tenga su registro de inscripción (TeamRegistration) creado con el valor del torneo.
    """
    fees_map = {
        tf.tournament_id: (tf.registration_fee if tf.registration_fee > 0 else tf.amount)
        for tf in TournamentFee.objects.all()
    }
    existing_pairs = set(TeamRegistration.objects.values_list('team_id', 'tournament_id'))

    to_create = []
    seen = set()
    for zt in ZoneTeam.objects.select_related('zone').all():
        pair = (zt.team_id, zt.zone.tournament_id)
        if pair in existing_pairs or pair in seen:
            continue
        seen.add(pair)
        base_amt = fees_map.get(zt.zone.tournament_id, ZERO)
        to_create.append(TeamRegistration(
            team_id=zt.team_id,
            tournament_id=zt.zone.tournament_id,
            base_amount=base_amt,
            discount=ZERO,
            status='activa',
        ))
    if to_create:
        TeamRegistration.objects.bulk_create(to_create, ignore_conflicts=True)

    # Actualizar inscripciones activas sin monto base personalizado si el torneo ya definió arancel
    for reg in TeamRegistration.objects.filter(custom_base=False, base_amount=0):
        t_fee = fees_map.get(reg.tournament_id, ZERO)
        if t_fee > 0:
            reg.base_amount = t_fee
            reg.save(update_fields=['base_amount'])


class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAdmin]


class StaffRateViewSet(viewsets.ModelViewSet):
    queryset = StaffRate.objects.all()
    serializer_class = StaffRateSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        obj = serializer.save()
        _log_change(self.request, 'staff', 0, obj.amount, staff_rate=obj)

    def perform_update(self, serializer):
        old = serializer.instance.amount
        obj = serializer.save()
        _log_change(self.request, 'staff', old, obj.amount, staff_rate=obj)


class TeamRegistrationViewSet(viewsets.ModelViewSet):
    queryset = TeamRegistration.objects.select_related('team', 'tournament').all()
    serializer_class = TeamRegistrationSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        sync_tournament_registrations()
        qs = super().get_queryset()
        team_id = self.request.query_params.get('team')
        tournament_id = self.request.query_params.get('tournament')
        if team_id:
            qs = qs.filter(team_id=team_id)
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs

    def create(self, request, *args, **kwargs):
        team_id = request.data.get('team')
        tournament_id = request.data.get('tournament')
        if not team_id or not tournament_id:
            raise ValidationError({'detail': 'Equipo y torneo son obligatorios.'})
        defaults = {}
        for field in ('base_amount', 'discount', 'custom_base', 'status', 'note'):
            if field in request.data:
                defaults[field] = request.data[field]
        obj, _ = TeamRegistration.objects.update_or_create(
            team_id=team_id,
            tournament_id=tournament_id,
            defaults=defaults,
        )
        return Response(TeamRegistrationSerializer(obj).data, status=status.HTTP_200_OK)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_base = serializer.validated_data.get('base_amount', instance.base_amount)
        custom_base = serializer.validated_data.get('custom_base', instance.custom_base)
        if new_base != instance.base_amount and 'custom_base' not in serializer.validated_data:
            custom_base = True
        serializer.save(custom_base=custom_base)


class RateChangeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RateChangeSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = RateChange.objects.select_related('tournament', 'staff_rate', 'changed_by')
        kind = self.request.query_params.get('kind')
        return qs.filter(kind=kind) if kind else qs


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def tournament_fees(request):
    """
    GET: arancel por fecha e inscripción actual de cada torneo.
    POST {tournament, amount?, registration_fee?, effective_from?, note?}.
    """
    if request.method == 'POST':
        t = Tournament.objects.filter(pk=request.data.get('tournament')).first()
        if not t:
            raise ValidationError({'tournament': 'Torneo inexistente.'})
        fee, created = TournamentFee.objects.get_or_create(tournament=t)
        old_amount = fee.amount

        if 'amount' in request.data and request.data.get('amount') is not None:
            new_amount = Decimal(str(request.data.get('amount', 0)))
            _log_change(request, 'equipo', old_amount, new_amount, tournament=t)
            # Si no enviaron registration_fee explícito y antes coincidía con el partido (o era 0), sincronizarlo
            if 'registration_fee' not in request.data and (
                created or fee.registration_fee == 0 or fee.registration_fee == old_amount
            ):
                fee.registration_fee = new_amount
            fee.amount = new_amount

        if 'registration_fee' in request.data and request.data.get('registration_fee') is not None:
            fee.registration_fee = Decimal(str(request.data.get('registration_fee', 0)))

        fee.save()

        # Actualizar el monto base de las inscripciones de ese torneo que no tengan base personalizada
        effective_reg = fee.registration_fee if fee.registration_fee > 0 else fee.amount
        TeamRegistration.objects.filter(tournament=t, custom_base=False).update(base_amount=effective_reg)

    fees_obj = {f.tournament_id: f for f in TournamentFee.objects.all()}
    result = []
    for t in Tournament.objects.select_related('category').order_by('name'):
        f = fees_obj.get(t.id)
        amt = f.amount if f else ZERO
        reg_fee = f.registration_fee if f else ZERO
        result.append({
            'tournament': t.id,
            'tournament_name': t.name,
            'category_name': t.category.name if t.category else 'Sin Asignar',
            'amount': amt,
            'registration_fee': reg_fee,
        })
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAdmin])
def team_accounts(request):
    """
    Estado de cuenta corriente unificada de todos los equipos:
    Saldo inicial (Excel) + Inscripciones (base - descuento) + Partidos (debe - pagos) - Cobros de deuda en Caja General.
    """
    sync_tournament_registrations()

    teams = list(Team.objects.select_related('category', 'account_adjustment').order_by('name'))
    zone_teams = ZoneTeam.objects.select_related('zone__tournament').all()
    registrations = TeamRegistration.objects.select_related('tournament').all()
    incomes = DayIncome.objects.filter(kind='cancha', team__isnull=False).select_related('day', 'tournament').order_by('-day__date', '-id')
    movements = GeneralMovement.objects.filter(category='cobro_deuda', team__isnull=False).order_by('-date', '-id')

    zones_by_team = defaultdict(list)
    active_zone_pairs = set()
    for zt in zone_teams:
        zones_by_team[zt.team_id].append({
            'tournament_id': zt.zone.tournament_id,
            'tournament_name': zt.zone.tournament.name,
            'zone_id': zt.zone_id,
            'zone_name': zt.zone.name,
        })
        active_zone_pairs.add((zt.team_id, zt.zone.tournament_id))

    regs_by_team = defaultdict(list)
    for r in registrations:
        regs_by_team[r.team_id].append(r)

    incomes_by_team = defaultdict(list)
    for inc in incomes:
        incomes_by_team[inc.team_id].append(inc)

    movements_by_team = defaultdict(list)
    for mov in movements:
        movements_by_team[mov.team_id].append(mov)

    data = []
    for t in teams:
        adj = getattr(t, 'account_adjustment', None)
        initial_debt = adj.initial_debt if adj else ZERO
        initial_note = adj.note if adj else ''

        t_regs = regs_by_team[t.id]
        reg_base = sum((r.base_amount for r in t_regs if r.status != 'baja'), ZERO)
        reg_discount = sum(
            ((r.base_amount if r.status == 'bonificada' else r.discount) for r in t_regs if r.status != 'baja'),
            ZERO
        )
        reg_due = sum((r.net_amount for r in t_regs), ZERO)

        t_incomes = incomes_by_team[t.id]
        matches_due = sum((i.amount_due for i in t_incomes), ZERO)
        matches_paid = sum((i.cash + i.transfer for i in t_incomes), ZERO)

        t_movements = movements_by_team[t.id]
        general_paid = sum((m.amount if m.type == 'ingreso' else -m.amount for m in t_movements), ZERO)

        total_charges = initial_debt + reg_due + matches_due
        total_paid = matches_paid + general_paid
        total_debt = total_charges - total_paid

        reg_list = []
        for r in t_regs:
            reg_list.append({
                'id': r.id,
                'team': t.id,
                'tournament': r.tournament_id,
                'tournament_name': r.tournament.name,
                'base_amount': r.base_amount,
                'discount': r.discount,
                'custom_base': r.custom_base,
                'status': r.status,
                'note': r.note,
                'net_amount': r.net_amount,
                'in_zone': (t.id, r.tournament_id) in active_zone_pairs,
            })

        history_items = []
        if initial_debt != 0:
            history_items.append({
                'kind': 'initial',
                'date': adj.updated_at.strftime('%Y-%m-%d') if adj and adj.updated_at else None,
                'title': 'Saldo inicial migrado',
                'subtitle': initial_note or 'Migración de saldo previo',
                'charge': initial_debt if initial_debt > 0 else ZERO,
                'payment': abs(initial_debt) if initial_debt < 0 else ZERO,
                'balance_impact': initial_debt,
            })

        for r in t_regs:
            status_label = (
                'Bonificada 100%' if r.status == 'bonificada'
                else 'Eximida / Baja' if r.status == 'baja'
                else f"Descuento ${int(r.discount)}" if r.discount > 0
                else 'Inscripción estándar'
            )
            history_items.append({
                'kind': 'registration',
                'id': r.id,
                'date': r.created_at.strftime('%Y-%m-%d') if r.created_at else None,
                'title': f"Inscripción — {r.tournament.name}",
                'subtitle': f"{status_label}{f' · {r.note}' if r.note else ''}",
                'charge': r.net_amount,
                'payment': ZERO,
                'balance_impact': r.net_amount,
            })

        for i in t_incomes:
            paid = i.cash + i.transfer
            methods = []
            if i.cash > 0:
                methods.append(f"Efvo ${int(i.cash)}")
            if i.transfer > 0:
                methods.append(f"Transf ${int(i.transfer)}")
            history_items.append({
                'kind': 'match',
                'id': i.id,
                'day_id': i.day_id,
                'date': i.day.date.strftime('%Y-%m-%d'),
                'title': f"Fecha {i.day.date.strftime('%d/%m/%Y')} — {i.tournament.name if i.tournament else (i.concept or 'Partido')}",
                'subtitle': ' + '.join(methods) if methods else 'Sin pago registrado en fecha',
                'charge': i.amount_due,
                'payment': paid,
                'balance_impact': i.amount_due - paid,
            })

        for m in t_movements:
            amt = m.amount if m.type == 'ingreso' else -m.amount
            history_items.append({
                'kind': 'movement',
                'id': m.id,
                'date': m.date.strftime('%Y-%m-%d'),
                'title': m.concept or 'Cobro en Caja General',
                'subtitle': f"Caja General ({m.method})",
                'charge': ZERO,
                'payment': amt,
                'balance_impact': -amt,
            })

        data.append({
            'team': t.id,
            'team_name': t.name,
            'category': t.category_id,
            'category_name': t.category.name if t.category else 'Sin Asignar',
            'is_active': t.is_active,
            'tournaments': zones_by_team[t.id],
            'initial_debt': initial_debt,
            'initial_note': initial_note,
            'registrations': reg_list,
            'registration_base': reg_base,
            'registration_discount': reg_discount,
            'registration_due': reg_due,
            'matches_count': len(t_incomes),
            'matches_due': matches_due,
            'matches_paid': matches_paid,
            'general_paid': general_paid,
            'total_charges': total_charges,
            'total_paid': total_paid,
            'total_debt': total_debt,
            'history': history_items,
        })

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdmin])
@transaction.atomic
def team_initial_balances(request):
    """
    Actualiza el saldo inicial migrado (Excel) de uno o varios equipos.
    Acepta { team, initial_debt, note? } o { items: [{ team, initial_debt, note? }, ...] }.
    """
    items = request.data.get('items')
    if items is None:
        items = [request.data]

    updated = []
    for item in items:
        team_id = item.get('team')
        if not team_id:
            continue
        debt_val = Decimal(str(item.get('initial_debt') or 0))
        note_val = item.get('note', 'Saldo inicial migrado')
        obj, _ = TeamAccountAdjustment.objects.update_or_create(
            team_id=team_id,
            defaults={
                'initial_debt': debt_val,
                'note': note_val,
            }
        )
        updated.append(TeamAccountAdjustmentSerializer(obj).data)

    return Response({'updated': len(updated), 'items': updated})


class GeneralMovementViewSet(viewsets.ModelViewSet):
    serializer_class = GeneralMovementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = GeneralMovement.objects.select_related('team', 'partner', 'financial_day')
        p = self.request.query_params
        if p.get('type'):
            qs = qs.filter(type=p['type'])
        if p.get('from'):
            qs = qs.filter(date__gte=p['from'])
        if p.get('to'):
            qs = qs.filter(date__lte=p['to'])
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        if instance.financial_day_id:
            raise ValidationError(
                'Este movimiento corresponde al cierre de una Caja de Fecha. '
                'Para eliminarlo o modificarlo, reabrí o eliminá la planilla desde Caja de Fecha.'
            )
        instance.delete()


class _DayItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]

    def _check_open(self, day):
        if day.status == 'cerrada':
            raise ValidationError('La jornada está cerrada. Reabrila para modificarla.')

    def get_queryset(self):
        qs = self.queryset
        day = self.request.query_params.get('day')
        return qs.filter(day_id=day) if day else qs

    def perform_create(self, serializer):
        self._check_open(serializer.validated_data['day'])
        serializer.save()

    def perform_update(self, serializer):
        self._check_open(serializer.instance.day)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_open(instance.day)
        instance.delete()


class DayIncomeViewSet(_DayItemViewSet):
    queryset = DayIncome.objects.select_related('team', 'tournament')
    serializer_class = DayIncomeSerializer


class DayExpenseViewSet(_DayItemViewSet):
    queryset = DayExpense.objects.select_related('partner')
    serializer_class = DayExpenseSerializer


class FinancialDayViewSet(viewsets.ModelViewSet):
    queryset = FinancialDay.objects.prefetch_related('incomes', 'expenses')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return FinancialDayDetailSerializer if self.action == 'retrieve' else FinancialDaySerializer

    def _open_day(self):
        day = self.get_object()
        if day.status == 'cerrada':
            raise ValidationError('La jornada está cerrada.')
        return day

    def perform_update(self, serializer):
        if serializer.instance.status == 'cerrada':
            raise ValidationError('La jornada está cerrada.')
        serializer.save()

    def perform_destroy(self, instance):
        # Permite eliminar planillas abiertas o cerradas si se completaron mal
        instance.delete()

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def prefill(self, request, pk=None):
        """Precarga cobros (según fixture del día y arancel vigente) y staff base."""
        sync_tournament_registrations()
        day = self._open_day()
        matches = Match.objects.filter(
            Q(date=day.date) | Q(date__isnull=True, match_round__date=day.date)
        ).select_related('match_round__tournament_zone__tournament', 'local_team', 'visitor_team')

        existing = set(day.incomes.filter(kind='cancha').values_list('team_id', 'tournament_id'))
        for m in matches:
            t = m.match_round.tournament_zone.tournament
            for team in (m.local_team, m.visitor_team):
                if (team.id, t.id) in existing:
                    continue
                existing.add((team.id, t.id))
                DayIncome.objects.create(day=day, kind='cancha', team=team, tournament=t,
                                         concept=t.name, amount_due=fee_for(t.id, day.date))

        existing_rates = set(day.expenses.filter(staff_rate__isnull=False).values_list('staff_rate_id', flat=True))
        existing_concepts = set(day.expenses.values_list('concept', flat=True))

        # 1. Todos los ítems de Staff (incluyendo árbitros) que tengan "Auto en fecha" activado
        auto_rates = list(StaffRate.objects.filter(active=True, auto_include=True))
        counts = Counter((m.arbitro or '').strip() for m in matches if (m.arbitro or '').strip())
        matched_fixture_names = set()

        for r in auto_rates:
            if r.id in existing_rates or r.name in existing_concepts:
                continue
            units = 1
            if r.category == 'arbitro':
                # Si el árbitro figura asignado en partidos del fixture, calcular su cantidad de partidos
                for fix_name, cnt in counts.items():
                    if fix_name.lower() in r.name.lower() or r.name.lower() in fix_name.lower():
                        units = cnt
                        matched_fixture_names.add(fix_name)
                        break
            DayExpense.objects.create(
                day=day, category=r.category, staff_rate=r, concept=r.name,
                units=units, unit_amount=r.amount, amount=units * r.amount
            )
            existing_rates.add(r.id)
            existing_concepts.add(r.name)

        # 2. Si hay árbitros escritos en el fixture que no estaban como tarifa "Auto en fecha"
        ref_rate = StaffRate.objects.filter(category='arbitro', active=True).first()
        for name, n in counts.items():
            if name in matched_fixture_names:
                continue
            concept_name = f'Árbitro {name}'
            if concept_name in existing_concepts or name in existing_concepts:
                continue
            unit = ref_rate.amount if ref_rate else ZERO
            DayExpense.objects.create(
                day=day, category='arbitro', staff_rate=ref_rate,
                concept=concept_name, units=n, unit_amount=unit, amount=n * unit
            )
            existing_concepts.add(concept_name)

        return Response(FinancialDayDetailSerializer(day).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Arqueo + aprobación. Body: {cash_counted}."""
        day = self._open_day()
        counted = request.data.get('cash_counted')
        if counted in (None, ''):
            raise ValidationError({'cash_counted': 'Ingresá el efectivo contado para cerrar.'})
        day.cash_counted = Decimal(str(counted))
        day.status = 'cerrada'
        day.approved_at = timezone.now()
        day.approved_by = request.user
        day.save()

        # Registrar el monto esperado del arqueo en Caja General como línea de ingreso
        totals = day_totals(day)
        expected_cash = totals['expected_cash']
        concept = f"Caja de Fecha {day.date.strftime('%d/%m/%Y')}"
        if day.name:
            concept += f" - {day.name}"

        GeneralMovement.objects.update_or_create(
            financial_day=day,
            defaults={
                'type': 'ingreso',
                'category': 'caja_fecha',
                'method': 'efectivo',
                'concept': concept,
                'amount': expected_cash,
                'date': day.date,
                'created_by': request.user,
            }
        )
        return Response(FinancialDayDetailSerializer(day).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        day = self.get_object()
        day.status, day.approved_at, day.approved_by = 'abierta', None, None
        day.save()
        # Al reabrir, se elimina la línea de caja general hasta su próximo cierre
        GeneralMovement.objects.filter(financial_day=day).delete()
        return Response(FinancialDayDetailSerializer(day).data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def summary(request):
    """Saldos de caja, deuda unificada de equipos y cuenta corriente de socios."""
    sync_tournament_registrations()

    bal = {'efectivo': ZERO, 'transferencia': ZERO}
    for day in FinancialDay.objects.filter(status='cerrada').prefetch_related('incomes', 'expenses'):
        t = day_totals(day)
        bal['transferencia'] += t['transfer_in'] - t['transfer_out']
        if not GeneralMovement.objects.filter(financial_day=day).exists():
            bal['efectivo'] += t['expected_cash']

    partner_owed = defaultdict(lambda: ZERO)
    for m in GeneralMovement.objects.all():
        if m.method in bal:
            bal[m.method] += m.amount if m.type == 'ingreso' else -m.amount
        if m.partner_id:
            if m.type == 'egreso' and m.method == 'socio':
                partner_owed[m.partner_id] += m.amount
            elif m.category == 'reintegro_socio':
                partner_owed[m.partner_id] -= m.amount
    for e in DayExpense.objects.filter(method='socio', partner__isnull=False):
        partner_owed[e.partner_id] += e.amount

    team_debt = get_team_total_debt_map()
    teams = {t.id: t.name for t in Team.objects.filter(id__in=team_debt.keys())}
    partners = {p.id: p.name for p in Partner.objects.all()}
    return Response({
        'cash': bal['efectivo'], 'bank': bal['transferencia'],
        'total': bal['efectivo'] + bal['transferencia'],
        'team_debts': sorted(({'team': k, 'team_name': teams.get(k, '—'), 'debt': v}
                              for k, v in team_debt.items() if v != 0),
                             key=lambda x: -x['debt']),
        'partner_balances': [{'partner': k, 'partner_name': partners.get(k, '—'), 'owed': v}
                             for k, v in partner_owed.items()],
    })
