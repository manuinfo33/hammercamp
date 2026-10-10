"""
Reglas de clasificación por torneo.

- sort_zone_teams: ordena la tabla de posiciones de una zona aplicando los
  criterios de desempate configurados en el torneo (tiebreaker_1..5).
- build_fair_play_table: arma la tabla de Fair Play del torneo (una sola tabla
  con todos los equipos). El primero es el que MENOS puntos tiene.
"""
from functools import cmp_to_key

from django.db.models import Q

from .models import Match


def _head_to_head_points(tournament, zone, team_a_id, team_b_id):
    """Puntos obtenidos por A y por B en los partidos jugados entre ellos dentro de la zona."""
    matches = Match.objects.filter(played=True).filter(
        Q(impact_zone=zone) | (Q(impact_zone__isnull=True) & Q(match_round__tournament_zone=zone))
    ).filter(
        (Q(local_team_id=team_a_id) & Q(visitor_team_id=team_b_id)) |
        (Q(local_team_id=team_b_id) & Q(visitor_team_id=team_a_id))
    )

    pts_a = 0
    pts_b = 0
    for m in matches:
        if m.points_awarded_to_id:
            if m.points_awarded_to_id == team_a_id:
                pts_a += tournament.pts_win
                pts_b += tournament.pts_loss
            else:
                pts_b += tournament.pts_win
                pts_a += tournament.pts_loss
            continue
        if m.local_score is None or m.visitor_score is None:
            continue
        a_score = m.local_score if m.local_team_id == team_a_id else m.visitor_score
        b_score = m.visitor_score if m.local_team_id == team_a_id else m.local_score
        if a_score > b_score:
            pts_a += tournament.pts_win
            pts_b += tournament.pts_loss
        elif a_score < b_score:
            pts_b += tournament.pts_win
            pts_a += tournament.pts_loss
        else:
            pts_a += tournament.pts_draw
            pts_b += tournament.pts_draw
    return pts_a, pts_b


def _criteria(tournament):
    raw = [
        tournament.tiebreaker_1, tournament.tiebreaker_2, tournament.tiebreaker_3,
        tournament.tiebreaker_4, tournament.tiebreaker_5,
    ]
    # "Puntos" siempre es el primer criterio.
    ordered = ['Puntos']
    for c in raw:
        if c and c not in ordered:
            ordered.append(c)
    return ordered


def sort_zone_teams(tournament, zone, zone_teams):
    """Devuelve la lista de ZoneTeam ordenada según los criterios del torneo."""
    zone_teams = list(zone_teams)
    if not tournament:
        return zone_teams
    criteria = _criteria(tournament)

    def compare(a, b):
        for criterion in criteria:
            if criterion == 'Puntos':
                diff = b.points - a.points
            elif criterion == 'Dif. de goles':
                diff = (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)
            elif criterion == 'Goles a favor':
                diff = b.goals_for - a.goals_for
            elif criterion == 'Fair Play':
                # Menos puntos de Fair Play = mejor conducta = mejor posición.
                diff = a.fair_play - b.fair_play
            elif criterion == 'Resultado entre ellos':
                pts_a, pts_b = _head_to_head_points(tournament, zone, a.team_id, b.team_id)
                diff = pts_b - pts_a
            else:
                diff = 0
            if diff != 0:
                return diff
        return (a.team.name > b.team.name) - (a.team.name < b.team.name)

    return sorted(zone_teams, key=cmp_to_key(compare))


def build_fair_play_table(tournament, request=None):
    """Una sola tabla por torneo, agregando los datos de todas las zonas."""
    rows = {}
    for zone in tournament.zones.all():
        for zt in zone.zone_teams.select_related('team').all():
            row = rows.get(zt.team_id)
            if not row:
                logo = None
                if zt.team.logo:
                    logo = request.build_absolute_uri(zt.team.logo.url) if request else zt.team.logo.url
                row = {
                    'team': zt.team_id,
                    'team_name': zt.team.name,
                    'team_logo': logo,
                    'played': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'blue_cards': 0,
                    'wo_count': 0,
                    'points': 0,
                }
                rows[zt.team_id] = row
            row['played'] += zt.played
            row['yellow_cards'] += zt.yellow_cards
            row['red_cards'] += zt.red_cards
            row['blue_cards'] += zt.blue_cards
            row['wo_count'] += zt.wo_count
            row['points'] += zt.fair_play

    # Menos puntos primero; a igualdad, más partidos jugados y luego alfabético.
    return sorted(rows.values(), key=lambda r: (r['points'], -r['played'], r['team_name'].lower()))
