from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Team, Delegate, Transaccion, SaldoSocio, Tournament, TournamentZone, ZoneTeam, CarouselImage, MatchRound, Match, Goleador, VallaMenosVencida, Sancionado, Player, GoodFaithList

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    team_id = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'team_id', 'team_name']

    def get_role(self, obj):
        if obj.is_superuser:
            return "Administrador"
        return "Delegado"

    def get_team_id(self, obj):
        if hasattr(obj, 'delegate_profile') and obj.delegate_profile and obj.delegate_profile.team:
            return obj.delegate_profile.team.id
        return None

    def get_team_name(self, obj):
        if hasattr(obj, 'delegate_profile') and obj.delegate_profile and obj.delegate_profile.team:
            return obj.delegate_profile.team.name
        return None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    delegate_name = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    current_tournament = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'category', 'category_name', 'delegate', 'delegate_name', 'logo', 'team_photo', 'is_active', 'current_tournament', 'created_at', 'updated_at']

    def get_delegate_name(self, obj):
        return f"{obj.delegate.first_name} {obj.delegate.last_name}" if obj.delegate else None

    def get_is_active(self, obj):
        return obj.zone_teams.exists()

    def get_current_tournament(self, obj):
        zone_team = obj.zone_teams.select_related('zone__tournament').first()
        if zone_team:
            return zone_team.zone.tournament.name
        return None

class DelegateSerializer(serializers.ModelSerializer):
    team_name = serializers.SerializerMethodField()
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Delegate
        fields = ['id', 'user', 'user_username', 'first_name', 'last_name', 'dni', 'address', 'birth_date', 'team', 'team_name', 'dni_front', 'dni_back', 'created_at', 'updated_at']

    def get_team_name(self, obj):
        return obj.team.name if obj.team else None

class TransaccionSerializer(serializers.ModelSerializer):
    equipo_nombre = serializers.ReadOnlyField(source='equipo.name')
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Transaccion
        fields = [
            'id', 'tipo', 'metodo_pago', 'concepto', 'monto', 'fecha',
            'descripcion', 'equipo', 'equipo_nombre', 'creado_por',
            'creado_por_nombre', 'created_at', 'updated_at',
        ]

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.first_name} {obj.creado_por.last_name}".strip() or obj.creado_por.username
        return None

class SaldoSocioSerializer(serializers.ModelSerializer):
    delegate_nombre = serializers.SerializerMethodField()
    equipo_nombre = serializers.ReadOnlyField(source='delegate.team.name')

    class Meta:
        model = SaldoSocio
        fields = ['id', 'delegate', 'delegate_nombre', 'equipo_nombre', 'saldo', 'estado', 'observaciones', 'updated_at']

    def get_delegate_nombre(self, obj):
        return f"{obj.delegate.first_name} {obj.delegate.last_name}"


# --- Tournament Serializers ---

class ZoneTeamSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')
    team_logo = serializers.SerializerMethodField()

    class Meta:
        model = ZoneTeam
        fields = ['id', 'zone', 'team', 'team_name', 'team_logo',
                  'points', 'played', 'won', 'drawn', 'lost', 'goals_for', 'goals_against']

    def get_team_logo(self, obj):
        request = self.context.get('request')
        if obj.team.logo and request:
            return request.build_absolute_uri(obj.team.logo.url)
        return None


class TournamentZoneSerializer(serializers.ModelSerializer):
    zone_teams = ZoneTeamSerializer(many=True, read_only=True)

    class Meta:
        model = TournamentZone
        fields = ['id', 'tournament', 'name', 'order', 'zone_teams']


class TournamentSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    zones = TournamentZoneSerializer(many=True, read_only=True)
    zones_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'category', 'category_name', 'zones_count', 'max_players_buena_fe',
                  'start_date', 'end_date', 'created_at', 'updated_at', 'zones']

    def get_zones_count(self, obj):
        return obj.zones.count()


