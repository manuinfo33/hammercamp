import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Search, Plus, Users, ArrowLeftRight, AlertTriangle, 
  HelpCircle, Shield, Award, Calendar, CheckCircle2, Circle
} from 'lucide-react';
import api from '../../api';
import TeamForm from '../teams/TeamForm';

export default function ReplaceTeamModal({
  zoneTeam,
  zone,
  categoryId,
  tournamentId,
  onClose,
  onSuccess
}) {
  const [allTeams, setAllTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [inheritPoints, setInheritPoints] = useState(false);
  const [reason, setReason] = useState('Expulsión disciplinaria');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [error, setError] = useState(null);

  // Teams already in this zone (cannot replace with a team that is already playing in the same zone)
  const existingZoneTeamIds = useMemo(() => {
    if (!zone?.zone_teams) return new Set();
    return new Set(zone.zone_teams.map(zt => zt.team));
  }, [zone]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const res = await api.get('teams/');
      setAllTeams(res.data || []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar la lista de equipos.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const filteredTeams = useMemo(() => {
    return allTeams
      .filter(t => !existingZoneTeamIds.has(t.id) && t.id !== zoneTeam.team)
      .filter(t => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.name?.toLowerCase().includes(q) ||
          t.category_name?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Prioritize same category if tournament has category
        if (categoryId) {
          const aMatch = a.category === parseInt(categoryId);
          const bMatch = b.category === parseInt(categoryId);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [allTeams, existingZoneTeamIds, zoneTeam.team, search, categoryId]);

  const handleCreatedTeam = (newTeam) => {
    setAllTeams(prev => [newTeam, ...prev]);
    setSelectedTeamId(newTeam.id);
    setShowCreateTeam(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedTeamId) {
      setError('Debes seleccionar un equipo nuevo para realizar el reemplazo.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        new_team_id: selectedTeamId,
        inherit_points: inheritPoints,
        reason,
        note: note.trim()
      };
      const res = await api.post(`zone-teams/${zoneTeam.id}/replace-team/`, payload);
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Error al procesar el reemplazo.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedTeamObj = allTeams.find(t => t.id === selectedTeamId);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(20, 20, 19, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e5e4df',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e5e4df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: '#f4f3ef',
                border: '1px solid #e5e4df',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#141413'
              }}
            >
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#141413',
                  margin: 0,
                  fontFamily: 'serif'
                }}
              >
                Reemplazar Equipo
              </h2>
              <p style={{ fontSize: '12px', color: '#787772', margin: 0 }}>
                Zona: <strong>{zone?.name || 'Torneo'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: '#787772',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Body content */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Equipo Saliente */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#faf9f6',
              border: '1px solid #e5e4df',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1px solid #e5e4df',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {zoneTeam.team_logo ? (
                  <img
                    src={zoneTeam.team_logo}
                    alt={zoneTeam.team_name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Shield size={20} color="#787772" />
                )}
              </div>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#dc2626',
                    letterSpacing: '0.04em'
                  }}
                >
                  Equipo Saliente
                </span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#141413' }}>
                  {zoneTeam.team_name}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                fontSize: '12px',
                color: '#52514e',
                alignItems: 'center'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#787772', display: 'block' }}>PUNTOS</span>
                <strong style={{ fontSize: '13px', color: '#141413' }}>{zoneTeam.points ?? 0}</strong>
              </div>
              <div style={{ width: '1px', height: '22px', background: '#e5e4df' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#787772', display: 'block' }}>PJ</span>
                <strong style={{ fontSize: '13px', color: '#141413' }}>{zoneTeam.played ?? 0}</strong>
              </div>
              <div style={{ width: '1px', height: '22px', background: '#e5e4df' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#787772', display: 'block' }}>FAIR PLAY</span>
                <strong style={{ fontSize: '13px', color: '#141413' }}>{zoneTeam.fair_play ?? 0}</strong>
              </div>
            </div>
          </div>

          {/* 2. Selector de Equipo Entrante */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#141413'
                }}
              >
                Seleccionar Equipo Entrante *
              </label>
              <button
                type="button"
                onClick={() => setShowCreateTeam(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#141413',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textDecoration: 'underline'
                }}
              >
                <Plus size={14} /> + Crear equipo nuevo
              </button>
            </div>

            {/* Buscador */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e4df',
                background: '#ffffff',
                marginBottom: '8px'
              }}
            >
              <Search size={15} color="#787772" />
              <input
                type="text"
                placeholder="Buscar por nombre de equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                  color: '#141413',
                  background: 'transparent'
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#787772',
                    padding: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Lista de equipos seleccionables */}
            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid #e5e4df',
                borderRadius: '8px',
                background: '#ffffff'
              }}
            >
              {loadingTeams ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#787772' }}>
                  Cargando equipos disponibles...
                </div>
              ) : filteredTeams.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#787772' }}>
                  No se encontraron equipos disponibles fuera de esta zona.
                </div>
              ) : (
                filteredTeams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderBottom: '1px solid #f4f3ef',
                        cursor: 'pointer',
                        background: isSelected ? '#141413' : 'transparent',
                        color: isSelected ? '#ffffff' : '#141413',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(255,255,255,0.1)' : '#f4f3ef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          {team.logo ? (
                            <img
                              src={team.logo}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <Shield size={14} color={isSelected ? '#ffffff' : '#787772'} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{team.name}</div>
                          {team.category_name && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: isSelected ? 'rgba(255,255,255,0.7)' : '#787772'
                              }}
                            >
                              {team.category_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #ffffff' : '2px solid #d4d4d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isSelected ? '#ffffff' : 'transparent'
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#141413'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {selectedTeamObj && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle2 size={13} />
                <span>Equipo seleccionado: <strong>{selectedTeamObj.name}</strong></span>
              </div>
            )}
          </div>

          {/* 3. Pregunta Clave: ¿Hereda puntos y estadísticas? */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#faf9f6',
              border: '1px solid #e5e4df'
            }}
          >
            <label
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#141413',
                display: 'block',
                marginBottom: '6px'
              }}
            >
              ¿Desea que el equipo nuevo conserve los puntos del equipo actual?
            </label>
            <p
              style={{
                fontSize: '11.5px',
                color: '#787772',
                margin: '0 0 12px 0'
              }}
            >
              Elige si el nuevo equipo hereda la posición y puntos acumulados o si comienza su participación desde 0.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Opción SÍ */}
              <button
                type="button"
                onClick={() => setInheritPoints(true)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: inheritPoints ? '2px solid #141413' : '1px solid #e5e4df',
                  background: inheritPoints ? '#141413' : '#ffffff',
                  color: inheritPoints ? '#ffffff' : '#141413',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>
                    SÍ, conservar puntos
                  </span>
                  {inheritPoints ? (
                    <CheckCircle2 size={16} color="#ffffff" />
                  ) : (
                    <Circle size={16} color="#a1a1aa" />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: inheritPoints ? 'rgba(255,255,255,0.75)' : '#787772',
                    lineHeight: 1.3
                  }}
                >
                  Hereda los <strong>{zoneTeam.points ?? 0} pts</strong>, PJ y Fair Play de {zoneTeam.team_name}.
                </span>
              </button>

              {/* Opción NO */}
              <button
                type="button"
                onClick={() => setInheritPoints(false)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: !inheritPoints ? '2px solid #141413' : '1px solid #e5e4df',
                  background: !inheritPoints ? '#141413' : '#ffffff',
                  color: !inheritPoints ? '#ffffff' : '#141413',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>
                    NO, comenzar desde 0
                  </span>
                  {!inheritPoints ? (
                    <CheckCircle2 size={16} color="#ffffff" />
                  ) : (
                    <Circle size={16} color="#a1a1aa" />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: !inheritPoints ? 'rgba(255,255,255,0.75)' : '#787772',
                    lineHeight: 1.3
                  }}
                >
                  Comienza desde <strong>0 puntos</strong>. {zoneTeam.team_name} sale de la tabla pero <em>no se elimina de la BD</em>.
                </span>
              </button>
            </div>
          </div>

          {/* 4. Motivo y Observaciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#141413',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                Motivo del Reemplazo *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e4df',
                  background: '#ffffff',
                  fontSize: '13px',
                  color: '#141413',
                  outline: 'none'
                }}
              >
                <option value="Expulsión disciplinaria">Expulsión disciplinaria</option>
                <option value="Abandono del torneo">Abandono del torneo</option>
                <option value="Baja por mutuo acuerdo / Fuerza mayor">Baja por mutuo acuerdo / Fuerza mayor</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#141413',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                Observaciones / Detalles adicionales (opcional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Salida acordada en la fecha 3. Ingreso directo para completar fixture..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e4df',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  color: '#141413',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 5. Resumen de Impacto Operativo */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
              color: '#475569',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontWeight: 600, color: '#1e293b' }}>Resumen de la operación:</div>
            <div>
              • <strong>Fixture:</strong> Partidos ya jugados permanecerán a nombre de <em>{zoneTeam.team_name}</em>. Los partidos por jugar y futuros pasarán a nombre del equipo nuevo.
            </div>
            <div>
              • <strong>Finanzas:</strong> El nuevo equipo se creará con inscripción en <strong>$0</strong> en <em>Deudas e Inscripciones</em> (podrás modificar el valor en cualquier momento). Los registros contables de <em>{zoneTeam.team_name}</em> quedan intactos.
            </div>
            <div>
              • <strong>Lista de Buena Fe:</strong> Los jugadores de <em>{zoneTeam.team_name}</em> quedarán liberados para poder jugar en otros equipos de este torneo.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e5e4df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#ffffff'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e4df',
              background: '#ffffff',
              color: '#52514e',
              fontSize: '13px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !selectedTeamId}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid #141413',
              background: '#141413',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving || !selectedTeamId ? 'not-allowed' : 'pointer',
              opacity: saving || !selectedTeamId ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftRight size={14} />
            {saving ? 'Procesando...' : 'Confirmar Reemplazo'}
          </button>
        </div>
      </div>

      {/* Submodal para Crear Equipo Nuevo si lo solicita el usuario */}
      {showCreateTeam && (
        <TeamForm
          isModal={true}
          defaultCategoryId={categoryId}
          onClose={() => setShowCreateTeam(false)}
          onSuccess={handleCreatedTeam}
        />
      )}
    </div>,
    document.body
  );
}
