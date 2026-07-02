from django.db import models
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

class Delegate(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='delegate_profile', verbose_name="Usuario de Login")
    first_name = models.CharField(max_length=100, verbose_name="Nombre")
    last_name = models.CharField(max_length=100, verbose_name="Apellido")
    dni = models.CharField(max_length=20, blank=True, null=True, verbose_name="DNI")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento")
    team = models.ForeignKey('Team', on_delete=models.SET_NULL, related_name='delegates', null=True, blank=True, verbose_name="Equipo")
    
    dni_front = models.ImageField(upload_to='delegates/dni_front/', blank=True, null=True, verbose_name="Foto DNI (Frente)")
    dni_back = models.ImageField(upload_to='delegates/dni_back/', blank=True, null=True, verbose_name="Foto DNI (Dorso)")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = "Delegado"
        verbose_name_plural = "Delegados"

class Team(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Equipo")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='teams', verbose_name="Categoría")
    delegate = models.ForeignKey(Delegate, on_delete=models.SET_NULL, related_name='teams_managed', null=True, verbose_name="Delegado Responsable")
    logo = models.ImageField(upload_to='teams/logos/', blank=True, null=True, verbose_name="Escudo/Logo")
    team_photo = models.ImageField(upload_to='teams/photos/', blank=True, null=True, verbose_name="Foto del Equipo")
    is_active = models.BooleanField(default=True, verbose_name="Equipo Activo")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Equipo"
        verbose_name_plural = "Equipos"


class Transaccion(models.Model):
    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]
    METODO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('banco', 'Banco'),
    ]

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, verbose_name="Tipo")
    metodo_pago = models.CharField(max_length=10, choices=METODO_CHOICES, default='efectivo', verbose_name="Método de Pago")
    concepto = models.CharField(max_length=255, verbose_name="Concepto")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    fecha = models.DateField(default=timezone.now, verbose_name="Fecha")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    equipo = models.ForeignKey(Team, on_delete=models.SET_NULL, related_name='transacciones', null=True, blank=True, verbose_name="Equipo")
    creado_por = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Creado por")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.concepto} - ${self.monto}"

    class Meta:
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        ordering = ['-fecha', '-created_at']


class SaldoSocio(models.Model):
    ESTADO_CHOICES = [
        ('al_dia', 'Al día'),
        ('debe', 'Debe'),
        ('suspendido', 'Suspendido'),
    ]

    delegate = models.OneToOneField(Delegate, on_delete=models.CASCADE, related_name='saldo', verbose_name="Delegado/Socio")
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Saldo")
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='al_dia', verbose_name="Estado")
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return f"{self.delegate} - ${self.saldo}"

    class Meta:
        verbose_name = "Saldo de Socio"
        verbose_name_plural = "Saldo de Socios"


class Tournament(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name="Nombre del Torneo")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='tournaments', verbose_name="Categoría")
    start_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Inicio")
    end_date = models.DateField(blank=True, null=True, verbose_name="Fecha Estimada de Finalización")
    max_players_buena_fe = models.PositiveIntegerField(default=25, verbose_name="Máximo de Jugadores Lista Buena Fe")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Torneo"
        verbose_name_plural = "Torneos"
        ordering = ['-created_at']


class TournamentZone(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='zones', verbose_name="Torneo")
    name = models.CharField(max_length=100, verbose_name="Nombre de la Zona")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Orden")

    def __str__(self):
        return f"{self.tournament.name} - {self.name}"

    class Meta:
        verbose_name = "Zona"
        verbose_name_plural = "Zonas"
        ordering = ['order']
        unique_together = ('tournament', 'name')


class ZoneTeam(models.Model):
    zone = models.ForeignKey(TournamentZone, on_delete=models.CASCADE, related_name='zone_teams', verbose_name="Zona")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='zone_teams', verbose_name="Equipo")
    points = models.IntegerField(default=0, verbose_name="Puntos")
    played = models.IntegerField(default=0, verbose_name="PJ")
    won = models.IntegerField(default=0, verbose_name="PG")
    drawn = models.IntegerField(default=0, verbose_name="PE")
    lost = models.IntegerField(default=0, verbose_name="PP")
    goals_for = models.IntegerField(default=0, verbose_name="GF")
    goals_against = models.IntegerField(default=0, verbose_name="GC")

    def __str__(self):
        return f"{self.zone} - {self.team.name}"

    class Meta:
        verbose_name = "Equipo en Zona"
        verbose_name_plural = "Equipos en Zona"
        unique_together = ('zone', 'team')


class CarouselImage(models.Model):
    title = models.CharField(max_length=100, blank=True, null=True, verbose_name="Título")
    image = models.ImageField(upload_to='carousel/', verbose_name="Imagen")
    is_active = models.BooleanField(default=True, verbose_name="Activa")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Orden")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return self.title or f"Imagen de Carrusel {self.id}"

    class Meta:
        verbose_name = "Imagen de Carrusel"
        verbose_name_plural = "Imágenes de Carrusel"
        ordering = ['order', '-created_at']


class News(models.Model):
    category = models.CharField(max_length=50, verbose_name="Categoría")
    title = models.CharField(max_length=200, verbose_name="Título")
    excerpt = models.TextField(verbose_name="Resumen")
    date = models.DateField(default=timezone.now, verbose_name="Fecha")
    image = models.ImageField(upload_to='news/', verbose_name="Imagen")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Noticia"
        verbose_name_plural = "Noticias"
        ordering = ['-date', '-created_at']


