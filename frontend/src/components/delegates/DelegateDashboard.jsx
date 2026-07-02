import React, { useState, useEffect } from 'react';
import { Trophy, Users, Plus, Trash2, UserCheck, AlertTriangle } from 'lucide-react';
import api from '../../api';

export default function DelegateDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [activeTournament, setActiveTournament] = useState(null);
  
  // Good faith list state
  const [buenaFePlayers, setBuenaFePlayers] = useState([]);
  const [loadingBuenaFe, setLoadingBuenaFe] = useState(false);
  const [allPlayersCatalog, setAllPlayersCatalog] = useState([]);
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState('');

  // 1. Fetch tournaments where delegate's team participates
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const res = await api.get('tournaments/');
        // Filter tournaments where the user's team is in any zone
        const teamTournaments = res.data.filter(t => 
          t.zones?.some(z => z.zone_teams?.some(zt => zt.team === user.team_id))
        );
        setTournaments(teamTournaments);
        
        if (teamTournaments.length > 0) {
          // Select the first/latest tournament by default
          setSelectedTournamentId(String(teamTournaments[0].id));
          setActiveTournament(teamTournaments[0]);
        }
      } catch (e) {
        console.error("Error fetching tournaments:", e);
      } finally {
        setLoading(false);
      }
    };

    if (user?.team_id) {
      fetchTournaments();
    } else {
      setLoading(false);
    }
  }, [user?.team_id]);

  // Update activeTournament object when dropdown selection changes
  useEffect(() => {
    if (selectedTournamentId) {
      const selected = tournaments.find(t => String(t.id) === selectedTournamentId);
      setActiveTournament(selected || null);
    } else {
      setActiveTournament(null);
    }
  }, [selectedTournamentId, tournaments]);

  // 2. Fetch roster (lista de buena fe) for selected team and tournament
  const fetchBuenaFePlayers = async () => {
    if (!selectedTournamentId || !user?.team_id) return;
    try {
      setLoadingBuenaFe(true);
      const res = await api.get(`good-faith-lists/?tournament=${selectedTournamentId}&team=${user.team_id}`);
      setBuenaFePlayers(res.data);
    } catch (e) {
      console.error("Error fetching Buena Fe players:", e);
    } finally {
      setLoadingBuenaFe(false);
    }
  };

  useEffect(() => {
    fetchBuenaFePlayers();
  }, [selectedTournamentId, user?.team_id]);

  // 3. Fetch global players catalog based on search query
  useEffect(() => {
    const fetchPlayersCatalog = async () => {
      if (!selectedTournamentId) return;
      try {
        const res = await api.get(`players/?search=${searchPlayerQuery}`);
        setAllPlayersCatalog(res.data);
      } catch (e) {
        console.error("Error fetching players catalog:", e);
      }
    };

    // Simple debounce to avoid spamming requests
    const delayDebounce = setTimeout(() => {
      fetchPlayersCatalog();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchPlayerQuery, selectedTournamentId]);

  // 4. Add player to roster
  const handleAddPlayerToRoster = async (e) => {
    e.preventDefault();
    if (!selectedPlayerToAdd) {
      alert("Seleccioná un jugador.");
      return;
    }
    
    const limit = activeTournament?.max_players_buena_fe || 25;
    if (buenaFePlayers.length >= limit) {
      alert(`No se pueden agregar más jugadores. El límite de la lista de buena fe para este torneo es de ${limit} jugadores.`);
      return;
    }

    try {
      setLoadingBuenaFe(true);
      await api.post('good-faith-lists/', {
        tournament: activeTournament.id,
        team: user.team_id,
        player: selectedPlayerToAdd,
        shirt_number: null // Shirt number is omitted as per instruction
      });
      alert("Jugador incorporado con éxito a la lista de buena fe.");
      setSelectedPlayerToAdd('');
      fetchBuenaFePlayers();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.player) {
        alert(Array.isArray(err.response.data.player) ? err.response.data.player[0] : err.response.data.player);
      } else if (err.response?.data?.non_field_errors) {
        alert("El jugador ya está inscrito en la lista de buena fe de este equipo.");
      } else {
        alert("Error al inscribir al jugador.");
      }
    } finally {
      setLoadingBuenaFe(false);
    }
  };

  // 5. Remove player from roster
  const handleRemovePlayerFromRoster = async (rosterId) => {
    if (!window.confirm("¿Estás seguro de quitar a este jugador de la lista de buena fe para este torneo?")) {
      return;
    }
    try {
      setLoadingBuenaFe(true);
      await api.delete(`good-faith-lists/${rosterId}/`);
      alert("Jugador removido de la lista de buena fe.");
      fetchBuenaFePlayers();
    } catch (err) {
      console.error(err);
      alert("Error al remover al jugador.");
    } finally {
      setLoadingBuenaFe(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando información del equipo y torneos...
      </div>
    );
  }

  if (!user?.team_id) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Sin equipo asignado</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Tu cuenta de delegado no tiene ningún equipo asignado actualmente. Por favor, contactá al administrador para que vincule tu usuario a tu equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>
          Dashboard de Delegado
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Bienvenido, <strong>{user.first_name} {user.last_name}</strong>. Administrá la lista de buena fe de tu equipo: <strong>{user.team_name}</strong>.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Tu equipo no está inscrito en ningún torneo activo actualmente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Tournament selection and active info */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trophy size={20} color="#1a1512" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Torneo Activo</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                    {activeTournament?.name} {activeTournament ? `(Categoría: ${activeTournament.category_name})` : ''}
                  </p>
                </div>
              </div>

              {tournaments.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Cambiar Torneo:</label>
                  <select
                    value={selectedTournamentId}
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                    style={{ height: '36px', minWidth: '200px', background: 'var(--input-bg)', border: '1px solid var(--border-strong)', borderRadius: '8px' }}
                  >
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeTournament && (
              <div>
                {/* Counter & Limit info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '12px 20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Límite de Jugadores: <span style={{ color: 'var(--brand-beige)' }}>{buenaFePlayers.length}</span> / {activeTournament.max_players_buena_fe}
                  </div>
                  {buenaFePlayers.length >= activeTournament.max_players_buena_fe && (
                    <span style={{ fontSize: '11px', color: '#ffb300', fontWeight: 'bold', background: 'rgba(255, 179, 0, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                      Cupo lleno
                    </span>
                  )}
                </div>

                {/* Add Player Form */}
                {buenaFePlayers.length < activeTournament.max_players_buena_fe ? (
                  <form onSubmit={handleAddPlayerToRoster} style={{ display: 'grid', gridTemplateColumns: '2fr 120px', gap: '15px', alignItems: 'end', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Buscar y seleccionar Jugador *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Escribe para buscar..."
                          value={searchPlayerQuery}
                          onChange={(e) => setSearchPlayerQuery(e.target.value)}
                          style={{ height: '36px', width: '130px', fontSize: '12px', padding: '6px' }}
                        />
                        <select
                          required
                          value={selectedPlayerToAdd}
                          onChange={(e) => setSelectedPlayerToAdd(e.target.value)}
                          style={{ height: '36px', flex: 1, fontSize: '13px' }}
                        >
                          <option value="">-- Elegir jugador --</option>
                          {allPlayersCatalog.map(p => (
                            <option key={p.id} value={p.id}>{p.last_name}, {p.first_name} (DNI: {p.dni})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingBuenaFe}
                      style={{ height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <Plus size={14} /> Inscribir
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', color: '#ffb300', fontSize: '13px', background: 'rgba(255,179,0,0.05)', border: '1px solid rgba(255,179,0,0.15)', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                    Has alcanzado la cantidad máxima de {activeTournament.max_players_buena_fe} jugadores en este torneo. Remové un jugador para poder añadir otro.
                  </div>
                )}

                {/* Roster Table */}
                <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Nombre del Jugador</th>
                        <th>DNI</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBuenaFe ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando lista...</td></tr>
                      ) : buenaFePlayers.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay jugadores inscritos en tu lista de buena fe para este torneo.</td></tr>
                      ) : (
                        buenaFePlayers.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '6px', overflow: 'hidden', background: 'var(--brand-beige-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {record.player_photo ? (
                                    <img src={record.player_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <UserCheck size={14} color="var(--brand-beige)" />
                                  )}
                                </div>
                                <span style={{ fontWeight: '600' }}>{record.player_name}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{record.player_dni}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleRemovePlayerFromRoster(record.id)}
                                className="danger"
                                style={{ padding: '6px', minWidth: 'auto', height: 'auto', borderRadius: '8px' }}
                                title="Quitar jugador"
                              >
                                <Trash2 size={14} />
                              </button>
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
        </div>
      )}
    </div>
  );
}
