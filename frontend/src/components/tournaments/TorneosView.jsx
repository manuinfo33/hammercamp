import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit2, Calendar, Eye, X, Check, ChevronRight, Layers, Users, Award } from 'lucide-react';
import TournamentForm from './TournamentForm';
import PageHeader from '../ui/PageHeader';
import '../../styles/tournaments.css';

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

  const handleToggleActive = async (tournament, e) => {
    e.stopPropagation();
    const newStatus = !tournament.is_active;
    try {
      // Optimistic update
      setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, is_active: newStatus } : t));
      await api.patch(`tournaments/${tournament.id}/`, { is_active: newStatus });
      setToastMessage(`Torneo ${newStatus ? 'activado' : 'desactivado'} con éxito`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error('Error toggling tournament active status:', err);
      // Revert on error
      setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, is_active: !newStatus } : t));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }} className="anthropic-theme animate-fade-in">

      {/* Header de la vista */}
      <PageHeader
        icon={Trophy}
        title={showForm ? (editingTournament ? 'Editar Torneo' : 'Nuevo Torneo') : 'Torneos'}
        subtitle={showForm
          ? 'Ingresa la información básica y las fechas del torneo.'
          : 'Gestión de torneos, zonas y tablas de posiciones.'}
        actions={showForm ? (
          <button
            type="button"
            onClick={() => { setShowForm(false); setEditingTournament(null); }}
            className="secondary icon-only"
            title="Volver a Torneos"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => { setEditingTournament(null); setShowForm(true); }}
          >
            <Plus size={18} /> Nuevo Torneo
          </button>
        )}
        style={{ marginBottom: 0 }}
      />

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
                border: '1px dashed #d4d4d8',
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No hay torneos registrados.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
              {tournaments.map((t) => {
                const totalTeams = t.zones?.reduce((acc, z) => acc + (z.zone_teams?.length || 0), 0) || 0;
                const totalZones = t.zones?.length || 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/torneos/${t.id}`)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e4e4e7',
                      borderRadius: '16px',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '18px',
                      boxShadow: '0 1px 2px rgba(24, 24, 27, 0.05)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#f2bb2b';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(24, 24, 27, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e4e4e7';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(24, 24, 27, 0.05)';
                    }}
                  >
                    <div>
                      {/* Main Tournament Title & Click indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontFamily: "var(--font-display)",
                              fontSize: '20px',
                              fontWeight: '800',
                              color: '#1c1d21',
                              letterSpacing: '0',
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={t.name}
                          >
                            {t.name}
                          </h3>
                        </div>

                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#fafafb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6f737b',
                            flexShrink: 0
                          }}
                        >
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Recuadro de Información (Zonas, Equipos, Categoría, Fecha Inicio, Estado) */}
                      <div style={{
                        marginTop: '16px',
                        padding: '14px 16px',
                        background: '#fafafb',
                        borderRadius: '12px',
                        border: '1px solid #ececef',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}>
                        {/* Grid de Métricas */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '12px 14px'
                        }}>
                          {/* Zonas */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(242, 187, 43, 0.14)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#b98a10',
                              flexShrink: 0
                            }}>
                              <Layers size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: '10.5px', color: '#6f737b', fontWeight: '500', textTransform: 'uppercase' }}>Zonas</div>
                              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1c1d21' }}>{totalZones} {totalZones === 1 ? 'Zona' : 'Zonas'}</div>
                            </div>
                          </div>

                          {/* Equipos */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(242, 187, 43, 0.14)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#b98a10',
                              flexShrink: 0
                            }}>
                              <Users size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: '10.5px', color: '#6f737b', fontWeight: '500', textTransform: 'uppercase' }}>Equipos</div>
                              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1c1d21' }}>{totalTeams} {totalTeams === 1 ? 'Equipo' : 'Equipos'}</div>
                            </div>
                          </div>

                          {/* Categoría */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(242, 187, 43, 0.14)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#b98a10',
                              flexShrink: 0
                            }}>
                              <Award size={15} />
                            </div>
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ fontSize: '10.5px', color: '#6f737b', fontWeight: '500', textTransform: 'uppercase' }}>Categoría</div>
                              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1c1d21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.category_name || 'Sin Categoría'}>
                                {t.category_name || 'Sin Categoría'}
                              </div>
                            </div>
                          </div>

                          {/* Fecha de Inicio */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(242, 187, 43, 0.14)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#b98a10',
                              flexShrink: 0
                            }}>
                              <Calendar size={15} />
                            </div>
                            <div>
                              <div style={{ fontSize: '10.5px', color: '#6f737b', fontWeight: '500', textTransform: 'uppercase' }}>Fecha de Inicio</div>
                              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1c1d21' }}>
                                {t.start_date ? formatDate(t.start_date) : 'Sin fecha'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer: Activo/Inactivo a la izquierda, Editar y Eliminar a la derecha */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #f0f0f2',
                        gap: '8px'
                      }}
                    >
                      {/* Botón de estado Activo/Inactivo (mismo alto 32px que los botones de acción) */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(t, e)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0 12px',
                          height: '32px',
                          minHeight: '32px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: t.is_active !== false ? '1px solid #bbf7d0' : '1px solid #fecaca',
                          background: t.is_active !== false ? '#f0fdf4' : '#fef2f2',
                          color: t.is_active !== false ? '#15803d' : '#b91c1c',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}
                        title={`Hacé clic para cambiar a ${t.is_active !== false ? 'Inactivo' : 'Activo'}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: t.is_active !== false ? '#22c55e' : '#ef4444',
                            display: 'inline-block'
                          }}
                        />
                        {t.is_active !== false ? 'Activo' : 'Inactivo'}
                      </button>

                      {/* Botones de acción a la derecha */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => { setEditingTournament(t); setShowForm(true); }}
                          type="button"
                          className="secondary icon-only"
                          style={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            padding: 0,
                            borderRadius: '10px',
                            border: '1px solid #d4d4d8',
                            background: '#ffffff',
                            color: '#3f4249',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          title="Editar información del torneo"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1c1d21';
                            e.currentTarget.style.color = '#1c1d21';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d4d4d8';
                            e.currentTarget.style.color = '#3f4249';
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(t)}
                          type="button"
                          className="secondary icon-only"
                          style={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            padding: 0,
                            borderRadius: '10px',
                            border: '1px solid #f3d4d4',
                            background: '#ffffff',
                            color: '#c62828',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          title="Eliminar torneo"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#e07070';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#f3d4d4';
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: '18px',
            maxWidth: '460px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div className="gx-icon-box sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Trash2 size={18} /></div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', color: '#1c1d21', minWidth: 0 }}>
                  Eliminar Torneo {tournamentToDelete.name}
                </h3>
              </div>
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
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#1c1d21', marginBottom: '6px', display: 'block' }}>Contraseña de Usuario *</label>
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
                    borderRadius: '12px',
                    border: deleteError ? '1px solid #e07070' : '1px solid #d4d4d8',
                    background: '#ffffff',
                    color: '#1c1d21',
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
                    height: '42px',
                    padding: '0 18px',
                    background: '#ffffff',
                    border: '1px solid #d4d4d8',
                    borderRadius: '12px',
                    color: '#1c1d21',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1c1d21';
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.background = '#fafafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d4d4d8';
                    e.currentTarget.style.color = '#1c1d21';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || !confirmPassword}
                  style={{
                    height: '42px', padding: '0 18px',
                    backgroundColor: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: '12px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer'
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
            color: '#f4f4f5',
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
              color: '#a1a1aa',
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
