import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Minus, Users, X, Check, Search } from 'lucide-react';

// ------------------------------------------------------------------
// Zones Builder — inside the TournamentForm
// ------------------------------------------------------------------

const ZonesBuilder = ({ zones, onChange, categoryId, savedZones = [], onSaveFirst }) => {
  const [openZoneSelector, setOpenZoneSelector] = useState(null); // zoneId of selector open
  const [zoneTeams, setZoneTeams] = useState({}); // { zoneId: [ZoneTeam] }
  const [saving, setSaving] = useState(false); // while auto-saving before opening
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');

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

  const setCount = (n) => {
    const count = Math.max(1, Math.min(10, n));
    const current = zones.length;
    if (count > current) {
      const added = Array.from({ length: count - current }, (_, i) => ({
        id: null,
        name: `Zona ${current + i + 1}`
      }));
      onChange([...zones, ...added]);
    } else {
      onChange(zones.slice(0, count));
    }
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
        alert(e.response.data.detail);
      } else if (typeof e.response?.data === 'object') {
        const errorMsg = Object.values(e.response.data).flat().join(', ');
        alert(errorMsg);
      } else {
        alert("Error al modificar el equipo en la zona");
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
        alert(e.response.data.detail);
      } else if (typeof e.response?.data === 'object') {
        const errorMsg = Object.values(e.response.data).flat().join(', ');
        alert(errorMsg);
      } else {
        alert("Error al eliminar el equipo de la zona");
      }
    }
  };

  return (
    <div>
      {/* Zone count selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cantidad de zonas:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={() => setCount(zones.length - 1)} className="secondary"
            style={{ width: '28px', height: '28px', padding: 0, minWidth: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Minus size={14} />
          </button>
          <span style={{
            width: '32px', textAlign: 'center', fontSize: '16px', fontWeight: '800',
            color: 'var(--brand-beige)'
          }}>{zones.length}</span>
          <button type="button" onClick={() => setCount(zones.length + 1)} className="secondary"
            style={{ width: '28px', height: '28px', padding: 0, minWidth: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  placeholder={`Zona ${index + 1}`}
                />

                {/* Add Teams button — always visible */}
                <button
                  type="button"
                  className="zone-action-btn"
                  onClick={() => handleAddTeamsClick(zone, index)}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: '700', height: '34px', padding: '0 12px',
                    background: 'linear-gradient(135deg, var(--brand-beige-subtle), rgba(212,184,150,0.08))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', color: 'var(--brand-beige)', cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  <Users size={13} />
                  {saving ? 'Guardando...' : (openZoneSelector === savedZone?.id ? 'Cerrar' : '+ Equipos')}
                </button>
              </div>

              {/* Inline Selector */}
              {savedZone && openZoneSelector === savedZone.id && (
                <div style={{
                  padding: '14px',
                  borderBottom: teams.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                  background: 'rgba(212,184,150,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Asignar Equipos a {zone.name}
                    </span>
                  </div>

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
                    maxHeight: '180px',
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
                              border: '1px solid var(--border-subtle)',
                              background: isAssigned ? 'var(--brand-beige-subtle)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            className="table-row-hover"
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: `2px solid ${isAssigned ? 'var(--brand-beige)' : 'rgba(212, 184, 150, 0.2)'}`,
                              background: isAssigned ? 'var(--brand-beige)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s'
                            }}>
                              {isAssigned && <Check size={12} color="#1a1512" strokeWidth={3} />}
                            </div>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: isAssigned ? 'var(--brand-beige)' : 'var(--text-primary)',
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
                </div>
              )}

              {/* Teams already in zone */}
              {teams.length > 0 && (
                <div style={{ padding: '10px 14px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {teams.map(zt => (
                      <span key={zt.id} style={{
                        fontSize: '11px', fontWeight: '600', padding: '3px 8px 3px 10px',
                        borderRadius: '20px', background: 'var(--brand-beige-subtle)',
                        color: 'var(--brand-beige)', border: '1px solid var(--border-subtle)',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}>
                        {zt.team_name}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveTeam(zt.id, savedZone.id); }}
                          style={{
                            background: 'none', border: 'none', padding: 0, margin: 0,
                            cursor: 'pointer', color: '#cc7a5c', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            minWidth: 'unset', height: 'auto'
                          }}
                          title="Eliminar de la zona"
                        >
                          <X size={11} style={{ strokeWidth: 2.5 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZonesBuilder;
