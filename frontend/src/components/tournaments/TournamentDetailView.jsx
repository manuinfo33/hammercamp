import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Trophy, Users, Edit, Check, X, Calendar, Clock, Plus, Trash2, Shield, 
  AlertTriangle, MoreVertical, FileSpreadsheet, FileText, MapPin, UserCheck, UserPlus,
  User, Menu, LogOut
} from 'lucide-react';
import api from '../../api';
import { createPortal } from 'react-dom';
import TeamForm from '../teams/TeamForm';
import PlayerFormModal from '../players/PlayerFormModal';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'principal', label: 'Principal' },
  { id: 'fixture', label: 'Fixture' },
  { id: 'buena_fe', label: 'Lista de Buena Fe' },
];

export default function TournamentDetailView({ tournament, onBack }) {
  const { user, logout } = useAuth();
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileRoster, setMobileRoster] = useState([]);

  // Fixture states
  const [activeZoneId, setActiveZoneId] = useState('');
  const [fixturesByZone, setFixturesByZone] = useState({});
  const [fixtureMode, setFixtureMode] = useState('ida'); // 'ida' or 'ida_vuelta'

  // Dropdown menu state
  const [openDropdownRoundId, setOpenDropdownRoundId] = useState(null);
  const [openDropdownZoneId, setOpenDropdownZoneId] = useState(null);
  const [importTeamZoneId, setImportTeamZoneId] = useState(null);
  const [allSystemTeams, setAllSystemTeams] = useState([]);
  const [importSearchQuery, setImportSearchQuery] = useState('');

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

  // Close dropdowns on outside click and handle resize
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownRoundId(null);
      setOpenDropdownMatchId(null);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
    document.body.classList.add('in-tournament-detail');
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('in-tournament-detail');
    };
  }, []);

  const reloadMobileRoster = async (teamId) => {
    try {
      setLoadingTeam(true);
      const playersRes = await api.get('players/');
      const gfRes = await api.get(`good-faith-lists/?tournament=${detailedTournament.id}&team=${teamId}`);
      const gfMap = {};
      gfRes.data.forEach(r => {
        gfMap[r.player] = r.id;
      });
      const roster = playersRes.data.map(p => ({
        player: p,
        isLbf: !!gfMap[p.id],
        recordId: gfMap[p.id] || null
      }));
      setMobileRoster(roster);
    } catch (e) {
      console.error("Error reloading roster:", e);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleEditTeamClick = async (teamId) => {
    try {
      setLoadingTeam(true);
      const res = await api.get(`teams/${teamId}/`);
      setSelectedTeam(res.data);
      if (window.innerWidth <= 768) {
        const playersRes = await api.get('players/');
        const gfRes = await api.get(`good-faith-lists/?tournament=${detailedTournament.id}&team=${teamId}`);
        const gfMap = {};
        gfRes.data.forEach(r => {
          gfMap[r.player] = r.id;
        });
        const roster = playersRes.data.map(p => ({
          player: p,
          isLbf: !!gfMap[p.id],
          recordId: gfMap[p.id] || null
        }));
        setMobileRoster(roster);
      }
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

  const handleEditZoneClick = async (zone) => {
    const newName = window.prompt("Modificar nombre de la zona:", zone.name);
    if (!newName || newName.trim() === "" || newName === zone.name) return;
    try {
      setLoading(true);
      await api.patch(`zones/${zone.id}/`, { name: newName.trim() });
      setCustomAlert({ message: "Nombre de zona actualizado con éxito.", type: "success" });
      await fetchTournamentDetail();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Error al actualizar la zona.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTeamClick = async (zoneId) => {
    const teamName = window.prompt("Nombre del nuevo equipo:");
    if (!teamName || teamName.trim() === "") return;
    try {
      setLoading(true);
      // 1. Create team
      const resTeam = await api.post('teams/', { name: teamName.trim() });
      const newTeamId = resTeam.data.id;
      // 2. Add to zone
      await api.post('zone-teams/', [{ zone: zoneId, team: newTeamId }]);
      setCustomAlert({ message: "Equipo creado y agregado a la zona con éxito.", type: "success" });
      await fetchTournamentDetail();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Error al crear el equipo.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openImportTeamModal = async (zoneId) => {
    try {
      setLoading(true);
      const res = await api.get('teams/');
      setAllSystemTeams(res.data);
      setImportTeamZoneId(zoneId);
      setImportSearchQuery('');
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Error al cargar el listado de equipos.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImportTeam = async (teamId) => {
    try {
      setLoading(true);
      await api.post('zone-teams/', [{ zone: importTeamZoneId, team: teamId }]);
      setCustomAlert({ message: "Equipo importado con éxito.", type: "success" });
      setImportTeamZoneId(null);
      await fetchTournamentDetail();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Error al importar el equipo.", type: "error" });
    } finally {
      setLoading(false);
    }
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
    background: '#ffffff',
    border: '1px solid #d8cfc0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(25, 20, 15, 0.08)',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 0',
  };

  const dropdownItemStyles = {
    background: 'none',
    border: 'none',
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#383530',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.15s ease, color 0.15s ease',
    height: '38px',
    justifyContent: 'flex-start'
  };

  if (showTeamForm && selectedTeam) {
    if (!isMobile) {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }} className="anthropic-theme tournaments-container animate-fade-in">
          <div className="glass-card" style={{ padding: '24px 28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e6dfd3' }}>
            <TeamForm
              team={selectedTeam}
              onClose={() => {
                setShowTeamForm(false);
                setSelectedTeam(null);
              }}
              onSuccess={() => {
                setShowTeamForm(false);
                setSelectedTeam(null);
                fetchTournamentDetail();
              }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <MobileTeamEditor
          team={selectedTeam}
          onClose={() => {
            setShowTeamForm(false);
            setSelectedTeam(null);
          }}
          onSuccess={() => {
            setShowTeamForm(false);
            setSelectedTeam(null);
            fetchTournamentDetail();
          }}
          tournamentId={detailedTournament?.id}
          mobileRoster={mobileRoster}
          setMobileRoster={setMobileRoster}
          reloadMobileRoster={reloadMobileRoster}
          handleDeleteTeamClick={handleDeleteTeamClick}
          detailedTournament={detailedTournament}
        />
      );
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="anthropic-theme tournaments-container animate-fade-in">
      
      {/* Header Card with Back Button & Category Badge */}
      <div className="glass-card hide-on-mobile" style={{
        padding: '24px 28px',
        marginBottom: '24px',
        background: '#ffffff',
        border: '1px solid #e6dfd3',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(25, 20, 15, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Top bar: Back Button & Category Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={onBack}
            className="secondary"
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Volver a la lista de torneos"
          >
            <ArrowLeft size={16} /> Volver a Torneos
          </button>

          {tournament.category_name && (
            <span style={{
              background: '#fbf5f2',
              color: '#cc7a5c',
              border: '1px solid #e5c5bb',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.3px'
            }}>
              Categoría: {tournament.category_name}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="anthropic-title" style={{ fontSize: '28px', margin: 0, fontWeight: '800', color: '#191919', letterSpacing: '-0.5px' }}>
            {tournament.name}
          </h1>
          <p style={{ color: '#7f776f', fontSize: '13px', margin: '4px 0 0' }}>
            Gestión de fixture, tabla de posiciones y lista de buena fe
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="hide-on-mobile" style={{
        display: 'flex',
        gap: '8px',
        background: '#eae4d8',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid #d8cfc0',
        marginBottom: '28px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="tournament-tab-btn"
              style={{
                background: isActive ? '#cc7a5c' : 'transparent',
                color: isActive ? '#ffffff' : '#383530',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                boxShadow: isActive ? '0 4px 12px rgba(204, 122, 92, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ paddingBottom: isMobile ? '80px' : (activeTab === 'fixture' && activeZoneFixtures.length > 0 ? '80px' : '0px') }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', position: 'relative' }}>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {zone.name}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownZoneId(openDropdownZoneId === zone.id ? null : zone.id);
                            }}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              background: 'none',
                              border: 'none',
                              padding: '4px',
                              color: '#7f776f',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              minWidth: 'auto',
                              height: 'auto'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown for Zone Actions */}
                          {openDropdownZoneId === zone.id && (
                            <div style={{ ...dropdownStyles, top: '35px', right: '16px', zIndex: 100 }} onClick={(e) => e.stopPropagation()}>
                              <button 
                                style={dropdownItemStyles} 
                                onClick={() => {
                                  setOpenDropdownZoneId(null);
                                  handleEditZoneClick(zone);
                                }}
                                className="premium-dropdown-item"
                              >
                                <Edit size={14} color="#cc7a5c" />
                                Editar Zona
                              </button>
                              <button 
                                style={dropdownItemStyles} 
                                onClick={() => {
                                  setOpenDropdownZoneId(null);
                                  handleNewTeamClick(zone.id);
                                }}
                                className="premium-dropdown-item"
                              >
                                <Plus size={14} color="#cc7a5c" />
                                Nuevo Equipo
                              </button>
                              <button 
                                style={dropdownItemStyles} 
                                onClick={() => {
                                  setOpenDropdownZoneId(null);
                                  openImportTeamModal(zone.id);
                                }}
                                className="premium-dropdown-item"
                              >
                                <Users size={14} color="#cc7a5c" />
                                Importar Equipo
                              </button>
                            </div>
                          )}
                        </div>

                        {sortedZoneTeams.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No hay equipos asignados a esta zona.
                          </div>
                        ) : (
                          <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
                            <table className="responsive-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th>Equipo</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>PS</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>PJ</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>PG</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>PE</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>PP</th>
                                  <th style={{ width: '60px', textAlign: 'center' }}>+/-</th>
                                  <th style={{ width: '40px', textAlign: 'center' }} title="Tarjetas Rojas">
                                    <span style={{ display: 'inline-block', width: '10px', height: '14px', background: '#ef4444', borderRadius: '2px' }} />
                                  </th>
                                  <th style={{ width: '40px', textAlign: 'center' }} title="Tarjetas Amarillas">
                                    <span style={{ display: 'inline-block', width: '10px', height: '14px', background: '#facc15', borderRadius: '2px' }} />
                                  </th>
                                  <th style={{ width: '50px', textAlign: 'center' }}>IND</th>
                                  <th style={{ width: '50px', textAlign: 'center' }}>FP</th>
                                  <th className="hide-on-mobile" style={{ width: '80px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedZoneTeams.map((zt) => {
                                  const diff = zt.goals_for - zt.goals_against;
                                  const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

                                  return (
                                    <tr key={zt.id}>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            background: 'var(--brand-beige-subtle)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                          }}>
                                            {zt.team_logo ? (
                                              <img src={zt.team_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                              <Users size={16} color="var(--brand-beige)" />
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleEditTeamClick(zt.team)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              padding: 0,
                                              font: 'inherit',
                                              cursor: 'pointer',
                                              color: '#191919',
                                              fontWeight: 'normal',
                                              textAlign: 'left',
                                              outline: 'none',
                                              transition: 'color 0.15s'
                                            }}
                                            className="team-link-hover"
                                          >
                                            {zt.team_name}
                                          </button>
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                                        {zt.points}
                                      </td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.played}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.won}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.drawn}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.lost}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {diffStr}
                                      </td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.red_cards || 0}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.yellow_cards || 0}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.indumentaria || 0}</td>
                                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{zt.fair_play || 0}</td>
                                      <td className="hide-on-mobile" style={{ textAlign: 'right' }}>
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
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          gap: '16px', 
                          background: '#ffffff', 
                          padding: '18px 24px', 
                          borderRadius: '16px', 
                          border: '1px solid #e6dfd3', 
                          boxShadow: '0 2px 10px rgba(25, 20, 15, 0.03)',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#191919' }}>
                              Fixture de {currentZone?.name}
                            </h3>
                            <span style={{ fontSize: '12px', color: '#7f776f', marginTop: '2px', display: 'block' }}>
                              {activeZoneFixtures.length} Fechas programadas
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteFixture(activeZoneId)}
                            className="danger"
                            style={{ height: '36px', fontSize: '0.8rem', padding: '0 16px', borderRadius: '10px' }}
                          >
                            <Trash2 size={14} /> Eliminar Fixture Completo
                          </button>
                        </div>

                        {/* Stacked Fechas Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          {activeZoneFixtures.map((r) => {
                            const libreTeam = getLibreTeam(currentZone?.zone_teams, r.matches);
                            
                            return (
                              <div 
                                key={r.id} 
                                className="fecha-card" 
                                style={{ 
                                  padding: 0, 
                                  overflow: 'visible',
                                  border: '1px solid #e6dfd3',
                                  borderRadius: '16px',
                                  boxShadow: '0 4px 20px rgba(25, 20, 15, 0.04)',
                                  background: '#ffffff'
                                }}
                              >
                                
                                {/* Card Header (Warm thematic header) */}
                                <div style={{
                                  background: '#eae4d8',
                                  borderBottom: '1px solid #d8cfc0',
                                  padding: '12px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  borderRadius: '16px 16px 0 0'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{ fontWeight: '800', letterSpacing: '1.5px', fontSize: '14px', textTransform: 'uppercase', color: '#191919' }}>
                                      {r.name}
                                    </span>
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
                                      right: '16px',
                                      background: 'none',
                                      border: 'none',
                                      padding: '6px',
                                      color: '#7f776f',
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

                                  {/* Dropdown Menu for Round */}
                                  {openDropdownRoundId === r.id && (
                                    <div style={dropdownStyles} onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          openEditRoundModal(r);
                                        }}
                                        className="premium-dropdown-item"
                                      >
                                        <Edit size={14} color="#cc7a5c" />
                                        Editar información
                                      </button>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          openNewMatchModal(r);
                                        }}
                                        className="premium-dropdown-item"
                                      >
                                        <Plus size={14} color="#cc7a5c" />
                                        Nuevo partido
                                      </button>
                                      <button 
                                        style={{ ...dropdownItemStyles, color: '#d9534f' }} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          handleDeleteRound(r.id);
                                        }}
                                        className="premium-dropdown-item"
                                      >
                                        <Trash2 size={14} color="#d9534f" />
                                        Eliminar fecha
                                      </button>
                                      <div style={{ height: '1px', background: '#e6dfd3', margin: '4px 0' }} />
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          alert("Generando planillas en Excel... (Funcionalidad en desarrollo)");
                                        }}
                                        className="premium-dropdown-item"
                                      >
                                        <FileSpreadsheet size={14} color="#7f776f" />
                                        Generar planillas en excel
                                      </button>
                                      <button 
                                        style={dropdownItemStyles} 
                                        onClick={() => {
                                          setOpenDropdownRoundId(null);
                                          alert("Generando planillas en PDF... (Funcionalidad en desarrollo)");
                                        }}
                                        className="premium-dropdown-item"
                                      >
                                        <FileText size={14} color="#7f776f" />
                                        Generar planillas en pdf
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Card Body (Stacked matches) */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '0 0 16px 16px', overflow: 'visible' }}>
                                  {r.matches?.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#7f776f', fontSize: '13px' }}>
                                      No hay partidos programados en esta fecha.
                                    </div>
                                  ) : (
                                    r.matches.map((m, index) => {
                                      const isLast = index === r.matches.length - 1 && !libreTeam;
                                      return (
                                        <div 
                                          key={m.id} 
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 16px',
                                            borderBottom: isLast ? 'none' : '1px solid #f0eae1',
                                            background: index % 2 === 0 ? '#fcfbfa' : '#ffffff',
                                            position: 'relative',
                                            minHeight: '42px',
                                            borderRadius: isLast ? '0 0 16px 16px' : '0'
                                          }}
                                        >
                                          {/* Local Team */}
                                          <div style={{ 
                                            flex: '1 1 0', 
                                            textAlign: 'right', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            color: '#191919', 
                                            paddingRight: '10px',
                                            wordBreak: 'break-word',
                                            lineHeight: '1.25'
                                          }}>
                                            {m.local_team_name}
                                          </div>

                                          {/* Center Column: Handles all 3 states (Image 1, Image 2, Image 3) */}
                                          <div style={{ 
                                            flex: '0 0 100px', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            gap: '2px',
                                            userSelect: 'none'
                                          }}>
                                            {m.played ? (
                                              /* IMAGEN 3: Partido Finalizado (FINALIZADO + Marcador, sin fecha ni hora) */
                                              <>
                                                <span style={{ 
                                                  fontSize: '8px', 
                                                  fontWeight: '800', 
                                                  color: '#191919', 
                                                  letterSpacing: '0.8px', 
                                                  textTransform: 'uppercase' 
                                                }}>
                                                  FINALIZADO
                                                </span>
                                                <div style={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'center',
                                                  gap: '18px',
                                                  fontSize: '15px', 
                                                  fontWeight: '800', 
                                                  color: '#191919', 
                                                  marginTop: '1px'
                                                }}>
                                                  <span>{m.local_score ?? 0}</span>
                                                  <span>{m.visitor_score ?? 0}</span>
                                                </div>
                                              </>
                                            ) : (m.date || m.time) ? (
                                              /* IMAGEN 2: Partido Programado con Fecha y Horario (sin cancha) */
                                              <>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#191919' }}>
                                                  {m.date ? m.date.split('-').reverse().slice(0, 2).join('/') : ''}
                                                </span>
                                                <span style={{ fontSize: '10px', fontWeight: '600', color: '#7f776f' }}>
                                                  {m.time ? `${m.time.slice(0, 5)} Hs` : ''}
                                                </span>
                                              </>
                                            ) : (
                                              /* IMAGEN 1: Partido Sin Carga (-  -) */
                                              <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                gap: '20px',
                                                fontSize: '15px', 
                                                fontWeight: '700', 
                                                color: '#8c827a' 
                                              }}>
                                                <span>-</span>
                                                <span>-</span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Visitor Team */}
                                          <div style={{ 
                                            flex: '1 1 0', 
                                            textAlign: 'left', 
                                            fontWeight: '700', 
                                            fontSize: '0.85rem', 
                                            color: '#191919', 
                                            paddingLeft: '10px', 
                                            paddingRight: '32px', 
                                            wordBreak: 'break-word',
                                            lineHeight: '1.25'
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
                                              right: '16px',
                                              top: '50%',
                                              transform: 'translateY(-50%)',
                                              background: 'none',
                                              border: 'none',
                                              padding: '4px',
                                              color: '#7f776f',
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
                                               style={dropdownStyles}
                                               onClick={(e) => e.stopPropagation()}
                                             >
                                               <button 
                                                 style={dropdownItemStyles} 
                                                 onClick={() => {
                                                   setOpenDropdownMatchId(null);
                                                   openEditMatchModal(m);
                                                 }}
                                                 className="premium-dropdown-item"
                                               >
                                                 <Edit size={14} color="#cc7a5c" />
                                                 Editar Partido
                                               </button>
                                               <button 
                                                 style={dropdownItemStyles} 
                                                 onClick={() => {
                                                   setOpenDropdownMatchId(null);
                                                   alert("Cargar Planilla se programará luego.");
                                                 }}
                                                 className="premium-dropdown-item"
                                               >
                                                 <Plus size={14} color="#cc7a5c" />
                                                 Cargar Planilla
                                               </button>
                                               <button 
                                                 style={dropdownItemStyles} 
                                                 onClick={() => {
                                                   setOpenDropdownMatchId(null);
                                                   alert("Cargar Resultado se programará luego.");
                                                 }}
                                                 className="premium-dropdown-item"
                                               >
                                                 <Check size={14} color="#cc7a5c" />
                                                 Cargar Resultado
                                               </button>
                                               <button 
                                                 style={dropdownItemStyles} 
                                                 onClick={() => {
                                                   setOpenDropdownMatchId(null);
                                                   alert("Generar Planilla se programará luego.");
                                                 }}
                                                 className="premium-dropdown-item"
                                               >
                                                 <FileText size={14} color="#cc7a5c" />
                                                 Generar Planilla
                                               </button>
                                               <div style={{ height: '1px', background: '#e6dfd3', margin: '4px 0' }} />
                                               <button 
                                                 style={{ ...dropdownItemStyles, color: '#d9534f' }} 
                                                 onClick={() => {
                                                   setOpenDropdownMatchId(null);
                                                   handleDeleteMatch(m.id);
                                                 }}
                                                 className="premium-dropdown-item"
                                               >
                                                 <Trash2 size={14} color="#d9534f" />
                                                 Eliminar Partido
                                               </button>
                                             </div>
                                           )}
                                        </div>
                                      );
                                    })
                                  )}
                                  
                                  {/* Libre team block inside Fecha card if present */}
                                  {libreTeam && (
                                    <div style={{
                                      background: '#fbf5f2',
                                      borderTop: '1px solid #e6dfd3',
                                      padding: '10px 16px',
                                      fontSize: '0.82rem',
                                      color: '#cc7a5c',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '8px',
                                      borderRadius: '0 0 16px 16px'
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

      {/* FLOATING ACTION BUTTON (Fixed on screen during scroll) */}
      {activeTab === 'fixture' && activeZoneId && (
        <button
          onClick={handleCreateNewRound}
          className="floating-plus-btn"
          title="Agregar Nueva Fecha"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Nueva Fecha</span>
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

      {/* Mobile Bottom Navigation Bar (Portal to document.body) */}
      {isMobile && !showTeamForm && createPortal(
        <>
          {mobileUserOpen && (
            <div className="mobile-dropdown-menu animate-fade-in" style={{
              position: 'fixed',
              bottom: '80px',
              right: '16px',
              zIndex: 10001,
              minWidth: '220px',
              background: '#fdfcfb',
              border: '1px solid #d8cfc0',
              borderRadius: '12px',
              boxShadow: '0 -10px 30px rgba(25, 20, 15, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #eae4d8' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#383530' }}>Hola {user?.first_name} {user?.last_name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#7f776f', fontWeight: '500' }}>{user?.role}</p>
              </div>
              <button 
                onClick={() => {
                  setMobileUserOpen(false);
                  logout();
                  window.location.href = '/login';
                }}
                className="mobile-logout-btn"
                style={{
                  width: '100%',
                  background: '#fdfcfb',
                  color: '#cc7a5c',
                  border: 'none',
                  borderTop: '1px solid #e5c5bb',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          <div className="mobile-bottom-nav anthropic-theme">
            <button 
              onClick={() => {
                setActiveTab('principal');
                setMobileUserOpen(false);
              }}
              className={`mobile-bottom-nav-item ${activeTab === 'principal' && !mobileUserOpen ? 'active' : ''}`}
            >
              <Trophy size={22} />
            </button>
            <button 
              onClick={() => {
                setActiveTab('fixture');
                setMobileUserOpen(false);
              }}
              className={`mobile-bottom-nav-item ${activeTab === 'fixture' && !mobileUserOpen ? 'active' : ''}`}
            >
              <Calendar size={22} />
            </button>
            <button 
              onClick={() => {
                setActiveTab('buena_fe');
                setMobileUserOpen(false);
              }}
              className={`mobile-bottom-nav-item ${activeTab === 'buena_fe' && !mobileUserOpen ? 'active' : ''}`}
            >
              <UserCheck size={22} />
            </button>
            <button 
              onClick={() => {
                setMobileUserOpen(!mobileUserOpen);
              }}
              className={`mobile-bottom-nav-item ${mobileUserOpen ? 'active' : ''}`}
            >
              <User size={22} />
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Importar Equipo Modal (Portal to document.body) */}
      {importTeamZoneId && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(25, 21, 18, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          padding: '16px'
        }} className="animate-fade-in">
          <div style={{
            background: '#fdfcfb',
            border: '1px solid #d8cfc0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #eae4d8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '850', fontSize: '1.05rem', color: '#383530' }}>Importar Equipo</span>
              <button 
                onClick={() => setImportTeamZoneId(null)}
                style={{ background: 'none', border: 'none', color: '#7f776f', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Search Box */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eae4d8' }}>
              <input 
                type="text" 
                placeholder="Buscar equipo por nombre..."
                value={importSearchQuery}
                onChange={(e) => setImportSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #d8cfc0',
                  padding: '0 12px',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#191919',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {(() => {
                const currentZone = detailedTournament?.zones?.find(z => z.id === importTeamZoneId);
                const currentTeamIds = new Set(currentZone?.zone_teams?.map(zt => zt.team) || []);
                
                const filtered = allSystemTeams.filter(t => 
                  !currentTeamIds.has(t.id) &&
                  t.name.toLowerCase().includes(importSearchQuery.toLowerCase())
                );
                
                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#7f776f', fontSize: '13px' }}>
                      No se encontraron equipos disponibles para importar.
                    </div>
                  );
                }
                
                return filtered.map((t, idx) => (
                  <div 
                    key={t.id}
                    onClick={() => handleImportTeam(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f0eae1',
                      background: idx % 2 === 0 ? '#fcfbfa' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    className="table-row-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#eae4d8',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {t.logo ? (
                          <img src={t.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Users size={16} color="#cc7a5c" />
                        )}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#383530' }}>{t.name}</span>
                    </div>
                    <Plus size={16} color="#cc7a5c" style={{ flexShrink: 0 }} />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// =============================================
// SUB-COMPONENTS FOR MOBILE TEAM EDITOR
// =============================================

const LbfSwitch = ({ checked, onChange }) => {
  return (
    <div 
      onClick={onChange}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#4cd964' : '#e5e5ea',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'inline-block',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

const EditIconOverlay = ({ onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: '0',
        right: '0',
        cursor: 'pointer',
        border: '2px solid #ffffff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: 2
      }}
    >
      <Edit size={14} color="#ffffff" />
    </div>
  );
};

const MobileTeamEditor = ({ 
  team, 
  onClose, 
  onSuccess, 
  tournamentId, 
  mobileRoster, 
  setMobileRoster,
  reloadMobileRoster,
  handleDeleteTeamClick,
  detailedTournament
}) => {
  const [teamName, setTeamName] = useState(team.name || '');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(team.logo || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(team.team_photo || null);
  
  const [saving, setSaving] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  
  const logoInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleLbf = (index) => {
    const updated = [...mobileRoster];
    updated[index].isLbf = !updated[index].isLbf;
    setMobileRoster(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      let hasTeamChanges = false;
      if (teamName !== team.name) {
        formData.append('name', teamName);
        hasTeamChanges = true;
      }
      if (logoFile) {
        formData.append('logo', logoFile);
        hasTeamChanges = true;
      }
      if (photoFile) {
        formData.append('team_photo', photoFile);
        hasTeamChanges = true;
      }

      if (hasTeamChanges) {
        await api.patch(`teams/${team.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      for (const item of mobileRoster) {
        if (item.isLbf && !item.recordId) {
          await api.post('good-faith-lists/', {
            tournament: tournamentId,
            team: team.id,
            player: item.player.id
          });
        } else if (!item.isLbf && item.recordId) {
          await api.delete(`good-faith-lists/${item.recordId}/`);
        }
      }

      alert("Cambios guardados con éxito.");
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Error al guardar cambios: " + (e.response?.data?.detail || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    const zt = detailedTournament.zones
      ?.flatMap(z => z.zone_teams || [])
      .find(zt => zt.team === team.id);
    if (zt) {
      if (window.confirm(`¿Estás seguro de que deseas eliminar a ${team.name} de este torneo?`)) {
        onClose();
        handleDeleteTeamClick(zt);
      }
    } else {
      alert("No se encontró el registro de zona de este equipo.");
    }
  };

  return (
    <div style={{ background: '#fcfbfa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <div style={{
        height: '56px',
        background: '#fdfcfb',
        borderBottom: '1px solid #eae4d8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        color: '#383530',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#cc7a5c', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#383530' }}>{teamName}</span>
        <button onClick={handleRemove} style={{ background: 'none', border: 'none', color: '#cc7a5c', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <MoreVertical size={20} />
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, paddingBottom: '160px', position: 'relative' }}>
        <input type="file" ref={logoInputRef} onChange={handleLogoChange} style={{ display: 'none' }} accept="image/*" />
        <input type="file" ref={photoInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} accept="image/*" />

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '105px' }}>
            <span style={{ fontSize: '13px', color: '#7f776f', fontWeight: '500' }}>Escudo</span>
            <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: '#ffffff', border: '1px solid #d8cfc0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Escudo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Users size={32} color="#7f776f" />
              )}
              <EditIconOverlay onClick={() => logoInputRef.current.click()} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <span style={{ fontSize: '13px', color: '#7f776f', fontWeight: '500' }}>Foto del equipo</span>
            <div style={{ height: '100px', borderRadius: '8px', background: '#ffffff', border: '1px solid #d8cfc0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Foto del equipo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FileSpreadsheet size={32} color="#7f776f" />
              )}
              <EditIconOverlay onClick={() => photoInputRef.current.click()} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#7f776f', fontWeight: '600' }}>Nombre</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #d8cfc0',
                borderRadius: '8px',
                padding: '10px 40px 10px 12px',
                fontSize: '0.92rem',
                color: '#191919',
                fontWeight: '600',
                outline: 'none',
                height: '42px'
              }}
            />
            {teamName && (
              <button 
                type="button" 
                onClick={() => setTeamName('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: '#c4b9a3',
                  border: 'none',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  padding: 0,
                  cursor: 'pointer'
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div>
          <div style={{ background: '#ffffff', border: '1px solid #d8cfc0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              background: '#f4efe6',
              borderBottom: '1px solid #d8cfc0',
              color: '#7f776f',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>JUGADORES/AS</span>
              <span>LBF</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' }}>
              {mobileRoster.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#7f776f', fontSize: '13px' }}>
                  No hay jugadores en el catálogo. ¡Agrega uno nuevo!
                </div>
              ) : (
                mobileRoster.map((item, idx) => (
                  <div 
                    key={item.player.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: idx === mobileRoster.length - 1 ? 'none' : '1px solid #f0eae1',
                      background: idx % 2 === 0 ? '#fcfbfa' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#eae4d8',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.player.photo ? (
                          <img src={item.player.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <UserCheck size={14} color="#cc7a5c" />
                        )}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#191919' }}>
                        {item.player.last_name}, {item.player.first_name}
                      </span>
                    </div>
                    
                    <LbfSwitch checked={item.isLbf} onChange={() => handleToggleLbf(idx)} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button 
              type="button"
              onClick={() => setShowAddPlayer(true)}
              style={{
                background: '#038c4c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(3,140,76,0.15)',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={16} /> Registrar Jugador
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              height: '44px',
              background: '#4cd964',
              color: '#ffffff',
              border: 'none',
              borderRadius: '22px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(76,217,100,0.3)'
            }}
          >
            {saving ? "GUARDANDO..." : "GUARDAR"}
          </button>
          
          <button 
            onClick={handleRemove}
            style={{
              width: '100%',
              height: '44px',
              background: '#ff3b30',
              color: '#ffffff',
              border: 'none',
              borderRadius: '22px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255,59,48,0.3)'
            }}
          >
            QUITAR DEL TORNEO
          </button>
        </div>
      </div>

      {showAddPlayer && (
        <PlayerFormModal
          onClose={() => setShowAddPlayer(false)}
          onSuccess={() => {
            setShowAddPlayer(false);
            reloadMobileRoster(team.id);
          }}
        />
      )}
    </div>
  );
};