class MatchRound(models.Model):
    tournament_zone = models.ForeignKey(TournamentZone, on_delete=models.CASCADE, related_name='match_rounds', verbose_name="Zona")
    name = models.CharField(max_length=100, verbose_name="Nombre de la Fecha")
    date = models.DateField(blank=True, null=True, verbose_name="Fecha")
    time = models.TimeField(blank=True, null=True, verbose_name="Hora de inicio general")
    order = models.PositiveIntegerField(default=1, verbose_name="Orden")

    def __str__(self):
        return f"{self.tournament_zone.tournament.name} - {self.tournament_zone.name} - {self.name}"

    class Meta:
        verbose_name = "Fecha"
        verbose_name_plural = "Fechas"
        ordering = ['order']


class Match(models.Model):
    match_round = models.ForeignKey(MatchRound, on_delete=models.CASCADE, related_name='matches', verbose_name="Fecha")
    local_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='local_matches', verbose_name="Equipo Local")
    visitor_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='visitor_matches', verbose_name="Equipo Visitante")
    local_score = models.IntegerField(blank=True, null=True, verbose_name="Goles Local")
    visitor_score = models.IntegerField(blank=True, null=True, verbose_name="Goles Visitante")
    played = models.BooleanField(default=False, verbose_name="Jugado")
    date = models.DateField(blank=True, null=True, verbose_name="Fecha (específica)")
    time = models.TimeField(blank=True, null=True, verbose_name="Hora (específica)")
    cancha = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cancha")
    impact_zone = models.ForeignKey(TournamentZone, on_delete=models.SET_NULL, blank=True, null=True, related_name='impact_matches', verbose_name="Zona de Impacto")

    def __str__(self):
        return f"{self.local_team.name} vs {self.visitor_team.name}"

    class Meta:
        verbose_name = "Partido"
        verbose_name_plural = "Partidos"


class Goleador(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='goleadores', verbose_name="Torneo")
    player_name = models.CharField(max_length=200, verbose_name="Nombre del Jugador")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='goleadores', verbose_name="Equipo")
    goals = models.PositiveIntegerField(default=0, verbose_name="Goles")

    def __str__(self):
        return f"{self.player_name} - {self.team.name} ({self.goals} goles)"

    class Meta:
        verbose_name = "Goleador"
        verbose_name_plural = "Goleadores"
        ordering = ['-goals', 'player_name']


class VallaMenosVencida(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='vallas', verbose_name="Torneo")
    player_name = models.CharField(max_length=200, verbose_name="Nombre del Jugador/Arquero")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='vallas', verbose_name="Equipo")
    goals_against = models.IntegerField(default=0, verbose_name="Goles en Contra")

    def __str__(self):
        return f"{self.player_name} - {self.team.name} ({self.goals_against} GC)"

    class Meta:
        verbose_name = "Valla Menos Vencida"
        verbose_name_plural = "Vallas Menos Vencidas"
        ordering = ['goals_against', 'player_name']


class Sancionado(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='sancionados', verbose_name="Torneo")
    player_name = models.CharField(max_length=200, verbose_name="Nombre del Jugador")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='sancionados', verbose_name="Equipo")
    reason = models.CharField(max_length=255, verbose_name="Razón/Sanción")

    def __str__(self):
        return f"{self.player_name} - {self.reason}"

    class Meta:
        verbose_name = "Sancionado"
        verbose_name_plural = "Sancionados"
        ordering = ['player_name']


class Player(models.Model):
    first_name = models.CharField(max_length=100, verbose_name="Nombre")
    last_name = models.CharField(max_length=100, verbose_name="Apellido")
    dni = models.CharField(max_length=20, unique=True, verbose_name="DNI")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento")
    photo = models.ImageField(upload_to='players/photos/', blank=True, null=True, verbose_name="Foto de Perfil")
    dni_front = models.ImageField(upload_to='players/dni_front/', blank=True, null=True, verbose_name="Foto DNI (Frente)")
    dni_back = models.ImageField(upload_to='players/dni_back/', blank=True, null=True, verbose_name="Foto DNI (Dorso)")
    email = models.EmailField(blank=True, null=True, verbose_name="Correo Electrónico")
    phone = models.CharField(max_length=30, blank=True, null=True, verbose_name="Celular")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado el")

    def __str__(self):
        return f"{self.last_name}, {self.first_name} (DNI: {self.dni})"

    class Meta:
        verbose_name = "Jugador"
        verbose_name_plural = "Jugadores"
        ordering = ['last_name', 'first_name']


class GoodFaithList(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='good_faith_records', verbose_name="Torneo")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='good_faith_records', verbose_name="Equipo")
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='good_faith_records', verbose_name="Jugador")
    shirt_number = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="Número de Camiseta")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Inscrito el")

    def __str__(self):
        return f"{self.team.name} - {self.player} (Torneo: {self.tournament.name})"

    class Meta:
        verbose_name = "Lista de Buena Fe"
        verbose_name_plural = "Listas de Buena Fe"
        unique_together = ('tournament', 'team', 'player')
