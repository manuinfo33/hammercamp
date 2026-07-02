import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Search, Plus, Users } from 'lucide-react';
import TeamForm from '../teams/TeamForm';

// ------------------------------------------------------------------
// Modal: seleccionar equipos para una zona
// ------------------------------------------------------------------
const AddTeamsModal = ({ zone, categoryId, onClose, onTeamsAdded }) => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [alreadyInZone, setAlreadyInZone] = useState(new Set());

  useEffect(() => {
    fetchTeams();
    fetchZoneTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get(`teams/?search=${search}`);
      // Filter by category if set
      const filtered = categoryId
        ? res.data.filter(t => t.category === parseInt(categoryId))
        : res.data;
      setTeams(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchZoneTeams = async () => {
    try {
      const res = await api.get(`zone-teams/?zone=${zone.id}`);
      setAlreadyInZone(new Set(res.data.map(zt => zt.team)));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchTeams(); }, [search]);

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => parseInt(k));
    if (!ids.length) return;
    setSaving(true);
    try {
      const payload = ids
        .filter(id => !alreadyInZone.has(id))
        .map(id => ({ zone: zone.id, team: id }));
      if (payload.length > 0) {
        await api.post('zone-teams/', payload);
      }
      onTeamsAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div 
        className="premium-modal-card" 
        style={{
          maxWidth: '560px', 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px 16px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(129,199,132,0.15), rgba(129,199,132,0.05))',
              border: '1px solid rgba(129,199,132,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Users size={16} color="#81c784" />
            </div>
            <div>
              <h3>Agregar Equipos — {zone.name}</h3>
              <p>Equipos de la categoría seleccionada</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Search + Add Team button */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(212,184,150,0.08)', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar equipo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '38px', fontSize: '13px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowTeamForm(true)}
            className="secondary"
            title="Nuevo Equipo"
            style={{ height: '38px', width: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Team list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,184,150,0.2) transparent' }}>
          {teams.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay equipos para esta categoría
            </div>
          ) : (
            teams.map(team => {
              const isAlready = alreadyInZone.has(team.id);
              const isChecked = selected[team.id] || false;
              return (
                <div
                  key={team.id}
                  onClick={() => !isAlready && toggleSelect(team.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 24px',
                    borderBottom: '1px solid rgba(212,184,150,0.05)',
                    cursor: isAlready ? 'default' : 'pointer',
                    background: isChecked ? 'rgba(212,184,150,0.07)' : 'transparent',
                    opacity: isAlready ? 0.45 : 1,
                    transition: 'background 0.15s'
                  }}
                  className={isAlready ? '' : 'table-row-hover'}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    border: `2px solid ${isChecked ? 'var(--brand-beige)' : 'rgba(212,184,150,0.2)'}`,
                    background: isChecked ? 'var(--brand-beige)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}>
                    {isChecked && <Check size={13} color="#1a1512" strokeWidth={3} />}
                  </div>

                  {/* Logo */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--brand-beige-subtle)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                  }}>
                    {team.logo
                      ? <img src={team.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <Users size={18} color="var(--brand-beige)" />
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{team.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{team.category_name}</div>
                  </div>

                  {isAlready && (
                    <span style={{ fontSize: '10px', color: 'var(--brand-beige)', background: 'var(--brand-beige-subtle)', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                      En zona
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(212,184,150,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {selectedCount > 0 ? `${selectedCount} equipo(s) seleccionado(s)` : 'Seleccioná equipos para agregar'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="secondary" style={{ height: '36px', fontSize: '13px' }}>Cancelar</button>
            <button
              type="button" onClick={handleAdd} disabled={saving || selectedCount === 0}
              style={{ height: '36px', fontSize: '13px', opacity: selectedCount === 0 ? 0.5 : 1 }}
            >
              {saving ? '...' : <><Check size={15} /> Agregar</>}
            </button>
          </div>
        </div>
      </div>

      {/* Nested TeamForm modal */}
      {showTeamForm && (
        <div className="premium-modal-overlay" onClick={() => setShowTeamForm(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <TeamForm
              onClose={() => setShowTeamForm(false)}
              onSuccess={() => { setShowTeamForm(false); fetchTeams(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTeamsModal;
