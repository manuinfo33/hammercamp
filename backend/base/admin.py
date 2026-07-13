from django.contrib import admin
from .models import (
    Category, Team, Delegate, Tournament, TournamentZone, ZoneTeam,
    Transaccion, SaldoSocio, CarouselImage, News, MatchRound, Match,
    Goleador, VallaMenosVencida, Sancionado, Player, GoodFaithList
)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description')
    search_fields = ('name',)

@admin.register(Delegate)
class DelegateAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'dni', 'team')
    search_fields = ('first_name', 'last_name', 'dni')
    list_filter = ('team',)

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'delegate', 'created_at')
    list_filter = ('category', 'delegate')
    search_fields = ('name',)

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'start_date', 'end_date', 'created_at')
    list_filter = ('category',)
    search_fields = ('name',)

@admin.register(TournamentZone)
class TournamentZoneAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'name', 'order')
    list_filter = ('tournament',)

@admin.register(ZoneTeam)
class ZoneTeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'zone', 'team', 'points', 'played', 'yellow_cards', 'red_cards', 'indumentaria', 'fair_play')
    list_filter = ('zone__tournament',)

@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'concepto', 'monto', 'fecha', 'metodo_pago')
    list_filter = ('tipo', 'metodo_pago', 'fecha')
    search_fields = ('concepto', 'descripcion')

@admin.register(SaldoSocio)
class SaldoSocioAdmin(admin.ModelAdmin):
    list_display = ('id', 'delegate', 'saldo', 'estado', 'updated_at')
    list_filter = ('estado',)
    search_fields = ('delegate__first_name', 'delegate__last_name')

@admin.register(CarouselImage)
class CarouselImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'order', 'is_active')
    list_filter = ('is_active',)

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'date')
    list_filter = ('category', 'date')
    search_fields = ('title', 'excerpt')

@admin.register(MatchRound)
class MatchRoundAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament_zone', 'name', 'date', 'order')
    list_filter = ('tournament_zone__tournament',)
    ordering = ('tournament_zone', 'order')

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'match_round', 'local_team', 'visitor_team', 'local_score', 'visitor_score', 'played')
    list_filter = ('match_round__tournament_zone__tournament', 'played')
    search_fields = ('local_team__name', 'visitor_team__name')

@admin.register(Goleador)
class GoleadorAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'player_name', 'team', 'goals')
    list_filter = ('tournament', 'team')
    search_fields = ('player_name',)

@admin.register(VallaMenosVencida)
class VallaMenosVencidaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'player_name', 'team', 'goals_against')
    list_filter = ('tournament', 'team')
    search_fields = ('player_name',)

@admin.register(Sancionado)
class SancionadoAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'player_name', 'team', 'reason')
    list_filter = ('tournament', 'team')
    search_fields = ('player_name',)

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'last_name', 'first_name', 'dni', 'phone', 'email')
    search_fields = ('last_name', 'first_name', 'dni')

@admin.register(GoodFaithList)
class GoodFaithListAdmin(admin.ModelAdmin):
    list_display = ('id', 'tournament', 'team', 'player', 'shirt_number')
    list_filter = ('tournament', 'team')
    search_fields = ('player__last_name', 'player__first_name', 'player__dni')

