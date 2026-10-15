import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Calendar, Trash2, ChevronDown, Info, ThumbsUp } from 'lucide-react';
import api from '../../api';

const BLUE = '#0284c7';
const YELLOW = '#facc15';
const RED = '#ef4444';

export function CardIcon({ color, w = 10, h = 14, glow = false }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${w}px`,
        height: `${h}px`,
        background: color,
        borderRadius: w > 14 ? '4px' : '2px',
        verticalAlign: 'middle',
        flexShrink: 0,
        boxShadow: glow ? `0 2px 6px ${color}66` : 'none',
      }}
    />
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000000,
  background: 'rgba(8, 7, 6, 0.82)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#4b5563', marginBottom: '6px', display: 'block' };

const fieldStyle = (hasError) => ({
  width: '100%',
  height: '42px',
  borderRadius: '8px',
  border: hasError ? '1.5px solid #ef4444' : '1.5px solid #d8cfc0',
  background: '#ffffff',
  padding: '0 34px 0 12px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#191919',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
});

const btnSecondary = {
  flex: 1, height: '40px', borderRadius: '8px', border: '1px solid #d8cfc0',
  background: '#ffffff', color: '#4b5563', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
};
const btnPrimary = {
  flex: 1, height: '40px', borderRadius: '8px', border: 'none',
  background: '#191919', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
};

const formatDate = (iso) => {
  if (!iso) return null;
  // Si es solo YYYY-MM-DD
  if (iso.length === 10 && !iso.includes('T')) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dt);
  } catch {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
};

/* =========================================================
   MODAL: CARGAR TARJETA AZUL
   ========================================================= */
export function BlueCardModal({ tournament, enabled, bluePts, onClose, onSaved }) {
  const [teamId, setTeamId] = useState('');
  const [roundId, setRoundId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [roundsByZone, setRoundsByZone] = useState({});

  const zones = useMemo(() => tournament?.zones || [], [tournament?.zones]);

  const teams = useMemo(() => {
    const map = new Map();
    zones.forEach(z => (z.zone_teams || []).forEach(zt => {
      if (!map.has(zt.team)) map.set(zt.team, { id: zt.team, name: zt.team_name, zones: [] });
      map.get(zt.team).zones.push(z.id);
    }));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [zones]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(zones.map(z => api.get(`match-rounds/?tournament_zone=${z.id}`).then(r => [z.id, r.data]).catch(() => [z.id, []])))
      .then(entries => { if (!cancelled) setRoundsByZone(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [tournament?.id]);

  const selectedTeam = teams.find(t => String(t.id) === String(teamId));
  const roundOptions = useMemo(() => {
    if (!selectedTeam) return [];
    const multiZone = selectedTeam.zones.length > 1;
    return selectedTeam.zones.flatMap(zid => {
      const zone = zones.find(z => z.id === zid);
      return (roundsByZone[zid] || []).map(r => ({
        id: r.id,
        label: `${r.name}${r.date ? ` · ${formatDate(r.date)}` : ''}${multiZone ? ` (${zone?.name})` : ''}`,
      }));
    });
  }, [selectedTeam, roundsByZone, zones]);

  const handleSave = async () => {
    if (!enabled) return;
    if (!teamId) { setError('Seleccioná el equipo al que se le carga la tarjeta azul.'); return; }
    if (!reason.trim()) { setError('Ingresá el motivo de la tarjeta azul.'); return; }
    try {
      setSaving(true);
      await api.post(`tournaments/${tournament.id}/blue-cards/`, {
        team: teamId,
        match_round: roundId || null,
        reason: reason.trim(),
      });
      onSaved?.(selectedTeam?.name);
    } catch (e) {
      setError(e?.response?.data?.detail || 'No se pudo cargar la tarjeta azul.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="animate-fade-in anthropic-theme"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px',
          border: '1px solid #e6dfd3', boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CardIcon color={BLUE} w={24} h={32} glow />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#191919' }}>Tarjeta Azul</h3>
            {enabled && (
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#cc7a5c' }}>
                Suma {bluePts} pts en la tabla de Fair Play
              </span>
            )}
          </div>
        </div>

        {!enabled ? (
          <>
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '10px 12px',
              borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', gap: '8px', lineHeight: 1.4,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>La tarjeta azul no está habilitada en la configuración de Fair Play de este torneo.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} style={btnPrimary}>Entendido</button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={labelStyle} htmlFor="blue-card-team">Equipo</label>
              <div style={{ position: 'relative' }}>
                <select
                  id="blue-card-team"
                  value={teamId}
                  onChange={e => { setTeamId(e.target.value); setRoundId(''); setError(''); }}
                  style={{ ...fieldStyle(error && !teamId), color: teamId ? '#191919' : '#7f776f' }}
                  autoFocus
                >
                  <option value="">Seleccionar equipo...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={15} color="#7f776f" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="blue-card-round">Fecha <span style={{ fontWeight: 500, color: '#9ca3af' }}>(opcional)</span></label>
              <div style={{ position: 'relative' }}>
                <select
                  id="blue-card-round"
                  value={roundId}
                  onChange={e => setRoundId(e.target.value)}
                  disabled={!selectedTeam}
                  style={{ ...fieldStyle(false), color: roundId ? '#191919' : '#7f776f', opacity: selectedTeam ? 1 : 0.6, cursor: selectedTeam ? 'pointer' : 'not-allowed' }}
                >
                  <option value="">Sin fecha asociada</option>
                  {roundOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <ChevronDown size={15} color="#7f776f" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="blue-card-reason">Motivo</label>
              <input
                id="blue-card-reason"
                type="text"
                placeholder="Describa el motivo de la tarjeta azul..."
                value={reason}
                onChange={e => { setReason(e.target.value); setError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onClose();
                }}
                style={{ ...fieldStyle(error && teamId && !reason.trim()), padding: '0 12px', cursor: 'text', fontWeight: '500' }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px',
                borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button type="button" id="blue-card-confirm" onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'OK'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   MODAL: HISTORIAL DE FAIR PLAY DE UN EQUIPO
   ========================================================= */
function StatPill({ icon, label, value, accent, bg, border, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fp-stat-pill"
      style={{
        flex: '1 1 0',
        minWidth: 0,
        height: 'auto',
        minHeight: '74px',
        background: active ? '#ffffff' : (bg || '#faf8f4'),
        border: active ? '2px solid #0f172a' : `1.5px solid ${border || '#ece5d8'}`,
        borderRadius: '12px',
        padding: '9px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        boxShadow: active ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
        transform: active ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s ease',
        outline: 'none',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div style={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span className="fp-stat-value" style={{ fontSize: '20px', fontWeight: '800', color: accent || '#191919', lineHeight: 1.1 }}>
        {value}
      </span>
      <span className="fp-stat-label" style={{
        fontSize: '10px',
        fontWeight: '800',
        color: active ? '#0f172a' : '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        padding: '0 2px',
      }}>
        {label}
      </span>
    </button>
  );
}

function EventCard({ icon, title, report, date, suspension, pts, onDelete }) {
  const [open, setOpen] = useState(false);
  const hasInfo = Boolean((report && report.trim()) || (suspension && suspension.trim()) || date);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s'
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{icon}</div>
          <span style={{ fontSize: '14.5px', fontWeight: 'normal', color: '#111827' }}>{title}</span>
          {hasInfo && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              title={open ? "Ocultar informe" : "Ver informe"}
              style={{
                background: open ? '#e0f2fe' : '#f3f4f6',
                border: open ? '1px solid #bae6fd' : '1px solid #e5e7eb',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                minWidth: '22px',
                minHeight: '22px',
                aspectRatio: '1 / 1',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: open ? '#0284c7' : '#4b5563',
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 0.15s'
              }}
            >
              <Info size={13} style={{ flexShrink: 0 }} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {pts > 0 && (
            <span style={{
              fontSize: '13px',
              fontWeight: 'normal',
              color: '#000000',
              whiteSpace: 'nowrap'
            }}>
              +{pts} pts
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Eliminar tarjeta azul"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '4px 6px',
                cursor: 'pointer',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              className="fp-delete-btn"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Desplegable de informe / motivo */}
      {hasInfo && open && (
        <div style={{
          padding: '10px 14px 12px 36px',
          background: '#f8fafc',
          borderTop: '1px dashed #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          {date && (
            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: '600', color: '#475569' }}>Fecha de carga:</span>
              <span>{formatDate(date)}</span>
            </div>
          )}
          {suspension && (
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c' }}>
              Sanción: {suspension} fecha{suspension === '1' ? '' : 's'}
            </div>
          )}
          {report && (
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.45 }}>
              <span style={{ fontWeight: '600', color: '#475569' }}>Informe: </span>
              {report}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TeamFairPlayHistoryModal({ tournamentId, team, canEdit, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'yellow', 'red', 'blue', 'wo'
  const [expandedRoundId, setExpandedRoundId] = useState(null);
  const toggleRound = (key) => setExpandedRoundId(prev => (prev === key ? null : key));

  const teamId = team?.id;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`tournaments/${tournamentId}/fair-play-history/?team=${teamId}`);
      setData(res.data);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, teamId]);

  useEffect(() => {
    let cancelled = false;
    api.get(`tournaments/${tournamentId}/fair-play-history/?team=${teamId}`)
      .then(res => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar el historial.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [tournamentId, teamId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, []);

  const handleDelete = async (cardId) => {
    try {
      await api.delete(`tournaments/${tournamentId}/blue-cards/${cardId}/`);
      setConfirmDeleteId(null);
      await load();
      onChanged?.();
    } catch {
      setError('No se pudo eliminar la tarjeta azul.');
    }
  };

  const pc = data?.points_config || {};
  const t = data?.totals || {};

  // Filtrado de fechas según la categoría seleccionada
  const rawRounds = data?.rounds || [];
  const filteredRounds = activeCategory === 'all'
    ? rawRounds
    : rawRounds.map(r => {
        const yellow_cards = activeCategory === 'yellow' ? r.yellow_cards : [];
        const red_cards = activeCategory === 'red' ? r.red_cards : [];
        const blue_cards = activeCategory === 'blue' ? r.blue_cards : [];
        const wo = activeCategory === 'wo' ? r.wo : [];

        const points = (
          (yellow_cards.length * (pc.yellow || 0)) +
          (red_cards.length * (pc.red || 0)) +
          (blue_cards.length * (data?.blue_card_enabled ? (pc.blue || 0) : 0)) +
          (wo.length * (data?.wo_enabled ? (pc.wo || 0) : 0))
        );

        return {
          ...r,
          yellow_cards,
          red_cards,
          blue_cards,
          wo,
          points,
        };
      }).filter(r => (
        r.yellow_cards.length > 0 ||
        r.red_cards.length > 0 ||
        r.blue_cards.length > 0 ||
        r.wo.length > 0
      ));

  return createPortal(
    <div style={{ ...overlayStyle, zIndex: 999999 }} onClick={onClose}>
      <div
        className="animate-fade-in anthropic-theme fp-history-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '640px',
          height: '85vh',
          maxHeight: '85vh',
          boxShadow: '0 20px 45px rgba(0,0,0,0.28)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          background: '#fafaf9'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            <ThumbsUp size={22} color="#ea580c" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Historial Fair Play
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="fp-close-btn"
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              minWidth: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1f2937',
              flexShrink: 0,
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <X size={20} strokeWidth={2.5} color="#1f2937" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="custom-time-scrollbar">
          {loading && !data ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Cargando historial...</div>
          ) : error && !data ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#b91c1c', fontSize: '14px' }}>{error}</div>
          ) : data && (
            <>
              {/* Resumen Pills Clickables */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${2 + (data.blue_card_enabled ? 1 : 0) + (data.wo_enabled ? 1 : 0) + 1}, minmax(0, 1fr))`,
                gap: '8px',
                width: '100%'
              }}>
                <StatPill
                  icon={<CardIcon color={YELLOW} w={11} h={15} glow />}
                  label="Amarillas"
                  value={t.yellow_cards}
                  bg="#fefce8"
                  border="#fef08a"
                  active={activeCategory === 'yellow'}
                  onClick={() => setActiveCategory(activeCategory === 'yellow' ? 'all' : 'yellow')}
                />
                <StatPill
                  icon={<CardIcon color={RED} w={11} h={15} glow />}
                  label="Rojas"
                  value={t.red_cards}
                  bg="#fef2f2"
                  border="#fecaca"
                  active={activeCategory === 'red'}
                  onClick={() => setActiveCategory(activeCategory === 'red' ? 'all' : 'red')}
                />
                {data.blue_card_enabled && (
                  <StatPill
                    icon={<CardIcon color={BLUE} w={11} h={15} glow />}
                    label="Azules"
                    value={t.blue_cards}
                    bg="#f0f9ff"
                    border="#bae6fd"
                    active={activeCategory === 'blue'}
                    onClick={() => setActiveCategory(activeCategory === 'blue' ? 'all' : 'blue')}
                  />
                )}
                {data.wo_enabled && (
                  <StatPill
                    icon={<span style={{ fontSize: '11px', fontWeight: '900', color: '#4b5563' }}>WO</span>}
                    label="Walkovers"
                    value={t.wo_count}
                    bg="#f9fafb"
                    border="#e5e7eb"
                    active={activeCategory === 'wo'}
                    onClick={() => setActiveCategory(activeCategory === 'wo' ? 'all' : 'wo')}
                  />
                )}
                <StatPill
                  icon={<span style={{ fontSize: '11px', fontWeight: '900', color: '#c2410c' }}>PTS</span>}
                  label="Total"
                  value={t.points}
                  accent="#c2410c"
                  bg="#fff7ed"
                  border="#ffedd5"
                  active={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                />
              </div>

              {/* Sub-info config */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '12.5px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  Partidos jugados: <b style={{ color: '#0f172a' }}>{t.played}</b>
                </div>
                {activeCategory !== 'all' && (
                  <span style={{ color: '#000000', fontWeight: '700', fontSize: '12px' }}>
                    Filtrando: {activeCategory === 'yellow' ? 'Amarillas' : activeCategory === 'red' ? 'Rojas' : activeCategory === 'blue' ? 'Azules' : 'Walkovers (WO)'}
                  </span>
                )}
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</div>
              )}

              {/* Timeline por fechas */}
              {!filteredRounds.length ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6b7280', fontSize: '14px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                  {activeCategory === 'all'
                    ? 'Este equipo no registra sanciones ni tarjetas en el torneo. 👏'
                    : `No hay registros de ${activeCategory === 'yellow' ? 'amarillas' : activeCategory === 'red' ? 'rojas' : activeCategory === 'blue' ? 'azules' : 'WO'} para este equipo.`
                  }
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredRounds.map(r => {
                    const roundKey = r.round_id ?? 'none';
                    const isOpen = expandedRoundId === roundKey;
                    const hasDetail = Boolean(r.date) || r.matches.length > 0;
                    return (
                      <div
                        key={r.round_id ?? 'none'}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          background: '#fafafa',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Cabecera de la fecha */}
                        <div
                          onClick={hasDetail ? () => toggleRound(roundKey) : undefined}
                          style={{
                          background: '#f1f5f9',
                          padding: '12px 16px',
                          borderBottom: isOpen || !hasDetail ? '1px solid #e2e8f0' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap',
                          cursor: hasDetail ? 'pointer' : 'default'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '800',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              letterSpacing: '0.02em'
                            }}>
                              {r.round_name}
                            </span>
                            {hasDetail && (
                              <span
                                title={isOpen ? 'Ocultar detalle' : 'Ver detalle'}
                                style={{ display: 'inline-flex', alignItems: 'center', color: '#475569' }}
                              >
                                <ChevronDown size={18} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                              </span>
                            )}
                          </div>
                          {r.points > 0 && (
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '800',
                              color: '#c2410c',
                              background: '#ffedd5',
                              padding: '3px 10px',
                              borderRadius: '8px'
                            }}>
                              +{r.points} pts
                            </span>
                          )}
                        </div>

                        {/* Fecha de calendario (desplegable) */}
                        {isOpen && r.date && (
                          <div style={{ padding: '8px 16px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                            <Calendar size={14} color="#64748b" /> {formatDate(r.date)}
                          </div>
                        )}

                        {/* Partido/Rival de la fecha (desplegable) */}
                        {isOpen && r.matches.length > 0 && (
                          <div style={{
                            padding: '8px 16px',
                            background: '#ffffff',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '13px',
                            color: '#64748b'
                          }}>
                            {r.matches.map(m => (
                              <div key={m.match_id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Partido:</span>
                                <b style={{ color: '#1e293b' }}>vs {m.opponent}</b>
                                {m.score && (
                                  <span style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    color: '#334155'
                                  }}>
                                    {m.score}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Listado de eventos / sanciones simplificado */}
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Tarjetas Rojas */}
                          {r.red_cards.map((rc, i) => (
                            <EventCard
                              key={`r${i}`}
                              icon={<CardIcon color={RED} w={12} h={16} glow />}
                              title={rc.player}
                              report={rc.reason}
                              suspension={rc.suspension_dates}
                              pts={pc.red}
                            />
                          ))}

                          {/* Tarjetas Amarillas individuales */}
                          {r.yellow_cards.map((ycName, i) => (
                            <EventCard
                              key={`y${i}`}
                              icon={<CardIcon color={YELLOW} w={12} h={16} glow />}
                              title={ycName}
                              pts={pc.yellow}
                            />
                          ))}

                          {/* Tarjeta Azul */}
                          {r.blue_cards.map(bc => (
                            <EventCard
                              key={`b${bc.id}`}
                              icon={<CardIcon color={BLUE} w={12} h={16} glow />}
                              title="Tarjeta Azul"
                              report={bc.reason}
                              date={bc.created_at}
                              pts={data.blue_card_enabled ? pc.blue : 0}
                              onDelete={canEdit ? () => setConfirmDeleteId(bc.id) : null}
                            />
                          ))}

                          {/* Walkovers (WO) */}
                          {r.wo.map((w, i) => (
                            <EventCard
                              key={`w${i}`}
                              icon={<span style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff', background: '#374151', borderRadius: '4px', padding: '2px 5px' }}>WO</span>}
                              title="WO"
                              report={`El equipo no se presentó al encuentro vs ${w.opponent}.`}
                              pts={w.points}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Valores al pie de la sección */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '11px 14px',
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '4px',
                lineHeight: 1.5,
              }}>
                <b style={{ color: '#0f172a' }}>Valores:</b>{' '}
                Amarilla {pc.yellow} pt · Roja {pc.red} pts{data.blue_card_enabled ? ` · Azul ${pc.blue} pts` : ''}{data.wo_enabled ? ` · WO ${pc.wo} pts` : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmación de borrado */}
      {confirmDeleteId && (
        <div style={{ ...overlayStyle, zIndex: 1000001 }} onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}>
          <div className="animate-fade-in anthropic-theme" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #e6dfd3',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CardIcon color={BLUE} w={20} h={26} glow />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#191919' }}>Eliminar tarjeta azul</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.4 }}>
              Se descontarán los puntos de la tabla de Fair Play. ¿Deseás continuar?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setConfirmDeleteId(null)} style={btnSecondary}>Cancelar</button>
              <button type="button" onClick={() => handleDelete(confirmDeleteId)} style={{ ...btnPrimary, background: '#b91c1c' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
