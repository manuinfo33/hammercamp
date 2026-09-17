import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Users, Edit, Check, X, Calendar, Clock, Plus, Trash2, Shield, 
  AlertTriangle, MoreVertical, FileSpreadsheet, FileText, MapPin, UserCheck, UserPlus,
  User, Menu, LogOut, ChevronDown
} from 'lucide-react';
import api from '../../api';
import { createPortal } from 'react-dom';
import TeamForm from '../teams/TeamForm';
import PlayerFormModal from '../players/PlayerFormModal';
import MatchResultModal from './MatchResultModal';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'principal', label: 'Principal' },
  { id: 'fixture', label: 'Fixture' },
  { id: 'buena_fe', label: 'Lista de Buena Fe' },
];

function TimeSelectInput({ value, onChange }) {
  const [openHour, setOpenHour] = useState(false);
  const [openMin, setOpenMin] = useState(false);
  const containerRef = useRef(null);
  const hourListRef = useRef(null);
  const minListRef = useRef(null);

  const parts = (value && typeof value === 'string' && value.includes(':')) ? value.split(':') : ['', ''];
  const hour = parts[0] || '';
  const minute = parts[1] ? parts[1].slice(0, 2) : '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenHour(false);
        setOpenMin(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Position at 12 hs by default (or selected hour) on open
  useEffect(() => {
    if (openHour && hourListRef.current) {
      const targetHour = hour || '12';
      const targetEl = hourListRef.current.querySelector(`[data-hour="${targetHour}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [openHour, hour]);

  // Position at 00 min by default (or selected minute) on open
  useEffect(() => {
    if (openMin && minListRef.current) {
      const targetMin = minute || '00';
      const targetEl = minListRef.current.querySelector(`[data-min="${targetMin}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [openMin, minute]);

  const handleHourSelect = (selectedHour) => {
    const curMin = minute || '00';
    onChange(`${selectedHour.padStart(2, '0')}:${curMin.padStart(2, '0')}`);
    setOpenHour(false);
  };

  const handleMinSelect = (selectedMin) => {
    const curHour = hour || '12';
    onChange(`${curHour.padStart(2, '0')}:${selectedMin.padStart(2, '0')}`);
    setOpenMin(false);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  if (minute && !minutesList.includes(minute)) {
    minutesList.push(minute);
    minutesList.sort((a, b) => Number(a) - Number(b));
  }

  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: '160px',
    overflowY: 'auto',
    background: '#ffffff',
    border: '1px solid #d8cfc0',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    zIndex: 10005,
    padding: '4px 0',
  };

  const itemStyle = (isActive) => ({
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: isActive ? '700' : '500',
    color: isActive ? '#191919' : '#5c554e',
    background: isActive ? '#f0ece4' : 'transparent',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background 0.1s ease',
  });

  const buttonStyle = (isOpen, hasVal) => ({
    width: '100%',
    height: '38px',
    background: '#ffffff',
    border: isOpen ? '1px solid #cc7a5c' : '1px solid #d8cfc0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    fontSize: '13px',
    fontWeight: '600',
    color: hasVal ? '#191919' : '#7f776f',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: isOpen ? '0 0 0 3px rgba(204, 122, 92, 0.12)' : 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {/* Hours dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setOpenHour(!openHour);
            setOpenMin(false);
          }}
          style={buttonStyle(openHour, !!hour)}
        >
          <span>{hour ? `${hour} hs` : 'Hora'}</span>
          <ChevronDown size={13} color="#7f776f" style={{ transform: openHour ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>

        {openHour && (
          <div ref={hourListRef} style={dropdownStyle} className="custom-time-scrollbar">
            {hoursList.map(h => {
              const isSelected = hour === h;
              return (
                <div
                  key={h}
                  data-hour={h}
                  className={`table-row-hover ${isSelected ? 'active-time-opt' : ''}`}
                  style={itemStyle(isSelected)}
                  onClick={() => handleHourSelect(h)}
                >
                  {h} hs
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minutes dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => {
            setOpenMin(!openMin);
            setOpenHour(false);
          }}
          style={buttonStyle(openMin, !!minute)}
        >
          <span>{minute ? `${minute} min` : 'Min'}</span>
          <ChevronDown size={13} color="#7f776f" style={{ transform: openMin ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>

        {openMin && (
          <div ref={minListRef} style={dropdownStyle} className="custom-time-scrollbar">
            {minutesList.map(m => {
              const isSelected = minute === m;
              return (
                <div
                  key={m}
                  data-min={m}
                  className={`table-row-hover ${isSelected ? 'active-time-opt' : ''}`}
                  style={itemStyle(isSelected)}
                  onClick={() => handleMinSelect(m)}
                >
                  {m} min
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TournamentDetailView({ tournament, onBack }) {
  const { id: paramId, tab: paramTab } = useParams();
  const navigate = useNavigate();

  const tournamentId = paramId || tournament?.id;
  const initialTab = (paramTab && ['principal', 'fixture', 'buena_fe'].includes(paramTab)) ? paramTab : 'principal';

  const { user, logout } = useAuth();
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [detailedTournament, setDetailedTournament] = useState(null);

  const displayTournament = detailedTournament || tournament || {};

  useEffect(() => {
    if (paramTab && ['principal', 'fixture', 'buena_fe'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (tournamentId) {
      navigate(`/torneos/${tournamentId}/${newTab}`, { replace: true });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/torneos');
    }
  };
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
      } else if (!confirmed && customConfirm?.onCancel) {
        customConfirm.onCancel();
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixture states
  const [activeZoneId, setActiveZoneId] = useState('');
  const [fixturesByZone, setFixturesByZone] = useState({});
  const [fixtureMode, setFixtureMode] = useState('ida'); // 'ida' or 'ida_vuelta'

  // Inline zone editing state
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [editingZoneName, setEditingZoneName] = useState('');

  // New team modal state
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamZoneId, setNewTeamZoneId] = useState(null);

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
  const [newMatchArbitro, setNewMatchArbitro] = useState('');
  const [newMatchZone, setNewMatchZone] = useState('cruce');

  // Edit match modal state
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [editMatchId, setEditMatchId] = useState(null);
  const [editMatchLocal, setEditMatchLocal] = useState('');
  const [editMatchVisitor, setEditMatchVisitor] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editMatchTime, setEditMatchTime] = useState('');
  const [editMatchCancha, setEditMatchCancha] = useState('');
  const [editMatchArbitro, setEditMatchArbitro] = useState('');
  const [editMatchZone, setEditMatchZone] = useState('cruce');

  // Match Dropdown menu state
  const [openDropdownMatchId, setOpenDropdownMatchId] = useState(null);

  // Match Result Modal state
  const [selectedMatchForScore, setSelectedMatchForScore] = useState(null);
  const [selectedRoundNameForScore, setSelectedRoundNameForScore] = useState('');

  const fetchTournamentDetail = async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      const res = await api.get(`tournaments/${tournamentId}/`);
      setDetailedTournament(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentDetail();
  }, [tournamentId]);

  // Set default active zone when detailedTournament is loaded
  useEffect(() => {
    if (detailedTournament?.zones?.length > 0 && !activeZoneId) {
      setActiveZoneId(detailedTournament.zones[0].id);
    }
  }, [detailedTournament, activeZoneId]);

  // Fetch fixtures for active zone and all zones in tournament
  const fetchFixturesForZone = async (zoneId) => {
    if (!zoneId) return;
    try {
      const res = await api.get(`match-rounds/?tournament_zone=${zoneId}`);
      setFixturesByZone(prev => ({ ...prev, [zoneId]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFixturesForAllZones = async () => {
    if (!detailedTournament?.zones || detailedTournament.zones.length === 0) return;
    try {
      const promises = detailedTournament.zones.map(z => api.get(`match-rounds/?tournament_zone=${z.id}`));
      const results = await Promise.all(promises);
      const newFixtures = {};
      results.forEach((res, i) => {
        newFixtures[detailedTournament.zones[i].id] = res.data;
      });
      setFixturesByZone(prev => ({ ...prev, ...newFixtures }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'fixture' && detailedTournament?.zones?.length) {
      fetchFixturesForAllZones();
    }
  }, [activeTab, detailedTournament]);

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
      message: `¿Estás seguro de que deseas eliminar a ${zt.team_name} de esta zona?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.delete(`zone-teams/${zt.id}/`);
          setCustomAlert({ message: "Equipo eliminado de la zona con éxito.", type: "success" });
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

  const handleEditZoneClick = (zone) => {
    setEditingZoneId(zone.id);
    setEditingZoneName(zone.name);
  };

  const saveInlineZoneName = async (zoneId) => {
    if (!editingZoneName || !editingZoneName.trim()) {
      setEditingZoneId(null);
      return;
    }
    try {
      setLoading(true);
      await api.patch(`tournament-zones/${zoneId}/`, { name: editingZoneName.trim() });
      setEditingZoneId(null);
      setCustomAlert({ message: "Nombre de zona actualizado con éxito.", type: "success" });
      await fetchTournamentDetail();
    } catch (e) {
      console.error(e);
      let errorMsg = "Error al actualizar la zona.";
      if (e.response?.data?.non_field_errors) {
        errorMsg = e.response.data.non_field_errors[0];
      } else if (e.response?.data?.name) {
        errorMsg = e.response.data.name[0];
      } else if (typeof e.response?.data?.detail === 'string') {
        errorMsg = e.response.data.detail;
      }
      setCustomAlert({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTeamClick = (zoneId) => {
    setNewTeamZoneId(zoneId);
    setShowNewTeamModal(true);
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
      setCustomAlert({ message: "Se necesitan al menos 2 equipos asignados para poder generar el fixture.", type: "error" });
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
      setCustomAlert({ message: "¡Fixture generado con éxito!", type: "success" });
      await fetchFixturesForAllZones();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Hubo un error al guardar el fixture en el servidor.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixtureAll = async () => {
    const zonesWithTeams = detailedTournament?.zones?.filter(z => z.zone_teams?.length >= 2) || [];
    if (zonesWithTeams.length === 0) {
      setCustomAlert({ message: "Se necesitan al menos 2 equipos asignados en el torneo para poder generar el fixture.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      for (const zone of zonesWithTeams) {
        const teams = zone.zone_teams.map(zt => ({
          id: zt.team,
          name: zt.team_name,
        }));
        const rounds = generateRoundRobin(teams, fixtureMode === 'ida_vuelta');
        for (const r of rounds) {
          await api.post('match-rounds/', {
            tournament_zone: zone.id,
            name: r.name,
            order: r.order,
            matches: r.matches.map(m => ({
              local_team: m.local.id,
              visitor_team: m.visitor.id,
              played: false,
              impact_zone: zone.id
            }))
          });
        }
      }
      setCustomAlert({ message: "¡Fixture generado con éxito!", type: "success" });
      await fetchFixturesForAllZones();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Hubo un error al guardar el fixture en el servidor.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFixture = async (zoneId) => {
    setCustomConfirm({
      message: "¿Estás seguro de que deseas eliminar el fixture? Se perderán todas las fechas y partidos creados.",
      onConfirm: async () => {
        try {
          setLoading(true);
          const rounds = fixturesByZone[zoneId] || [];
          for (const r of rounds) {
            await api.delete(`match-rounds/${r.id}/`);
          }
          setCustomAlert({ message: "Fixture eliminado correctamente.", type: "success" });
          await fetchFixturesForAllZones();
        } catch (e) {
          console.error(e);
          setCustomAlert({ message: "Hubo un error al eliminar el fixture.", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteAllFixtures = async () => {
    setCustomConfirm({
      message: "¿Estás seguro de que deseas eliminar todo el fixture del torneo? Se perderán todas las fechas y partidos creados.",
      onConfirm: async () => {
        try {
          setLoading(true);
          const allRounds = Object.values(fixturesByZone).flat();
          for (const r of allRounds) {
            await api.delete(`match-rounds/${r.id}/`);
          }
          setCustomAlert({ message: "Fixture del torneo eliminado correctamente.", type: "success" });
          await fetchFixturesForAllZones();
        } catch (e) {
          console.error(e);
          setCustomAlert({ message: "Hubo un error al eliminar el fixture.", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Create a new empty round manually
  const handleCreateNewRound = async () => {
    if (tournamentTeams.length < 2) {
      setCustomAlert({ message: "Se necesitan al menos 2 equipos cargados en el torneo para agregar fechas.", type: "error" });
      return;
    }
    const targetZoneId = detailedTournament?.zones?.[0]?.id;
    if (!targetZoneId) {
      setCustomAlert({ message: "El torneo no tiene zonas configuradas.", type: "error" });
      return;
    }
    try {
      setLoading(true);
      const nextOrder = unifiedFixtures.length + 1;
      await api.post('match-rounds/', {
        tournament_zone: targetZoneId,
        name: `Fecha ${nextOrder}`,
        order: nextOrder,
        matches: []
      });
      setCustomAlert({ message: `Jornada 'Fecha ${nextOrder}' creada con éxito.`, type: "success" });
      await fetchFixturesForAllZones();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Hubo un error al crear la nueva fecha.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Round Modal
  const openEditRoundModal = (r) => {
    setEditRoundRoundId(r.roundIds?.[0] || r.id);
    setEditRoundName(r.name);
    setEditRoundDate(r.date || '');
    setEditRoundTime(r.time || '');
    setShowEditRoundModal(true);
  };

  const handleUpdateRound = async (roundId) => {
    if (!editRoundName.trim()) {
      setCustomAlert({ message: "El nombre de la fecha no puede estar vacío.", type: "error" });
      return;
    }
    try {
      setLoading(true);
      await api.patch(`match-rounds/${roundId}/`, {
        name: editRoundName,
        date: editRoundDate || null,
        time: editRoundTime || null
      });
      setCustomAlert({ message: "Fecha actualizada correctamente.", type: "success" });
      await fetchFixturesForAllZones();
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Error al actualizar los datos de la fecha.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRound = async (roundOrIds) => {
    const ids = Array.isArray(roundOrIds) ? roundOrIds : [roundOrIds];
    setCustomConfirm({
      message: "¿Estás seguro de que deseas eliminar esta fecha por completo? Se perderán todos sus partidos programados.",
      onConfirm: async () => {
        try {
          setLoading(true);
          for (const id of ids) {
            await api.delete(`match-rounds/${id}/`);
          }
          setCustomAlert({ message: "Fecha eliminada correctamente.", type: "success" });
          await fetchFixturesForAllZones();
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
    setNewMatchRoundId(r.roundIds?.[0] || r.id);
    setNewMatchLocal('');
    setNewMatchVisitor('');
    setNewMatchDate(r.date || '');
    setNewMatchTime(r.time || '');
    setNewMatchCancha('');
    setNewMatchArbitro('');
    setNewMatchZone(r.tournament_zone || detailedTournament?.zones?.[0]?.id || 'cruce');
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
        arbitro: matchData.arbitro || null,
        impact_zone: matchData.impact_zone || null,
        played: false
      });
      setCustomAlert({ message: "Partido programado con éxito.", type: "success" });
      await fetchFixturesForAllZones();
      setShowNewMatchModal(false);
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Hubo un error al guardar el partido.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAndCreateMatch = () => {
    if (!newMatchLocal || !newMatchVisitor) {
      setCustomAlert({ message: "Debe seleccionar ambos equipos.", type: "error" });
      return;
    }
    if (String(newMatchLocal) === String(newMatchVisitor)) {
      setCustomAlert({ message: "El Equipo 1 y el Equipo 2 no pueden ser el mismo.", type: "error" });
      return;
    }

    const localId = Number(newMatchLocal);
    const visitorId = Number(newMatchVisitor);

    const allRounds = Object.values(fixturesByZone).flat();
    const currentRound = allRounds.find(r => r.id === newMatchRoundId);

    // 1. Check if either team already plays in this SAME fecha (round)
    const teamAlreadyInRound = currentRound?.matches?.some(m => {
      const mLocal = Number(m.local_team);
      const mVisitor = Number(m.visitor_team);
      return mLocal === localId || mVisitor === localId || mLocal === visitorId || mVisitor === visitorId;
    });

    if (teamAlreadyInRound) {
      setCustomConfirm({
        title: "Atención",
        message: "El equipo que esta intentando ingresar ya tiene un partido en la misma fecha.",
        confirmText: "OK",
        singleButton: true,
        onConfirm: () => {}
      });
      return;
    }

    // 2. Check if this exact matchup (local vs visitor or visitor vs local) already exists in the TARGET impact zone
    // Each zone is independent: we inspect matches that impact the selected target zone.
    const isCruce = newMatchZone === 'cruce';
    const targetZoneId = isCruce ? null : (newMatchZone ? Number(newMatchZone) : Number(activeZoneId));

    let matchAlreadyExistsInZone = false;
    if (targetZoneId) {
      const targetZoneRounds = fixturesByZone[targetZoneId] || [];
      matchAlreadyExistsInZone = targetZoneRounds.some(r =>
        r.matches?.some(m => {
          const mLocal = Number(m.local_team);
          const mVisitor = Number(m.visitor_team);
          return (mLocal === localId && mVisitor === visitorId) || (mLocal === visitorId && mVisitor === localId);
        })
      );
    }

    const matchData = {
      local_team: newMatchLocal,
      visitor_team: newMatchVisitor,
      date: newMatchDate || null,
      time: newMatchTime || null,
      cancha: newMatchCancha || null,
      arbitro: newMatchArbitro || null,
      impact_zone: newMatchZone === 'cruce' ? null : newMatchZone
    };

    if (matchAlreadyExistsInZone) {
      setCustomConfirm({
        title: "Atención",
        message: "El partido ya existe, desea crearlo de todos modos?",
        confirmText: "OK",
        cancelText: "CANCELAR",
        onConfirm: () => {
          handleCreateNewMatch(matchData);
        }
      });
      return;
    }

    // Normal direct creation
    handleCreateNewMatch(matchData);
  };

  // Open Edit Match Modal
  const openEditMatchModal = (m) => {
    setEditMatchId(m.id);
    setEditMatchLocal(m.local_team ? String(m.local_team) : '');
    setEditMatchVisitor(m.visitor_team ? String(m.visitor_team) : '');
    setEditMatchDate(m.date || '');
    setEditMatchTime(m.time ? m.time.slice(0, 5) : '');
    setEditMatchCancha(m.cancha || '');
    setEditMatchArbitro(m.arbitro || '');
    setEditMatchZone(m.impact_zone ? String(m.impact_zone) : 'cruce');
    setShowEditMatchModal(true);
  };

  const handleUpdateMatch = async () => {
    if (!editMatchLocal || !editMatchVisitor) {
      setCustomAlert({ message: "Debe seleccionar ambos equipos.", type: "error" });
      return;
    }
    if (editMatchLocal === editMatchVisitor) {
      setCustomAlert({ message: "El Equipo 1 y el Equipo 2 no pueden ser el mismo.", type: "error" });
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
        arbitro: editMatchArbitro || null,
        impact_zone: editMatchZone === 'cruce' ? null : editMatchZone
      });
      setCustomAlert({ message: "Partido actualizado con éxito.", type: "success" });
      await fetchFixturesForAllZones();
      setShowEditMatchModal(false);
    } catch (e) {
      console.error(e);
      setCustomAlert({ message: "Hubo un error al guardar los cambios del partido.", type: "error" });
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

  // Helper to dynamically calculate which team is libre in a round across tournament zones
  const getLibreTeam = (roundMatches) => {
    if (!detailedTournament?.zones) return null;
    const playingTeamIds = new Set();
    roundMatches?.forEach(m => {
      playingTeamIds.add(Number(m.local_team));
      playingTeamIds.add(Number(m.visitor_team));
    });

    const libreNames = [];
    detailedTournament.zones.forEach(z => {
      if (z.zone_teams && z.zone_teams.length % 2 !== 0) {
        const libreZt = z.zone_teams.find(zt => !playingTeamIds.has(Number(zt.team)));
        if (libreZt) {
          libreNames.push(libreZt.team_name);
        }
      }
    });
    return libreNames.length > 0 ? libreNames.join(', ') : null;
  };

  // Group and unify all fixture rounds across all zones of the tournament
  const unifiedFixtures = useMemo(() => {
    const allRounds = Object.values(fixturesByZone).flat();
    if (!allRounds.length) return [];

    const map = new Map();
    allRounds.forEach(r => {
      const key = r.name?.trim().toLowerCase() || `order_${r.order}`;
      if (!map.has(key)) {
        map.set(key, {
          ...r,
          matches: [...(r.matches || [])],
          roundIds: [r.id],
          zones: [r.tournament_zone]
        });
      } else {
        const existing = map.get(key);
        existing.matches.push(...(r.matches || []));
        existing.roundIds.push(r.id);
        if (!existing.zones.includes(r.tournament_zone)) {
          existing.zones.push(r.tournament_zone);
        }
        // Deduplicate matches
        const seenMatchIds = new Set();
        existing.matches = existing.matches.filter(m => {
          if (seenMatchIds.has(m.id)) return false;
          seenMatchIds.add(m.id);
          return true;
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [fixturesByZone]);

  const currentZone = detailedTournament?.zones?.find(z => z.id === activeZoneId);
  const activeZoneFixtures = unifiedFixtures;

  // Gather all teams in the tournament for manual match assignment
  const allTeams = detailedTournament?.zones?.flatMap(z => 
    z.zone_teams?.map(zt => ({ id: zt.team, name: zt.team_name })) || []
  ) || [];

  // Deduplicate teams participating in the tournament and sort alphabetically A-Z
  const tournamentTeams = [];
  const seenTeamIds = new Set();
  allTeams.forEach(t => {
    if (!seenTeamIds.has(t.id)) {
      seenTeamIds.add(t.id);
      tournamentTeams.push(t);
    }
  });
  tournamentTeams.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

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
      setCustomAlert({ message: "Seleccioná un jugador.", type: "error" });
      return;
    }
    const limit = detailedTournament.max_players_buena_fe;
    if (buenaFePlayers.length >= limit) {
      setCustomAlert({ message: `No se pueden agregar más jugadores. El límite de la lista de buena fe para este torneo es de ${limit} jugadores.`, type: "error" });
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
      setCustomAlert({ message: "Jugador incorporado con éxito a la lista de buena fe.", type: "success" });
      setSelectedPlayerToAdd('');
      setShirtNumberToAdd('');
      fetchBuenaFePlayers();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.player) {
        setCustomAlert({ message: Array.isArray(err.response.data.player) ? err.response.data.player[0] : err.response.data.player, type: "error" });
      } else if (err.response?.data?.non_field_errors) {
        setCustomAlert({ message: "El jugador ya está inscrito en la lista de buena fe de este equipo.", type: "error" });
      } else {
        setCustomAlert({ message: "Error al inscribir al jugador.", type: "error" });
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
    return (
      <TeamDetailEditor
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
        isMobile={isMobile}
      />
    );
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
            onClick={handleBack}
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

          {displayTournament.category_name && (
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
              Categoría: {displayTournament.category_name}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="anthropic-title" style={{ fontSize: '28px', margin: 0, fontWeight: '800', color: '#191919', letterSpacing: '-0.5px' }}>
            {displayTournament.name}
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
              onClick={() => handleTabChange(tab.id)}
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
      <div style={{ paddingBottom: isMobile ? '80px' : (activeTab === 'fixture' && unifiedFixtures.length > 0 ? '80px' : '0px') }}>
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
                          {editingZoneId === zone.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                              <input
                                type="text"
                                value={editingZoneName}
                                onChange={(e) => setEditingZoneName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineZoneName(zone.id);
                                  if (e.key === 'Escape') setEditingZoneId(null);
                                }}
                                autoFocus
                                style={{
                                  height: '36px',
                                  padding: '0 12px',
                                  fontSize: '15px',
                                  fontWeight: '700',
                                  borderRadius: '8px',
                                  border: '1px solid #cc7a5c',
                                  background: 'var(--input-bg, #ffffff)',
                                  color: 'var(--text-primary)'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => saveInlineZoneName(zone.id)}
                                style={{
                                  padding: '6px 12px',
                                  height: '36px',
                                  background: '#cc7a5c',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={14} /> Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingZoneId(null)}
                                style={{
                                  padding: '6px 10px',
                                  height: '36px',
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                              {zone.name}
                            </h3>
                          )}
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
                
                {/* Fixture Control Bar - ALWAYS VISIBLE */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '16px', 
                  background: '#ffffff', 
                  padding: '18px 24px', 
                  borderRadius: '16px', 
                  border: '1px solid #e6dfd3', 
                  boxShadow: '0 2px 10px rgba(25, 20, 15, 0.03)'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#191919' }}>
                      Fixture
                    </h3>
                    <span style={{ fontSize: '12px', color: '#7f776f', marginTop: '2px', display: 'block' }}>
                      {unifiedFixtures.length === 0 ? 'Sin fechas creadas' : `${unifiedFixtures.length} ${unifiedFixtures.length === 1 ? 'Fecha programada' : 'Fechas programadas'}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={handleCreateNewRound}
                      disabled={tournamentTeams.length < 2}
                      title={tournamentTeams.length < 2 ? "Se necesitan al menos 2 equipos para agregar fechas" : "Agregar Nueva Fecha"}
                      style={{ 
                        height: '36px', 
                        fontSize: '0.8rem', 
                        padding: '0 16px', 
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: tournamentTeams.length < 2 ? 0.5 : 1,
                        cursor: tournamentTeams.length < 2 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Plus size={14} /> Nueva Fecha
                    </button>
                    {unifiedFixtures.length > 0 && (
                      <button
                        onClick={handleDeleteAllFixtures}
                        className="danger"
                        style={{ height: '36px', fontSize: '0.8rem', padding: '0 16px', borderRadius: '10px' }}
                      >
                        <Trash2 size={14} /> Eliminar Fixture Completo
                      </button>
                    )}
                  </div>
                </div>

                {unifiedFixtures.length === 0 ? (
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
                        Todavía no se ha generado el fixture para este torneo. Podés hacer clic en <strong>"+ Nueva Fecha"</strong> para crear fechas manualmente o seleccionar el tipo de fixture a continuación.
                      </p>
                    </div>

                    {tournamentTeams.length < 2 ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        background: '#fef2f2', 
                        color: '#dc2626', 
                        border: '1px solid #fecaca', 
                        padding: '12px 20px', 
                        borderRadius: '10px', 
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        <AlertTriangle size={18} color="#dc2626" />
                        <span>Se necesitan al menos 2 equipos en el torneo para poder generar el fixture.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '360px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                        <div className="input-group" style={{ textAlign: 'left' }}>
                          <label>Tipo de Fixture Automático</label>
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
                          onClick={handleGenerateFixtureAll}
                          style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                        >
                          <Plus size={16} /> Generar Fixture Automático
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* FIXTURE EXISTS: DISPLAY STACKED CARDS */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Stacked Fechas Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {unifiedFixtures.map((r) => {
                        const libreTeam = getLibreTeam(r.matches);
                        
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
                                      handleDeleteRound(r.roundIds || r.id);
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
                                        fontWeight: '500', 
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
                                        fontWeight: '500', 
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
                                               setSelectedMatchForScore(m);
                                               setSelectedRoundNameForScore(r.name);
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



      {/* EDIT ROUND MODAL */}
      {showEditRoundModal && createPortal(
        <div className="premium-modal-overlay anthropic-theme" onClick={() => setShowEditRoundModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '460px', padding: isMobile ? '20px 16px' : '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(204, 122, 92, 0.12)',
                  border: '1px solid rgba(204, 122, 92, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Calendar size={17} color="#cc7a5c" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#191919' }}>Editar Información de la Fecha</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#7f776f' }}>Modificá el nombre, fecha y horario general</p>
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
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={editRoundDate} 
                    onChange={(e) => setEditRoundDate(e.target.value)} 
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch(err) {}
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div className="input-group">
                  <label>Hora de Inicio</label>
                  <TimeSelectInput 
                    value={editRoundTime} 
                    onChange={(val) => setEditRoundTime(val)} 
                  />
                </div>
              </div>
              <div style={{
                background: 'rgba(204, 122, 92, 0.06)', border: '1px solid rgba(204, 122, 92, 0.15)',
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '11px', color: '#7f776f', lineHeight: '1.5'
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
        </div>,
        document.body
      )}

      {/* NEW MATCH MODAL */}
      {showNewMatchModal && createPortal(
        <div className="premium-modal-overlay anthropic-theme" onClick={() => setShowNewMatchModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '540px', padding: isMobile ? '20px 16px' : '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(204, 122, 92, 0.12)',
                  border: '1px solid rgba(204, 122, 92, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Plus size={17} color="#cc7a5c" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#191919' }}>Nuevo Partido</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#7f776f' }}>Agregá un partido a esta fecha del fixture</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNewMatchModal(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Team 1 and Team 2 Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo 1</label>
                  <select 
                    value={newMatchLocal} 
                    onChange={(e) => setNewMatchLocal(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {tournamentTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo 2</label>
                  <select 
                    value={newMatchVisitor} 
                    onChange={(e) => setNewMatchVisitor(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {tournamentTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={newMatchDate} 
                    onChange={(e) => setNewMatchDate(e.target.value)} 
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch(err) {}
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Hora</label>
                  <TimeSelectInput 
                    value={newMatchTime} 
                    onChange={(val) => setNewMatchTime(val)} 
                  />
                </div>
              </div>

              {/* Cancha & Árbitro Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Cancha</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cancha 1" 
                    value={newMatchCancha} 
                    onChange={(e) => setNewMatchCancha(e.target.value)} 
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Árbitro</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez" 
                    value={newMatchArbitro} 
                    onChange={(e) => setNewMatchArbitro(e.target.value)} 
                  />
                </div>
              </div>

              {/* Impact Zone */}
              <div className="input-group" style={{ margin: 0 }}>
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
              <button onClick={handleValidateAndCreateMatch}>
                <Check size={14} /> Agregar Partido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MATCH MODAL */}
      {showEditMatchModal && createPortal(
        <div className="premium-modal-overlay anthropic-theme" onClick={() => setShowEditMatchModal(false)}>
          <div className="premium-modal-card" style={{ maxWidth: '540px', padding: isMobile ? '20px 16px' : '28px' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(204, 122, 92, 0.12)',
                  border: '1px solid rgba(204, 122, 92, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Edit size={17} color="#cc7a5c" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#191919' }}>Editar Partido</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#7f776f' }}>Modificá los datos del partido programado</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditMatchModal(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Team 1 and Team 2 Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo 1</label>
                  <select 
                    value={editMatchLocal} 
                    onChange={(e) => setEditMatchLocal(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {tournamentTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Equipo 2</label>
                  <select 
                    value={editMatchVisitor} 
                    onChange={(e) => setEditMatchVisitor(e.target.value)}
                  >
                    <option value="">— Seleccioná —</option>
                    {tournamentTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    value={editMatchDate} 
                    onChange={(e) => setEditMatchDate(e.target.value)} 
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch(err) {}
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Hora</label>
                  <TimeSelectInput 
                    value={editMatchTime} 
                    onChange={(val) => setEditMatchTime(val)} 
                  />
                </div>
              </div>

              {/* Cancha & Árbitro Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Cancha</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cancha 1" 
                    value={editMatchCancha} 
                    onChange={(e) => setEditMatchCancha(e.target.value)} 
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Árbitro</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez" 
                    value={editMatchArbitro} 
                    onChange={(e) => setEditMatchArbitro(e.target.value)} 
                  />
                </div>
              </div>

              {/* Impact Zone */}
              <div className="input-group" style={{ margin: 0 }}>
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
        </div>,
        document.body
      )}

      {/* Match Result Modal */}
      {selectedMatchForScore && (
        <MatchResultModal
          match={selectedMatchForScore}
          roundName={selectedRoundNameForScore}
          tournamentId={detailedTournament?.id}
          onClose={() => setSelectedMatchForScore(null)}
          onSuccess={async () => {
            setSelectedMatchForScore(null);
            await fetchFixturesForAllZones();
            await fetchTournamentDetail();
          }}
          isMobile={isMobile}
        />
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
      {/* Custom alert notification toast pill (matching Equipos & Jugadores sections) */}
      {customAlert && createPortal(
        <div className="toast-pill-container">
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: customAlert.type === 'error' ? '#c62828' : '#2e7d32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {customAlert.type === 'error' ? (
              <AlertTriangle size={14} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <Check size={14} color="#ffffff" strokeWidth={3} />
            )}
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#f5ede4',
            whiteSpace: 'nowrap'
          }}>
            {customAlert.message}
          </span>
          <button
            type="button"
            onClick={triggerCloseAlert}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a8957e',
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

      {/* Custom confirmation banner with blocking backdrop overlay (Portal to document.body) */}
      {customConfirm && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.38)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          className="animate-fade-in"
          onClick={() => triggerCloseConfirm(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              border: '1px solid #e6dfd3',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={18} color="#856404" />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#191919' }}>
                  {customConfirm.title || 'Confirmación'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => triggerCloseConfirm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#383530', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
              {customConfirm.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              {!customConfirm.singleButton && (
                <button
                  type="button"
                  onClick={() => triggerCloseConfirm(false)}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    background: '#ffffff',
                    border: '1px solid #d8cfc0',
                    borderRadius: '8px',
                    color: '#191919',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                >
                  {customConfirm.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerCloseConfirm(true)}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  background: '#191919',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333333'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#191919'; }}
              >
                {customConfirm.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Bottom Navigation Bar (Portal to document.body) */}
      {isMobile && !showTeamForm && !selectedMatchForScore && createPortal(
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
                handleTabChange('principal');
                setMobileUserOpen(false);
              }}
              className={`mobile-bottom-nav-item ${activeTab === 'principal' && !mobileUserOpen ? 'active' : ''}`}
            >
              <Trophy size={22} />
            </button>
            <button 
              onClick={() => {
                handleTabChange('fixture');
                setMobileUserOpen(false);
              }}
              className={`mobile-bottom-nav-item ${activeTab === 'fixture' && !mobileUserOpen ? 'active' : ''}`}
            >
              <Calendar size={22} />
            </button>
            <button 
              onClick={() => {
                handleTabChange('buena_fe');
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
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            padding: '16px'
          }} 
          className="animate-fade-in"
          onClick={() => setImportTeamZoneId(null)}
        >
          <div 
            style={{
              background: '#ffffff',
              border: '1px solid #d8cfc0',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
            }}
            onClick={e => e.stopPropagation()}
          >
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

      {/* Modal para Nuevo Equipo sin salir de Torneos */}
      {showNewTeamModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.38)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          className="animate-fade-in"
          onClick={() => setShowNewTeamModal(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #eee8df',
              position: 'sticky',
              top: 0,
              background: '#ffffff',
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2d2822' }}>
                Nuevo Equipo
              </h3>
              <button
                type="button"
                onClick={() => setShowNewTeamModal(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#7f776f',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <TeamForm
                isModal={true}
                defaultCategoryId={detailedTournament?.category}
                onClose={() => setShowNewTeamModal(false)}
                onSuccess={async (createdTeam) => {
                  try {
                    setLoading(true);
                    await api.post('zone-teams/', [{ zone: newTeamZoneId, team: createdTeam.id }]);
                    setShowNewTeamModal(false);
                    setCustomAlert({ message: 'Equipo creado y agregado a la zona con éxito.', type: 'success' });
                    await fetchTournamentDetail();
                  } catch (err) {
                    console.error(err);
                    setCustomAlert({ message: 'Equipo creado pero hubo un error al agregarlo a la zona.', type: 'error' });
                  } finally {
                    setLoading(false);
                  }
                }}
              />
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

const TeamDetailEditor = ({ 
  team, 
  onClose, 
  onSuccess, 
  tournamentId, 
  mobileRoster, 
  setMobileRoster,
  reloadMobileRoster,
  handleDeleteTeamClick,
  detailedTournament,
  isMobile
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

  const formContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <input type="file" ref={logoInputRef} onChange={handleLogoChange} style={{ display: 'none' }} accept="image/*" />
      <input type="file" ref={photoInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} accept="image/*" />

      {/* Escudo & Foto del equipo */}
      <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: isMobile ? '105px' : '120px' }}>
          <span style={{ fontSize: '13px', color: '#7f776f', fontWeight: '600' }}>Escudo</span>
          <div 
            onClick={() => logoInputRef.current?.click()}
            style={{ 
              width: isMobile ? '100px' : '115px', 
              height: isMobile ? '100px' : '115px', 
              borderRadius: '8px', 
              background: '#ffffff', 
              border: '1px solid #d8cfc0', 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Escudo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Users size={32} color="#7f776f" />
            )}
            <EditIconOverlay onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <span style={{ fontSize: '13px', color: '#7f776f', fontWeight: '600' }}>Foto del equipo</span>
          <div 
            onClick={() => photoInputRef.current?.click()}
            style={{ 
              height: isMobile ? '100px' : '115px', 
              borderRadius: '8px', 
              background: '#ffffff', 
              border: '1px solid #d8cfc0', 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Foto del equipo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FileSpreadsheet size={32} color="#7f776f" />
            )}
            <EditIconOverlay onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }} />
          </div>
        </div>
      </div>

      {/* Nombre */}
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
              height: '42px',
              boxSizing: 'border-box'
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
                minWidth: '18px',
                minHeight: '18px',
                maxWidth: '18px',
                maxHeight: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* JUGADORES/AS LIST */}
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

        <div style={{ marginTop: '12px' }}>
          <button 
            type="button"
            onClick={() => setShowAddPlayer(true)}
            style={{
              width: '100%',
              height: '44px',
              background: '#038c4c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '22px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(3,140,76,0.3)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#02733e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#038c4c'; }}
          >
            <UserPlus size={18} /> Añadir Jugador
          </button>
        </div>
      </div>

      {/* Guardar & Quitar Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
        <button 
          type="button"
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
            boxShadow: '0 2px 6px rgba(76,217,100,0.3)',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#3fc456'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4cd964'; }}
        >
          {saving ? "GUARDANDO..." : "GUARDAR"}
        </button>
        
        <button 
          type="button"
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
            boxShadow: '0 2px 6px rgba(255,59,48,0.3)',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e0352b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ff3b30'; }}
        >
          QUITAR DEL TORNEO
        </button>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 40px' }} className="anthropic-theme animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="secondary"
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Volver al Torneo
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#191919' }}>
            {teamName}
          </h2>
          <div style={{ width: '130px' }} />
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e6dfd3',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(25, 20, 15, 0.05)'
        }}>
          {formContent}
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
  }

  return (
    <div className="anthropic-theme animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: '#fcfbfa',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
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

      <div style={{ padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, position: 'relative' }}>
        {formContent}
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