class TournamentCreateSerializer(serializers.ModelSerializer):
    """Used for creating/updating tournaments with zones via a single request."""
    zones_data = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'category', 'start_date', 'end_date', 'max_players_buena_fe', 'zones_data']

    def create(self, validated_data):
        zones_data = validated_data.pop('zones_data', [])
        tournament = Tournament.objects.create(**validated_data)
        for i, zone in enumerate(zones_data):
            TournamentZone.objects.create(
                tournament=tournament,
                name=zone.get('name', f'Zona {i+1}'),
                order=i
            )
        return tournament

    def update(self, instance, validated_data):
        zones_data = validated_data.pop('zones_data', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if zones_data is not None:
            existing = {z.id: z for z in instance.zones.all()}
            seen_ids = set()
            for i, zone_data in enumerate(zones_data):
                zone_id = zone_data.get('id')
                if zone_id and zone_id in existing:
                    z = existing[zone_id]
                    z.name = zone_data.get('name', z.name)
                    z.order = i
                    z.save()
                    seen_ids.add(zone_id)
                else:
                    new_zone = TournamentZone.objects.create(
                        tournament=instance,
                        name=zone_data.get('name', f'Zona {i+1}'),
                        order=i
                    )
                    seen_ids.add(new_zone.id)
            for zone_id, zone in existing.items():
                if zone_id not in seen_ids:
                    zone.delete()
        return instance

from .models import Category, Team, Delegate, Transaccion, SaldoSocio, Tournament, TournamentZone, ZoneTeam, CarouselImage, News

# ... (omitted replacing the import, I should just use multi_replace or append). Wait, I'll just append NewsSerializer.

class CarouselImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarouselImage
        fields = '__all__'

class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'


class MatchSerializer(serializers.ModelSerializer):
    local_team_name = serializers.ReadOnlyField(source='local_team.name')
    local_team_logo = serializers.SerializerMethodField()
    visitor_team_name = serializers.ReadOnlyField(source='visitor_team.name')
    visitor_team_logo = serializers.SerializerMethodField()
    impact_zone_name = serializers.ReadOnlyField(source='impact_zone.name')

    class Meta:
        model = Match
        fields = ['id', 'match_round', 'local_team', 'local_team_name', 'local_team_logo',
                  'visitor_team', 'visitor_team_name', 'visitor_team_logo',
                  'local_score', 'visitor_score', 'played', 'date', 'time',
                  'cancha', 'impact_zone', 'impact_zone_name']
        extra_kwargs = {
            'match_round': {'required': False}
        }



    def get_local_team_logo(self, obj):
        request = self.context.get('request')
        if obj.local_team.logo and request:
            return request.build_absolute_uri(obj.local_team.logo.url)
        return None

    def get_visitor_team_logo(self, obj):
        request = self.context.get('request')
        if obj.visitor_team.logo and request:
            return request.build_absolute_uri(obj.visitor_team.logo.url)
        return None


class MatchRoundSerializer(serializers.ModelSerializer):
    matches = MatchSerializer(many=True, required=False)

    class Meta:
        model = MatchRound
        fields = ['id', 'tournament_zone', 'name', 'date', 'time', 'order', 'matches']

    def create(self, validated_data):
        matches_data = validated_data.pop('matches', [])
        round_obj = MatchRound.objects.create(**validated_data)
        for match_data in matches_data:
            Match.objects.create(match_round=round_obj, **match_data)
        return round_obj


class GoleadorSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = Goleador
        fields = ['id', 'tournament', 'player_name', 'team', 'team_name', 'goals']


class VallaMenosVencidaSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = VallaMenosVencida
        fields = ['id', 'tournament', 'player_name', 'team', 'team_name', 'goals_against']


class SancionadoSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = Sancionado
        fields = ['id', 'tournament', 'player_name', 'team', 'team_name', 'reason']


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'


class GoodFaithListSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    player_dni = serializers.ReadOnlyField(source='player.dni')
    player_photo = serializers.SerializerMethodField()
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = GoodFaithList
        fields = ['id', 'tournament', 'team', 'team_name', 'player', 'player_name', 'player_dni', 'player_photo', 'shirt_number', 'created_at']

    def get_player_name(self, obj):
        return f"{obj.player.last_name}, {obj.player.first_name}"

    def get_player_photo(self, obj):
        request = self.context.get('request')
        if obj.player.photo and request:
            return request.build_absolute_uri(obj.player.photo.url)
        return None

    def validate(self, attrs):
        tournament = attrs.get('tournament')
        team = attrs.get('team')
        
        # Check if creating (no self.instance)
        if not self.instance:
            current_count = GoodFaithList.objects.filter(tournament=tournament, team=team).count()
            limit = tournament.max_players_buena_fe
            if current_count >= limit:
                raise serializers.ValidationError(
                    {"player": f"No se pueden agregar más jugadores a la lista de buena fe para {team.name} en este torneo. Límite máximo: {limit} jugadores."}
                )
        return attrs
