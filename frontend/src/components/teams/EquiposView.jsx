import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Plus, Filter, Trash2, Edit2, Check, X } from 'lucide-react';
import TeamForm from './TeamForm';

const EquiposView = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, [search]);

  const fetchTeams = async () => {
    try {
      const response = await api.get(`teams/?search=${search}`);
      console.log("DEBUG: Teams fetched from API:", response.data);
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setLoading(false);
    }
  };

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`teams/${id}/`);
      alert('Equipo eliminado correctamente');
      setDeletingId(null);
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      alert('Hubo un error al intentar eliminar el equipo: ' + (error.message || 'Error desconocido'));
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="anthropic-theme teams-container animate-fade-in">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="anthropic-title" style={{ margin: 0 }}>
            {showForm ? (selectedTeam ? 'Editar Equipo' : 'Nuevo Equipo') : 'Equipos'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm ? 'Ingresa la información básica y fotos' : 'Gestión centralizada de equipos y categorías'}
          </p>
        </div>
        {showForm ? (
          <button 
            type="button" 
            onClick={() => setShowForm(false)} 
            className="secondary icon-only" 
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        ) : (
          <button 
            onClick={() => { setSelectedTeam(null); setShowForm(true); }}
            style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
          >
            <Plus size={18} /> Nuevo Equipo
          </button>
        )}
      </div>

      {showForm && (
        <TeamForm 
          team={selectedTeam} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => { setShowForm(false); fetchTeams(); }}
        />
      )}

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
                placeholder="Buscar equipo..." 
                style={{ 
                  width: '100%', 
                  padding: '10px 10px 10px 42px', 
                  height: '42px', 
                  fontSize: '14px'
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="secondary" style={{ minWidth: '100px', fontSize: '14px' }}>
              <Filter size={18} />
              Filtrar
            </button>
          </div>

          {/* Teams Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Escudo</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Delegado</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                ) : teams.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay equipos registrados</td></tr>
                ) : (
                  teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--brand-beige-subtle)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {team.logo ? <img src={team.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>N/A</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{team.name}</td>
                      <td><span className="badge">{team.category_name}</span></td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{team.delegate_name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={team.is_active ? "status-badge active" : "status-badge inactive"}>
                            {team.is_active ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                            {team.is_active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                          {team.current_tournament && (
                            <span style={{ fontSize: '10px', color: 'var(--brand-beige)', fontWeight: '600' }}>
                              🏆 {team.current_tournament}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(team.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', position: 'relative', zIndex: 10 }}>
                          {deletingId === team.id ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', marginRight: '4px' }}>¿Eliminar?</span>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(team.id); }} 
                                className="danger" 
                                style={{ minWidth: 'auto', height: '28px', padding: '0 8px', fontSize: '11px' }}
                              >
                                Sí
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(null); }} 
                                className="secondary" 
                                style={{ minWidth: 'auto', height: '28px', padding: '0 8px', fontSize: '11px' }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(team); }} 
                                className="secondary icon-only" 
                                style={{ position: 'relative', zIndex: 11 }}
                              >
                                <Edit2 size={16} style={{ pointerEvents: 'none' }} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(team.id); }} 
                                className="danger icon-only" 
                                style={{ position: 'relative', zIndex: 11 }}
                              >
                                <Trash2 size={16} style={{ pointerEvents: 'none' }} />
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

export default EquiposView;
