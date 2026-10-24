from collections import Counter, defaultdict
from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from base.models import Match, Tournament
from .models import (Partner, StaffRate, TournamentFee, RateChange, FinancialDay,
                     DayIncome, DayExpense, GeneralMovement)
from .serializers import (PartnerSerializer, StaffRateSerializer, RateChangeSerializer,
                          FinancialDaySerializer, FinancialDayDetailSerializer,
                          DayIncomeSerializer, DayExpenseSerializer,
                          GeneralMovementSerializer, day_totals)

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
    return rc.new_amount if rc else ZERO


def _log_change(request, kind, old, new, **kw):
    if Decimal(str(old)) == Decimal(str(new)):
        return
    RateChange.objects.create(
        kind=kind, old_amount=old, new_amount=new, changed_by=request.user,
        effective_from=request.data.get('effective_from') or timezone.localdate(),
        note=request.data.get('note', ''), **kw)


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
    """GET: arancel actual de cada torneo. POST {tournament, amount, effective_from?, note?}."""
    if request.method == 'POST':
        t = Tournament.objects.filter(pk=request.data.get('tournament')).first()
        if not t:
            raise ValidationError({'tournament': 'Torneo inexistente.'})
        new = Decimal(str(request.data.get('amount', 0)))
        fee, _ = TournamentFee.objects.get_or_create(tournament=t)
        _log_change(request, 'equipo', fee.amount, new, tournament=t)
        fee.amount = new
        fee.save()
    fees = {f.tournament_id: f.amount for f in TournamentFee.objects.all()}
    return Response([{'tournament': t.id, 'tournament_name': t.name, 'amount': fees.get(t.id, ZERO)}
                     for t in Tournament.objects.order_by('name')])


class GeneralMovementViewSet(viewsets.ModelViewSet):
    serializer_class = GeneralMovementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = GeneralMovement.objects.select_related('team', 'partner')
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
        if instance.status == 'cerrada':
            raise ValidationError('No se puede eliminar una jornada cerrada.')
        instance.delete()

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def prefill(self, request, pk=None):
        """Precarga cobros (según fixture del día y arancel vigente) y staff base."""
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

        if not day.expenses.exists():
            ref_rate = StaffRate.objects.filter(category='arbitro', active=True).first()
            counts = Counter((m.arbitro or '').strip() for m in matches if (m.arbitro or '').strip())
            for name, n in counts.items():
                unit = ref_rate.amount if ref_rate else ZERO
                DayExpense.objects.create(day=day, category='arbitro', staff_rate=ref_rate,
                                          concept=f'Árbitro {name}', units=n,
                                          unit_amount=unit, amount=n * unit)
            for r in StaffRate.objects.filter(active=True, auto_include=True).exclude(category='arbitro'):
                DayExpense.objects.create(day=day, category=r.category, staff_rate=r, concept=r.name,
                                          units=1, unit_amount=r.amount, amount=r.amount)
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
        return Response(FinancialDayDetailSerializer(day).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        day = self.get_object()
        day.status, day.approved_at, day.approved_by = 'abierta', None, None
        day.save()
        return Response(FinancialDayDetailSerializer(day).data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def summary(request):
    """Saldos de caja, deuda de equipos y cuenta corriente de socios."""
    bal = {'efectivo': ZERO, 'transferencia': ZERO}
    for day in FinancialDay.objects.filter(status='cerrada').prefetch_related('incomes', 'expenses'):
        t = day_totals(day)
        bal['efectivo'] += t['cash_in'] - t['cash_out']
        bal['transferencia'] += t['transfer_in'] - t['transfer_out']

    partner_owed = defaultdict(lambda: ZERO)
    team_debt = defaultdict(lambda: ZERO)
    for m in GeneralMovement.objects.all():
        if m.method in bal:
            bal[m.method] += m.amount if m.type == 'ingreso' else -m.amount
        if m.partner_id:
            if m.type == 'egreso' and m.method == 'socio':
                partner_owed[m.partner_id] += m.amount
            elif m.category == 'reintegro_socio':
                partner_owed[m.partner_id] -= m.amount
        if m.team_id and m.category == 'cobro_deuda':
            team_debt[m.team_id] -= m.amount
    for e in DayExpense.objects.filter(method='socio', partner__isnull=False):
        partner_owed[e.partner_id] += e.amount
    for i in DayIncome.objects.filter(kind='cancha', team__isnull=False):
        team_debt[i.team_id] += i.amount_due - i.cash - i.transfer

    from base.models import Team
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
