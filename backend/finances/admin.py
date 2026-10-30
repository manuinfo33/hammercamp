from decimal import Decimal
from django.contrib import admin
from .models import (
    Partner, StaffRate, TournamentFee, RateChange,
    FinancialDay, DayIncome, DayExpense, GeneralMovement
)
from .serializers import day_totals


@admin.register(RateChange)
class RateChangeAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'effective_from', 'kind', 'target_name',
        'old_amount', 'new_amount', 'variation_display',
        'note', 'changed_by', 'created_at'
    )
    list_filter = ('kind', 'effective_from')
    search_fields = ('note', 'tournament__name', 'staff_rate__name', 'changed_by__username')
    date_hierarchy = 'effective_from'

    @admin.display(description='Concepto / Tarifa')
    def target_name(self, obj):
        return obj.tournament.name if obj.tournament else (obj.staff_rate.name if obj.staff_rate else '—')

    @admin.display(description='Variación')
    def variation_display(self, obj):
        old, new = obj.old_amount, obj.new_amount
        if old and old > Decimal('0'):
            diff = new - old
            pct = (diff / old) * Decimal('100')
            sign = '+' if diff >= 0 else ''
            return f"{sign}{pct:.1f}% ({sign}${diff})"
        return 'Alta inicial'


@admin.register(StaffRate)
class StaffRateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'unit', 'amount', 'auto_include', 'active')
    list_filter = ('category', 'unit', 'auto_include', 'active')
    search_fields = ('name',)
    list_editable = ('amount', 'auto_include', 'active')


@admin.register(TournamentFee)
class TournamentFeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'amount')
    search_fields = ('tournament__name',)
    list_editable = ('amount',)


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'alias', 'phone', 'active')
    list_filter = ('active',)
    search_fields = ('name', 'alias', 'phone')
    list_editable = ('active',)


class DayIncomeInline(admin.TabularInline):
    model = DayIncome
    extra = 0
    fields = ('kind', 'team', 'tournament', 'concept', 'amount_due', 'cash', 'transfer', 'observation')


class DayExpenseInline(admin.TabularInline):
    model = DayExpense
    extra = 0
    fields = ('category', 'staff_rate', 'concept', 'units', 'unit_amount', 'amount', 'method', 'partner')


@admin.register(FinancialDay)
class FinancialDayAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'date', 'name', 'status', 'cash_counted',
        'expected_cash_display', 'net_display', 'approved_at', 'approved_by'
    )
    list_filter = ('status', 'date')
    search_fields = ('name', 'notes')
    date_hierarchy = 'date'
    inlines = [DayIncomeInline, DayExpenseInline]

    @admin.display(description='Efectivo Esperado')
    def expected_cash_display(self, obj):
        t = day_totals(obj)
        return f"${t['expected_cash']}"

    @admin.display(description='Resultado Neto')
    def net_display(self, obj):
        t = day_totals(obj)
        return f"${t['net']}"


@admin.register(DayIncome)
class DayIncomeAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'kind', 'team', 'tournament', 'concept', 'amount_due', 'cash', 'transfer')
    list_filter = ('kind', 'day__date', 'tournament')
    search_fields = ('concept', 'team__name', 'observation')


@admin.register(DayExpense)
class DayExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'category', 'concept', 'units', 'unit_amount', 'amount', 'method', 'partner')
    list_filter = ('category', 'method', 'day__date')
    search_fields = ('concept', 'partner__name')


@admin.register(GeneralMovement)
class GeneralMovementAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'date', 'type', 'category', 'concept', 'amount',
        'method', 'financial_day', 'team', 'partner', 'created_by'
    )
    list_filter = ('type', 'category', 'method', 'date')
    search_fields = ('concept', 'team__name', 'partner__name')
    date_hierarchy = 'date'
