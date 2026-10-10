import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../../api';
import { Plus, Users, X, Check, Search, Trash2, AlertTriangle } from 'lucide-react';

// ------------------------------------------------------------------
// Zones Builder — inside the TournamentForm
// ------------------------------------------------------------------

const ZonesBuilder = ({ zones, onChange, categoryId, savedZones = [], tournamentId, onSaveFirst, onZoneDeleted }) => {
  const [openZoneSelector, setOpenZoneSelector] = useState(null); // zoneId of selector open
  const [zoneTeams, setZoneTeams] = useState({}); // { zoneId: [ZoneTeam] }
  const [saving, setSaving] = useState(false); // while auto-saving before opening
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [customAlert, setCustomAlert] = useState(null); // { title, message }
  const [deletingZoneIndex, setDeletingZoneIndex] = useState(null);

  // Fetch teams for all already-saved zones
  useEffect(() => {
    savedZones.forEach(z => {
      if (z.id) fetchZoneTeams(z.id);
    });
  }, [savedZones]);

  useEffect(() => {
    if (categoryId) {
      fetchAvailableTeams();
    } else {
      setAvailableTeams([]);
    }
  }, [categoryId]);

  // Clear search whenever open selector changes
  useEffect(() => {
    setTeamSearch('');
  }, [openZoneSelector]);

  const fetchAvailableTeams = async () => {
    try {
      const res = await api.get('teams/');
      const filtered = categoryId
        ? res.data.filter(t => t.category === parseInt(categoryId))
        : res.data;
      setAvailableTeams(filtered);
    } catch (e) {
      console.error("Error fetching available teams:", e);
    }
  };

  const fetchZoneTeams = async (zoneId) => {
    try {
      const res = await api.get(`zone-teams/?zone=${zoneId}`);
      setZoneTeams(prev => ({ ...prev, [zoneId]: res.data }));
    } catch (e) { console.error(e); }
  };

  const handleAddZone = () => {
    if (zones.length >= 10) return;
    const newZone = {
      id: null,
      name: `Zona ${zones.length + 1}`
    };
    onChange([...zones, newZone]);
  };

  const updateName = (index, name) => {
    const updated = zones.map((z, i) => i === index ? { ...z, name } : z);
    onChange(updated);
  };

  const handleAddTeamsClick = async (zone, index) => {
    let activeZone = savedZones.find(z => z.id && z.order === index);
    if (!activeZone && onSaveFirst) {
      setSaving(true);
      const updatedSavedZones = await onSaveFirst();
      setSaving(false);
      if (updatedSavedZones) {
        activeZone = updatedSavedZones.find(z => z.order === index);
      }
    }
    
    if (activeZone) {
      setOpenZoneSelector(prev => prev === activeZone.id ? null : activeZone.id);
    }
  };

  const handleDeleteZoneClick = async (zone, index) => {
    const savedZone = savedZones.find(z => (zone.id && z.id === zone.id) || (z.order === index));
    const assignedTeams = savedZone ? (zoneTeams[savedZone.id] || []) : [];

    // Si tiene equipos asignados: no se puede eliminar y mostramos alerta
    if (assignedTeams.length > 0) {
      setCustomAlert({
        title: 'Atención',
        message: 'No se puede eliminar ya que los equipos cargados ya tienen partidos asignados en el torneo'
      });
      return;
    }

    // Si la zona ya está guardada en la base de datos
    if (savedZone && savedZone.id) {
      // Doble verificación: chequear si por backend existen partidos asignados
      try {
        setDeletingZoneIndex(index);
        await api.delete(`tournament-zones/${savedZone.id}/`);
        // Eliminada exitosamente en el backend
        if (onZoneDeleted) {
          onZoneDeleted(savedZone.id);
        }
        const updated = zones.filter((_, i) => i !== index);
        onChange(updated);
        if (openZoneSelector === savedZone.id) {
          setOpenZoneSelector(null);
        }
      } catch (err) {
        console.error("Error al eliminar la zona:", err);
        const detailMsg = err.response?.data?.detail || 
          'No se puede eliminar ya que los equipos cargados ya tienen partidos asignados en el torneo';
        setCustomAlert({
          title: 'Atención',
          message: detailMsg
        });
      } finally {
        setDeletingZoneIndex(null);
      }
    } else {
      // Zona nueva aún no persistida en BD y sin equipos
      const updated = zones.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  const handleToggleTeam = async (teamId, zoneId, isAssigned, currentTeams) => {
    try {
      if (isAssigned) {
        const zt = currentTeams.find(t => t.team === teamId);
        if (zt) {
          await api.delete(`zone-teams/${zt.id}/`);
          fetchZoneTeams(zoneId);
        }
      } else {
        await api.post('zone-teams/', [{ zone: zoneId, team: teamId }]);
        fetchZoneTeams(zoneId);
      }
    } catch (e) {
      console.error("Error toggling team zone:", e);
      if (e.response?.data?.detail) {
        setCustomAlert({
          title: 'Atención',
          message: e.response.data.detail
        });
      } else if (typeof e.response?.data === 'object') {
        const errorMsg = Object.values(e.response.data).flat().join(', ');
        setCustomAlert({
          title: 'Atención',
          message: errorMsg
        });
      } else {
        setCustomAlert({
          title: 'Atención',
          message: "Error al modificar el equipo en la zona"
        });
      }
    }
  };

  const handleRemoveTeam = async (ztId, zoneId) => {
    try {
      await api.delete(`zone-teams/${ztId}/`);
      fetchZoneTeams(zoneId);
    } catch (e) {
      console.error("Error removing team from zone:", e);
      if (e.response?.data?.detail) {
        setCustomAlert({
          title: 'Atención',
          message: e.response.data.detail
        });
      } else if (typeof e.response?.data === 'object') {
        const errorMsg = Object.values(e.response.data).flat().join(', ');
        setCustomAlert({
          title: 'Atención',
          message: errorMsg
        });
      } else {
        setCustomAlert({
          title: 'Atención',
          message: "Error al eliminar el equipo de la zona"
        });
      }
    }
  };

  return (
    <div>
      {/* Zone count selector: solo agregar zonas con '+' */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cantidad de zonas:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '32px', textAlign: 'center', fontSize: '16px', fontWeight: '800',
            color: 'var(--brand-beige)'
          }}>{zones.length}</span>
          <button 
            type="button" 
            onClick={handleAddZone} 
            className="secondary"
            title="Agregar zona"
            disabled={zones.length >= 10}
            style={{ 
              width: '28px', 
              height: '28px', 
              padding: 0, 
              minWidth: 'unset', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: zones.length >= 10 ? 'not-allowed' : 'pointer',
              opacity: zones.length >= 10 ? 0.5 : 1
            }}
          >
            <Plus size={14} />
          </button>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(máx. 10)</span>
      </div>

      {/* Zone cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {zones.map((zone, index) => {
          const savedZone = savedZones.find(z => z.id && z.order === index);
          const teams = savedZone ? (zoneTeams[savedZone.id] || []) : [];
          
          // Filter available teams by search query
          const filteredTeams = availableTeams.filter(team =>
            team.name.toLowerCase().includes(teamSearch.toLowerCase())
          );

          return (
            <div key={index} style={{
              border: '1px solid var(--border-subtle)', borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)', overflow: 'hidden'
            }}>
              {/* Zone header */}
              <div 
                className="zone-card-header"
                style={{
                  borderBottom: (teams.length > 0 || openZoneSelector === savedZone?.id) ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                {/* Zone number badge */}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--brand-beige)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#1a1512'
                }}>{index + 1}</div>

                {/* Zone name input — always has a visible border */}
                <input
                  type="text"
                  className="zone-input"
                  value={zone.name}
                  onChange={e => updateName(index, e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    padding: '5px 10px',
                    height: '34px',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--brand-beige)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  placeholder="Ingresa el nombre de la Zona"
                />

                {/* Add Teams button — always visible */}
                <button
                  type="button"
                  className="zone-action-btn"
                  onClick={() => handleAddTeamsClick(zone, index)}
                  disabled={saving || deletingZoneIndex === index}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: '700', height: '34px', padding: '0 12px',
                    minWidth: '115px',
                    background: 'linear-gradient(135deg, var(--brand-beige-subtle), rgba(212,184,150,0.08))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', color: 'var(--brand-beige)', cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    opacity: (saving || deletingZoneIndex === index) ? 0.6 : 1
                  }}
                >
                  <Users size={13} />
                  {saving ? 'Guardando...' : (openZoneSelector === savedZone?.id ? 'Cerrar' : (teams.length > 0 ? `Equipos (${teams.length})` : '+ Equipos'))}
                </button>

                {/* Delete Zone Button — Cesto de basura al lado de Equipos */}
                <button
                  type="button"
                  className="zone-delete-btn"
                  title="Eliminar zona"
                  onClick={() => handleDeleteZoneClick(zone, index)}
                  disabled={deletingZoneIndex === index}
                  style={{
                    width: '34px',
                    height: '34px',
                    minWidth: '34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: deletingZoneIndex === index ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (deletingZoneIndex !== index) {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deletingZoneIndex !== index) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Inline Selector */}
              {savedZone && openZoneSelector === savedZone.id && (
                <div style={{
                  padding: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(34, 197, 94, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Asignar Equipos a {zone.name} ({teams.length} seleccionados)
                    </span>
                  </div>

                  {availableTeams.length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Debes crear equipos nuevos desde la sección Equipos{' '}
                      <Link to="/equipos" style={{ color: '#22c55e', fontWeight: '700', textDecoration: 'underline' }}>
                        Pulsa Aquí
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Search bar inside inline selector */}
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Buscar equipo por nombre..."
                          value={teamSearch}
                          onChange={e => setTeamSearch(e.target.value)}
                          style={{
                            width: '100%',
                            paddingLeft: '32px',
                            height: '32px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '8px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                      }}>
                        {filteredTeams.length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
                            No se encontraron equipos
                          </span>
                        ) : (
                          filteredTeams.map(team => {
                            const isAssigned = teams.some(zt => zt.team === team.id);
                            return (
                              <div
                                key={team.id}
                                onClick={() => handleToggleTeam(team.id, savedZone.id, isAssigned, teams)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: `1px solid ${isAssigned ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-subtle)'}`,
                                  background: isAssigned ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                className="table-row-hover"
                              >
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '5px',
                                  border: `2px solid ${isAssigned ? '#22c55e' : 'rgba(212, 184, 150, 0.2)'}`,
                                  background: isAssigned ? '#22c55e' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  transition: 'all 0.15s'
                                }}>
                                  {isAssigned && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                </div>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: isAssigned ? '#22c55e' : 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {team.name}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Alerta con diseño estándar del sistema */}
      {customAlert && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 7, 6, 0.82)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          className="animate-fade-in"
          onClick={() => setCustomAlert(null)}
        >
          <div 
            style={{
              background: '#ffffff',
              border: '1px solid #e6dfd3',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={18} color="#856404" />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#191919' }}>
                  {customAlert.title || 'Atención'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#383530', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
              {customAlert.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                style={{
                  height: '38px',
                  padding: '0 22px',
                  background: '#191919',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333333'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#191919'; }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ZonesBuilder;
