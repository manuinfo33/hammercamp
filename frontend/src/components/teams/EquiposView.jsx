import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTeamErrorModal, setActiveTeamErrorModal] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, [search]);

  const fetchTeams = async () => {
    try {
      const response = await api.get(`teams/?search=${search}`);
      console.log("DEBUG: Teams fetched from API:", response.data);
      const sorted = response.data.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setTeams(sorted);
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

  const handleAttemptDelete = (team) => {
    if (team.is_active) {
      setActiveTeamErrorModal(team);
      return;
    }
    setDeletingId(team.id);
  };

  const handleDelete = async (team) => {
    if (team.is_active) {
      setActiveTeamErrorModal(team);
      setDeletingId(null);
      return;
    }
    try {
      await api.delete(`teams/${team.id}/`);
      setDeletingId(null);
      fetchTeams();
      setToastMessage('Equipo eliminado con éxito');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error("Error deleting team:", error);
      const message = error.response?.data?.message || error.response?.data?.detail;
      if (message && (message.includes("activo") || error.response?.data?.detail === "ACTIVE_TEAM_CANNOT_BE_DELETED")) {
        setActiveTeamErrorModal(team);
      } else {
        alert('Hubo un error al intentar eliminar el equipo: ' + (message || error.message || 'Error desconocido'));
      }
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
          onSuccess={() => {
            const isNew = !selectedTeam;
            setShowForm(false);
            fetchTeams();
            if (isNew) {
              setToastMessage('Equipo creado con éxito');
              setShowToast(true);
              setTimeout(() => {
                setShowToast(false);
              }, 3000);
            }
          }}
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
                      <td><span className="badge" style={{ opacity: team.category_name ? 1 : 0.7 }}>{team.category_name || 'Sin Asignar'}</span></td>
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
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(team); }} 
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
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAttemptDelete(team); }} 
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

      {/* Modal Alerta de Equipo Activo */}
      {activeTeamErrorModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e6dfd3',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
                No se puede eliminar el equipo
              </h3>
              <button
                type="button"
                onClick={() => setActiveTeamErrorModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: '#fff8f8',
              border: '1px solid #f8d7da',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '13px',
              color: '#721c24',
              lineHeight: '1.5'
            }}>
              <strong>Equipo Activo:</strong> El equipo <strong>"{activeTeamErrorModal.name}"</strong> se encuentra actualmente activo en el torneo <strong>"{activeTeamErrorModal.current_tournament || 'un torneo'}"</strong>. Para poder eliminar este equipo, primero debes eliminar el torneo al que pertenece.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTeamErrorModal(null)}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  background: '#191919',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333333'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#191919'; }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notificación centro inferior */}
      {showToast && createPortal(
        <div className="toast-pill-container">
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#2e7d32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Check size={14} color="#ffffff" strokeWidth={3} />
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#f5ede4',
            whiteSpace: 'nowrap'
          }}>
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a8957e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              marginLeft: '4px'
            }}
          >
            <X size={14} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EquiposView;
