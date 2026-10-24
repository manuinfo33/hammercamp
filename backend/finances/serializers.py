from decimal import Decimal
from rest_framework import serializers
from .models import (Partner, StaffRate, TournamentFee, RateChange, FinancialDay,
                     DayIncome, DayExpense, GeneralMovement)

ZERO = Decimal('0')


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = '__all__'


class StaffRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffRate
        fields = '__all__'


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

    class Meta:
        model = DayIncome
        fields = '__all__'

    def get_debt(self, obj):
        return (obj.amount_due - obj.cash - obj.transfer) if obj.kind == 'cancha' else ZERO


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
    incomes = DayIncomeSerializer(many=True, read_only=True)
    expenses = DayExpenseSerializer(many=True, read_only=True)

    class Meta(FinancialDaySerializer.Meta):
        fields = FinancialDaySerializer.Meta.fields + ['incomes', 'expenses']
