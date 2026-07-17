import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit, Calendar, MapPin, ChevronRight, X } from 'lucide-react';
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="anthropic-theme tournaments-container animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="anthropic-title" style={{ margin: 0 }}>
            {showForm ? (editingTournament ? 'Editar Torneo' : 'Nuevo Torneo') : 'Torneos'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm ? 'Ingresa la información básica y fechas' : 'Gestión de torneos, zonas y tablas de posiciones'}
          </p>
        </div>
        {showForm ? (
          <button 
            type="button" 
            onClick={() => { setShowForm(false); setEditingTournament(null); }} 
            className="secondary icon-only" 
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        ) : (
          <button 
            onClick={() => { setEditingTournament(null); setShowForm(true); }}
            style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search & Filter Bar */}
          <div className="search-filter-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar torneo..." 
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 42px', 
                  height: '42px', 
                  fontSize: '14px'
                }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tournaments Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Zonas</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                ) : tournaments.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay torneos registrados</td></tr>
                ) : (
                  tournaments.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{t.name}</td>
                      <td><span className="badge">{t.category_name}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {t.zones?.length > 0 ? (
                            t.zones.map(z => (
                              <span key={z.id} className="badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                {z.name} ({z.zone_teams?.length || 0})
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin zonas</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(t.start_date)}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(t.end_date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {deletingId === t.id ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eliminando...</span>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedTournamentForDetail(t)}
                                className="secondary"
                                style={{ padding: '6px 12px', minWidth: 'auto', height: '32px', borderRadius: '8px', fontSize: '12px' }}
                                title="Ver detalles"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => { setEditingTournament(t); setShowForm(true); }}
                                className="secondary icon-only"
                                style={{ padding: '6px', minWidth: 'auto', height: '32px', borderRadius: '8px' }}
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="danger icon-only"
                                style={{ padding: '6px', minWidth: 'auto', height: '32px', borderRadius: '8px' }}
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TorneosView;
