import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Minus, Users } from 'lucide-react';
import AddTeamsModal from './AddTeamsModal';

// ------------------------------------------------------------------
// Zones Builder — inside the TournamentForm
// ------------------------------------------------------------------

const ZonesBuilder = ({ zones, onChange, categoryId, savedZones = [], onSaveFirst }) => {
  const [addTeamsZone, setAddTeamsZone] = useState(null);
  const [zoneTeams, setZoneTeams] = useState({}); // { zoneId: [ZoneTeam] }
  const [saving, setSaving] = useState(false); // while auto-saving before opening modal

  // Fetch teams for all already-saved zones
  useEffect(() => {
    savedZones.forEach(z => {
      if (z.id) fetchZoneTeams(z.id);
    });
  }, [savedZones]);

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

  // Handle click on "Agregar Equipos":
  // If the zone already has an ID → open modal directly.
  // Otherwise → ask the parent form to save first, then open.
  const handleAddTeamsClick = async (zone, index) => {
    const savedZone = savedZones.find(z => z.id && z.order === index);
    if (savedZone) {
      setAddTeamsZone(savedZone);
    } else if (onSaveFirst) {
      setSaving(true);
      const updatedSavedZones = await onSaveFirst();
      setSaving(false);
      if (updatedSavedZones) {
        const newSavedZone = updatedSavedZones.find(z => z.order === index);
        if (newSavedZone) setAddTeamsZone(newSavedZone);
      }
    }
  };

  return (
    <div>
      {/* Zone count selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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

          return (
            <div key={index} style={{
              border: '1px solid var(--border-subtle)', borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)', overflow: 'hidden'
            }}>
              {/* Zone header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px',
                borderBottom: teams.length > 0 ? '1px solid var(--border-subtle)' : 'none'
              }}>
                {/* Zone number badge */}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--brand-beige)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#1a1512'
                }}>{index + 1}</div>

                {/* Zone name input — always has a visible border */}
                <input
                  type="text"
                  value={zone.name}
                  onChange={e => updateName(index, e.target.value)}
                  style={{
                    flex: 1,
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
                  {saving ? 'Guardando...' : '+ Equipos'}
                </button>
              </div>

              {/* Teams already in zone */}
              {teams.length > 0 && (
                <div style={{ padding: '10px 14px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {teams.map(zt => (
                      <span key={zt.id} style={{
                        fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                        borderRadius: '20px', background: 'var(--brand-beige-subtle)',
                        color: 'var(--brand-beige)', border: '1px solid var(--border-subtle)'
                      }}>{zt.team_name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AddTeamsModal */}
      {addTeamsZone && (
        <AddTeamsModal
          zone={addTeamsZone}
          categoryId={categoryId}
          onClose={() => setAddTeamsZone(null)}
          onTeamsAdded={() => {
            fetchZoneTeams(addTeamsZone.id);
            setAddTeamsZone(null);
          }}
        />
      )}
    </div>
  );
};

export default ZonesBuilder;
