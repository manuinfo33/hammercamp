import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import {
  Plus,
  Search,
  UserCheck,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react';
import PlayerFormModal from './PlayerFormModal';
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

const JugadoresView = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

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
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await api.get('players/');
      const sorted = (response.data || []).sort((a, b) => {
        const lastCompare = (a.last_name || '').localeCompare(b.last_name || '', undefined, {
          sensitivity: 'base',
        });
        if (lastCompare !== 0) return lastCompare;
        return (a.first_name || '').localeCompare(b.first_name || '', undefined, {
          sensitivity: 'base',
        });
      });
      setPlayers(sorted);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const full = `${p.last_name || ''} ${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const dni = String(p.dni || '').toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        if (!full.includes(q) && !dni.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [players, search]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`players/${id}/`);
      fetchPlayers();
      notify('Jugador eliminado con éxito');
    } catch (error) {
      console.error('Error deleting player:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="anthropic-theme players-container animate-fade-in"
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
        icon={UserCheck}
        title={showForm ? (editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador') : 'Jugadores'}
        subtitle={
          showForm
            ? 'Datos personales y documentación del jugador'
            : 'Padrón general de jugadores'
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
                setEditingPlayer(null);
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
                setEditingPlayer(null);
                setShowForm(true);
              }}
            >
              <Plus size={15} /> Nuevo jugador
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
        <PlayerFormModal
          inline
          player={editingPlayer}
          onClose={() => {
            setShowForm(false);
            setEditingPlayer(null);
          }}
          onSuccess={() => {
            const isNew = !editingPlayer;
            setShowForm(false);
            setEditingPlayer(null);
            fetchPlayers();
            notify(isNew ? 'Jugador creado con éxito' : 'Jugador actualizado');
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
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : 360 }}>
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
                placeholder="Buscar por nombre, apellido o DNI…"
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
            {!isMobile && (
              <span style={{ fontSize: 12, color: '#787772' }}>
                Total: <strong>{players.length}</strong>
              </span>
            )}
          </div>

          {/* Listado */}
          {loading ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              Cargando…
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#787772', fontSize: 13 }}>
              No hay jugadores registrados.
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredPlayers.map((player, idx) => {
                const avatar = AVATAR_BANNERS[idx % AVATAR_BANNERS.length];
                const initials =
                  `${(player.last_name || '')[0] || ''}${(player.first_name || '')[0] || ''}`.toUpperCase() ||
                  'J';

                return (
                  <div
                    key={player.id}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f0ec',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {/* Fila principal: Avatar + Nombre + DNI y Botones */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
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
                            background: player.photo ? '#faf9f6' : avatar.bg,
                            color: avatar.stroke,
                            border: player.photo ? '1px solid #e5e4df' : 'none',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            initials
                          )}
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
                            {player.last_name}, {player.first_name}
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
                            DNI {player.dni || '—'}
                            {player.birth_date
                              ? ` · ${new Date(player.birth_date).toLocaleDateString('es-AR')}`
                              : ''}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {deletingId === player.id ? (
                          <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(player.id);
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
                              onClick={() => {
                                setEditingPlayer(player);
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
                              onClick={() => setDeletingId(player.id)}
                              style={{ ...iconBtn, width: 30, height: 30, color: '#787772' }}
                              title="Eliminar"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subfila contacto en móvil (si tiene) */}
                    {(player.phone || player.email) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          paddingLeft: 48,
                          fontSize: 11.5,
                          color: '#787772',
                        }}
                      >
                        {player.phone && <span>{player.phone}</span>}
                        {player.phone && player.email && <span>·</span>}
                        {player.email && <span>{player.email}</span>}
                      </div>
                    )}
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
                    <th style={{ padding: '10px 20px' }}>Jugador</th>
                    <th style={{ padding: '10px 14px' }}>DNI</th>
                    <th style={{ padding: '10px 14px' }}>Contacto</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((player, idx) => {
                    const avatar = AVATAR_BANNERS[idx % AVATAR_BANNERS.length];
                    const initials =
                      `${(player.last_name || '')[0] || ''}${(player.first_name || '')[0] || ''}`.toUpperCase() ||
                      'J';

                    return (
                      <tr
                        key={player.id}
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
                                background: player.photo ? '#faf9f6' : avatar.bg,
                                color: avatar.stroke,
                                border: player.photo ? '1px solid #e5e4df' : 'none',
                                fontSize: 11.5,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {player.photo ? (
                                <img
                                  src={player.photo}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                initials
                              )}
                            </div>

                            <div>
                              <strong style={{ fontSize: 13.5, fontWeight: 600, color: '#141413' }}>
                                {player.last_name}, {player.first_name}
                              </strong>
                              {player.birth_date && (
                                <div style={{ fontSize: 11.5, color: '#787772' }}>
                                  {new Date(player.birth_date).toLocaleDateString('es-AR')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#52514e',
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {player.dni || '—'}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {player.phone || player.email ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {player.phone && (
                                <span style={{ fontSize: 12.5, color: '#52514e' }}>
                                  {player.phone}
                                </span>
                              )}
                              {player.email && (
                                <span style={{ fontSize: 11.5, color: '#787772' }}>
                                  {player.email}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#a1a09a', fontSize: 12 }}>—</span>
                          )}
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
                            {deletingId === player.id ? (
                              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    marginRight: 2,
                                  }}
                                >
                                  ¿Eliminar?
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(player.id);
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
                                  onClick={() => {
                                    setEditingPlayer(player);
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
                                  onClick={() => setDeletingId(player.id)}
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

export default JugadoresView;
