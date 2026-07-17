import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, UserCheck, Trash2, Edit, Eye, Mail, Phone, Calendar, X } from 'lucide-react';
import PlayerFormModal from './PlayerFormModal';

const JugadoresView = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedDniImage, setSelectedDniImage] = useState(null); // to show full DNI in modal overlay

  useEffect(() => {
    fetchPlayers();
  }, [search]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`players/?search=${search}`);
      setPlayers(response.data);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`players/${id}/`);
      fetchPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="anthropic-theme players-container animate-fade-in">
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="anthropic-title" style={{ margin: 0 }}>
            {showForm ? (editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador') : 'Jugadores'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm ? 'Completa la información del jugador para la base de datos' : 'Base de datos central y documentación de todos los jugadores'}
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
            onClick={() => { setEditingPlayer(null); setShowForm(true); }}
            style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
          >
            <Plus size={18} /> Nuevo Jugador
          </button>
        )}
      </div>

      {showForm && (
        <PlayerFormModal 
          player={editingPlayer} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchPlayers();
          }} 
        />
      )}

      {/* Content Section — hidden while form is open */}
      {!showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Toolbar */}
          <div className="search-filter-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar jugador por nombre, apellido o DNI..." 
                style={{ paddingLeft: '42px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>DNI</th>
                  <th>Contacto</th>
                  <th>Documentación</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                ) : players.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay jugadores registrados</td></tr>
                ) : (
                  players.map((player) => (
                    <tr key={player.id} className="table-row-hover">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            background: '#f4efe6', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#cc7a5c',
                            overflow: 'hidden',
                            border: '1px solid #e6dfd3'
                          }}>
                            {player.photo ? (
                              <img src={player.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <UserCheck size={20} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                              {player.last_name}, {player.first_name}
                            </div>
                            {player.birth_date && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Calendar size={12} /> {new Date(player.birth_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                        {player.dni}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {player.phone && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {player.phone}
                            </span>
                          )}
                          {player.email && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {player.email}
                            </span>
                          )}
                          {!player.phone && !player.email && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {player.dni_front ? (
                            <button 
                              type="button" 
                              onClick={() => setSelectedDniImage(player.dni_front)}
                              className="secondary" 
                              style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', fontSize: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={10} /> Frente DNI
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '3px 6px', borderRadius: '6px' }}>Sin Frente</span>
                          )}
                          {player.dni_back ? (
                            <button 
                              type="button" 
                              onClick={() => setSelectedDniImage(player.dni_back)}
                              className="secondary" 
                              style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', fontSize: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={10} /> Dorso DNI
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '3px 6px', borderRadius: '6px' }}>Sin Dorso</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {deletingId === player.id ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                              <span style={{ fontSize: '10px', color: '#cc7a5c', fontWeight: 'bold', marginRight: '4px' }}>¿Eliminar?</span>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(player.id); }} 
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
                                onClick={() => { setEditingPlayer(player); setShowForm(true); }} 
                                className="secondary icon-only" 
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setDeletingId(player.id)} 
                                className="danger icon-only" 
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

      {/* DNI Image Modal overlay */}
      {selectedDniImage && (
        <div 
          onClick={() => setSelectedDniImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img src={selectedDniImage} alt="DNI" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', border: '2px solid var(--border-subtle)', borderRadius: '12px' }} />
            <div style={{ color: '#fff', textAlign: 'center', marginTop: '12px', fontSize: '14px', fontWeight: 'bold' }}>Hacé click en cualquier lugar para cerrar</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JugadoresView;
