import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Users,
  Trophy,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import TeamForm from './TeamForm';
import PageHeader from '../ui/PageHeader';
import '../../styles/data.css';

const CATEGORY_BANNERS = [
  { bg: '#7cb2f4', stroke: '#132a4a' },
  { bg: '#e89d7c', stroke: '#3b1d11' },
  { bg: '#c8ded3', stroke: '#1f3a2e' },
  { bg: '#dcd8ea', stroke: '#2c2545' },
  { bg: '#f5dd90', stroke: '#4d3d0d' },
  { bg: '#eeece6', stroke: '#3d3929' },
];

const btnOutline = {
  height: 34,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 500,
  background: '#ffffff',
  color: '#18181b',
  border: '1px solid #d4d3ce',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const btnDark = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  background: '#141413',
  color: '#ffffff',
  border: '1px solid #141413',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const iconBtn = {
  width: 30,
  height: 30,
  minWidth: 30,
  padding: 0,
  borderRadius: 7,
  background: '#ffffff',
  color: '#52514e',
  border: '1px solid #e5e4df',
  boxShadow: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
};

const tagGreen = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dcfce7',
  color: '#166534',
};

const tagBlue = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dbeafe',
  color: '#1d4ed8',
};

const EquiposView = () => {
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTeamErrorModal, setActiveTeamErrorModal] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    api
      .get('categories/')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.get('teams/');
      const sorted = (response.data || []).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
      );
      setTeams(sorted);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const active = teams.filter((t) => Boolean(t.is_active)).length;
    return {
      total: teams.length,
      active,
      inactive: teams.length - active,
    };
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (selectedCategory) {
        if (selectedCategory === 'sin_asignar') {
          if (t.category) return false;
        } else if (String(t.category) !== String(selectedCategory)) {
          return false;
        }
      }

      if (statusFilter === 'activos' && !t.is_active) return false;
      if (statusFilter === 'inactivos' && t.is_active) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (t.name || '').toLowerCase();
        const cat = (t.category_name || '').toLowerCase();
        const del = (t.delegate_name || '').toLowerCase();
        if (!name.includes(q) && !cat.includes(q) && !del.includes(q)) return false;
      }

      return true;
    });
  }, [teams, selectedCategory, statusFilter, search]);

  const groupedTeams = useMemo(() => {
    const groupsMap = new Map();
    for (const t of filteredTeams) {
      const catKey = t.category ? `cat_${t.category}` : 'sin_asignar';
      const catLabel = t.category_name || 'Sin asignar';

      if (!groupsMap.has(catKey)) {
        groupsMap.set(catKey, {
          key: catKey,
          label: catLabel,
          items: [],
        });
      }
      groupsMap.get(catKey).items.push(t);
    }
    return Array.from(groupsMap.values());
  }, [filteredTeams]);

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
      notify('Equipo eliminado con éxito');
    } catch (error) {
      console.error('Error deleting team:', error);
      const message = error.response?.data?.message || error.response?.data?.detail;
      if (
        message &&
        (message.includes('activo') ||
          error.response?.data?.detail === 'ACTIVE_TEAM_CANNOT_BE_DELETED')
      ) {
        setActiveTeamErrorModal(team);
      } else {
        alert(
          'Hubo un error al intentar eliminar el equipo: ' +
            (message || error.message || 'Error desconocido'),
        );
      }
      setDeletingId(null);
    }
  };

  return (
    <div
      className="anthropic-theme teams-container animate-fade-in"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 12 : 16,
        paddingBottom: 32,
      }}
    >
      <PageHeader
        icon={Users}
        title={showForm ? (selectedTeam ? 'Editar Equipo' : 'Nuevo Equipo') : 'Equipos'}
        subtitle={
          showForm
            ? 'Información básica e imágenes del club'
            : 'Gestión centralizada de equipos y categorías'
        }
        style={{ marginBottom: 0 }}
        actions={
          showForm ? (
            <button
              type="button"
              style={{ ...btnOutline, height: isMobile ? 38 : 34, width: isMobile ? '100%' : 'auto' }}
              onClick={() => {
                setShowForm(false);
                setSelectedTeam(null);
              }}
            >
              <X size={15} /> Volver
            </button>
          ) : (
            <button
              type="button"
              style={{ ...btnDark, height: isMobile ? 38 : 34, width: isMobile ? '100%' : 'auto' }}
              onClick={() => {
                setSelectedTeam(null);
                setShowForm(true);
              }}
            >
              <Plus size={15} /> Nuevo equipo
            </button>
          )
        }
      />

      {toastMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid #d4d3ce',
            color: '#141413',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={15} style={{ color: '#166534', flexShrink: 0 }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {showForm ? (
        <TeamForm
          team={selectedTeam}
          onClose={() => {
            setShowForm(false);
            setSelectedTeam(null);
          }}
          onSuccess={() => {
            const isNew = !selectedTeam;
            setShowForm(false);
            setSelectedTeam(null);
            fetchTeams();
            notify(isNew ? 'Equipo creado con éxito' : 'Equipo actualizado');
          }}
        />
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Barra de búsqueda y filtros (adaptada a celular y escritorio) */}
          <div
            style={{
              padding: isMobile ? '12px' : '14px 20px',
              borderBottom: '1px solid #efeee9',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 8 : 12,
            }}
          >
            {/* Buscador */}
            <div
              style={{
                position: 'relative',
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? '100%' : 340,
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#787772',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Buscar equipo o delegado…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  height: isMobile ? 38 : 34,
                  paddingLeft: 32,
                  paddingRight: 10,
                  fontSize: isMobile ? 13 : 12.5,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                  margin: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Desplegables: en celular grilla 50/50 perfectamente alineada */}
            <div
              style={
                isMobile
                  ? {
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      width: '100%',
                    }
                  : {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                {!isMobile && (
                  <span style={{ fontSize: 12, color: '#787772', fontWeight: 600 }}>Estado:</span>
                )}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: isMobile ? 36 : 34,
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? 0 : 155,
                    fontSize: 12.5,
                    fontWeight: 500,
                    borderRadius: 8,
                    background: '#faf9f6',
                    border: '1px solid #e5e4df',
                    padding: '0 28px 0 10px',
                    margin: 0,
                    color: '#141413',
                  }}
                >
                  <option value="todos">Todos ({counts.total})</option>
                  <option value="activos">Activos ({counts.active})</option>
                  <option value="inactivos">Inactivos ({counts.inactive})</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                {!isMobile && (
                  <span style={{ fontSize: 12, color: '#787772', fontWeight: 600 }}>
                    Categoría:
                  </span>
                )}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    height: isMobile ? 36 : 34,
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? 0 : 185,
                    fontSize: 12.5,
                    fontWeight: 500,
                    borderRadius: 8,
                    background: '#faf9f6',
                    border: '1px solid #e5e4df',
                    padding: '0 28px 0 10px',
                    margin: 0,
                    color: '#141413',
                  }}
                >
                  <option value="">Todas las categorías</option>
                  <option value="sin_asignar">Sin asignar</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contenido: Lista adaptada para celular vs Tabla para escritorio */}
          {loading ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              Cargando…
            </div>
          ) : groupedTeams.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              No hay equipos registrados.
            </div>
          ) : isMobile ? (
            /* VISTA MÓVIL: Agrupada por categoría, sin scroll horizontal */
            <div>
              {groupedTeams.map((group, gIdx) => {
                const banner = CATEGORY_BANNERS[gIdx % CATEGORY_BANNERS.length];

                return (
                  <div key={group.key}>
                    {/* Cabecera de categoría */}
                    <div
                      style={{
                        background: '#f6f5f1',
                        borderTop: gIdx === 0 ? 'none' : '1px solid #e5e4df',
                        borderBottom: '1px solid #e5e4df',
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          background: banner.bg,
                          color: banner.stroke,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Award size={12} strokeWidth={2} />
                      </span>
                      <strong style={{ fontSize: 12.5, fontWeight: 700, color: '#141413' }}>
                        {group.label}
                      </strong>
                      <span style={{ fontSize: 11.5, color: '#787772' }}>
                        ({group.items.length})
                      </span>
                    </div>

                    {/* Filas móviles */}
                    {group.items.map((team) => (
                      <div
                        key={team.id}
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #f1f0ec',
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          {/* Escudo + Nombre + Delegado */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                background: '#faf9f6',
                                border: '1px solid #e5e4df',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {team.logo ? (
                                <img
                                  src={team.logo}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <span style={{ fontSize: 10, color: '#a1a09a' }}>N/A</span>
                              )}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: '#141413',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {team.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#787772',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: 1,
                                }}
                              >
                                {team.delegate_name
                                  ? `Delegado: ${team.delegate_name}`
                                  : 'Sin delegado'}
                              </div>
                            </div>
                          </div>

                          {/* Acciones a la derecha */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {deletingId === team.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(team)}
                                  style={{
                                    ...btnDark,
                                    height: 28,
                                    padding: '0 10px',
                                    fontSize: 11.5,
                                    background: '#dc2626',
                                    borderColor: '#dc2626',
                                  }}
                                >
                                  Eliminar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  style={{
                                    ...btnOutline,
                                    height: 28,
                                    padding: '0 8px',
                                    fontSize: 11.5,
                                  }}
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(team)}
                                  style={iconBtn}
                                  title="Editar"
                                >
                                  <Pencil size={13.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAttemptDelete(team)}
                                  style={{ ...iconBtn, color: '#787772' }}
                                  title="Eliminar"
                                >
                                  <Trash2 size={13.5} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subfila inferior: Estado + Torneo + Fecha */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            paddingLeft: 48,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {team.is_active ? (
                              <span style={tagGreen}>
                                <Check size={11} strokeWidth={2.5} /> Activo
                              </span>
                            ) : (
                              <span style={tagPill}>Inactivo</span>
                            )}
                            {team.current_tournament && (
                              <span style={tagBlue}>
                                <Trophy size={10.5} /> {team.current_tournament}
                              </span>
                            )}
                          </div>

                          {team.created_at && (
                            <span style={{ fontSize: 11, color: '#a1a09a' }}>
                              {new Date(team.created_at).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA ESCRITORIO: Tabla agrupada */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      background: '#faf9f6',
                      borderBottom: '1px solid #e5e4df',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#787772',
                    }}
                  >
                    <th style={{ padding: '10px 20px' }}>Equipo</th>
                    <th style={{ padding: '10px 14px' }}>Categoría</th>
                    <th style={{ padding: '10px 14px' }}>Delegado</th>
                    <th style={{ padding: '10px 14px' }}>Estado</th>
                    <th style={{ padding: '10px 14px' }}>Registro</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedTeams.map((group, gIdx) => {
                    const banner = CATEGORY_BANNERS[gIdx % CATEGORY_BANNERS.length];

                    return (
                      <React.Fragment key={group.key}>
                        <tr
                          style={{
                            background: '#f6f5f1',
                            borderTop: '1px solid #e5e4df',
                            borderBottom: '1px solid #e5e4df',
                          }}
                        >
                          <td colSpan={6} style={{ padding: '7px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 5,
                                  background: banner.bg,
                                  color: banner.stroke,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Award size={12} strokeWidth={2} />
                              </span>
                              <strong style={{ fontSize: 12.5, fontWeight: 700, color: '#141413' }}>
                                {group.label}
                              </strong>
                              <span style={{ fontSize: 11.5, color: '#787772' }}>
                                ({group.items.length})
                              </span>
                            </div>
                          </td>
                        </tr>

                        {group.items.map((team) => (
                          <tr
                            key={team.id}
                            style={{
                              borderBottom: '1px solid #f1f0ec',
                              background: '#ffffff',
                            }}
                          >
                            <td style={{ padding: '10px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 8,
                                    background: '#faf9f6',
                                    border: '1px solid #e5e4df',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {team.logo ? (
                                    <img
                                      src={team.logo}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: 10, color: '#a1a09a' }}>N/A</span>
                                  )}
                                </div>
                                <strong style={{ fontSize: 13.5, fontWeight: 600, color: '#141413' }}>
                                  {team.name}
                                </strong>
                              </div>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span style={tagPill}>{team.category_name || 'Sin asignar'}</span>
                            </td>

                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#52514e' }}>
                              {team.delegate_name || '—'}
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {team.is_active ? (
                                  <span style={tagGreen}>
                                    <Check size={11} strokeWidth={2.5} /> Activo
                                  </span>
                                ) : (
                                  <span style={tagPill}>Inactivo</span>
                                )}
                                {team.current_tournament && (
                                  <span style={tagBlue}>
                                    <Trophy size={11} /> {team.current_tournament}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '10px 14px', fontSize: 12, color: '#787772' }}>
                              {team.created_at
                                ? new Date(team.created_at).toLocaleDateString('es-AR')
                                : '—'}
                            </td>

                            <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  justifyContent: 'flex-end',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {deletingId === team.id ? (
                                  <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginRight: 2 }}>
                                      ¿Eliminar?
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(team);
                                      }}
                                      style={{
                                        ...btnDark,
                                        height: 26,
                                        padding: '0 8px',
                                        fontSize: 11,
                                        background: '#dc2626',
                                        borderColor: '#dc2626',
                                      }}
                                    >
                                      Sí
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeletingId(null);
                                      }}
                                      style={{
                                        ...btnOutline,
                                        height: 26,
                                        padding: '0 8px',
                                        fontSize: 11,
                                      }}
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEdit(team);
                                      }}
                                      style={iconBtn}
                                      title="Editar"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAttemptDelete(team);
                                      }}
                                      style={{ ...iconBtn, color: '#787772' }}
                                      title="Eliminar"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTeamErrorModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(20, 20, 19, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: 20,
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e4df',
                borderRadius: 14,
                maxWidth: 440,
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid #efeee9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#141413' }}>
                    No se puede eliminar el equipo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTeamErrorModal(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#787772',
                    padding: 4,
                    minWidth: 0,
                    height: 'auto',
                    boxShadow: 'none',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '16px 20px', fontSize: 13, color: '#52514e', lineHeight: 1.5 }}>
                El equipo <strong>"{activeTeamErrorModal.name}"</strong> está activo en{' '}
                <strong>"{activeTeamErrorModal.current_tournament || 'un torneo'}"</strong>. Primero
                debés quitarlo del torneo para poder eliminarlo.
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: '#faf9f6',
                  borderTop: '1px solid #efeee9',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTeamErrorModal(null)}
                  style={btnDark}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default EquiposView;
