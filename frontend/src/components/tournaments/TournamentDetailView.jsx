import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Trophy, Users, Edit, Check, X, Calendar, Clock, Plus, Trash2, Shield, 
  AlertTriangle, MoreVertical, FileSpreadsheet, FileText, MapPin, UserCheck 
} from 'lucide-react';
import api from '../../api';
import TeamForm from '../teams/TeamForm';

const TABS = [
  { id: 'principal', label: 'Principal' },
  { id: 'fixture', label: 'Fixture' },
  { id: 'buena_fe', label: 'Lista de Buena Fe' },
];

export default function TournamentDetailView({ tournament, onBack }) {
  const [activeTab, setActiveTab] = useState('principal');
  const [detailedTournament, setDetailedTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState(null); // { message: string, type: 'success' | 'error' }
  const [alertExiting, setAlertExiting] = useState(false);
  const [customConfirm, setCustomConfirm] = useState(null); // { message: string, onConfirm: () => void }
  const [confirmExiting, setConfirmExiting] = useState(false);

  const triggerCloseAlert = () => {
    setAlertExiting(true);
    setTimeout(() => {
      setCustomAlert(null);
      setAlertExiting(false);
    }, 300);
  };

  const triggerCloseConfirm = (confirmed) => {
    setConfirmExiting(true);
    setTimeout(() => {
      if (confirmed && customConfirm?.onConfirm) {
        customConfirm.onConfirm();
      }
      setCustomConfirm(null);
      setConfirmExiting(false);
    }, 300);
  };

  useEffect(() => {
    if (!customAlert) return;
    const timer = setTimeout(() => {
      triggerCloseAlert();
    }, 3000);
    return () => clearTimeout(timer);
  }, [customAlert]);
  
  // Good Faith list states
  const [selectedBuenaFeTeamId, setSelectedBuenaFeTeamId] = useState('');
  const [buenaFePlayers, setBuenaFePlayers] = useState([]);
  const [loadingBuenaFe, setLoadingBuenaFe] = useState(false);
  const [allPlayersCatalog, setAllPlayersCatalog] = useState([]);
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState('');
  const [shirtNumberToAdd, setShirtNumberToAdd] = useState('');
  
  // Team editing modal state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Fixture states
  const [activeZoneId, setActiveZoneId] = useState('');
  const [fixturesByZone, setFixturesByZone] = useState({});
  const [fixtureMode, setFixtureMode] = useState('ida'); // 'ida' or 'ida_vuelta'

  // Dropdown menu state
  const [openDropdownRoundId, setOpenDropdownRoundId] = useState(null);

  // Edit round modal state
  const [showEditRoundModal, setShowEditRoundModal] = useState(false);
  const [editRoundRoundId, setEditRoundRoundId] = useState(null);
  const [editRoundName, setEditRoundName] = useState('');
  const [editRoundDate, setEditRoundDate] = useState('');
  const [editRoundTime, setEditRoundTime] = useState('');

  // New match modal state
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [newMatchRoundId, setNewMatchRoundId] = useState(null);
  const [newMatchLocal, setNewMatchLocal] = useState('');
  const [newMatchVisitor, setNewMatchVisitor] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');
  const [newMatchCancha, setNewMatchCancha] = useState('');
  const [newMatchZone, setNewMatchZone] = useState('cruce');

  // Edit match modal state
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [editMatchId, setEditMatchId] = useState(null);
  const [editMatchLocal, setEditMatchLocal] = useState('');
  const [editMatchVisitor, setEditMatchVisitor] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editMatchTime, setEditMatchTime] = useState('');
  const [editMatchCancha, setEditMatchCancha] = useState('');
  const [editMatchZone, setEditMatchZone] = useState('cruce');

  // Match Dropdown menu state
  const [openDropdownMatchId, setOpenDropdownMatchId] = useState(null);

  const fetchTournamentDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`tournaments/${tournament.id}/`);
      setDetailedTournament(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetail();
  }, [tournament.id]);

  // Set default active zone when detailedTournament is loaded
  useEffect(() => {
    if (detailedTournament?.zones?.length > 0 && !activeZoneId) {
      setActiveZoneId(detailedTournament.zones[0].id);
    }
  }, [detailedTournament, activeZoneId]);

  // Fetch fixtures for active zone
  const fetchFixturesForZone = async (zoneId) => {
    if (!zoneId) return;
    try {
      const res = await api.get(`match-rounds/?tournament_zone=${zoneId}`);
      setFixturesByZone(prev => ({ ...prev, [zoneId]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'fixture' && activeZoneId) {
      fetchFixturesForZone(activeZoneId);
    }
  }, [activeTab, activeZoneId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownRoundId(null);
      setOpenDropdownMatchId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleEditTeamClick = async (teamId) => {
    try {
      setLoadingTeam(true);
      const res = await api.get(`teams/${teamId}/`);
      setSelectedTeam(res.data);
      setShowTeamForm(true);
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: 'Error al cargar la información del equipo.', type: 'error' });
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleDeleteTeamClick = async (zt) => {
    setCustomConfirm({
      message: `¿Estás seguro de que deseas eliminar a ${zt.team_name} de este torneo?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.delete(`zone-teams/${zt.id}/`);
          setCustomAlert({ message: "Equipo eliminado del torneo con éxito.", type: "success" });
          await fetchTournamentDetail();
        } catch (e) {
          console.error(e);
          let errorMsg = "Hubo un error al eliminar el equipo del torneo.";
          if (e.response?.data) {
            if (typeof e.response.data === 'string') {
              errorMsg = e.response.data;
            } else if (e.response.data.detail) {
              errorMsg = e.response.data.detail;
            } else if (Array.isArray(e.response.data)) {
              errorMsg = e.response.data[0];
            } else if (typeof e.response.data === 'object') {
              const firstKey = Object.keys(e.response.data)[0];
              const val = e.response.data[firstKey];
              errorMsg = Array.isArray(val) ? val[0] : val;
            }
          }
          setCustomAlert({ message: errorMsg, type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Round-Robin Fixture Generator Algorithm (Berger Tables)
  const generateRoundRobin = (teams, doubleRound = false) => {
    let list = [...teams];
    if (list.length % 2 !== 0) {
      list.push({ id: null, name: "LIBRE" }); // Dummy/Bye team
    }
    const numTeams = list.length;
    const rounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const resultRounds = [];

    for (let round = 0; round < rounds; round++) {
      const roundMatches = [];
      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (numTeams - 1);
        let away = (numTeams - 1 - match + round) % (numTeams - 1);
        if (match === 0) {
          away = numTeams - 1;
        }
        
        const local = list[home];
        const visitor = list[away];
        
        // Exclude dummy team matches (they indicate a LIBRE team)
        if (local.id !== null && visitor.id !== null) {
          // Alternate home/away to balance matches
          if (round % 2 === 0) {
            roundMatches.push({ local, visitor });
          } else {
            roundMatches.push({ local: visitor, visitor: local });
          }
        }
      }
      resultRounds.push({
        name: `Fecha ${round + 1}`,
        order: round + 1,
        matches: roundMatches
      });
    }

    if (doubleRound) {
      const secondHalf = resultRounds.map((r, index) => {
        const roundNum = rounds + index + 1;
        return {
          name: `Fecha ${roundNum}`,
          order: roundNum,
          matches: r.matches.map(m => ({ local: m.visitor, visitor: m.local }))
        };
      });
      return [...resultRounds, ...secondHalf];
    }

    return resultRounds;
  };

  const handleGenerateFixture = async (zoneId) => {
    const zone = detailedTournament?.zones?.find(z => z.id === zoneId);
    if (!zone || !zone.zone_teams || zone.zone_teams.length < 2) {
      alert("Se necesitan al menos 2 equipos asignados a esta zona para generar el fixture.");
      return;
    }

    const teams = zone.zone_teams.map(zt => ({
      id: zt.team,
      name: zt.team_name,
    }));

    const rounds = generateRoundRobin(teams, fixtureMode === 'ida_vuelta');

    try {
      setLoading(true);
      for (const r of rounds) {
        await api.post('match-rounds/', {
          tournament_zone: zoneId,
          name: r.name,
          order: r.order,
          matches: r.matches.map(m => ({
            local_team: m.local.id,
            visitor_team: m.visitor.id,
            played: false,
            impact_zone: zoneId
          }))
        });
      }
      alert("¡Fixture generado con éxito!");
      await fetchFixturesForZone(zoneId);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar el fixture en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFixture = async (zoneId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar el fixture de esta zona? Se perderán todas las fechas y partidos creados.")) {
      return;
    }
    try {
      setLoading(true);
      const rounds = fixturesByZone[zoneId] || [];
      for (const r of rounds) {
        await api.delete(`match-rounds/${r.id}/`);
      }
      alert("Fixture eliminado correctamente.");
      await fetchFixturesForZone(zoneId);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al eliminar el fixture.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new empty round manually
  const handleCreateNewRound = async () => {
    try {
      setLoading(true);
      const nextOrder = (fixturesByZone[activeZoneId] || []).length + 1;
      await api.post('match-rounds/', {
        tournament_zone: activeZoneId,
        name: `Fecha ${nextOrder}`,
        order: nextOrder,
        matches: []
      });
      alert(`Jornada 'Fecha ${nextOrder}' creada con éxito.`);
      await fetchFixturesForZone(activeZoneId);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al crear la nueva fecha.");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Round Modal
  const openEditRoundModal = (r) => {
    setEditRoundRoundId(r.id);
    setEditRoundName(r.name);
    setEditRoundDate(r.date || '');
    setEditRoundTime(r.time || '');
    setShowEditRoundModal(true);
  };

  const handleUpdateRound = async (roundId) => {
    if (!editRoundName.trim()) {
      alert("El nombre de la fecha no puede estar vacío.");
      return;
    }
    try {
      setLoading(true);
      await api.patch(`match-rounds/${roundId}/`, {
        name: editRoundName,
        date: editRoundDate || null,
        time: editRoundTime || null
      });
      alert("Fecha actualizada correctamente.");
      await fetchFixturesForZone(activeZoneId);
    } catch (e) {
      console.error(e);
      alert("Error al actualizar los datos de la fecha.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRound = async (roundId) => {
    setCustomConfirm({
      message: "¿Estás seguro de que deseas eliminar esta fecha por completo? Se perderán todos sus partidos programados.",
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.delete(`match-rounds/${roundId}/`);
          setCustomAlert({ message: "Fecha eliminada correctamente.", type: "success" });
          await fetchFixturesForZone(activeZoneId);
        } catch (e) {
          console.error(e);
          setCustomAlert({ message: "Hubo un error al eliminar la fecha.", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Open New Match Modal
  const openNewMatchModal = (r) => {
    setNewMatchRoundId(r.id);
    setNewMatchLocal('');
    setNewMatchVisitor('');
    setNewMatchDate(r.date || '');
    setNewMatchTime(r.time || '');
    setNewMatchCancha('');
    setNewMatchZone(activeZoneId);
    setShowNewMatchModal(true);
  };

  const handleCreateNewMatch = async (matchData) => {
    try {
      setLoading(true);
      await api.post('matches/', {
        match_round: newMatchRoundId,
        local_team: matchData.local_team,
        visitor_team: matchData.visitor_team,
        date: matchData.date || null,
        time: matchData.time || null,
        cancha: matchData.cancha || null,
        impact_zone: matchData.impact_zone || null,
        played: false
      });
      alert("Partido programado con éxito.");
      await fetchFixturesForZone(activeZoneId);
      setShowNewMatchModal(false);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar el partido.");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Match Modal
  const openEditMatchModal = (m) => {
    setEditMatchId(m.id);
    setEditMatchLocal(m.local_team ? String(m.local_team) : '');
    setEditMatchVisitor(m.visitor_team ? String(m.visitor_team) : '');
    setEditMatchDate(m.date || '');
    setEditMatchTime(m.time ? m.time.slice(0, 5) : '');
    setEditMatchCancha(m.cancha || '');
    setEditMatchZone(m.impact_zone ? String(m.impact_zone) : 'cruce');
    setShowEditMatchModal(true);
  };

  const handleUpdateMatch = async () => {
    if (!editMatchLocal || !editMatchVisitor) {
      alert("Debe seleccionar ambos equipos.");
      return;
    }
    if (editMatchLocal === editMatchVisitor) {
      alert("El equipo local y visitante no pueden ser el mismo.");
      return;
    }
    try {
      setLoading(true);
      await api.patch(`matches/${editMatchId}/`, {
        local_team: editMatchLocal,
        visitor_team: editMatchVisitor,
        date: editMatchDate || null,
        time: editMatchTime || null,
        cancha: editMatchCancha || null,
        impact_zone: editMatchZone === 'cruce' ? null : editMatchZone
      });
      alert("Partido actualizado con éxito.");
      await fetchFixturesForZone(activeZoneId);
      setShowEditMatchModal(false);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar los cambios del partido.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    setCustomConfirm({
      message: "¿Estás seguro de que deseas eliminar este partido?",
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.delete(`matches/${matchId}/`);
          setCustomAlert({ message: "Partido de fixture eliminado.", type: "success" });
          await fetchFixturesForZone(activeZoneId);
        } catch (e) {
          console.error(e);
          setCustomAlert({ message: "Hubo un error al eliminar el partido.", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Helper to dynamically calculate which team is libre in a round
  const getLibreTeam = (zoneTeams, roundMatches) => {
    if (!zoneTeams || zoneTeams.length % 2 === 0) return null;
    const playingTeamIds = new Set();
    roundMatches.forEach(m => {
      playingTeamIds.add(m.local_team);
      playingTeamIds.add(m.visitor_team);
    });
    const libreZoneTeam = zoneTeams.find(zt => !playingTeamIds.has(zt.team));
    return libreZoneTeam ? libreZoneTeam.team_name : null;
  };

  const currentZone = detailedTournament?.zones?.find(z => z.id === activeZoneId);
  const activeZoneFixtures = fixturesByZone[activeZoneId] || [];

  // Gather all teams in the tournament for manual match assignment
  const allTeams = detailedTournament?.zones?.flatMap(z => 
    z.zone_teams?.map(zt => ({ id: zt.team, name: zt.team_name })) || []
  ) || [];

  // Deduplicate teams participating in the tournament
  const tournamentTeams = [];
  const seenTeamIds = new Set();
  allTeams.forEach(t => {
    if (!seenTeamIds.has(t.id)) {
      seenTeamIds.add(t.id);
      tournamentTeams.push(t);
    }
  });

  // Set default team for buena_fe when tab becomes active
  useEffect(() => {
    if (activeTab === 'buena_fe' && tournamentTeams.length > 0 && !selectedBuenaFeTeamId) {
      setSelectedBuenaFeTeamId(String(tournamentTeams[0].id));
    }
  }, [activeTab, tournamentTeams]);

  // Fetch the roster (lista de buena fe)
  const fetchBuenaFePlayers = async () => {
    if (!selectedBuenaFeTeamId || !detailedTournament) return;
    try {
      setLoadingBuenaFe(true);
      const res = await api.get(`good-faith-lists/?tournament=${detailedTournament.id}&team=${selectedBuenaFeTeamId}`);
      setBuenaFePlayers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBuenaFe(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'buena_fe' && selectedBuenaFeTeamId) {
      fetchBuenaFePlayers();
    }
  }, [activeTab, selectedBuenaFeTeamId]);

  // Fetch players from global database for search
  useEffect(() => {
    const fetchPlayersCatalog = async () => {
      if (activeTab !== 'buena_fe') return;
      try {
        const res = await api.get(`players/?search=${searchPlayerQuery}`);
        setAllPlayersCatalog(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPlayersCatalog();
  }, [activeTab, searchPlayerQuery]);

  const handleAddPlayerToRoster = async (e) => {
    e.preventDefault();
    if (!selectedPlayerToAdd) {
      alert("Seleccioná un jugador.");
      return;
    }
    const limit = detailedTournament.max_players_buena_fe;
    if (buenaFePlayers.length >= limit) {
      alert(`No se pueden agregar más jugadores. El límite de la lista de buena fe para este torneo es de ${limit} jugadores.`);
      return;
    }
    try {
      setLoadingBuenaFe(true);
      await api.post('good-faith-lists/', {
        tournament: detailedTournament.id,
        team: selectedBuenaFeTeamId,
        player: selectedPlayerToAdd,
        shirt_number: shirtNumberToAdd ? parseInt(shirtNumberToAdd) : null
      });
      alert("Jugador incorporado con éxito a la lista de buena fe.");
      setSelectedPlayerToAdd('');
      setShirtNumberToAdd('');
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

  const handleRemovePlayerFromRoster = async (rosterId) => {
    setCustomConfirm({
      message: "¿Estás seguro de quitar a este jugador de la lista de buena fe para este torneo?",
      onConfirm: async () => {
        try {
          setLoadingBuenaFe(true);
          await api.delete(`good-faith-lists/${rosterId}/`);
          setCustomAlert({ message: "Jugador removido de la lista de buena fe.", type: "success" });
          fetchBuenaFePlayers();
        } catch (err) {
          console.error(err);
          setCustomAlert({ message: "Error al remover al jugador.", type: "error" });
        } finally {
          setLoadingBuenaFe(false);
        }
      }
    });
  };

  const dropdownStyles = {
    position: 'absolute',
    top: '42px',
    right: '12px',
    zIndex: 100,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 0',
    backdropFilter: 'blur(10px)'
  };

  const dropdownItemStyles = {
    background: 'none',
    border: 'none',
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.2s',
    height: '38px',
    justifyContent: 'flex-start'
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <button
          onClick={onBack}
          className="secondary"
          style={{
            minWidth: 'auto',
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
          title="Volver a la lista"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={22} color="#1a1512" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '24px', margin: 0, fontWeight: '800' }}>
              {tournament.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>
              Categoría: <span className="badge" style={{ verticalAlign: 'middle' }}>{tournament.category_name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--brand-beige)' : 'transparent',
              color: activeTab === tab.id ? '#1a1512' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-beige)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              padding: '8px 20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-1px',
              flexShrink: 0
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ paddingBottom: activeTab === 'fixture' && activeZoneFixtures.length > 0 ? '80px' : '0px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando detalles...</div>
        ) : !detailedTournament ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontró información para este torneo.</div>
        ) : (
          <div>
            
            {/* PRINCIPAL TAB (ZONE TABLES) */}
            {activeTab === 'principal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {detailedTournament.zones?.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Este torneo no tiene zonas configuradas.</p>
                  </div>
                ) : (
                  detailedTournament.zones.map((zone) => {
                    const sortedZoneTeams = zone.zone_teams?.length
                      ? [...zone.zone_teams].sort((a, b) => a.team_name.localeCompare(b.team_name))
                      : [];

                    return (
                      <div key={zone.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'var(--brand-beige)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '900',
                            color: '#1a1512'
                          }}>
                            {zone.order + 1}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {zone.name}
                          </h3>
                        </div>

                        {sortedZoneTeams.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No hay equipos asignados a esta zona.
                          </div>
                        ) : (
                          <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                              <thead>
                                <tr>
                                  <th className="hide-on-mobile" style={{ width: '80px' }}>Escudo</th>
                                  <th>Nombre</th>
                                  <th className="hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>PJ</th>
                                  <th className="hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>PG</th>
                                  <th className="hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>PE</th>
                                  <th className="hide-on-mobile" style={{ width: '60px', textAlign: 'center' }}>PP</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>+/-</th>
                                  <th className="hide-on-mobile" style={{ width: '40px', textAlign: 'center' }} title="Tarjetas Rojas">
                                    <span style={{ display: 'inline-block', width: '10px', height: '14px', background: '#ef4444', borderRadius: '2px' }} />
                                  </th>
                                  <th className="hide-on-mobile" style={{ width: '40px', textAlign: 'center' }} title="Tarjetas Amarillas">
                                    <span style={{ display: 'inline-block', width: '10px', height: '14px', background: '#facc15', borderRadius: '2px' }} />
                                  </th>
                                  <th className="hide-on-mobile" style={{ width: '50px', textAlign: 'center' }}>IND</th>
                                  <th className="hide-on-mobile" style={{ width: '50px', textAlign: 'center' }}>FP</th>
                                  <th style={{ width: '80px', textAlign: 'center' }}>Puntos</th>
                                  <th style={{ width: '80px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedZoneTeams.map((zt) => {
                                  const diff = zt.goals_for - zt.goals_against;
                                  const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

                                  return (
                                    <tr key={zt.id}>
                                      <td className="hide-on-mobile">
                                        <div style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '8px',
                                          background: 'var(--brand-beige-subtle)',
                                          overflow: 'hidden',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}>
                                          {zt.team_logo ? (
                                            <img src={zt.team_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                          ) : (
                                            <Users size={18} color="var(--brand-beige)" />
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          onClick={() => handleEditTeamClick(zt.team)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            font: 'inherit',
                                            cursor: 'pointer',
                                            color: 'var(--brand-beige)',
                                            fontWeight: '700',
                                            textAlign: 'left',
                                            outline: 'none',
                                            transition: 'color 0.15s'
                                          }}
                                          className="team-link-hover"
                                        >
                                          {zt.team_name}
                                        </button>
                                      </td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.played}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.won}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.drawn}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.lost}</td>
                                      <td style={{ textAlign: 'center', color: diff >= 0 ? '#81c784' : '#e57373', fontWeight: '700', fontSize: '13px' }}>
                                        {diffStr}
                                      </td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.red_cards || 0}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.yellow_cards || 0}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.indumentaria || 0}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.fair_play || 0}</td>
                                      <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                                        {zt.points}
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleEditTeamClick(zt.team)}
                                            className="secondary"
                                            style={{
                                              minWidth: 'auto',
                                              height: '34px',
                                              width: '34px',
                                              padding: 0,
                                              borderRadius: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            }}
                                            title="Editar equipo"
                                          >
                                            <Edit size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTeamClick(zt)}
                                            className="secondary"
                                            style={{
                                              minWidth: 'auto',
                                              height: '34px',
                                              width: '34px',
                                              padding: 0,
                                              borderRadius: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: '#e57373'
                                            }}
                                            title="Eliminar equipo del torneo"
                                          >
                                            <Trash2 size={14} />
                                          </button>
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
                    );
                  })
                )}

              </div>
            )}

            {/* FIXTURE TAB */}
            {activeTab === 'fixture' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Zone Navigation Tabs */}
                {detailedTournament.zones?.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                    {detailedTournament.zones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setActiveZoneId(zone.id)}
                        className={activeZoneId === zone.id ? "" : "secondary"}
                        style={{
                          borderRadius: '20px',
                          padding: '6px 16px',
                          fontSize: '0.8rem',
                          height: '32px',
                          flexShrink: 0
                        }}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Fixture content for selected zone */}
                {activeZoneId && (
                  <div>
                    {activeZoneFixtures.length === 0 ? (
                      /* NO FIXTURE CREATED YET */
                      <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '30px',
                          background: 'rgba(212, 184, 150, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <Calendar size={28} color="var(--brand-beige)" />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Sin Fixture Creado</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', maxWidth: '400px' }}>
                            Todavía no se ha generado el fixture para la <strong>{currentZone?.name}</strong>. Selecciona el tipo de fixture y créalo a continuación.
                          </p>
                        </div>

                        {currentZone?.zone_teams?.length < 2 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(220, 100, 50, 0.1)', color: '#ffd54f', border: '1px solid rgba(220, 100, 50, 0.3)', padding: '12px 20px', borderRadius: '10px', fontSize: '13px' }}>
                            <AlertTriangle size={16} />
                            Se necesitan al menos 2 equipos en esta zona para poder generar el fixture.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '360px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                            <div className="input-group" style={{ textAlign: 'left' }}>
                              <label>Tipo de Fixture</label>
                              <select 
                                value={fixtureMode} 
                                onChange={(e) => setFixtureMode(e.target.value)}
                                style={{ background: 'var(--input-bg)', border: '1px solid var(--border-strong)' }}
                              >
                                <option value="ida">Solo IDA</option>
                                <option value="ida_vuelta">IDA y VUELTA</option>
                              </select>
                            </div>
                            <button
                              onClick={() => handleGenerateFixture(activeZoneId)}
                              style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                            >
                              <Plus size={16} /> Generar Fixture
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* FIXTURE EXISTS: DISPLAY STACKED CARDS */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Control Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
                            Fixture de {currentZone?.name} ({activeZoneFixtures.length} Fechas)
                          </h3>
                          <button
                            onClick={() => handleDeleteFixture(activeZoneId)}
                            className="danger"
                            style={{ height: '32px', fontSize: '0.75rem', padding: '0 12px', borderRadius: '8px' }}
                          >
                            <Trash2 size={12} /> Eliminar Fixture Completo
                          </button>
                        </div>

                        {/* Stacked Fechas Cards (matches stacked vertically exactly like Photo 1) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          {activeZoneFixtures.map((r) => {
                            const libreTeam = getLibreTeam(currentZone?.zone_teams, r.matches);
                            
                            return (
                              <div 
                                key={r.id} 
                                className="glass-card" 
                                style={{ 
                                  padding: 0, 
                                  overflow: 'visible', // Keep overflow visible so dropdown is not clipped
                                  border: '1px solid var(--border-medium)',
                                  borderRadius: '20px',
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                                }}
                              >
                                
                                {/* Card Header (Black bar with MoreVertical button) */}
                                <div style={{
                                  background: '#13110c',
                                  borderBottom: '1px solid var(--border-subtle)',
                                  padding: '12px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  borderRadius: '20px 20px 0 0'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{ fontWeight: '800', letterSpacing: '1.5px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                                      {r.name}
                                    </span>
                                    {r.date && (
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                        📅 {r.date.split('-').reverse().join('/')} {r.time ? `• ⏰ ${r.time.slice(0, 5)} hs` : ''}
                                      </span>
                                    )}
                                  </div>

                                  {/* Kebab/More Options Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownRoundId(openDropdownRoundId === r.id ? null : r.id);
                                    }}
                                    style={{
                                      position: 'absolute',
                                      right: '12px',
                                      background: 'none',
                                      border: 'none',
                                      padding: '6px',
                                      color: 'var(--brand-beige)',
                                      cursor: 'pointer',
                                      minWidth: 'auto',
                                      height: 'auto',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '50%'
                                    }}
                                    className="secondary"
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {/* Dropdown Menu (exactly matching options requested) */}
                                  {openDropdownRoundId === r.id && (
                                    <div style={dropdownStyles} onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          openEditRoundModal(r);
                                        }}
                                        className="team-link-hover"
                                      >
                                        <Edit size={14} color="var(--brand-beige)" />
                                        Editar información
                                      </button>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          openNewMatchModal(r);
                                        }}
                                        className="team-link-hover"
                                      >
                                        <Plus size={14} color="var(--brand-beige)" />
                                        Nuevo partido
                                      </button>
                                      <button 
                                        style={{ ...dropdownItemStyles, color: '#e57373' }} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          handleDeleteRound(r.id);
                                        }}
                                        className="team-link-hover"
                                      >
                                        <Trash2 size={14} color="#e57373" />
                                        Eliminar fecha
                                      </button>
                                      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          alert("Generando planillas en Excel... (Funcionalidad en desarrollo)");
                                        }}
                                        className="team-link-hover"
                                      >
                                        <FileSpreadsheet size={14} color="var(--text-muted)" />
                                        Generar planillas en excel
                                      </button>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          alert("Generando planillas en PDF... (Funcionalidad en desarrollo)");
                                        }}
                                        className="team-link-hover"
                                      >
                                        <FileText size={14} color="var(--text-muted)" />
                                        Generar planillas en pdf
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Card Body (Stacked matches) */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {r.matches?.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                      No hay partidos programados en esta fecha.
                                    </div>
                                  ) : (
                                    r.matches.map((m) => (
                                      <div 
                                        key={m.id} 
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '14px 44px 14px 16px',
                                          borderBottom: '1px solid rgba(212, 184, 150, 0.05)',
                                          background: 'rgba(0,0,0,0.08)',
                                          position: 'relative'
                                        }}
                                      >
                                        {/* Local Team */}
                                        <div style={{ 
                                          flex: '1 1 0', 
                                          textAlign: 'right', 
                                          fontWeight: '700', 
                                          fontSize: '0.88rem', 
                                          color: 'var(--text-primary)', 
                                          paddingRight: '16px', 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis', 
                                          whiteSpace: 'nowrap' 
                                        }}>
                                          {m.local_team_name}
                                        </div>

                                        {/* Center Score / VS / Cancha info */}
                                        <div style={{ 
                                          flex: '0 0 140px', 
                                          display: 'flex', 
                                          flexDirection: 'column', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          textAlign: 'center'
                                        }}>
                                          <span style={{ 
                                            fontSize: '8px', 
                                            fontWeight: '800', 
                                            color: 'var(--text-muted)', 
                                            letterSpacing: '0.8px', 
                                            textTransform: 'uppercase' 
                                          }}>
                                            {m.played ? 'FINALIZADO' : 'PROGRAMADO'}
                                          </span>
                                          <div style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '900', 
                                            color: 'var(--brand-beige)', 
                                            marginTop: '3px', 
                                            letterSpacing: m.played ? '12px' : 'normal', 
                                            paddingLeft: m.played ? '12px' : '0' 
                                          }}>
                                            {m.played ? `${m.local_score} ${m.visitor_score}` : 'VS'}
                                          </div>
                                          
                                          {/* court & specific match time */}
                                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px', justifyContent: 'center' }}>
                                            {m.time && !m.played && (
                                              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                <Clock size={8} /> {m.time.slice(0, 5)}
                                              </span>
                                            )}
                                            {m.cancha && (
                                              <span style={{ 
                                                fontSize: '9px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                color: 'var(--text-muted)', 
                                                border: '1px solid var(--border-subtle)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '2px'
                                              }}>
                                                <MapPin size={8} /> {m.cancha}
                                              </span>
                                            )}
                                            {m.impact_zone && (
                                              <span style={{ 
                                                fontSize: '8px', 
                                                background: 'var(--brand-beige-subtle)', 
                                                color: 'var(--brand-beige)', 
                                                border: '1px solid rgba(212,184,150,0.12)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px' 
                                              }}>
                                                Impacta: {m.impact_zone_name}
                                              </span>
                                            )}
                                            {m.impact_zone === null && (
                                              <span style={{ 
                                                fontSize: '8px', 
                                                background: 'rgba(239, 83, 80, 0.08)', 
                                                color: '#e57373', 
                                                border: '1px solid rgba(239, 83, 80, 0.15)', 
                                                padding: '1px 5px', 
                                                borderRadius: '4px' 
                                              }}>
                                                CRUCE
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Visitor Team */}
                                        <div style={{ 
                                          flex: '1 1 0', 
                                          textAlign: 'left', 
                                          fontWeight: '700', 
                                          fontSize: '0.88rem', 
                                          color: 'var(--text-primary)', 
                                          paddingLeft: '16px', 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis', 
                                          whiteSpace: 'nowrap' 
                                        }}>
                                          {m.visitor_team_name}
                                        </div>

                                        {/* Kebab button and Dropdown for Match */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownMatchId(openDropdownMatchId === m.id ? null : m.id);
                                          }}
                                          style={{
                                            position: 'absolute',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            padding: '6px',
                                            color: 'var(--brand-beige)',
                                            cursor: 'pointer',
                                            minWidth: 'auto',
                                            height: 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%'
                                          }}
                                          className="secondary"
                                        >
                                          <MoreVertical size={16} />
                                        </button>

                                        {openDropdownMatchId === m.id && (
                                          <div 
                                            style={{
                                              position: 'absolute',
                                              top: '42px',
                                              right: '12px',
                                              zIndex: 100,
                                              background: 'var(--bg-elevated)',
                                              border: '1px solid var(--border-medium)',
                                              borderRadius: '12px',
                                              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                              minWidth: '200px',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              padding: '6px 0',
                                              backdropFilter: 'blur(10px)'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <button 
                                              style={dropdownItemStyles} 
                                              onClick={() => {
                                                setOpenDropdownMatchId(null);
                                                openEditMatchModal(m);
                                              }}
                                              className="team-link-hover"
                                            >
                                              <Edit size={14} color="var(--brand-beige)" />
                                              Editar Partido
                                            </button>
                                            <button 
                                              style={dropdownItemStyles} 
                                              onClick={() => {
                                                setOpenDropdownMatchId(null);
                                                alert("Cargar Planilla se programará luego.");
                                              }}
                                              className="team-link-hover"
                                            >
                                              <Plus size={14} color="var(--brand-beige)" />
                                              Cargar Planilla
                                            </button>
                                            <button 
                                              style={dropdownItemStyles} 
                                              onClick={() => {
                                                setOpenDropdownMatchId(null);
                                                alert("Cargar Resultado se programará luego.");
                                              }}
                                              className="team-link-hover"
                                            >
                                              <Check size={14} color="var(--brand-beige)" />
                                              Cargar Resultado
                                            </button>
                                            <button 
                                              style={dropdownItemStyles} 
                                              onClick={() => {
                                                setOpenDropdownMatchId(null);
                                                alert("Generar Planilla se programará luego.");
                                              }}
                                              className="team-link-hover"
                                            >
                                              <FileText size={14} color="var(--brand-beige)" />
                                              Generar Planilla
                                            </button>
                                            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                                            <button 
                                              style={{ ...dropdownItemStyles, color: '#e57373' }} 
                                              onClick={() => {
                                                setOpenDropdownMatchId(null);
                                                handleDeleteMatch(m.id);
                                              }}
                                              className="team-link-hover"
                                            >
                                              <Trash2 size={14} color="#e57373" />
                                              Eliminar Partido
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                  
                                  {/* Libre team block inside Fecha card if present */}
                                  {libreTeam && (
                                    <div style={{
                                      background: 'rgba(212, 184, 150, 0.03)',
                                      borderTop: '1px solid rgba(212, 184, 150, 0.05)',
                                      padding: '10px 16px',
                                      fontSize: '0.82rem',
                                      color: 'var(--brand-beige)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '8px',
                                      borderRadius: '0 0 20px 20px'
                                    }}>
                                      <Shield size={14} />
                                      <span>Equipo Libre de la Jornada: <strong>{libreTeam}</strong></span>
                                    </div>
                                  )}
                                </div>

                              </div>
                            );
                          })}
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'buena_fe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Listas de Buena Fe</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Equipo:</label>
                      <select 
                        value={selectedBuenaFeTeamId} 
                        onChange={(e) => setSelectedBuenaFeTeamId(e.target.value)}
                        style={{ height: '36px', minWidth: '200px', background: 'var(--input-bg)', border: '1px solid var(--border-strong)', borderRadius: '8px' }}
                      >
                        <option value="" disabled>Selecciona un equipo...</option>
                        {tournamentTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {tournamentTeams.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay equipos asignados a las zonas de este torneo para gestionar sus listas.
                    </div>
                  ) : !selectedBuenaFeTeamId ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Selecciona un equipo de la lista superior.
                    </div>
                  ) : (
                    <div>
                      {/* Counter & Limit info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '12px 20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          Límite de Jugadores: <span style={{ color: 'var(--brand-beige)' }}>{buenaFePlayers.length}</span> / {detailedTournament.max_players_buena_fe}
                        </div>
                        {buenaFePlayers.length >= detailedTournament.max_players_buena_fe && (
                          <span style={{ fontSize: '11px', color: '#ffb300', fontWeight: 'bold', background: 'rgba(255, 179, 0, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                            Cupo lleno
                          </span>
                        )}
                      </div>

                      {/* Add Player Form (hidden if full) */}
                      {buenaFePlayers.length < detailedTournament.max_players_buena_fe ? (
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
                          Has alcanzado la cantidad máxima de {detailedTournament.max_players_buena_fe} jugadores en este torneo. Remueve un jugador para poder añadir otro.
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
                              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay jugadores inscritos en la lista de buena fe de este equipo.</td></tr>
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
        )}
      </div>

      {/* FLOATING ACTION BUTTON (exactly like mockup green circle with Plus) */}
      {activeTab === 'fixture' && activeZoneFixtures.length > 0 && (
        <button
          onClick={handleCreateNewRound}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: '#0f766e',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(15, 118, 110, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s ease',
            outline: 'none'
          }}
          className="floating-plus-btn"
          title="Agregar Nueva Fecha"
        >
          <Plus size={28} />
        </button>
      )}

      {/* EDIT ROUND MODAL */}
      {showEditRoundModal && (
        <div className="premium-modal-overlay" onClick={() => setShowEditRoundModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '460px', padding: '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(212,184,150,0.15), rgba(212,184,150,0.05))',
                  border: '1px solid rgba(212,184,150,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Calendar size={16} color="var(--brand-beige)" />
                </div>
                <div>
                  <h3>Editar Información de la Fecha</h3>
                  <p>Modificá el nombre, fecha y horario general</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditRoundModal(false)}>
                <X size={14} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label>Nombre de la Fecha</label>
                <input 
                  type="text" 
                  value={editRoundName} 
                  onChange={(e) => setEditRoundName(e.target.value)} 
                  placeholder="Ej: Fecha 1, Semifinal..."
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Fecha (dd/mm/aaaa)</label>
                  <input 
                    type="date" 
                    value={editRoundDate} 
                    onChange={(e) => setEditRoundDate(e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>Hora de Inicio</label>
                  <input 
                    type="time" 
                    value={editRoundTime} 
                    onChange={(e) => setEditRoundTime(e.target.value)} 
                  />
                </div>
              </div>
              <div style={{
                background: 'rgba(212,184,150,0.04)', border: '1px solid rgba(212,184,150,0.08)',
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5'
              }}>
                💡 Si configurás una hora general, todos los partidos de esta fecha usarán ese horario por defecto.
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="secondary" onClick={() => setShowEditRoundModal(false)}>Cancelar</button>
              <button onClick={() => {
                handleUpdateRound(editRoundRoundId);
                setShowEditRoundModal(false);
              }}>
                <Check size={14} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MATCH MODAL */}
      {showNewMatchModal && (
        <div className="premium-modal-overlay" onClick={() => setShowNewMatchModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '520px', padding: '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(129,199,132,0.15), rgba(129,199,132,0.05))',
                  border: '1px solid rgba(129,199,132,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Plus size={16} color="#81c784" />
                </div>
                <div>
                  <h3>Nuevo Partido</h3>
                  <p>Agregá un partido a esta fecha del fixture</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNewMatchModal(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* VS Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo Local</label>
                  <select 
                    value={newMatchLocal} 
                    onChange={(e) => setNewMatchLocal(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {allTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{
                  padding: '0 6px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--brand-beige)',
                  fontWeight: '900',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  marginTop: '18px'
                }}>VS</div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo Visitante</label>
                  <select 
                    value={newMatchVisitor} 
                    onChange={(e) => setNewMatchVisitor(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {allTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time & Cancha row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Fecha</label>
                  <input type="date" value={newMatchDate} onChange={(e) => setNewMatchDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Hora</label>
                  <input type="time" value={newMatchTime} onChange={(e) => setNewMatchTime(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Cancha</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cancha 1" 
                    value={newMatchCancha} 
                    onChange={(e) => setNewMatchCancha(e.target.value)} 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Impacto del resultado en zona</label>
                <select 
                  value={newMatchZone} 
                  onChange={(e) => setNewMatchZone(e.target.value)}
                >
                  <option value="cruce">Cruce — No impacta en ninguna zona</option>
                  {detailedTournament?.zones?.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="secondary" onClick={() => setShowNewMatchModal(false)}>Cancelar</button>
              <button onClick={() => {
                if (!newMatchLocal || !newMatchVisitor) {
                  alert("Debe seleccionar ambos equipos.");
                  return;
                }
                if (newMatchLocal === newMatchVisitor) {
                  alert("El equipo local y visitante no pueden ser el mismo.");
                  return;
                }
                handleCreateNewMatch({
                  local_team: newMatchLocal,
                  visitor_team: newMatchVisitor,
                  date: newMatchDate || null,
                  time: newMatchTime || null,
                  cancha: newMatchCancha || null,
                  impact_zone: newMatchZone === 'cruce' ? null : newMatchZone
                });
              }}>
                <Check size={14} /> Agregar Partido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MATCH MODAL */}
      {showEditMatchModal && (
        <div className="premium-modal-overlay" onClick={() => setShowEditMatchModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '520px', padding: '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(129,199,132,0.15), rgba(129,199,132,0.05))',
                  border: '1px solid rgba(129,199,132,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Edit size={16} color="#81c784" />
                </div>
                <div>
                  <h3>Editar Partido</h3>
                  <p>Modificá los datos del partido programado</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditMatchModal(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* VS Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo Local</label>
                  <select 
                    value={editMatchLocal} 
                    onChange={(e) => setEditMatchLocal(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {allTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{
                  padding: '0 6px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--brand-beige)',
                  fontWeight: '900',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  marginTop: '18px'
                }}>VS</div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo Visitante</label>
                  <select 
                    value={editMatchVisitor} 
                    onChange={(e) => setEditMatchVisitor(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {allTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time & Cancha row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Fecha</label>
                  <input type="date" value={editMatchDate} onChange={(e) => setEditMatchDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Hora</label>
                  <input type="time" value={editMatchTime} onChange={(e) => setEditMatchTime(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Cancha</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cancha 1" 
                    value={editMatchCancha} 
                    onChange={(e) => setEditMatchCancha(e.target.value)} 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Impacto del resultado en zona</label>
                <select 
                  value={editMatchZone} 
                  onChange={(e) => setEditMatchZone(e.target.value)}
                >
                  <option value="cruce">Cruce — No impacta en ninguna zona</option>
                  {detailedTournament?.zones?.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="secondary" onClick={() => setShowEditMatchModal(false)}>Cancelar</button>
              <button onClick={() => {
                handleUpdateMatch();
              }}>
                <Check size={14} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {showTeamForm && selectedTeam && (
        <div className="premium-modal-overlay" onClick={() => setShowTeamForm(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '620px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <TeamForm
              team={selectedTeam}
              onClose={() => setShowTeamForm(false)}
              onSuccess={() => {
                setShowTeamForm(false);
                fetchTournamentDetail();
              }}
            />
          </div>
        </div>
      )}

      {/* Global loading overlay for team fetching */}
      {loadingTeam && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 3001
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e1b16, #161310)',
            border: '1px solid rgba(212,184,150,0.2)',
            borderRadius: '16px',
            padding: '20px 36px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--brand-beige)',
            fontWeight: '700',
            fontSize: '14px'
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid rgba(212,184,150,0.3)',
              borderTopColor: 'var(--brand-beige)',
              animation: 'spin 0.7s linear infinite'
            }} />
            Cargando datos del equipo...
          </div>
        </div>
      )}
      {/* Custom alert notification banner */}
      {customAlert && (
        <div 
          className="custom-alert-container"
          style={{
            position: 'fixed',
            top: alertExiting ? '-80px' : '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(26, 21, 18, 0.95)',
            border: customAlert.type === 'error' ? '1px solid #e57373' : '1px solid var(--brand-beige)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
            maxWidth: '480px',
            backdropFilter: 'blur(8px)',
            opacity: alertExiting ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {customAlert.type === 'error' ? (
            <AlertTriangle size={20} color="#e57373" style={{ flexShrink: 0 }} />
          ) : (
            <Check size={20} color="var(--brand-beige)" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: '600', flexGrow: 1 }}>
            {customAlert.message}
          </span>
          <button
            onClick={triggerCloseAlert}
            style={{
              background: customAlert.type === 'error' ? '#e57373' : 'var(--brand-beige)',
              color: '#1a1512',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              outline: 'none',
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            OK
          </button>
        </div>
      )}

      {/* Custom confirmation banner with blocking backdrop overlay */}
      {customConfirm && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 9998,
              animation: 'fade-in 0.2s ease-out'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <div 
            className="custom-confirm-container"
            style={{
              position: 'fixed',
              top: confirmExiting ? '-120px' : '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: 'rgba(26, 21, 18, 0.98)',
              border: '1px solid var(--brand-beige)',
              borderRadius: '16px',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minWidth: '340px',
              maxWidth: '500px',
              backdropFilter: 'blur(10px)',
              opacity: confirmExiting ? 0 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <AlertTriangle size={22} color="var(--brand-beige)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: '700', lineHeight: '1.4' }}>
                {customConfirm.message}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => triggerCloseConfirm(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancelar
              </button>
              <button
                onClick={() => triggerCloseConfirm(true)}
                style={{
                  background: 'var(--brand-beige)',
                  color: '#1a1512',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Aceptar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
