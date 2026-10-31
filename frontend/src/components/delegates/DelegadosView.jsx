import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import {
  Plus,
  Search,
  Contact,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DelegateForm from './DelegateForm';
import PageHeader from '../ui/PageHeader';
import '../../styles/data.css';

const AVATAR_BANNERS = [
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
  width: 28,
  height: 28,
  minWidth: 28,
  padding: 0,
  borderRadius: 6,
  background: '#ffffff',
  color: '#52514e',
  border: '1px solid #e5e4df',
  boxShadow: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  fontWeight: 500,
  padding: '3px 8px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
};

const DelegadosView = () => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    fetchDelegates();
  }, []);

  useEffect(() => {
    if (location.state?.openForm) {
      setEditingDelegate(null);
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDelegates = async () => {
    setLoading(true);
    try {
      const response = await api.get('delegates/');
      const sorted = (response.data || []).sort((a, b) => {
        const firstCompare = (a.first_name || '').localeCompare(b.first_name || '', undefined, {
          sensitivity: 'base',
        });
        if (firstCompare !== 0) return firstCompare;
        return (a.last_name || '').localeCompare(b.last_name || '', undefined, {
          sensitivity: 'base',
        });
      });
      setDelegates(sorted);
    } catch (error) {
      console.error('Error fetching delegates:', error);
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const withTeam = delegates.filter((d) => Boolean(d.team || d.team_name)).length;
    return {
      total: delegates.length,
      withTeam,
      withoutTeam: delegates.length - withTeam,
    };
  }, [delegates]);

  const filteredDelegates = useMemo(() => {
    return delegates.filter((d) => {
      if (statusFilter === 'con_equipo' && !d.team && !d.team_name) return false;
      if (statusFilter === 'sin_equipo' && (d.team || d.team_name)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const full = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
        const dni = (d.dni || '').toLowerCase();
        const team = (d.team_name || '').toLowerCase();
        if (!full.includes(q) && !dni.includes(q) && !team.includes(q)) return false;
      }

      return true;
    });
  }, [delegates, statusFilter, search]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`delegates/${id}/`);
      fetchDelegates();
      notify('Delegado eliminado con éxito');
    } catch (error) {
      console.error('Error deleting delegate:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="anthropic-theme delegates-container animate-fade-in"
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
        icon={Contact}
        title={showForm ? (editingDelegate ? 'Editar Delegado' : 'Nuevo Delegado') : 'Delegados'}
        subtitle={
          showForm
            ? 'Datos del representante y credenciales'
            : 'Gestión de delegados y representantes de equipos'
        }
        actions={
          showForm ? (
            <button
              type="button"
              style={{
                ...btnOutline,
                width: isMobile ? '100%' : 'auto',
                height: isMobile ? 38 : 34,
              }}
              onClick={() => {
                setShowForm(false);
                setEditingDelegate(null);
              }}
            >
              <X size={15} /> Volver
            </button>
          ) : (
            <button
              type="button"
              style={{
                ...btnDark,
                width: isMobile ? '100%' : 'auto',
                height: isMobile ? 38 : 34,
              }}
              onClick={() => {
                setEditingDelegate(null);
                setShowForm(true);
              }}
            >
              <Plus size={15} /> Nuevo delegado
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
        <DelegateForm
          delegate={editingDelegate}
          onClose={() => {
            setShowForm(false);
            setEditingDelegate(null);
          }}
          onSuccess={() => {
            const isNew = !editingDelegate;
            setShowForm(false);
            setEditingDelegate(null);
            fetchDelegates();
            notify(isNew ? 'Delegado creado con éxito' : 'Delegado actualizado');
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
          {/* Barra superior limpia */}
          <div
            style={{
              padding: isMobile ? '12px 14px' : '14px 20px',
              borderBottom: '1px solid #efeee9',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 8 : 12,
            }}
          >
            <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? 'none' : 360 }}>
              <Search
                size={13.5}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#787772',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o equipo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  height: isMobile ? 36 : 34,
                  paddingLeft: 30,
                  paddingRight: 10,
                  fontSize: 12.5,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                  margin: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: isMobile ? '100%' : 'auto' }}>
              {!isMobile && (
                <span style={{ fontSize: 12, color: '#787772', fontWeight: 600 }}>Estado:</span>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: isMobile ? 36 : 34,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 0 : 175,
                  fontSize: 12.5,
                  fontWeight: 500,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                  padding: '0 28px 0 10px',
                  margin: 0,
                  color: '#141413',
                  boxSizing: 'border-box',
                }}
              >
                <option value="todos">Estado: Todos ({counts.total})</option>
                <option value="con_equipo">Con equipo ({counts.withTeam})</option>
                <option value="sin_equipo">Sin equipo ({counts.withoutTeam})</option>
              </select>
            </div>
          </div>

          {/* Listado */}
          {loading ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              Cargando…
            </div>
          ) : filteredDelegates.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              No hay delegados registrados.
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredDelegates.map((delegate, idx) => {
                const avatar = AVATAR_BANNERS[idx % AVATAR_BANNERS.length];
                const initials =
                  `${(delegate.first_name || '')[0] || ''}${(delegate.last_name || '')[0] || ''}`.toUpperCase() ||
                  'D';

                return (
                  <div
                    key={delegate.id}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f0ec',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {/* Fila superior: Avatar + Nombre + DNI y Botones */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: avatar.bg,
                            color: avatar.stroke,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: '#141413',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {delegate.first_name} {delegate.last_name}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: '#787772',
                              marginTop: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {delegate.dni ? `DNI ${delegate.dni}` : 'Sin DNI'}
                            {delegate.address ? ` · ${delegate.address}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {deletingId === delegate.id ? (
                          <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(delegate.id);
                              }}
                              style={{
                                ...btnDark,
                                height: 28,
                                padding: '0 10px',
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
                                height: 28,
                                padding: '0 10px',
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
                                setEditingDelegate(delegate);
                                setShowForm(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{ ...iconBtn, width: 30, height: 30 }}
                              title="Editar"
                            >
                              <Pencil size={13.5} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingId(delegate.id);
                              }}
                              style={{ ...iconBtn, width: 30, height: 30, color: '#787772' }}
                              title="Eliminar"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fila inferior: Equipo y fecha */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        paddingLeft: 46,
                      }}
                    >
                      <div>
                        {delegate.team_name ? (
                          <span style={{ ...tagPill, fontSize: 11, padding: '2px 7px' }}>
                            {delegate.team_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#a1a09a' }}>Sin equipo</span>
                        )}
                      </div>

                      {delegate.created_at && (
                        <span style={{ fontSize: 11, color: '#a1a09a', flexShrink: 0 }}>
                          {new Date(delegate.created_at).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
                    <th style={{ padding: '10px 20px' }}>Delegado</th>
                    <th style={{ padding: '10px 14px' }}>DNI</th>
                    <th style={{ padding: '10px 14px' }}>Equipo</th>
                    <th style={{ padding: '10px 14px' }}>Registro</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDelegates.map((delegate, idx) => {
                    const avatar = AVATAR_BANNERS[idx % AVATAR_BANNERS.length];
                    const initials =
                      `${(delegate.first_name || '')[0] || ''}${(delegate.last_name || '')[0] || ''}`.toUpperCase() ||
                      'D';

                    return (
                      <tr
                        key={delegate.id}
                        style={{
                          borderBottom: '1px solid #f1f0ec',
                          background: '#ffffff',
                        }}
                      >
                        <td style={{ padding: '10px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 7,
                                background: avatar.bg,
                                color: avatar.stroke,
                                fontSize: 11.5,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <strong style={{ fontSize: 13.5, fontWeight: 600, color: '#141413' }}>
                                {delegate.first_name} {delegate.last_name}
                              </strong>
                              {delegate.address && (
                                <div style={{ fontSize: 11.5, color: '#787772' }}>
                                  {delegate.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', color: '#52514e' }}>
                          {delegate.dni || '—'}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {delegate.team_name ? (
                            <span style={tagPill}>{delegate.team_name}</span>
                          ) : (
                            <span style={{ color: '#a1a09a', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#787772' }}>
                          {delegate.created_at
                            ? new Date(delegate.created_at).toLocaleDateString('es-AR')
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
                            {deletingId === delegate.id ? (
                              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginRight: 2 }}>
                                  ¿Eliminar?
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(delegate.id);
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
                                    setEditingDelegate(delegate);
                                    setShowForm(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                    setDeletingId(delegate.id);
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DelegadosView;
