from decimal import Decimal
from django.db.models import Sum, F
from rest_framework import serializers
from .models import (
    Partner, StaffRate, TournamentFee, TeamRegistration, TeamAccountAdjustment,
    RateChange, FinancialDay, DayIncome, DayExpense, GeneralMovement
)

ZERO = Decimal('0')


def get_team_total_debt_map(team_ids=None):
    """Calcula el saldo total de cuenta corriente (deuda > 0, a favor < 0) para los equipos indicados."""
    from collections import defaultdict
    totals = defaultdict(lambda: ZERO)

    adj_qs = TeamAccountAdjustment.objects.all()
    reg_qs = TeamRegistration.objects.exclude(status__in=['bonificada', 'baja'])
    inc_qs = DayIncome.objects.filter(kind='cancha', team__isnull=False)
    mov_qs = GeneralMovement.objects.filter(category='cobro_deuda', team__isnull=False)

    if team_ids is not None:
        adj_qs = adj_qs.filter(team_id__in=team_ids)
        reg_qs = reg_qs.filter(team_id__in=team_ids)
        inc_qs = inc_qs.filter(team_id__in=team_ids)
        mov_qs = mov_qs.filter(team_id__in=team_ids)

    for adj in adj_qs:
        totals[adj.team_id] += adj.initial_debt

    for reg in reg_qs:
        totals[reg.team_id] += reg.net_amount

    for inc in inc_qs:
        totals[inc.team_id] += (inc.amount_due - inc.cash - inc.transfer)

    for mov in mov_qs:
        if mov.type == 'ingreso':
            totals[mov.team_id] -= mov.amount
        else:
            totals[mov.team_id] += mov.amount

    return totals


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = '__all__'


class StaffRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffRate
        fields = '__all__'


class TeamRegistrationSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True, default=None)
    net_amount = serializers.SerializerMethodField()

    class Meta:
        model = TeamRegistration
        fields = [
            'id', 'team', 'team_name', 'tournament', 'tournament_name',
            'base_amount', 'discount', 'custom_base', 'status', 'note',
            'net_amount', 'created_at', 'updated_at',
        ]

    def get_net_amount(self, obj):
        return obj.net_amount


class TeamAccountAdjustmentSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)

    class Meta:
        model = TeamAccountAdjustment
        fields = ['id', 'team', 'team_name', 'initial_debt', 'note', 'updated_at']


class RateChangeSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name', read_only=True, default=None)
    staff_name = serializers.CharField(source='staff_rate.name', read_only=True, default=None)
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True, default=None)

    class Meta:
        model = RateChange
        fields = '__all__'


class DayIncomeSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True, default=None)
    debt = serializers.SerializerMethodField()
    prior_debt = serializers.SerializerMethodField()

    class Meta:
        model = DayIncome
        fields = '__all__'

    def get_debt(self, obj):
        return (obj.amount_due - obj.cash - obj.transfer) if obj.kind == 'cancha' else ZERO

    def get_prior_debt(self, obj):
        if obj.kind != 'cancha' or not obj.team_id:
            return ZERO
        debt_map = self.context.get('team_debt_map')
        if debt_map is not None:
            total_debt = debt_map.get(obj.team_id, ZERO)
        else:
            total_debt = get_team_total_debt_map([obj.team_id]).get(obj.team_id, ZERO)
        row_diff = obj.amount_due - obj.cash - obj.transfer
        return total_debt - row_diff


class DayExpenseSerializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source='partner.name', read_only=True, default=None)

    class Meta:
        model = DayExpense
        fields = '__all__'
        extra_kwargs = {'amount': {'required': False}}

    def validate(self, data):
        if 'amount' not in data:
            units = data.get('units', getattr(self.instance, 'units', 1))
            unit_amount = data.get('unit_amount', getattr(self.instance, 'unit_amount', 0))
            data['amount'] = units * unit_amount
        if data.get('method', getattr(self.instance, 'method', None)) == 'socio' and not (
                data.get('partner') or getattr(self.instance, 'partner', None)):
            raise serializers.ValidationError({'partner': 'Indicá qué socio puso el dinero.'})
        return data


class GeneralMovementSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True, default=None)
    partner_name = serializers.CharField(source='partner.name', read_only=True, default=None)

    class Meta:
        model = GeneralMovement
        fields = '__all__'
        read_only_fields = ['created_by']


def day_totals(day):
    inc, exp = list(day.incomes.all()), list(day.expenses.all())
    cash_in = sum((i.cash for i in inc), ZERO)
    transfer_in = sum((i.transfer for i in inc), ZERO)
    due = sum((i.amount_due for i in inc if i.kind == 'cancha'), ZERO)
    paid_teams = sum((i.cash + i.transfer for i in inc if i.kind == 'cancha'), ZERO)
    cash_out = sum((e.amount for e in exp if e.method == 'efectivo'), ZERO)
    transfer_out = sum((e.amount for e in exp if e.method == 'transferencia'), ZERO)
    partner_out = sum((e.amount for e in exp if e.method == 'socio'), ZERO)
    expected_cash = cash_in - cash_out
    return {
        'due': due, 'paid_teams': paid_teams, 'team_debt': due - paid_teams,
        'cash_in': cash_in, 'transfer_in': transfer_in, 'total_in': cash_in + transfer_in,
        'cash_out': cash_out, 'transfer_out': transfer_out, 'partner_out': partner_out,
        'total_out': cash_out + transfer_out + partner_out,
        'net': cash_in + transfer_in - cash_out - transfer_out - partner_out,
        'expected_cash': expected_cash,
        'cash_diff': (day.cash_counted - expected_cash) if day.cash_counted is not None else None,
    }


class FinancialDaySerializer(serializers.ModelSerializer):
    totals = serializers.SerializerMethodField()

    class Meta:
        model = FinancialDay
        fields = ['id', 'date', 'name', 'status', 'cash_counted', 'notes', 'approved_at', 'totals']
        read_only_fields = ['status', 'approved_at']

    def get_totals(self, obj):
        return day_totals(obj)


class FinancialDayDetailSerializer(FinancialDaySerializer):
    incomes = serializers.SerializerMethodField()
    expenses = DayExpenseSerializer(many=True, read_only=True)

    class Meta(FinancialDaySerializer.Meta):
        fields = FinancialDaySerializer.Meta.fields + ['incomes', 'expenses']

    def get_incomes(self, obj):
        incomes_list = list(obj.incomes.all())
        team_ids = [i.team_id for i in incomes_list if i.team_id]
        debt_map = get_team_total_debt_map(team_ids) if team_ids else {}
        ctx = {**self.context, 'team_debt_map': debt_map}
        return DayIncomeSerializer(incomes_list, many=True, context=ctx).data
