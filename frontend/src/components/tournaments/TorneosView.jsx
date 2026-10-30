import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit2, Calendar, Eye, X, Check, ChevronRight, Layers, Users, Award } from 'lucide-react';
import TournamentForm from './TournamentForm';
import PageHeader from '../ui/PageHeader';
import '../../styles/tournaments.css';

const TOURNAMENT_BANNERS = [
  { bg: '#7cb2f4', stroke: '#132a4a' }, // Azul suave
  { bg: '#e89d7c', stroke: '#3b1d11' }, // Terracota / Coral cálido
  { bg: '#c8ded3', stroke: '#1f3a2e' }, // Verde salvia
  { bg: '#dcd8ea', stroke: '#2c2545' }, // Lavanda / Violeta pastel
  { bg: '#f5dd90', stroke: '#4d3d0d' }, // Mostaza suave / Ocre cálido
  { bg: '#eeece6', stroke: '#3d3929' }, // Arena / Gris cálido
];

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
  lineHeight: 1.3,
};

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '18px' }}>
              {tournaments.map((t, idx) => {
                const totalTeams = t.zones?.reduce((acc, z) => acc + (z.zone_teams?.length || 0), 0) || 0;
                const totalZones = t.zones?.length || 0;
                const banner = TOURNAMENT_BANNERS[idx % TOURNAMENT_BANNERS.length];
                const isActive = t.is_active !== false;

                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/torneos/${t.id}`)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e4df',
                      borderRadius: '14px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 2px rgba(20, 20, 19, 0.03)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c7c5bd';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 22px rgba(20, 20, 19, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e4df';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(20, 20, 19, 0.03)';
                    }}
                  >
                    {/* Cabecera pastel con ícono centrado */}
                    <div
                      style={{
                        height: '92px',
                        borderRadius: '10px',
                        background: banner.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Trophy size={32} strokeWidth={1.6} style={{ color: banner.stroke }} />
                    </div>

                    {/* Cuerpo de la tarjeta */}
                    <div
                      style={{
                        padding: '14px 12px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        flex: 1,
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Fila 1: Nombre del Torneo + Píldora de estado (Vigente / Inactivo) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '10px',
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#141413',
                              lineHeight: 1.3,
                            }}
                            title={t.name}
                          >
                            {t.name}
                          </h3>

                          <button
                            type="button"
                            onClick={(e) => handleToggleActive(t, e)}
                            title={`Hacé clic para cambiar a ${isActive ? 'Inactivo' : 'Activo'}`}
                            style={{
                              height: '24px',
                              minHeight: '24px',
                              minWidth: 0,
                              padding: '0 9px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              background: isActive ? '#dbeafe' : '#fee2e2',
                              color: isActive ? '#1d4ed8' : '#991b1b',
                              border: 'none',
                              boxShadow: 'none',
                              textTransform: 'none',
                              letterSpacing: 0,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {isActive ? 'Vigente' : 'Inactivo'}
                          </button>
                        </div>

                        {/* Fila 2: Píldoras grises con los detalles del torneo (Título en negrita, valor sin negrita) */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={tagPill}>
                            <strong style={{ fontWeight: '700', color: '#141413' }}>Categoría:</strong>{' '}
                            <span style={{ fontWeight: '400' }}>{t.category_name || 'Sin categoría'}</span>
                          </span>
                          <span style={tagPill}>
                            <strong style={{ fontWeight: '700', color: '#141413' }}>Zonas:</strong>{' '}
                            <span style={{ fontWeight: '400' }}>{totalZones}</span>
                          </span>
                          <span style={tagPill}>
                            <strong style={{ fontWeight: '700', color: '#141413' }}>Equipos:</strong>{' '}
                            <span style={{ fontWeight: '400' }}>{totalTeams}</span>
                          </span>
                          <span style={tagPill}>
                            <strong style={{ fontWeight: '700', color: '#141413' }}>Inicio:</strong>{' '}
                            <span style={{ fontWeight: '400' }}>
                              {t.start_date ? formatDate(t.start_date) : 'Sin fecha'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Fila inferior separada por línea sutil: Botón Ver torneo + Editar / Eliminar */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          paddingTop: '12px',
                          marginTop: '4px',
                          borderTop: '1px solid #f1f0ec',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/torneos/${t.id}`)}
                          style={{
                            flex: 1,
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            background: '#faf9f6',
                            color: '#141413',
                            border: '1px solid #e5e4df',
                            boxShadow: 'none',
                            textTransform: 'none',
                            letterSpacing: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <span>Ver zonas y posiciones</span>
                          <ChevronRight size={14} style={{ color: '#787772' }} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingTournament(t);
                              setShowForm(true);
                            }}
                            type="button"
                            className="secondary icon-only"
                            style={{
                              width: '34px',
                              height: '34px',
                              minWidth: '34px',
                              padding: 0,
                              borderRadius: '8px',
                              border: '1px solid #d4d3ce',
                              background: '#ffffff',
                              color: '#3f4249',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Editar información del torneo"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(t)}
                            type="button"
                            className="secondary icon-only"
                            style={{
                              width: '34px',
                              height: '34px',
                              minWidth: '34px',
                              padding: 0,
                              borderRadius: '8px',
                              border: '1px solid #f3d4d4',
                              background: '#ffffff',
                              color: '#c62828',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Eliminar torneo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
          background: 'rgba(0, 0, 0, 0.55)',
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
