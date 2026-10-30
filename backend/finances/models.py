from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

METHODS = [('efectivo', 'Efectivo'), ('transferencia', 'Transferencia')]
EXPENSE_METHODS = METHODS + [('socio', 'Puesto por socio')]


class Partner(models.Model):
    """Socio (puede no tener usuario en la plataforma)."""
    name = models.CharField(max_length=120)
    alias = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Socio'
        verbose_name_plural = 'Socios'

    def __str__(self):
        return self.name


class StaffRate(models.Model):
    CATEGORIES = [
        ('arbitro', 'Árbitro'), ('medico', 'Médico'), ('ambulancia', 'Ambulancia'),
        ('planillero', 'Planillero'), ('seguridad', 'Seguridad'),
        ('fotografia', 'Fotografía'), ('socio', 'Socio'), ('semana', 'Semana'),
        ('otro', 'Otro'),
    ]
    UNITS = [('jornada', 'Por jornada'), ('partido', 'Por partido')]

    name = models.CharField(max_length=120)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='otro')
    unit = models.CharField(max_length=10, choices=UNITS, default='jornada')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    auto_include = models.BooleanField(default=False, help_text="Se agrega solo al abrir planilla de fecha")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']
        verbose_name = 'Tarifa de personal / servicio'
        verbose_name_plural = 'Tarifas de personal y servicios'

    def __str__(self):
        return f"{self.name} (${self.amount})"


class TournamentFee(models.Model):
    tournament = models.OneToOneField('base.Tournament', on_delete=models.CASCADE, related_name='fee')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Arancel de torneo'
        verbose_name_plural = 'Aranceles de torneos'

    def __str__(self):
        return f"{self.tournament.name}: ${self.amount}"


class RateChange(models.Model):
    """Historial inmutable de aumentos (arancel de torneo o tarifa de staff)."""
    KINDS = [('equipo', 'Arancel de equipos'), ('staff', 'Tarifa de staff')]
    kind = models.CharField(max_length=10, choices=KINDS)
    tournament = models.ForeignKey('base.Tournament', null=True, blank=True, on_delete=models.CASCADE)
    staff_rate = models.ForeignKey(StaffRate, null=True, blank=True, on_delete=models.CASCADE, related_name='changes')
    old_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    new_amount = models.DecimalField(max_digits=12, decimal_places=2)
    effective_from = models.DateField(default=timezone.localdate)
    note = models.CharField(max_length=200, blank=True)
    changed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_from', '-created_at']
        verbose_name = 'Historial de aumento'
        verbose_name_plural = 'Historial de aumentos'

    def __str__(self):
        target = self.tournament.name if self.tournament else (self.staff_rate.name if self.staff_rate else '—')
        return f"{self.effective_from} - {target}: ${self.old_amount} -> ${self.new_amount}"


class FinancialDay(models.Model):
    STATUS = [('abierta', 'Abierta'), ('cerrada', 'Cerrada y aprobada')]
    date = models.DateField(unique=True)
    name = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default='abierta')
    cash_counted = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Caja de Fecha'
        verbose_name_plural = 'Cajas de Fecha'

    def __str__(self):
        label = self.name or self.date.strftime('%d/%m/%Y')
        return f"Caja {label} ({self.status})"


class DayIncome(models.Model):
    """Ingreso de la fecha: cobro de equipo, retiro de buffet u otro."""
    KINDS = [('cancha', 'Cobro de equipo'), ('buffet', 'Retiro de buffet'), ('otro', 'Otro')]
    day = models.ForeignKey(FinancialDay, on_delete=models.CASCADE, related_name='incomes')
    kind = models.CharField(max_length=10, choices=KINDS, default='cancha')
    team = models.ForeignKey('base.Team', null=True, blank=True, on_delete=models.SET_NULL)
    tournament = models.ForeignKey('base.Tournament', null=True, blank=True, on_delete=models.SET_NULL)
    concept = models.CharField(max_length=200, blank=True)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transfer = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    observation = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Ingreso de fecha'
        verbose_name_plural = 'Ingresos de fecha'

    def __str__(self):
        desc = self.team.name if self.team else (self.concept or self.kind)
        return f"{self.day.date} - {desc}: ${self.cash + self.transfer}"


class DayExpense(models.Model):
    day = models.ForeignKey(FinancialDay, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=20, choices=StaffRate.CATEGORIES, default='otro')
    staff_rate = models.ForeignKey(StaffRate, null=True, blank=True, on_delete=models.SET_NULL)
    concept = models.CharField(max_length=200)
    units = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    unit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    method = models.CharField(max_length=15, choices=EXPENSE_METHODS, default='efectivo')
    partner = models.ForeignKey(Partner, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['id']
        verbose_name = 'Egreso de fecha'
        verbose_name_plural = 'Egresos de fecha'

    def __str__(self):
        return f"{self.day.date} - {self.concept}: ${self.amount} ({self.method})"


class GeneralMovement(models.Model):
    """Movimientos fuera de fecha o automáticos de cierre: compras, alquileres, cobro de deudas, caja de fecha, reintegros."""
    TYPES = [('ingreso', 'Ingreso'), ('egreso', 'Egreso')]
    CATEGORIES = [
        ('caja_fecha', 'Caja de Fecha'),
        ('alquiler', 'Alquiler de cancha'), ('cobro_deuda', 'Cobro de deuda de equipo'),
        ('compra', 'Compra / mantenimiento'), ('reintegro_socio', 'Reintegro a socio'),
        ('inversion', 'Inversión'), ('otro', 'Otro'),
    ]
    financial_day = models.OneToOneField(
        'FinancialDay', null=True, blank=True, on_delete=models.CASCADE, related_name='general_movement'
    )
    type = models.CharField(max_length=10, choices=TYPES)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='otro')
    method = models.CharField(max_length=15, choices=EXPENSE_METHODS, default='efectivo')
    concept = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.localdate)
    team = models.ForeignKey('base.Team', null=True, blank=True, on_delete=models.SET_NULL)
    partner = models.ForeignKey(Partner, null=True, blank=True, on_delete=models.SET_NULL)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['-date', '-id']
        verbose_name = 'Movimiento de Caja General'
        verbose_name_plural = 'Movimientos de Caja General'

    def __str__(self):
        sign = '+' if self.type == 'ingreso' else '-'
        return f"{self.date} - {self.concept}: {sign}${self.amount} ({self.method})"
