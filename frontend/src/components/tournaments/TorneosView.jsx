import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit, Calendar, MapPin, ChevronRight } from 'lucide-react';
import TournamentForm from './TournamentForm';
import TournamentDetailView from './TournamentDetailView';

const TorneosView = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedTournamentForDetail, setSelectedTournamentForDetail] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, [search]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`tournaments/?search=${search}`);
      setTournaments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este torneo? Se eliminarán todas sus zonas y tablas de posiciones.')) {
      setDeletingId(id);
      try {
        await api.delete(`tournaments/${id}/`);
        fetchTournaments();
      } catch (e) {
        console.error(e);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (selectedTournamentForDetail) {
    return (
      <TournamentDetailView
        tournament={selectedTournamentForDetail}
        onBack={() => {
          setSelectedTournamentForDetail(null);
          fetchTournaments();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px -6px rgba(212,184,150,0.5)'
          }}>
            <Trophy size={26} color="#1a1512" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '32px', margin: 0 }}>Torneos</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Gestión de torneos, zonas y tablas de posiciones
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditingTournament(null); setShowForm(true); }}
            style={{
              height: '42px', padding: '0 20px', fontSize: '14px',
              background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
              boxShadow: '0 8px 20px -6px rgba(212,184,150,0.4)',
              border: 'none', color: '#1a1512'
            }}
          >
            <Plus size={18} /> Nuevo Torneo
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <TournamentForm
          tournament={editingTournament}
          onClose={() => { setShowForm(false); setEditingTournament(null); }}
          onSuccess={() => { setShowForm(false); setEditingTournament(null); fetchTournaments(); }}
        />
      )}

      {/* Search + List — hidden while form is open */}
      {!showForm && (
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar torneo por nombre..."
              style={{
                width: '100%', padding: '10px 10px 10px 42px', height: '42px',
                fontSize: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)',
                background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none'
              }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '8px' }}>No hay torneos registrados</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Hacé clic en "Nuevo Torneo" para comenzar</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tournaments.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  borderBottom: idx < tournaments.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '20px',
                  transition: 'background 0.15s'
                }}
                className="table-row-hover"
              >
                {/* Icon */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--brand-beige-subtle), rgba(212,184,150,0.05))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trophy size={22} color="var(--brand-beige)" />
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{t.name}</span>
                    <span className="badge">{t.category_name}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                      borderRadius: '20px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-subtle)', color: 'var(--text-muted)'
                    }}>
                      {t.zones_count} {t.zones_count === 1 ? 'zona' : 'zonas'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      <span>Creado: {formatDate(t.created_at?.split('T')[0])}</span>
                    </div>
                    {t.start_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={12} />
                        <span>Inicio: {formatDate(t.start_date)}</span>
                      </div>
                    )}
                    {t.end_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={12} />
                        <span>Fin est.: {formatDate(t.end_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Zone pills */}
                  {t.zones?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {t.zones.map(z => (
                        <span key={z.id} style={{
                          fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '20px', background: 'var(--brand-beige-subtle)',
                          color: 'var(--brand-beige)', border: '1px solid var(--border-subtle)'
                        }}>
                          {z.name} · {z.zone_teams?.length || 0} eq.
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {deletingId === t.id ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eliminando...</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedTournamentForDetail(t)}
                        style={{
                          padding: '6px 12px',
                          minWidth: 'auto',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(74, 222, 128, 0.15)',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          color: '#4ade80',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 222, 128, 0.25)';
                          e.currentTarget.style.borderColor = '#4ade80';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.3)';
                        }}
                        title="Ver detalles"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => { setEditingTournament(t); setShowForm(true); }}
                        className="secondary"
                        style={{ padding: '6px', minWidth: 'auto', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="danger"
                        style={{ padding: '6px', minWidth: 'auto', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default TorneosView;
