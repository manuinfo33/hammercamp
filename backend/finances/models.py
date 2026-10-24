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

    def __str__(self):
        return self.name


class StaffRate(models.Model):
    CATEGORIES = [
        ('arbitro', 'Árbitro'), ('medico', 'Médico'), ('ambulancia', 'Ambulancia'),
        ('planillero', 'Planillero'), ('seguridad', 'Seguridad'),
        ('fotografia', 'Fotografía'), ('otro', 'Otro'),
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

    def __str__(self):
        return self.name


class TournamentFee(models.Model):
    tournament = models.OneToOneField('base.Tournament', on_delete=models.CASCADE, related_name='fee')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)


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


class GeneralMovement(models.Model):
    """Movimientos fuera de fecha: compras, alquileres, cobro de deudas, reintegros a socios."""
    TYPES = [('ingreso', 'Ingreso'), ('egreso', 'Egreso')]
    CATEGORIES = [
        ('alquiler', 'Alquiler de cancha'), ('cobro_deuda', 'Cobro de deuda de equipo'),
        ('compra', 'Compra / mantenimiento'), ('reintegro_socio', 'Reintegro a socio'),
        ('inversion', 'Inversión'), ('otro', 'Otro'),
    ]
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
