import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Check, X, Shield, Star, AlertCircle
} from 'lucide-react';
import api from '../../api';

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

// Switch compacto estilo LbfSwitch
const CompactToggleSwitch = ({ checked, onChange }) => {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '11px',
        background: checked ? '#4cd964' : '#e5e5ea',
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
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
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
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#4cd964' : '#e5e5ea',
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
          left: checked ? '22px' : '2px',
          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
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

  // Render de la tabla de un equipo con Grid uniforme y espaciado claro
  const renderTeamTable = (teamName, roster, teamType) => {
    const colGap = isMobile ? '10px' : '14px';

    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #d8cfc0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        position: 'relative'
      }}>
        {/* Cabecera con Nombre del Equipo (Gris más oscuro que #EAE4D8) */}
        <div style={{
          background: '#d9d2c5',
          color: '#191919',
          padding: '11px 16px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '0.92rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #cbbeab',
          borderRadius: '13px 13px 0 0'
        }}>
          {teamName}
        </div>

        {/* Subcabecera con columnas exactamente centradas (#EAE4D8) */}
        <div style={{
          background: '#EAE4D8',
          color: '#191919',
          borderBottom: '1px solid #dfd8cc',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.05em'
        }}>
          <span style={{ flex: 1, textTransform: 'uppercase', color: '#191919' }}>JUGADOR/A</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 28px 28px 28px 40px',
            gap: colGap,
            alignItems: 'center',
            justifyItems: 'center',
            textAlign: 'center'
          }}>
            <span style={{ width: '28px', textAlign: 'center', color: '#191919' }}>G</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#ca8a04' }}>A</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#dc2626' }}>R</span>
            <span style={{ width: '28px', textAlign: 'center', color: '#191919' }}>F</span>
            <span style={{ width: '40px', textAlign: 'center', color: '#191919' }}>J</span>
          </div>
        </div>

        {/* Filas de Jugadores */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {roster.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7f776f', fontSize: '13px' }}>
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
                    padding: '8px 14px',
                    borderBottom: idx === roster.length - 1 ? 'none' : '1px solid #f0eae1',
                    background: idx % 2 === 0 ? '#fdfcfb' : '#ffffff',
                    minHeight: '44px'
                  }}
                >
                  {/* Nombre y Apellido: juntos por defecto, sólo pasa a 2da línea si es extenso */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingRight: '12px',
                    lineHeight: '1.25'
                  }}>
                    {isExtensive ? (
                      <>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#191919',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal'
                        }}>
                          {player.lastName}
                        </span>
                        {player.firstName && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '400',
                            color: '#6b7280',
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
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#191919',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        {fullText}
                      </span>
                    )}
                  </div>

                  {/* Controles en Grid idéntico al encabezado con celdas cuadradas y círculo */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 28px 28px 28px 40px',
                    gap: colGap,
                    alignItems: 'center',
                    justifyItems: 'center'
                  }}>
                    {/* G: Goles (Cuadrado 28x28 con número centrado y desplegable de 0 a 5 scrollable) */}
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
                        borderRadius: '5px',
                        border: '1.5px solid #d8cfc0',
                        background: '#ffffff',
                        color: player.goals > 0 ? '#191919' : '#4b5563',
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

                    {/* A: Tarjeta Amarilla (Cuadrado 28x28) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleYellow(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '5px',
                        border: player.yellow_card ? '1.5px solid #ca8a04' : '1.5px solid #d8cfc0',
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
                      {player.yellow_card ? <Check size={16} strokeWidth={3} color="#000000" /> : null}
                    </div>

                    {/* R: Tarjeta Roja (Cuadrado 28x28) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRedCardClick(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '5px',
                        border: player.red_card ? '1.5px solid #dc2626' : '1.5px solid #d8cfc0',
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

                    {/* F: Figura del Partido (Círculo 28x28) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleFigura(teamType, idx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: player.is_figura ? '2px solid #191919' : '1.5px solid #d8cfc0',
                        background: player.is_figura ? '#191919' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        boxShadow: player.is_figura ? '0 2px 5px rgba(0,0,0,0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={player.is_figura ? 'Figura del partido (Clic para quitar)' : 'Marcar como figura'}
                    >
                      {player.is_figura ? (
                        <Star size={13} fill="#ffffff" strokeWidth={1} color="#ffffff" />
                      ) : null}
                    </div>

                    {/* J: Jugó (switch verde/gris) */}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '24px' }}>
      
      {/* Alerta de Error si ocurre */}
      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. TARJETA DE RESULTADO / MARCADOR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #d8cfc0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        position: 'relative'
      }}>
        {/* Barra superior con la Fecha (Gris más oscuro que #EAE4D8) */}
        <div style={{
          background: '#d9d2c5',
          color: '#191919',
          padding: '10px 16px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #cbbeab',
          borderRadius: '13px 13px 0 0'
        }}>
          {roundName || match?.match_round_name || 'PARTIDO'}
        </div>

        {/* Escudos, Nombres y Marcador no cortado */}
        <div style={{
          padding: isMobile ? '20px 12px 16px' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          {/* Equipo Local */}
          <div style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: isMobile ? '52px' : '64px',
              height: isMobile ? '52px' : '64px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f4efe6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e6dfd3'
            }}>
              {match.local_team_logo ? (
                <img src={match.local_team_logo} alt={match.local_team_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Shield size={28} color="#cc7a5c" />
              )}
            </div>
            <span style={{
              fontWeight: '700',
              fontSize: isMobile ? '0.82rem' : '0.92rem',
              color: '#191919',
              lineHeight: '1.2'
            }}>
              {match.local_team_name}
            </span>
          </div>

          {/* Marcador al centro con números limpios sin cortes */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '16px'
          }}>
            {/* Goles Local */}
            <div style={{
              position: 'relative',
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isMobile ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  fontSize: '22px',
                  fontWeight: '800',
                  textAlign: 'center',
                  border: '1.5px solid #d8cfc0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#191919',
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
                    fontSize: '26px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d8cfc0',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#191919',
                    outline: 'none',
                    lineHeight: 'normal',
                    padding: 0,
                    margin: 0,
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            <span style={{ fontSize: '18px', fontWeight: '800', color: '#7f776f' }}>-</span>

            {/* Goles Visitante */}
            <div style={{
              position: 'relative',
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isMobile ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  fontSize: '22px',
                  fontWeight: '800',
                  textAlign: 'center',
                  border: '1.5px solid #d8cfc0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#191919',
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
                    fontSize: '26px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d8cfc0',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#191919',
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
            gap: '6px'
          }}>
            <div style={{
              width: isMobile ? '52px' : '64px',
              height: isMobile ? '52px' : '64px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f4efe6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e6dfd3'
            }}>
              {match.visitor_team_logo ? (
                <img src={match.visitor_team_logo} alt={match.visitor_team_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Shield size={28} color="#cc7a5c" />
              )}
            </div>
            <span style={{
              fontWeight: '700',
              fontSize: isMobile ? '0.82rem' : '0.92rem',
              color: '#191919',
              lineHeight: '1.2'
            }}>
              {match.visitor_team_name}
            </span>
          </div>
        </div>

        {/* Switch de Penales */}
        <div style={{
          borderTop: '1px solid #f0eae1',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: '#fcfbfa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#191919' }}>Penales</span>
            <MainToggleSwitch 
              checked={penalties}
              onChange={() => setPenalties(!penalties)}
            />
          </div>

          {/* Si se selecciona Penales: dos pequeños resultados levemente por debajo */}
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
                {isMobile ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '16px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d8cfc0',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#191919',
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
                      fontSize: '16px',
                      fontWeight: '800',
                      textAlign: 'center',
                      border: '1.5px solid #d8cfc0',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#191919',
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

              <span style={{ fontSize: '15px', fontWeight: '800', color: '#7f776f' }}>-</span>

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
                {isMobile ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '16px',
                    fontWeight: '800',
                    textAlign: 'center',
                    border: '1.5px solid #d8cfc0',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: '#191919',
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
                      fontSize: '16px',
                      fontWeight: '800',
                      textAlign: 'center',
                      border: '1.5px solid #d8cfc0',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#191919',
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
        background: '#ffffff',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid #d8cfc0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: '#7f776f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Estado del partido
        </label>
        <select
          value={matchStatus}
          onChange={(e) => setMatchStatus(e.target.value)}
          style={{
            width: '100%',
            height: '36px',
            border: 'none',
            borderBottom: '2px solid #191919',
            background: 'transparent',
            color: '#191919',
            fontWeight: '500',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            padding: '2px 0'
          }}
        >
          <option value="FINALIZADO" style={{ fontWeight: '400' }}>FINALIZADO</option>
          <option value="PENDIENTE" style={{ fontWeight: '400' }}>PENDIENTE</option>
          <option value="POSTERGADO" style={{ fontWeight: '400' }}>POSTERGADO</option>
          <option value="SUSPENDIDO" style={{ fontWeight: '400' }}>SUSPENDIDO</option>
        </select>
      </div>

      {/* 3. TABLA EQUIPO LOCAL */}
      {renderTeamTable(match.local_team_name, localRoster, 'local')}

      {/* 4. TABLA EQUIPO VISITANTE */}
      {renderTeamTable(match.visitor_team_name, visitorRoster, 'visitor')}

      {/* 5. NO SE JUGO EL PARTIDO. LOS PUNTOS SON PARA: */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #d8cfc0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          background: '#d9d2c5',
          color: '#191919',
          padding: '11px 16px',
          textAlign: 'center',
          fontWeight: '800',
          fontSize: '0.82rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #cbbeab'
        }}>
          NO SE JUGO EL PARTIDO. LOS PUNTOS SON PARA:
        </div>

        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '24px' : '40px',
          flexWrap: 'wrap'
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
              gap: '9px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '5px',
              border: '1.5px solid #d8cfc0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              flexShrink: 0
            }}>
              {pointsAwardedTo === match.local_team && (
                <Check size={16} strokeWidth={3} color="#000000" />
              )}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#191919' }}>
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
              gap: '9px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '5px',
              border: '1.5px solid #d8cfc0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              flexShrink: 0
            }}>
              {pointsAwardedTo === match.visitor_team && (
                <Check size={16} strokeWidth={3} color="#000000" />
              )}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#191919' }}>
              {match.visitor_team_name}
            </span>
          </div>
        </div>
      </div>

      {/* 6. BOTONES INFERIORES: GUARDAR Y BORRAR RESULTADO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={handleSaveResult}
          disabled={saving}
          style={{
            width: '100%',
            height: '44px',
            background: '#4cd964',
            color: '#ffffff',
            border: 'none',
            borderRadius: '22px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(76,217,100,0.3)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#3fc456'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4cd964'; }}
        >
          {saving ? "GUARDANDO..." : "GUARDAR"}
        </button>

        <button
          type="button"
          onClick={() => setShowConfirmDelete(true)}
          disabled={saving}
          style={{
            width: '100%',
            height: '44px',
            background: '#ff3b30',
            color: '#ffffff',
            border: 'none',
            borderRadius: '22px',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(255,59,48,0.3)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e0352b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ff3b30'; }}
        >
          BORRAR RESULTADO
        </button>
      </div>

    </div>
  );

  // MODAL / VISTA según plataforma (Móvil vs PC Escritorio)
  const modalDOM = isMobile ? (
    /* VISTA MÓVIL: Pantalla completa idéntica a modificar equipo (Foto 2), cubriendo el menú superior */
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      background: '#fcfbfa',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }} className="anthropic-theme animate-fade-in">
      
        {/* Cabecera Móvil idéntica a TeamDetailEditor (Foto 2) */}
        <div style={{
          height: '56px',
          background: '#fdfcfb',
          borderBottom: '1px solid #eae4d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          color: '#383530',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#cc7a5c',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>

          <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#383530' }}>
            Cargar Partido
          </span>

          <div style={{ width: '36px' }} />
        </div>

        <div style={{ padding: '16px', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f776f' }}>
              Cargando datos del partido...
            </div>
          ) : content}
        </div>
      </div>
    ) : (
      /* VISTA ESCRITORIO (PC): Mismo diseño y posición de ventana que Editar Partido */
      <div 
        className="premium-modal-overlay anthropic-theme" 
        onClick={onClose}
        style={{ zIndex: 99999 }}
      >
        <div 
          className="premium-modal-card" 
          style={{ 
            maxWidth: '580px', 
            maxHeight: '90vh',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column'
          }} 
          onClick={e => e.stopPropagation()}
        >
          {/* Cabecera idéntica a Editar Partido */}
          <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(204, 122, 92, 0.12)',
                border: '1px solid rgba(204, 122, 92, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Check size={18} color="#cc7a5c" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#191919', lineHeight: '1' }}>
                  Cargar Partido
                </h3>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>


        {/* Cuerpo scrolleable */}
        <div style={{ overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f776f' }}>
              Cargando datos del partido...
            </div>
          ) : content}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalDOM, document.body)}

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
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
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
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '24px',
                height: '32px',
                borderRadius: '4px',
                background: '#ef4444',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#191919' }}>
                Tarjeta Roja
              </h3>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '600', color: '#cc7a5c' }}>
              Jugador/a: {redCardModal.playerName}
            </div>

            {/* PASO 1: Cantidad de fechas */}
            {redCardModal.step === 1 && (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                  Ingresar la cantidad de fechas de suspensión o dejar vacío para definirlo más adelante:
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
                    height: '42px',
                    borderRadius: '8px',
                    border: redCardError ? '1.5px solid #ef4444' : '1.5px solid #d8cfc0',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#191919',
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleRedCardCancel}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #d8cfc0',
                      background: '#f3f4f6',
                      color: '#4b5563',
                      fontWeight: '700',
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
                      height: '40px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#191919',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    OK
                  </button>
                </div>
              </>
            )}

            {/* PASO 2: Motivo de la suspensión */}
            {redCardModal.step === 2 && (
              <>
                <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                  Ingrese el motivo de la suspensión:
                </p>
                <textarea
                  placeholder="Describa el motivo de la expulsión..."
                  rows={3}
                  value={redCardModal.reason}
                  onChange={(e) => setRedCardModal({ ...redCardModal, reason: e.target.value })}
                  autoFocus
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1.5px solid #d8cfc0',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#191919',
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleRedCardCancel}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #d8cfc0',
                      background: '#f3f4f6',
                      color: '#4b5563',
                      fontWeight: '700',
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
                      height: '40px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    OK
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
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
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
            gap: '16px'
          }} className="animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>
              ¿Borrar resultado?
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
              Se restablecerá el marcador del partido y se eliminarán los goles, tarjetas y estadísticas de los jugadores en este encuentro.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #d8cfc0',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  fontWeight: '700',
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
                  height: '40px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ff3b30',
                  color: '#ffffff',
                  fontWeight: '700',
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
