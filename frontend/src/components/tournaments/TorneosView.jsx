import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit2, Calendar, Eye, X, Check } from 'lucide-react';
import TournamentForm from './TournamentForm';

const TorneosView = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleOpenDeleteModal = (tournament) => {
    setTournamentToDelete(tournament);
    setConfirmPassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      setDeleteError('Por favor ingresá tu contraseña.');
      return;
    }
    try {
      setDeleting(true);
      setDeleteError('');
      await api.delete(`tournaments/${tournamentToDelete.id}/`, {
        headers: { 'X-Password': confirmPassword },
        data: { password: confirmPassword },
        params: { password: confirmPassword }
      });
      setTournamentToDelete(null);
      setConfirmPassword('');
      fetchTournaments();
      setToastMessage('Torneo eliminado con éxito');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      console.error('Error al eliminar torneo:', err);
      setDeleteError('No se pudo eliminar el Torneo. Verificá que la contraseña sea correcta');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }} className="anthropic-theme animate-fade-in">

      {/* Header de la vista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="anthropic-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={30} style={{ color: '#cc7a5c' }} />
            {showForm ? (editingTournament ? 'Editar Torneo' : 'Nuevo Torneo') : 'Torneos'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm
              ? 'Ingresa la información básica y las fechas del torneo.'
              : 'Gestión de torneos, zonas y tablas de posiciones.'}
          </p>
        </div>

        {showForm ? (
          <button 
            type="button" 
            onClick={() => { setShowForm(false); setEditingTournament(null); }} 
            className="secondary icon-only" 
            style={{ width: '36px', height: '36px' }}
            title="Volver a Torneos"
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

      {/* Vista de Formulario In-Page */}
      {showForm ? (
        <TournamentForm
          tournament={editingTournament}
          onClose={() => { setShowForm(false); setEditingTournament(null); }}
          onSuccess={() => {
            const isNew = !editingTournament;
            setShowForm(false);
            setEditingTournament(null);
            fetchTournaments();
            if (isNew) {
              setToastMessage('Torneo creado con éxito');
              setShowToast(true);
              setTimeout(() => {
                setShowToast(false);
              }, 3000);
            }
          }}
        />
      ) : (
        /* Lista de Torneos en Formato Cards */
        <>
          {/* Buscador de Torneos */}
          <div className="search-filter-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar torneo por nombre..." 
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

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando torneos...</div>
          ) : tournaments.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px dashed #d8cfc0',
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No hay torneos registrados.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e6dfd3',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Header de la Card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h3 
                        onClick={() => navigate(`/torneos/${t.id}`)}
                        style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#191919',
                          cursor: 'pointer',
                        }}
                        className="hover:underline"
                        title="Ver detalles del torneo"
                      >
                        {t.name}
                      </h3>
                      {t.category_name ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#eef7ed',
                            color: '#2e7d32',
                            border: '1px solid #c8e6c9',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.category_name}
                        </span>
                      ) : (
                        <span
                          title="Debes asignarle una categoría a este torneo"
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#fff3e0',
                            color: '#d97706',
                            border: '1px solid #ffedd5',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#e07070',
                            display: 'inline-block',
                            boxShadow: '0 0 0 2px rgba(224, 112, 112, 0.25)'
                          }}></span>
                          Sin Categoría
                        </span>
                      )}
                    </div>

                    {/* Detalle de Fechas y Zonas */}
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px',
                        background: '#faf8f5',
                        borderRadius: '8px',
                        border: '1px solid #efe9e0',
                        fontSize: '12px',
                        color: '#444',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#cc7a5c' }} />
                        <span><strong>Fecha de Inicio:</strong> {formatDate(t.start_date)}</span>
                      </div>
                      <div>
                        <strong>Zonas:</strong>{' '}
                        {t.zones?.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {t.zones.map(z => (
                              <span 
                                key={z.id} 
                                style={{ 
                                  fontSize: '11px', 
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#eae4d8',
                                  color: '#191919',
                                  fontWeight: '500'
                                }}
                              >
                                {z.name} ({z.zone_teams?.length || 0})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sin zonas configuradas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid #f2ede4',
                    }}
                  >
                    <button
                      onClick={() => navigate(`/torneos/${t.id}`)}
                      style={{
                        background: 'none',
                        border: '1px solid #d8cfc0',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#191919',
                        fontWeight: '500',
                      }}
                    >
                      <Eye size={14} /> Ver Torneo
                    </button>
                    <button
                      onClick={() => { setEditingTournament(t); setShowForm(true); }}
                      style={{
                        background: 'none',
                        border: '1px solid #d8cfc0',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#444',
                        fontWeight: '500',
                      }}
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(t)}
                      style={{
                        background: 'none',
                        border: '1px solid #f1c5c5',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#c62828',
                        fontWeight: '500',
                      }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Confirmación de Eliminación de Torneo */}
      {tournamentToDelete && createPortal(
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
                Eliminar Torneo {tournamentToDelete.name}
              </h3>
              <button
                type="button"
                onClick={() => setTournamentToDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#444', margin: 0, lineHeight: '1.5' }}>
              ¿Estás seguro que quieres eliminar el torneo <strong>"{tournamentToDelete.name}"</strong>?
            </p>

            <div style={{
              background: '#fff8f8',
              border: '1px solid #f8d7da',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#721c24',
              lineHeight: '1.4'
            }}>
              <strong>Advertencia de seguridad:</strong> Al eliminar este torneo, se eliminaran todas las zonas, tablas de posiciones, fixture y toda la información relacionada con el torneo. Para confirmar esta acción, ingresá la contraseña del usuario actual.
            </div>

            <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#191919', marginBottom: '6px', display: 'block' }}>Contraseña de Usuario *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Ingresá tu contraseña de usuario..."
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setDeleteError(''); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    height: '42px',
                    borderRadius: '8px',
                    border: deleteError ? '1px solid #e07070' : '1px solid #d8cfc0',
                    background: '#ffffff',
                    color: '#191919',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {deleteError && (
                <div style={{ fontSize: '12px', color: '#c62828', fontWeight: '500' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTournamentToDelete(null)}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    background: '#ffffff',
                    border: '1px solid #d8cfc0',
                    borderRadius: '8px',
                    color: '#191919',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#191919';
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.background = '#faf8f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d8cfc0';
                    e.currentTarget.style.color = '#191919';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || !confirmPassword}
                  style={{
                    height: '38px', padding: '0 16px',
                    backgroundColor: '#c62828', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </form>
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

export default TorneosView;
