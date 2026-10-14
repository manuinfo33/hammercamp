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
    from .models import BlueCard

    blue_by_team = {}
    for team_id in BlueCard.objects.filter(tournament=tournament).values_list('team_id', flat=True):
        blue_by_team[team_id] = blue_by_team.get(team_id, 0) + 1
    blue_pts = tournament.fp_blue_pts if tournament.fp_blue_card_enabled else 0

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
            row['wo_count'] += zt.wo_count
            # Las azules son por torneo: se descuentan de cada zona y se suman una sola vez abajo.
            row['points'] += zt.fair_play - (zt.blue_cards * blue_pts)

    for team_id, row in rows.items():
        blue = blue_by_team.get(team_id, 0)
        row['blue_cards'] = blue
        row['points'] += blue * blue_pts

    # Menos puntos primero; a igualdad, más partidos jugados y luego alfabético.
    return sorted(rows.values(), key=lambda r: (r['points'], -r['played'], r['team_name'].lower()))


def build_team_fair_play_history(tournament, team):
    """Historial de Fair Play de un equipo a lo largo del torneo, agrupado por fecha."""
    from .models import BlueCard, MatchPlayerStat

    blue_enabled = tournament.fp_blue_card_enabled
    wo_enabled = tournament.fp_wo_enabled
    pts_y, pts_r = tournament.fp_yellow_pts, tournament.fp_red_pts
    pts_b = tournament.fp_blue_pts if blue_enabled else 0
    pts_wo = tournament.fp_wo_pts if wo_enabled else 0

    rounds = {}

    def get_round(mr):
        key = mr.id if mr else None
        if key not in rounds:
            rounds[key] = {
                'round_id': key,
                'round_name': mr.name if mr else 'Sin fecha asociada',
                'round_order': mr.order if mr else 10 ** 6,
                'zone_name': mr.tournament_zone.name if mr else None,
                'date': mr.date.isoformat() if mr and mr.date else None,
                'matches': [],
                'yellow_cards': [],
                'red_cards': [],
                'blue_cards': [],
                'wo': [],
                'points': 0,
            }
        return rounds[key]

    matches = (
        Match.objects.filter(match_round__tournament_zone__tournament=tournament, played=True)
        .filter(Q(local_team=team) | Q(visitor_team=team))
        .select_related('match_round__tournament_zone', 'local_team', 'visitor_team')
    )
    for m in matches:
        r = get_round(m.match_round)
        is_local = m.local_team_id == team.id
        opponent = m.visitor_team if is_local else m.local_team
        match_date = m.date or m.match_round.date
        if match_date and not r['date']:
            r['date'] = match_date.isoformat()
        is_wo = bool(m.points_awarded_to_id and m.points_awarded_to_id != team.id)
        if m.points_awarded_to_id:
            score = 'Ganó por WO' if m.points_awarded_to_id == team.id else 'Perdió por WO'
        elif m.local_score is not None and m.visitor_score is not None:
            own = m.local_score if is_local else m.visitor_score
            opp = m.visitor_score if is_local else m.local_score
            score = f"{own} - {opp}"
        else:
            score = None
        r['matches'].append({
            'match_id': m.id,
            'opponent': opponent.name,
            'is_local': is_local,
            'score': score,
            'date': match_date.isoformat() if match_date else None,
        })
        if is_wo:
            r['wo'].append({'opponent': opponent.name, 'points': pts_wo})
            r['points'] += pts_wo

        stats = MatchPlayerStat.objects.filter(match=m, team=team).select_related('player')
        for s in stats:
            name = f"{s.player.first_name} {s.player.last_name}".strip()
            if s.yellow_card:
                r['yellow_cards'].append(name)
                r['points'] += pts_y
            if s.red_card:
                r['red_cards'].append({
                    'player': name,
                    'reason': s.red_card_reason or '',
                    'suspension_dates': s.red_card_suspension_dates or '',
                })
                r['points'] += pts_r

    for bc in BlueCard.objects.filter(tournament=tournament, team=team).select_related('match_round__tournament_zone'):
        r = get_round(bc.match_round)
        from django.utils import timezone as _tz
        r['blue_cards'].append({
            'id': bc.id,
            'reason': bc.reason,
            'created_at': _tz.localtime(bc.created_at).isoformat() if bc.created_at else None,
        })
        r['points'] += pts_b

    events = [
        r for r in rounds.values()
        if r['yellow_cards'] or r['red_cards'] or r['blue_cards'] or r['wo']
    ]
    events.sort(key=lambda r: (r['round_order'], r['date'] or ''))

    totals = {
        'yellow_cards': sum(len(r['yellow_cards']) for r in events),
        'red_cards': sum(len(r['red_cards']) for r in events),
        'blue_cards': sum(len(r['blue_cards']) for r in events),
        'wo_count': sum(len(r['wo']) for r in events),
        'played': sum(len(r['matches']) for r in rounds.values()),
    }
    totals['points'] = (
        totals['yellow_cards'] * pts_y + totals['red_cards'] * pts_r +
        totals['blue_cards'] * pts_b + totals['wo_count'] * pts_wo
    )

    return {
        'team': team.id,
        'team_name': team.name,
        'blue_card_enabled': blue_enabled,
        'wo_enabled': wo_enabled,
        'points_config': {'yellow': pts_y, 'red': pts_r, 'blue': tournament.fp_blue_pts, 'wo': tournament.fp_wo_pts},
        'totals': totals,
        'rounds': events,
    }
