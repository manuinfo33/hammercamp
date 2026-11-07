import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Search, Trophy, Trash2, Edit2, Calendar, Eye, X, Check, ChevronRight, Layers, Users, Award } from 'lucide-react';
import TournamentForm from './TournamentForm';
import PageHeader from '../ui/PageHeader';
import '../../styles/tournaments.css';

const FLOODLIGHT_THEMES = [
  { bg: '#132a4a', sideBeam: '#7cb2f4', centerBeam: '#f5dd90', arch: '#7cb2f4', star: '#f5dd90', cupMain: '#f5dd90', cupShade: '#e0be5a', cupBase: '#faf9f6', emblem: '#132a4a' },
  { bg: '#133829', sideBeam: '#6ee7b7', centerBeam: '#fde68a', arch: '#6ee7b7', star: '#fde68a', cupMain: '#fde68a', cupShade: '#eab308', cupBase: '#faf9f6', emblem: '#133829' },
  { bg: '#3f1420', sideBeam: '#fda4af', centerBeam: '#fcd34d', arch: '#fda4af', star: '#fcd34d', cupMain: '#fcd34d', cupShade: '#d99b26', cupBase: '#faf9f6', emblem: '#3f1420' },
  { bg: '#261b47', sideBeam: '#c4b5fd', centerBeam: '#f5dd90', arch: '#c4b5fd', star: '#f5dd90', cupMain: '#f5dd90', cupShade: '#dfba48', cupBase: '#faf9f6', emblem: '#261b47' },
  { bg: '#1b1d24', sideBeam: '#fbbf24', centerBeam: '#fef08a', arch: '#9ca3af', star: '#fbbf24', cupMain: '#fde047', cupShade: '#ca8a04', cupBase: '#faf9f6', emblem: '#1b1d24' },
  { bg: '#0f333e', sideBeam: '#67e8f9', centerBeam: '#f5dd90', arch: '#67e8f9', star: '#f5dd90', cupMain: '#f5dd90', cupShade: '#d4af37', cupBase: '#faf9f6', emblem: '#0f333e' },
  { bg: '#3c1f14', sideBeam: '#fdba74', centerBeam: '#fde68a', arch: '#fdba74', star: '#fde68a', cupMain: '#fde68a', cupShade: '#d97706', cupBase: '#faf9f6', emblem: '#3c1f14' },
  { bg: '#1e293b', sideBeam: '#93c5fd', centerBeam: '#fde68a', arch: '#93c5fd', star: '#fde68a', cupMain: '#f5dd90', cupShade: '#cda434', cupBase: '#faf9f6', emblem: '#1e293b' },
];

