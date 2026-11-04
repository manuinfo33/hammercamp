import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, X, Shield, Star, AlertCircle
} from 'lucide-react';
import api from '../../api';
import { Modal } from '../finanzas/common';

// Selector desplegable compacto para resultados y goles (muestra 0 a 5 goles visibles = 6 items, scroll hasta 99)
const ScoreDropdownPicker = ({
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  max = 99,
  isPlayer = false
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('.active');
      if (activeEl) {
        dropdownRef.current.scrollTop = activeEl.offsetTop - (isPlayer ? 56 : 60);
      }
    }
  }, [isOpen, isPlayer]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {value}
      </div>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999998,
              background: 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
          <div
            ref={dropdownRef}
            className={`score-dropdown-menu ${isPlayer ? 'player-goals' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {Array.from({ length: max + 1 }, (_, i) => (
              <div
                key={i}
                className={`score-dropdown-item ${Number(value) === i ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(i);
                  onClose();
                }}
              >
                {i}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Switch compacto
const CompactToggleSwitch = ({ checked, onChange }) => {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        background: checked ? '#141413' : '#e4e4e7',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        display: 'inline-block',
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      <div 
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

// Switch estándar para Penales
const MainToggleSwitch = ({ checked, onChange }) => {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: '42px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#141413' : '#e4e4e7',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        display: 'inline-block',
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      <div 
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

const MatchResultModal = ({
  match,
  roundName,
  tournamentId,
  onClose,
  onSuccess,
  isMobile
}) => {
  const [internalMobile, setInternalMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setInternalMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const mobile = isMobile ?? internalMobile;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Marcador y opciones del partido
  const [localScore, setLocalScore] = useState(match?.local_score !== null && match?.local_score !== undefined ? match.local_score : 0);
  const [visitorScore, setVisitorScore] = useState(match?.visitor_score !== null && match?.visitor_score !== undefined ? match.visitor_score : 0);
  const [penalties, setPenalties] = useState(Boolean(match?.penalties));
  const [localPenalties, setLocalPenalties] = useState(match?.local_penalties !== null && match?.local_penalties !== undefined ? match.local_penalties : 0);
  const [visitorPenalties, setVisitorPenalties] = useState(match?.visitor_penalties !== null && match?.visitor_penalties !== undefined ? match.visitor_penalties : 0);

  const VALID_STATUSES = ['FINALIZADO', 'PENDIENTE', 'POSTERGADO', 'SUSPENDIDO'];
  const initialStatus = VALID_STATUSES.includes(match?.status)
    ? match.status
    : (match?.played ? 'FINALIZADO' : 'PENDIENTE');
  const [matchStatus, setMatchStatus] = useState(initialStatus);
  const [pointsAwardedTo, setPointsAwardedTo] = useState(match?.points_awarded_to || null);

  // Estado para controlar qué desplegable de selección está abierto
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Planteles cargados desde Lista de Buena Fe
  const [localRoster, setLocalRoster] = useState([]);
  const [visitorRoster, setVisitorRoster] = useState([]);

  // Modal / Diálogo de 2 pasos para Tarjeta Roja
  const [redCardModal, setRedCardModal] = useState({
    isOpen: false,
    step: 1, // 1: fechas, 2: motivo
    teamType: null, // 'local' | 'visitor'
    playerIndex: null,
    playerName: '',
    suspensionDates: '',
    reason: ''
  });
  const [redCardError, setRedCardError] = useState('');

  // Modal de confirmación para Borrar Resultado
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Cargar jugadores de LBF y estadísticas existentes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const localTeamId = match.local_team;
        const visitorTeamId = match.visitor_team;

        const [localRes, visitorRes] = await Promise.all([
          api.get(`good-faith-lists/?tournament=${tournamentId}&team=${localTeamId}`),
          api.get(`good-faith-lists/?tournament=${tournamentId}&team=${visitorTeamId}`)
        ]);

        // Mapa de estadísticas previas si ya existen
        const statsMap = {};
        if (match.player_stats && Array.isArray(match.player_stats)) {
          match.player_stats.forEach(st => {
            statsMap[st.player] = st;
          });
        }

        const buildRoster = (lbfList, teamId) => {
          return lbfList.map(item => {
            const playerId = item.player;
            const existingStat = statsMap[playerId];

            const goals = existingStat ? existingStat.goals : 0;
            const yellow_card = existingStat ? Boolean(existingStat.yellow_card) : false;
            const red_card = existingStat ? Boolean(existingStat.red_card) : false;
            const red_card_suspension_dates = existingStat?.red_card_suspension_dates || '';
            const red_card_reason = existingStat?.red_card_reason || '';
            const is_figura = existingStat ? Boolean(existingStat.is_figura) : false;
            const played = existingStat ? Boolean(existingStat.played) : false;

            // Extraer apellido y nombre
            let lastName = item.last_name || '';
            let firstName = item.first_name || '';

            if (!lastName && !firstName && item.player_name) {
              if (item.player_name.includes(',')) {
                const parts = item.player_name.split(',');
                lastName = parts[0].trim();
                firstName = parts[1].trim();
              } else {
                const parts = item.player_name.trim().split(' ');
                if (parts.length > 1) {
                  firstName = parts.slice(0, -1).join(' ');
                  lastName = parts[parts.length - 1];
                } else {
                  lastName = item.player_name;
                }
              }
            }

            return {
              recordId: item.id,
              player: playerId,
              team: teamId,
              lastName: lastName || `Jugador ${playerId}`,
              firstName: firstName || '',
              goals,
              yellow_card,
              red_card,
              red_card_suspension_dates,
              red_card_reason,
              is_figura,
              played: played || goals > 0 || yellow_card || red_card || is_figura
            };
          });
        };

        setLocalRoster(buildRoster(localRes.data, localTeamId));
        setVisitorRoster(buildRoster(visitorRes.data, visitorTeamId));
      } catch (err) {
        console.error("Error al cargar datos del partido:", err);
        setErrorMessage("Hubo un error al cargar la lista de buena fe de los equipos.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [match, tournamentId]);

  // Manejo de cambio de goles (G)
  const handleGoalsChange = (teamType, index, val) => {
    const goalsNum = parseInt(val, 10) || 0;
    const updateRoster = (prev) => {
      const updated = [...prev];
      const p = { ...updated[index] };
      p.goals = goalsNum;
      if (goalsNum > 0) {
        p.played = true;
      }
      updated[index] = p;
      return updated;
    };

    if (teamType === 'local') {
      setLocalRoster(updateRoster);
    } else {
      setVisitorRoster(updateRoster);
    }
  };

  // Manejo de Amarilla (A)
  const handleToggleYellow = (teamType, index) => {
    const updateRoster = (prev) => {
      const updated = [...prev];
      const p = { ...updated[index] };
      p.yellow_card = !p.yellow_card;
      if (p.yellow_card) {
        p.played = true;
      }
      updated[index] = p;
      return updated;
    };

    if (teamType === 'local') {
      setLocalRoster(updateRoster);
    } else {
      setVisitorRoster(updateRoster);
    }
  };

  // Manejo de Roja (R)
  const handleRedCardClick = (teamType, index) => {
    const roster = teamType === 'local' ? localRoster : visitorRoster;
    const player = roster[index];

    // Si ya tiene roja: se elimina la sanción
    if (player.red_card) {
      const updateRoster = (prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          red_card: false,
          red_card_suspension_dates: '',
          red_card_reason: ''
        };
        return updated;
      };
      if (teamType === 'local') setLocalRoster(updateRoster);
      else setVisitorRoster(updateRoster);
      return;
    }

    // Si no tiene roja: abrir diálogo paso 1
    const fullName = `${player.firstName} ${player.lastName}`.trim() || player.lastName;
    setRedCardError('');
    setRedCardModal({
      isOpen: true,
      step: 1,
      teamType,
      playerIndex: index,
      playerName: fullName,
      suspensionDates: '',
      reason: ''
    });
  };

  // Avanzar al paso 2 de Tarjeta Roja con validación de 0 a 99
  const handleRedCardStep1Confirm = () => {
    const val = redCardModal.suspensionDates.trim();
    if (val !== '') {
      const num = Number(val);
      if (!/^\d+$/.test(val) || isNaN(num) || num < 0 || num > 99) {
        setRedCardError('La cantidad de fechas debe ser un número entre 0 y 99.');
        return;
      }
    }
    setRedCardError('');
    setRedCardModal(prev => ({
      ...prev,
      step: 2
    }));
  };

  // Finalizar paso 2 de Tarjeta Roja
  const handleRedCardStep2Confirm = () => {
    const { teamType, playerIndex, suspensionDates, reason } = redCardModal;

    const updateRoster = (prev) => {
      const updated = [...prev];
      const p = { ...updated[playerIndex] };
      p.red_card = true;
      p.red_card_suspension_dates = suspensionDates.trim();
      p.red_card_reason = reason.trim();
      p.played = true;
      updated[playerIndex] = p;
      return updated;
    };

    if (teamType === 'local') {
      setLocalRoster(updateRoster);
    } else {
      setVisitorRoster(updateRoster);
    }

    setRedCardError('');
    setRedCardModal({
      isOpen: false,
      step: 1,
      teamType: null,
      playerIndex: null,
      playerName: '',
      suspensionDates: '',
      reason: ''
    });
  };

  // Cancelar diálogo de Tarjeta Roja
  const handleRedCardCancel = () => {
    setRedCardError('');
    setRedCardModal({
      isOpen: false,
      step: 1,
      teamType: null,
      playerIndex: null,
      playerName: '',
      suspensionDates: '',
      reason: ''
    });
  };

  // Manejo de Figura (F): exclusivo en todo el partido
  const handleToggleFigura = (teamType, index) => {
    const roster = teamType === 'local' ? localRoster : visitorRoster;
    const isCurrentlyFigura = roster[index].is_figura;

    // Si ya era figura, al presionar se desmarca
    if (isCurrentlyFigura) {
      if (teamType === 'local') {
        setLocalRoster(prev => prev.map((p, i) => i === index ? { ...p, is_figura: false } : p));
      } else {
        setVisitorRoster(prev => prev.map((p, i) => i === index ? { ...p, is_figura: false } : p));
      }
      return;
    }

    // Desmarcar en ambos equipos y asignar al seleccionado
    if (teamType === 'local') {
      setLocalRoster(prev => prev.map((p, i) => {
        if (i === index) return { ...p, is_figura: true, played: true };
        return { ...p, is_figura: false };
      }));
      setVisitorRoster(prev => prev.map(p => ({ ...p, is_figura: false })));
    } else {
      setVisitorRoster(prev => prev.map((p, i) => {
        if (i === index) return { ...p, is_figura: true, played: true };
        return { ...p, is_figura: false };
      }));
      setLocalRoster(prev => prev.map(p => ({ ...p, is_figura: false })));
    }
  };

  // Manejo manual de Jugó (J)
  const handleTogglePlayed = (teamType, index) => {
    const updateRoster = (prev) => {
      const updated = [...prev];
      const p = { ...updated[index] };
      p.played = !p.played;
      updated[index] = p;
      return updated;
    };

    if (teamType === 'local') {
      setLocalRoster(updateRoster);
    } else {
      setVisitorRoster(updateRoster);
    }
  };

  // Guardar resultado
  const handleSaveResult = async () => {
    try {
      setSaving(true);
      setErrorMessage('');

      // Juntar estadísticas de ambos planteles
      const allStats = [...localRoster, ...visitorRoster].map(p => ({
        player: p.player,
        team: p.team,
        goals: p.goals,
        yellow_card: p.yellow_card,
        red_card: p.red_card,
        red_card_suspension_dates: p.red_card_suspension_dates,
        red_card_reason: p.red_card_reason,
        is_figura: p.is_figura,
        played: p.played
      }));

      const payload = {
        local_score: localScore === '' ? null : localScore,
        visitor_score: visitorScore === '' ? null : visitorScore,
        penalties: penalties,
        local_penalties: penalties ? (localPenalties === '' ? null : localPenalties) : null,
        visitor_penalties: penalties ? (visitorPenalties === '' ? null : visitorPenalties) : null,
        status: matchStatus,
        points_awarded_to: pointsAwardedTo,
        player_stats: allStats
      };

      await api.post(`matches/${match.id}/save-result/`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error guardando resultado:", err);
      setErrorMessage(err.response?.data?.detail || "Hubo un error al guardar el resultado del partido.");
    } finally {
      setSaving(false);
    }
  };

  // Borrar resultado
  const handleConfirmClearResult = async () => {
    try {
      setSaving(true);
      setShowConfirmDelete(false);
      await api.post(`matches/${match.id}/clear-result/`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error borrando resultado:", err);
      setErrorMessage("Hubo un error al borrar el resultado del partido.");
    } finally {
      setSaving(false);
    }
  };

  // Render de la tabla de un equipo con Grid uniforme
  const renderTeamTable = (teamName, roster, teamType) => {
    const colGap = mobile ? '8px' : '12px';

    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        {/* Cabecera con Nombre del Equipo (Negro con texto blanco, coherente con Fixture y Zonas) */}
        <div style={{
          background: '#18181b',
          color: '#ffffff',
          padding: '10px 14px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '12.5px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #27272a'
        }}>
          {teamName}
        </div>

        {/* Subcabecera con columnas */}
        <div style={{
          background: '#f8f9fa',
          color: '#71717a',
          borderBottom: '1px solid #e4e4e7',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.05em'
        }}>
          <span style={{ flex: 1, textTransform: 'uppercase' }}>JUGADOR/A</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 28px 28px 28px 36px',
            gap: colGap,
            alignItems: 'center',
            justifyItems: 'center',
            textAlign: 'center'
          }}>
            <span style={{ width: '28px', textAlign: 'center', color: '#18181b' }} title="Goles">G</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#ca8a04' }} title="Tarjeta Amarilla">A</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#dc2626' }} title="Tarjeta Roja">R</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#18181b' }} title="Figura del partido">F</span>
            <span style={{ width: '36px', textAlign: 'center', color: '#18181b' }} title="Jugó">J</span>
          </div>
        </div>

        {/* Filas de Jugadores */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {roster.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
              No hay jugadores en la lista de buena fe de este equipo.
            </div>
          ) : (
            roster.map((player, idx) => {
              const fullText = `${player.firstName} ${player.lastName}`.trim();
              const isExtensive = fullText.length > 21 || (player.lastName && player.lastName.length > 14);

              return (
                <div 
                  key={player.player}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: idx === roster.length - 1 ? 'none' : '1px solid #f0f0f2',
                    background: idx % 2 === 0 ? '#fafafb' : '#ffffff',
                    minHeight: '44px'
                  }}
                >
                  {/* Nombre y Apellido */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingRight: '10px',
                    lineHeight: '1.25'
                  }}>
                    {isExtensive ? (
                      <>
                        <span style={{
                          fontSize: '12.5px',
                          fontWeight: '600',
                          color: '#18181b',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          {player.lastName}
                        </span>
                        {player.firstName && (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: '400',
                            color: '#71717a',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            marginTop: '1px'
                          }}>
                            {player.firstName}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{
                        fontSize: '12.5px',
                        fontWeight: '600',
                        color: '#18181b',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        {fullText}
                      </span>
                    )}
                  </div>

                  {/* Controles en Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 28px 28px 28px 36px',
                    gap: colGap,
                    alignItems: 'center',
                    justifyItems: 'center'
                  }}>
                    {/* G: Goles */}
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="Goles anotados"
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1.5px solid #d4d4d8',
                        background: '#ffffff',
                        color: player.goals > 0 ? '#18181b' : '#71717a',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        boxSizing: 'border-box'
                      }}>
                        <ScoreDropdownPicker
                          value={player.goals}
                          onChange={(val) => handleGoalsChange(teamType, idx, val)}
                          isOpen={activeDropdown === `player_${teamType}_${idx}`}
                          onToggle={() => setActiveDropdown(activeDropdown === `player_${teamType}_${idx}` ? null : `player_${teamType}_${idx}`)}
                          onClose={() => setActiveDropdown(null)}
                          isPlayer={true}
                        />
                      </div>
                    </div>

                    {/* A: Tarjeta Amarilla */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleYellow(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: player.yellow_card ? '1.5px solid #ca8a04' : '1.5px solid #d4d4d8',
                        background: player.yellow_card ? '#facc15' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        boxShadow: player.yellow_card ? '0 1px 4px rgba(250, 204, 21, 0.4)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={player.yellow_card ? 'Quitar tarjeta amarilla' : 'Asignar tarjeta amarilla'}
                    >
                      {player.yellow_card ? <Check size={15} strokeWidth={3} color="#000000" /> : null}
                    </div>

                    {/* R: Tarjeta Roja */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRedCardClick(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: player.red_card ? '1.5px solid #dc2626' : '1.5px solid #d4d4d8',
                        background: player.red_card ? '#ef4444' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        fontWeight: '800',
                        fontSize: '12px',
                        boxShadow: player.red_card ? '0 1px 4px rgba(239, 68, 68, 0.4)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={
                        player.red_card 
                          ? `Roja: ${player.red_card_suspension_dates || 'Sin definir'} fechas. Clic para quitar.`
                          : 'Asignar tarjeta roja'
                      }
                    >
                      {player.red_card ? (
                        <span>{player.red_card_suspension_dates || 'R'}</span>
                      ) : null}
                    </div>

                    {/* F: Figura del Partido */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleFigura(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: player.is_figura ? '2px solid #141413' : '1.5px solid #d4d4d8',
                        background: player.is_figura ? '#141413' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        boxShadow: player.is_figura ? '0 2px 5px rgba(0,0,0,0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={player.is_figura ? 'Figura del partido (Clic para quitar)' : 'Marcar como figura'}
                    >
                      {player.is_figura ? (
                        <Star size={13} fill="#ffffff" strokeWidth={1} color="#ffffff" />
                      ) : null}
                    </div>

                    {/* J: Jugó */}
                    <CompactToggleSwitch 
                      checked={player.played}
                      onChange={() => handleTogglePlayed(teamType, idx)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Contenido de las tarjetas y formulario
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Alerta de Error si ocurre */}
      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. TARJETA DE RESULTADO / MARCADOR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e4e4e7',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        {/* Barra superior con la Fecha (Negro con texto blanco idéntico a Fixture) */}
        <div style={{
          background: '#18181b',
          color: '#ffffff',
          padding: '10px 16px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '12px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          borderBottom: '1px solid #27272a'
        }}>
          {roundName || match?.match_round_name || 'PARTIDO'}
        </div>

        {/* Escudos, Nombres y Marcador */}
        <div style={{
          padding: mobile ? '16px 12px 14px' : '20px 20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Equipo Local */}
          <div style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '8px',
            minWidth: 0
          }}>
            <div style={{
              width: mobile ? '48px' : '58px',
              height: mobile ? '48px' : '58px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#f8f8fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e4e4e7'
            }}>
              {match.local_team_logo ? (
                <img src={match.local_team_logo} alt={match.local_team_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Shield size={24} color="#71717a" />
              )}
            </div>
            <span style={{
              fontWeight: '700',
              fontSize: mobile ? '12px' : '13px',
              color: '#18181b',
              lineHeight: '1.25',
              wordBreak: 'break-word'
            }}>
              {match.local_team_name}
            </span>
          </div>

          {/* Marcador al centro */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: mobile ? '8px' : '14px',
            flexShrink: 0
          }}>
            {/* Goles Local */}
            <div style={{
              position: 'relative',
              width: mobile ? '44px' : '52px',
              height: mobile ? '44px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {mobile ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  fontSize: '20px',
                  fontWeight: '800',
                  textAlign: 'center',
                  border: '1.5px solid #d4d4d8',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#18181b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  boxSizing: 'border-box'
                }}>
                  <ScoreDropdownPicker
                    value={localScore}
                    onChange={(val) => setLocalScore(val)}
                    isOpen={activeDropdown === 'localScore'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'localScore' ? null : 'localScore')}
                    onClose={() => setActiveDropdown(null)}
                    isPlayer={false}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={localScore}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setLocalScore(val === '' ? '' : parseInt(val, 10));
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '22px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d4d4d8',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#18181b',
                    outline: 'none',
                    lineHeight: 'normal',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            <span style={{ fontSize: '18px', fontWeight: '800', color: '#a1a1aa' }}>-</span>

            {/* Goles Visitante */}
            <div style={{
              position: 'relative',
              width: mobile ? '44px' : '52px',
              height: mobile ? '44px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {mobile ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  fontSize: '20px',
                  fontWeight: '800',
                  textAlign: 'center',
                  border: '1.5px solid #d4d4d8',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#18181b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  boxSizing: 'border-box'
                }}>
                  <ScoreDropdownPicker
                    value={visitorScore}
                    onChange={(val) => setVisitorScore(val)}
                    isOpen={activeDropdown === 'visitorScore'}
                    onToggle={() => setActiveDropdown(activeDropdown === 'visitorScore' ? null : 'visitorScore')}
                    onClose={() => setActiveDropdown(null)}
                    isPlayer={false}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={visitorScore}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setVisitorScore(val === '' ? '' : parseInt(val, 10));
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '22px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d4d4d8',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#18181b',
                    outline: 'none',
                    lineHeight: 'normal',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>
          </div>

          {/* Equipo Visitante */}
          <div style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '8px',
            minWidth: 0
          }}>
            <div style={{
              width: mobile ? '48px' : '58px',
              height: mobile ? '48px' : '58px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#f8f8fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e4e4e7'
            }}>
              {match.visitor_team_logo ? (
                <img src={match.visitor_team_logo} alt={match.visitor_team_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Shield size={24} color="#71717a" />
              )}
            </div>
            <span style={{
              fontWeight: '700',
              fontSize: mobile ? '12px' : '13px',
              color: '#18181b',
              lineHeight: '1.25',
              wordBreak: 'break-word'
            }}>
              {match.visitor_team_name}
            </span>
          </div>
        </div>

        {/* Switch de Penales */}
        <div style={{
          borderTop: '1px solid #f0f0f2',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: '#fafafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#52514e' }}>Definición por Penales</span>
            <MainToggleSwitch 
              checked={penalties}
              onChange={() => setPenalties(!penalties)}
            />
          </div>

          {/* Si se selecciona Penales */}
          {penalties && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              paddingTop: '2px'
            }}>
              {/* Penales Local */}
              <div style={{
                position: 'relative',
                width: '38px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {mobile ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '15px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d4d4d8',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box'
                  }}>
                    <ScoreDropdownPicker
                      value={localPenalties}
                      onChange={(val) => setLocalPenalties(val)}
                      isOpen={activeDropdown === 'localPenalties'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'localPenalties' ? null : 'localPenalties')}
                      onClose={() => setActiveDropdown(null)}
                      isPlayer={false}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={localPenalties}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setLocalPenalties(val === '' ? '' : parseInt(val, 10));
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: '15px',
                      fontWeight: '800',
                      textAlign: 'center',
                      border: '1.5px solid #d4d4d8',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#18181b',
                      outline: 'none',
                      lineHeight: 'normal',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box'
                    }}
                    title={`Penales ${match.local_team_name}`}
                  />
                )}
              </div>

              <span style={{ fontSize: '14px', fontWeight: '800', color: '#a1a1aa' }}>-</span>

              {/* Penales Visitante */}
              <div style={{
                position: 'relative',
                width: '38px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {mobile ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '15px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d4d4d8',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    boxSizing: 'border-box'
                  }}>
                    <ScoreDropdownPicker
                      value={visitorPenalties}
                      onChange={(val) => setVisitorPenalties(val)}
                      isOpen={activeDropdown === 'visitorPenalties'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'visitorPenalties' ? null : 'visitorPenalties')}
                      onClose={() => setActiveDropdown(null)}
                      isPlayer={false}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={visitorPenalties}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setVisitorPenalties(val === '' ? '' : parseInt(val, 10));
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: '15px',
                      fontWeight: '800',
                      textAlign: 'center',
                      border: '1.5px solid #d4d4d8',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#18181b',
                      outline: 'none',
                      lineHeight: 'normal',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box'
                    }}
                    title={`Penales ${match.visitor_team_name}`}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ESTADO DEL PARTIDO */}
      <div style={{
        background: '#faf9f6',
        borderRadius: '10px',
        padding: '12px 14px',
        border: '1px solid #e6e4dd',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: '#52514e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Estado del partido
        </label>
        <select
          value={matchStatus}
          onChange={(e) => setMatchStatus(e.target.value)}
          style={{
            width: '100%',
            height: '38px',
            border: '1px solid #d4d3ce',
            borderRadius: '8px',
            background: '#ffffff',
            color: '#18181b',
            fontWeight: '600',
            fontSize: '13.5px',
            outline: 'none',
            cursor: 'pointer',
            padding: '0 10px',
            boxSizing: 'border-box'
          }}
        >
          <option value="FINALIZADO">FINALIZADO</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="POSTERGADO">POSTERGADO</option>
          <option value="SUSPENDIDO">SUSPENDIDO</option>
        </select>
      </div>

      {/* 3. TABLA EQUIPO LOCAL */}
      {renderTeamTable(match.local_team_name, localRoster, 'local')}

      {/* 4. TABLA EQUIPO VISITANTE */}
      {renderTeamTable(match.visitor_team_name, visitorRoster, 'visitor')}

      {/* 5. NO SE JUGO EL PARTIDO. LOS PUNTOS SON PARA: */}
      <div style={{
        background: '#faf9f6',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e6e4dd'
      }}>
        <div style={{
          padding: '10px 14px',
          fontWeight: '700',
          fontSize: '11px',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          color: '#52514e',
          borderBottom: '1px solid #e6e4dd',
          background: '#f5f4ef'
        }}>
          No se jugó el partido. Los puntos son para:
        </div>

        <div style={{
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
          gap: '10px'
        }}>
          {/* Opción Local */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => {
              setPointsAwardedTo(pointsAwardedTo === match.local_team ? null : match.local_team);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: pointsAwardedTo === match.local_team ? '#ffffff' : 'transparent',
              border: pointsAwardedTo === match.local_team ? '1.5px solid #141413' : '1px solid #d4d3ce',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              border: pointsAwardedTo === match.local_team ? '1.5px solid #141413' : '1.5px solid #a1a1aa',
              background: pointsAwardedTo === match.local_team ? '#141413' : '#ffffff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {pointsAwardedTo === match.local_team && (
                <Check size={13} strokeWidth={3} />
              )}
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.local_team_name}
            </span>
          </div>

          {/* Opción Visitante */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => {
              setPointsAwardedTo(pointsAwardedTo === match.visitor_team ? null : match.visitor_team);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: pointsAwardedTo === match.visitor_team ? '#ffffff' : 'transparent',
              border: pointsAwardedTo === match.visitor_team ? '1.5px solid #141413' : '1px solid #d4d3ce',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              border: pointsAwardedTo === match.visitor_team ? '1.5px solid #141413' : '1.5px solid #a1a1aa',
              background: pointsAwardedTo === match.visitor_team ? '#141413' : '#ffffff',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {pointsAwardedTo === match.visitor_team && (
                <Check size={13} strokeWidth={3} />
              )}
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.visitor_team_name}
            </span>
          </div>
        </div>
      </div>

      {/* 6. BOTONES INFERIORES: GUARDAR Y BORRAR RESULTADO */}
      <div style={{
        display: 'flex',
        flexDirection: mobile ? 'column-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        paddingTop: '8px',
        borderTop: '1px solid #f0f0f2',
        marginTop: '4px'
      }}>
        {/* Borrar Resultado */}
        <button
          type="button"
          onClick={() => setShowConfirmDelete(true)}
          disabled={saving}
          style={{
            width: mobile ? '100%' : 'auto',
            height: '38px',
            padding: '0 14px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
        >
          Borrar Resultado
        </button>

        <div style={{
          display: 'flex',
          gap: '10px',
          width: mobile ? '100%' : 'auto',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: mobile ? 1 : 'none',
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              background: '#ffffff',
              color: '#18181b',
              border: '1px solid #d4d3ce',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveResult}
            disabled={saving}
            style={{
              flex: mobile ? 1 : 'none',
              height: '38px',
              padding: '0 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#141413',
              color: '#ffffff',
              border: '1px solid #141413',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} />
            {saving ? "Guardando..." : "Guardar Partido"}
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      <Modal
        title="Cargar Partido"
        onClose={onClose}
        width={620}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a', fontSize: '13.5px' }}>
            Cargando datos del partido...
          </div>
        ) : content}
      </Modal>

      {/* =========================================================
          MODAL DE 2 PASOS PARA TARJETA ROJA (Portal a document.body)
          ========================================================= */}
      {redCardModal.isOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000000,
          background: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid #e4e4e7'
          }} className="animate-fade-in anthropic-theme" onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '24px',
                height: '32px',
                borderRadius: '4px',
                background: '#ef4444',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }} />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#18181b' }}>
                Tarjeta Roja
              </h3>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '600', color: '#52514e' }}>
              Jugador/a: <strong style={{ color: '#18181b' }}>{redCardModal.playerName}</strong>
            </div>

            {/* PASO 1: Cantidad de fechas */}
            {redCardModal.step === 1 && (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: '#52514e', lineHeight: '1.4' }}>
                  Ingresá la cantidad de fechas de suspensión (o dejalo vacío para definirlo luego):
                </p>
                <input
                  type="text"
                  placeholder="Ej: 1, 2, o dejar vacío"
                  value={redCardModal.suspensionDates}
                  onChange={(e) => {
                    setRedCardError('');
                    setRedCardModal({ ...redCardModal, suspensionDates: e.target.value });
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: redCardError ? '1.5px solid #ef4444' : '1px solid #d4d3ce',
                    background: '#ffffff',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: '#18181b',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedCardStep1Confirm();
                    if (e.key === 'Escape') handleRedCardCancel();
                  }}
                />

                {redCardError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{redCardError}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleRedCardCancel}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #d4d3ce',
                      background: '#ffffff',
                      color: '#18181b',
                      fontWeight: '500',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRedCardStep1Confirm}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #141413',
                      background: '#141413',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}

            {/* PASO 2: Motivo de la suspensión */}
            {redCardModal.step === 2 && (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: '#52514e', lineHeight: '1.4' }}>
                  Ingresá el motivo de la suspensión:
                </p>
                <textarea
                  placeholder="Describí el motivo de la expulsión..."
                  rows={3}
                  value={redCardModal.reason}
                  onChange={(e) => setRedCardModal({ ...redCardModal, reason: e.target.value })}
                  autoFocus
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #d4d3ce',
                    background: '#ffffff',
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#18181b',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRedCardStep2Confirm();
                    }
                    if (e.key === 'Escape') handleRedCardCancel();
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleRedCardCancel}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #d4d3ce',
                      background: '#ffffff',
                      color: '#18181b',
                      fontWeight: '500',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRedCardStep2Confirm}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #141413',
                      background: '#141413',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================
          MODAL DE CONFIRMACIÓN PARA BORRAR RESULTADO (Portal a document.body)
          ========================================================= */}
      {showConfirmDelete && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000000,
          background: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1px solid #fecaca'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#dc2626' }}>
              ¿Borrar resultado del partido?
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#52514e', lineHeight: '1.5' }}>
              Se restablecerá el marcador del partido y se eliminarán los goles, tarjetas y estadísticas de los jugadores en este encuentro.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #d4d3ce',
                  background: '#ffffff',
                  color: '#18181b',
                  fontWeight: '500',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearResult}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Confirmar Borrado
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MatchResultModal;