function TrophyIllustration({ variant, theme }) {
  switch (variant) {
    case 0:
      return (
        <g transform="translate(200, 62)">
          <path d="M -20,-28 L 20,-28 L 14,2 C 12,12 -12,12 -14,2 Z" fill={theme.cupMain} />
          <path d="M -20,-22 L -28,-22 L -25,-6 L -15,-4" fill="none" stroke={theme.cupMain} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20,-22 L 28,-22 L 25,-6 L 15,-4" fill="none" stroke={theme.cupMain} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-5" y="9" width="10" height="12" fill={theme.cupShade} />
          <rect x="-16" y="21" width="32" height="7" rx="3" fill={theme.cupBase} />
          <circle cx="0" cy="-12" r="6" fill={theme.emblem} />
        </g>
      );
    case 1:
      return (
        <g transform="translate(200, 62)">
          <path d="M -13,-18 C -30,-30 -30,0 -11,4" fill="none" stroke={theme.cupMain} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 13,-18 C 30,-30 30,0 11,4" fill="none" stroke={theme.cupMain} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M -14,-28 L 14,-28 L 17,-8 C 17,6 8,12 0,12 C -8,12 -17,6 -17,-8 Z" fill={theme.cupMain} />
          <ellipse cx="0" cy="-28" rx="14" ry="3.5" fill={theme.cupShade} />
          <rect x="-6" y="11" width="12" height="9" rx="2" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
          <polygon points="0,-19 5,-11 0,-3 -5,-11" fill={theme.emblem} />
        </g>
      );
    case 2:
      return (
        <g transform="translate(200, 62)">
          <polyline points="-17,-22 -27,-18 -23,-4 -12,-2" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17,-22 27,-18 23,-4 12,-2" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="-19,-26 19,-26 23,-12 11,6 -11,6 -23,-12" fill={theme.cupMain} />
          <polygon points="-8,-26 8,-26 10,-12 4,6 -4,6 -10,-12" fill={theme.cupShade} opacity="0.55" />
          <rect x="-4" y="6" width="8" height="11" fill={theme.cupShade} />
          <rect x="-13" y="17" width="26" height="4" rx="1.5" fill={theme.cupMain} />
          <rect x="-19" y="21" width="38" height="7" rx="2.5" fill={theme.cupBase} />
        </g>
      );
    case 3:
      return (
        <g transform="translate(200, 62)">
          <path d="M -14,18 L -6,0 L -16,-14 L -6,-14 L 0,2 L 6,-14 L 16,-14 L 6,0 L 14,18 Z" fill={theme.cupShade} />
          <path d="M -10,18 L 0,-4 L 10,18 Z" fill={theme.cupMain} />
          <circle cx="0" cy="-16" r="14" fill={theme.cupMain} />
          <polygon points="0,-22 5.5,-18 3.5,-11.5 -3.5,-11.5 -5.5,-18" fill={theme.emblem} />
          <rect x="-15" y="16" width="30" height="4" rx="2" fill={theme.cupMain} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 4:
      return (
        <g transform="translate(200, 62)">
          <polygon points="-16,-22 -12,-31 -5,-24 0,-33 5,-24 12,-31 16,-22" fill={theme.cupShade} />
          <path d="M -18,-22 L 18,-22 L 18,-4 C 18,9 0,16 0,16 C 0,16 -18,9 -18,-4 Z" fill={theme.cupMain} />
          <path d="M -18,-16 L -26,-16 L -26,-5 L -16,-1" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M 18,-16 L 26,-16 L 26,-5 L 16,-1" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinejoin="round" />
          <line x1="-18" y1="-9" x2="18" y2="-9" stroke={theme.emblem} strokeWidth="2.5" />
          <circle cx="0" cy="-1" r="4.5" fill={theme.emblem} />
          <rect x="-6" y="14" width="12" height="7" fill={theme.cupShade} />
          <rect x="-17" y="21" width="34" height="7" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 5:
      return (
        <g transform="translate(200, 62)">
          <polygon points="-10,-8 -32,-24 -26,-12 -30,-4 -12,2" fill={theme.cupShade} />
          <polygon points="10,-8 32,-24 26,-12 30,-4 12,2" fill={theme.cupShade} />
          <polygon points="-16,-28 16,-28 8,12 -8,12" fill={theme.cupMain} />
          <polygon points="0,-20 2.5,-14 9,-14 3.8,-10 5.8,-4 0,-8 -5.8,-4 -3.8,-10 -9,-14 -2.5,-14" fill={theme.emblem} />
          <rect x="-5" y="12" width="10" height="8" fill={theme.cupShade} />
          <rect x="-16" y="20" width="32" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 6:
      return (
        <g transform="translate(200, 62)">
          <circle cx="-16" cy="-12" r="6" fill="none" stroke={theme.cupMain} strokeWidth="2.6" />
          <circle cx="16" cy="-12" r="6" fill="none" stroke={theme.cupMain} strokeWidth="2.6" />
          <circle cx="0" cy="-29" r="4.5" fill={theme.cupBase} />
          <path d="M -14,-18 C -14,-26 14,-26 14,-18 L 11,2 L -11,2 Z" fill={theme.cupMain} />
          <rect x="-15" y="-19" width="30" height="3.5" rx="1.5" fill={theme.cupShade} />
          <rect x="-7" y="2" width="14" height="6" rx="2" fill={theme.cupShade} />
          <polygon points="-11,8 11,8 15,20 -15,20" fill={theme.cupMain} />
          <rect x="-19" y="20" width="38" height="8" rx="2.5" fill={theme.cupBase} />
          <circle cx="0" cy="-9" r="4.5" fill={theme.emblem} />
        </g>
      );
    default:
      return (
        <g transform="translate(200, 62)">
          <polygon points="0,-34 2.5,-28 9,-28 4,-24 6,-18 0,-22 -6,-18 -4,-24 -9,-28 -2.5,-28" fill={theme.cupBase} />
          <polygon points="0,-18 18,-6 10,16 -10,16 -18,-6" fill={theme.cupMain} />
          <polygon points="0,-18 18,-6 0,16" fill={theme.cupShade} opacity="0.5" />
          <polygon points="-18,-6 -26,-14 -20,4 -12,8" fill={theme.cupShade} />
          <polygon points="18,-6 26,-14 20,4 12,8" fill={theme.cupShade} />
          <polygon points="0,-9 6,-2 0,5 -6,-2" fill={theme.emblem} />
          <rect x="-13" y="16" width="26" height="4" rx="1.5" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
  }
}

function TournamentFloodlightBanner({ index, height = 126 }) {
  const variant = index % 8;
  const theme = FLOODLIGHT_THEMES[variant];

  return (
    <div
      style={{
        height,
        overflow: 'hidden',
        position: 'relative',
        background: theme.bg,
        borderBottom: '3px solid rgba(245, 221, 144, 0.35)',
      }}
    >
      <svg
        viewBox="0 0 400 120"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="0" y="0" width="400" height="120" fill={theme.bg} />
        <polygon points="30,0 90,0 220,120 110,120" fill={theme.sideBeam} opacity="0.18" />
        <polygon points="370,0 310,0 180,120 290,120" fill={theme.sideBeam} opacity="0.18" />
        <polygon points="155,0 245,0 275,120 125,120" fill={theme.centerBeam} opacity="0.14" />
        <circle cx="70" cy="125" r="55" fill="none" stroke={theme.arch} strokeWidth="2" strokeOpacity="0.3" />
        <circle cx="330" cy="125" r="55" fill="none" stroke={theme.arch} strokeWidth="2" strokeOpacity="0.3" />
        <polygon points="118,34 121,41 128,41 122,45 124,52 118,48 112,52 114,45 108,41 115,41" fill={theme.star} />
        <polygon points="282,34 285,41 292,41 286,45 288,52 282,48 276,52 278,45 272,41 279,41" fill={theme.star} />
        <TrophyIllustration variant={variant} theme={theme} />
      </svg>
    </div>
  );
}

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '20px' }}>
              <style>{`
                .sl-mgmt-tourn-card {
                  background: #ffffff;
                  border: 1px solid #e6e4dd;
                  border-radius: 18px;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  box-shadow: 0 2px 10px rgba(20, 20, 19, 0.04);
                  cursor: pointer;
                  position: relative;
                  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                              box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                              border-color 0.24s ease;
                }
                .sl-mgmt-tourn-card:hover {
                  border-color: #c9c6bc;
                  transform: translateY(-4px);
                  box-shadow: 0 14px 30px rgba(20, 20, 19, 0.09);
                }
              `}</style>
              {tournaments.map((t, idx) => {
                const totalTeams = t.zones?.reduce((acc, z) => acc + (z.zone_teams?.length || 0), 0) || 0;
                const totalZones = t.zones?.length || 0;
                const theme = FLOODLIGHT_THEMES[idx % FLOODLIGHT_THEMES.length];
                const isActive = t.is_active !== false;

                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/torneos/${t.id}`)}
                    className="sl-mgmt-tourn-card"
                  >
                    {/* Ilustración estilo "Noche de Reflectores" a sangre completa (idéntica a la Web Visual) */}
                    <TournamentFloodlightBanner index={idx} height={128} />

                    {/* Cuerpo de la tarjeta */}
                    <div
                      style={{
                        padding: '18px 20px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        flex: 1,
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Fila 1: Píldora de Categoría asociada + Estado interactivo (Vigente / Inactivo) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: '#f5f4f0',
                              border: '1px solid #e8e6df',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: theme.bg,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#575652',
                                lineHeight: 1,
                              }}
                            >
                              Categoría · {t.category_name || 'Sin categoría'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleActive(t, e)}
                            title={`Hacé clic para cambiar a ${isActive ? 'Inactivo' : 'Vigente'}`}
                            style={{
                              height: '24px',
                              minHeight: '24px',
                              minWidth: 0,
                              padding: '0 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: isActive ? '#eef7ed' : '#fef2f2',
                              color: isActive ? '#2e7d32' : '#dc2626',
                              border: isActive ? '1px solid #c8e6c9' : '1px solid #fecaca',
                              boxShadow: 'none',
                              textTransform: 'none',
                              letterSpacing: 0,
                              cursor: 'pointer',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: isActive ? '#2e7d32' : '#dc2626',
                              }}
                            />
                            {isActive ? 'Vigente' : 'Inactivo'}
                          </button>
                        </div>

                        {/* Fila 2: Título del Torneo */}
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '18.5px',
                            fontWeight: '800',
                            color: '#141413',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.28,
                          }}
                          title={t.name}
                        >
                          {t.name}
                        </h3>

                        {/* Fila 3: Bloque estructurado con Zonas, Equipos e Inicio */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1.25fr',
                            gap: '8px',
                            padding: '10px 12px',
                            background: '#f8f7f4',
                            borderRadius: '12px',
                            border: '1px solid #edece6',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                              Zonas
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#141413' }}>
                              {totalZones}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #e6e4dd', paddingLeft: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                              Equipos
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#141413' }}>
                              {totalTeams}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #e6e4dd', paddingLeft: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                              Inicio
                            </span>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#141413' }}>
                              {t.start_date ? formatDate(t.start_date) : 'Sin fecha'}
                            </span>
                          </div>
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
                          borderTop: '1px solid #f0efe9',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/torneos/${t.id}`)}
                          style={{
                            flex: 1,
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '10px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            background: '#f8f7f4',
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
                              borderRadius: '10px',
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
                              borderRadius: '10px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
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
