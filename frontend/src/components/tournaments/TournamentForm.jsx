import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { X, Check, Trophy, Calendar, Users, Layers, FileText, Plus, Minus, Clock, ListOrdered, CheckCircle, UserCheck, Settings, AlertTriangle } from 'lucide-react';
import ZonesBuilder from './ZonesBuilder';

const TournamentForm = ({ tournament, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isZonesOpen, setIsZonesOpen] = useState(false);
  const [isBuenaFeOpen, setIsBuenaFeOpen] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [isTiebreakerOpen, setIsTiebreakerOpen] = useState(false);
  const [isFairPlayOpen, setIsFairPlayOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    category: tournament?.category || '',
    start_date: tournament?.start_date || '',
    end_date: tournament?.end_date || '',
    max_players_buena_fe: tournament?.max_players_buena_fe !== undefined && tournament?.max_players_buena_fe !== null ? String(tournament.max_players_buena_fe) : '25',
    pts_win: tournament?.pts_win !== undefined && tournament?.pts_win !== null ? tournament.pts_win : 3,
    pts_draw: tournament?.pts_draw !== undefined && tournament?.pts_draw !== null ? tournament.pts_draw : 1,
    pts_loss: tournament?.pts_loss !== undefined && tournament?.pts_loss !== null ? tournament.pts_loss : 0,
    yellow_cards_suspension: tournament?.yellow_cards_suspension !== undefined && tournament?.yellow_cards_suspension !== null ? String(tournament.yellow_cards_suspension) : 'none',
    description: tournament?.description || '',
    half_duration: tournament?.half_duration !== undefined && tournament?.half_duration !== null ? tournament.half_duration : 35,
    tiebreaker_1: 'Puntos',
    tiebreaker_2: tournament?.tiebreaker_2 || 'Dif. de goles',
    tiebreaker_3: tournament?.tiebreaker_3 || 'Goles a favor',
    tiebreaker_4: tournament?.tiebreaker_4 || 'Fair Play',
    tiebreaker_5: tournament?.tiebreaker_5 || 'Resultado entre ellos',
    fp_yellow_pts: tournament?.fp_yellow_pts !== undefined && tournament?.fp_yellow_pts !== null ? tournament.fp_yellow_pts : 1,
    fp_red_pts: tournament?.fp_red_pts !== undefined && tournament?.fp_red_pts !== null ? tournament.fp_red_pts : 2,
    fp_blue_card_enabled: tournament?.fp_blue_card_enabled || false,
    fp_blue_pts: tournament?.fp_blue_pts !== undefined && tournament?.fp_blue_pts !== null ? tournament.fp_blue_pts : 5,
    fp_wo_enabled: tournament?.fp_wo_enabled || false,
    fp_wo_pts: tournament?.fp_wo_pts !== undefined && tournament?.fp_wo_pts !== null ? tournament.fp_wo_pts : 4,
    is_active: tournament?.is_active !== undefined ? tournament.is_active : true,
  });
  const [zones, setZones] = useState(
    tournament?.zones?.length
      ? tournament.zones.map(z => ({ id: z.id, name: z.name, order: z.order }))
      : [{ id: null, name: 'Zona 1' }]
  );
  const [savedZones, setSavedZones] = useState(tournament?.zones || []);
  const [tournamentId, setTournamentId] = useState(tournament?.id || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState(false);
  const [saved, setSaved] = useState(!!tournament); // true if we already have an ID
  const isCreating = !tournament?.id;
  // Una vez creado el torneo, el Puntaje Fair Play y las Configuraciones Extras (puntos y amarillas)
  // quedan solo de lectura para no romper las tablas.
  const isRulesLocked = !!tournament?.id;

  const [reviewedSections, setReviewedSections] = useState({
    fairPlay: false,
    extras: false,
  });
  const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);

  const nameInputRef = useRef(null);
  const buenaFeRef = useRef(null);
  const [isBuenaFeDropdownOpen, setIsBuenaFeDropdownOpen] = useState(false);
  const isDraftCreated = useRef(false);
  const isSubmitted = useRef(false);
  const currentIdRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buenaFeRef.current && !buenaFeRef.current.contains(e.target)) {
        setIsBuenaFeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync tournamentId ref so it's always accessible in cleanup
  useEffect(() => {
    currentIdRef.current = tournamentId;
  }, [tournamentId]);

  useEffect(() => {
    return () => {
      // If we created a new draft during this session, but user didn't submit successfully, delete it.
      if (isDraftCreated.current && !isSubmitted.current && currentIdRef.current) {
        api.delete(`tournaments/${currentIdRef.current}/?draft=1`).catch(err => {
          console.error("Cleanup: Error deleting draft tournament:", err);
        });
      }
    };
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('categories/');
      setCategories(res.data);
      if (!tournament && res.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: res.data[0].id }));
      }
    } catch (e) { console.error(e); }
  };

  const isHalfDurationInvalid = () => {
    if (formData.half_duration === '' || formData.half_duration === null || formData.half_duration === undefined) return true;
    const val = Number(formData.half_duration);
    return isNaN(val) || val < 1 || val > 200;
  };

  const isMaxPlayersInvalid = () => {
    if (formData.max_players_buena_fe === '' || formData.max_players_buena_fe === null || formData.max_players_buena_fe === undefined) return false;
    const val = Number(formData.max_players_buena_fe);
    return isNaN(val) || val < 0 || val > 200;
  };

  const isFpYellowInvalid = () => {
    if (formData.fp_yellow_pts === '' || formData.fp_yellow_pts === null || formData.fp_yellow_pts === undefined) return true;
    const val = Number(formData.fp_yellow_pts);
    return isNaN(val) || val < 1 || val > 300;
  };

  const isFpRedInvalid = () => {
    if (formData.fp_red_pts === '' || formData.fp_red_pts === null || formData.fp_red_pts === undefined) return true;
    const val = Number(formData.fp_red_pts);
    return isNaN(val) || val < 1 || val > 300;
  };

  const isFpBlueInvalid = () => {
    if (!formData.fp_blue_card_enabled) return false;
    if (formData.fp_blue_pts === '' || formData.fp_blue_pts === null || formData.fp_blue_pts === undefined) return true;
    const val = Number(formData.fp_blue_pts);
    return isNaN(val) || val < 1 || val > 300;
  };

  const isFpWoInvalid = () => {
    if (!formData.fp_wo_enabled) return false;
    if (formData.fp_wo_pts === '' || formData.fp_wo_pts === null || formData.fp_wo_pts === undefined) return true;
    const val = Number(formData.fp_wo_pts);
    return isNaN(val) || val < 1 || val > 100;
  };

  const isAnyFieldInvalid = () => {
    return isHalfDurationInvalid() || isMaxPlayersInvalid() || isFpYellowInvalid() || isFpRedInvalid() || isFpBlueInvalid() || isFpWoInvalid();
  };

  const handleToggleSection = (sectionKey, currentOpen, setter) => {
    const nextOpen = !currentOpen;
    setter(nextOpen);
    if (nextOpen) {
      setReviewedSections(prev => ({ ...prev, [sectionKey]: true }));
    }
  };

  const buildPayload = () => ({
    name: formData.name,
    category: formData.category,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
    max_players_buena_fe: formData.max_players_buena_fe === 'unlimited' || formData.max_players_buena_fe === '' ? null : Number(formData.max_players_buena_fe),
    pts_win: Number(formData.pts_win),
    pts_draw: Number(formData.pts_draw),
    pts_loss: Number(formData.pts_loss),
    yellow_cards_suspension: formData.yellow_cards_suspension === 'none' || formData.yellow_cards_suspension === '' ? null : Number(formData.yellow_cards_suspension),
    description: formData.description || '',
    half_duration: Number(formData.half_duration),
    tiebreaker_1: 'Puntos',
    tiebreaker_2: formData.tiebreaker_2,
    tiebreaker_3: formData.tiebreaker_3,
    tiebreaker_4: formData.tiebreaker_4,
    tiebreaker_5: formData.tiebreaker_5,
    fp_yellow_pts: Number(formData.fp_yellow_pts),
    fp_red_pts: Number(formData.fp_red_pts),
    fp_blue_card_enabled: !!formData.fp_blue_card_enabled,
    fp_blue_pts: Number(formData.fp_blue_pts),
    fp_wo_enabled: !!formData.fp_wo_enabled,
    fp_wo_pts: Number(formData.fp_wo_pts),
    is_active: formData.is_active !== undefined ? !!formData.is_active : true,
    zones_data: zones.map((z, i) => ({
      id: z.id,
      name: z.name,
      order: i,
    })),
  });

  const executeSaveTournament = async () => {
    setSubmitting(true);
    const payload = buildPayload();

    try {
      let res;
      if (tournamentId) {
        res = await api.patch(`tournaments/${tournamentId}/`, payload);
      } else {
        res = await api.post('tournaments/', payload);
      }
      setTournamentId(res.data.id);

      // Mark as submitted so cleanup won't delete it
      isSubmitted.current = true;

      // Fetch the full tournament with zones to get the zone IDs
      const fullRes = await api.get(`tournaments/${res.data.id}/`);
      setSavedZones(fullRes.data.zones);
      setZones(fullRes.data.zones.map(z => ({ id: z.id, name: z.name, order: z.order })));
      setSaved(true);
      setSubmitting(false);
      onSuccess(fullRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.name) {
        setNameError(true);
        setIsInfoOpen(true);
        setError('Ya existe un torneo con ese nombre.');
        if (nameInputRef.current) nameInputRef.current.focus();
      } else if (err.response?.data?.detail) {
        setError(Array.isArray(err.response.data.detail) ? err.response.data.detail[0] : err.response.data.detail);
      } else {
        setError('Error al guardar el torneo. Verificá los datos.');
      }
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.name.trim()) {
      setNameError(true);
      setIsInfoOpen(true);
      setError('Debés ingresar un nombre para el torneo.');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    if (isAnyFieldInvalid()) {
      setError('Por favor, verificá que los campos numéricos contengan valores válidos.');
      return;
    }

    if (isCreating) {
      setShowCreateConfirmModal(true);
      return;
    }

    await executeSaveTournament();
  };

  const saveAndGetZones = async () => {
    if (!formData.name || !formData.name.trim()) {
      setNameError(true);
      setIsInfoOpen(true);
      setError('Debés ingresar un nombre para el torneo antes de poder seleccionar equipos.');
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return null;
    }

    if (!formData.category) {
      setError('Para agregar equipos, seleccioná primero una categoría.');
      return null;
    }

    if (isAnyFieldInvalid()) {
      setError('Por favor, verificá que los campos numéricos contengan valores válidos.');
      return null;
    }

    try {
      const payload = buildPayload();
      let res;
      const isNewDraft = !tournamentId;
      if (tournamentId) {
        res = await api.patch(`tournaments/${tournamentId}/`, payload);
      } else {
        res = await api.post('tournaments/', payload);
      }
      setTournamentId(res.data.id);
      if (isNewDraft) {
        isDraftCreated.current = true;
      }
      const fullRes = await api.get(`tournaments/${res.data.id}/`);
      setSavedZones(fullRes.data.zones);
      setZones(fullRes.data.zones.map(z => ({ id: z.id, name: z.name, order: z.order })));
      setSaved(true);
      return fullRes.data.zones;
    } catch (err) {
      console.error(err);
      if (err.response?.data?.name) {
        setNameError(true);
        setIsInfoOpen(true);
        setError('Ya existe un torneo con ese nombre.');
        if (nameInputRef.current) nameInputRef.current.focus();
      } else {
        setError('Para agregar equipos, completá el nombre y la categoría primero.');
      }
      return null;
    }
  };

  const SECONDARY_TIEBREAKER_OPTIONS = [
    'Dif. de goles',
    'Goles a favor',
    'Fair Play',
    'Resultado entre ellos',
  ];

  const renderPendingBadge = (sectionKey) => {
    if (!isCreating) return null;
    if (sectionKey !== 'fairPlay' && sectionKey !== 'extras') return null;
    if (reviewedSections[sectionKey]) return null;
    return (
      <span className="pending-section-btn">
        <span className="pending-section-dot" />
        Ver
      </span>
    );
  };

  return (
    <div className="responsive-form-card tf-form-wrapper anthropic-theme animate-fade-in">
      <style>{`
        @keyframes pulseRedBtn {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45);
          }
          50% {
            opacity: 0.65;
            box-shadow: 0 0 0 5px rgba(220, 38, 38, 0);
          }
        }
        .pending-section-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          background: #fee2e2;
          border: 1px solid #ef4444;
          color: #dc2626;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          animation: pulseRedBtn 1.5s infinite ease-in-out;
          flex-shrink: 0;
        }
        .pending-section-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dc2626;
        }
        .tf-form-wrapper {
          padding: 20px !important;
        }
        .tf-form-wrapper input,
        .tf-form-wrapper select,
        .tf-form-wrapper textarea {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        .tf-sections-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tf-section-card {
          background: #ffffff;
          border: 1px solid #e7e5e0;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .tf-section-card.is-open {
          border-color: #dfcbbd;
          box-shadow: 0 6px 20px rgba(28, 25, 23, 0.04);
        }
        .tf-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          cursor: pointer;
          user-select: none;
          background: #fcfbfa;
          transition: background 0.15s ease;
        }
        .tf-section-card.is-open .tf-section-header {
          background: #faf6f3;
          border-bottom: 1px solid #efe8e2;
        }
        .tf-section-header:hover {
          background: #f7f3ef;
        }
        .tf-section-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .tf-section-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #f5ebe4;
          border: 1px solid #e8d5c8;
          color: #cc7a5c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tf-section-card.is-open .tf-section-icon {
          background: #cc7a5c;
          border-color: #cc7a5c;
          color: #ffffff;
        }
        .tf-section-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          min-width: 0;
        }
        .tf-section-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #1c1d21;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin: 0;
          line-height: 1.25;
        }
        .tf-section-card.is-open .tf-section-title {
          color: #b86344;
        }
        .tf-section-toggle-btn {
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          min-width: unset !important;
          border-radius: 8px !important;
          border: 1px solid #e4e2dd !important;
          background: #ffffff !important;
          color: #cc7a5c !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .tf-section-card.is-open .tf-section-toggle-btn {
          background: #f5ebe4 !important;
          border-color: #dfcbbd !important;
        }
        .tf-section-body {
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #ffffff;
        }
        .tf-helper-banner {
          font-size: 13px;
          color: #52525b;
          background: #f8f7f4;
          border: 1px solid #eceae4;
          border-radius: 10px;
          padding: 10px 12px;
          margin: 0;
          line-height: 1.45;
        }
        .tf-input-suffix {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11.5px;
          font-weight: 700;
          color: #71717a;
          background: #ffffff;
          border: 1px solid #e7e5e0;
          padding: 2px 8px;
          border-radius: 6px;
          pointer-events: none;
        }
        .tf-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .tf-card-box {
          background: #ffffff;
          border: 1px solid #e7e5e0;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tf-card-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          font-weight: 800;
          color: #27272a;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .tf-soccer-card-icon {
          width: 12px;
          height: 16px;
          border-radius: 3px;
          display: inline-block;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .tf-soccer-card-icon.yellow {
          background: #facc15;
          border: 1px solid #eab308;
        }
        .tf-soccer-card-icon.red {
          background: #ef4444;
          border: 1px solid #dc2626;
        }
        .tf-soccer-card-icon.blue {
          background: #0ea5e9;
          border: 1px solid #0284c7;
        }
        .tf-toggle-card {
          background: #ffffff;
          border: 1px solid #e7e5e0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .tf-toggle-card.is-active {
          background: #ffffff;
          border-color: #e7e5e0;
        }
        .tf-pts-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .tf-pts-card {
          background: #ffffff;
          border: 1px solid #e7e5e0;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tf-pts-card label {
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #52525b !important;
          margin: 0 !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tf-tiebreaker-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tf-rank-badge {
          width: 36px;
          height: 40px;
          border-radius: 9px;
          background: #f5ebe4;
          border: 1px solid #e5d2c5;
          color: #b86344;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tf-rank-badge.first {
          background: #1c1d21;
          border-color: #1c1d21;
          color: #facc15;
        }
        .tf-actions-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          margin-top: 4px;
          border-top: 1px solid #e4e4e7;
        }
        @media (max-width: 768px) {
          .tf-form-wrapper {
            padding: 12px !important;
            border-radius: 16px !important;
          }
          .tf-sections-stack {
            gap: 10px;
          }
          .tf-section-header {
            padding: 11px 13px;
            gap: 10px;
          }
          .tf-section-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
          .tf-section-title {
            font-size: 12px;
          }
          .tf-section-body {
            padding: 14px 13px;
            gap: 14px;
          }
          .tf-pts-3col {
            gap: 8px;
          }
          .tf-pts-card {
            padding: 8px;
          }
          .tf-pts-card select {
            padding: 0 8px !important;
            font-size: 13px !important;
            height: 38px !important;
          }
          .tf-actions-footer {
            justify-content: stretch;
            gap: 10px;
          }
          .tf-actions-footer > button {
            flex: 1;
            height: 46px !important;
            justify-content: center;
            font-size: 13.5px !important;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit} className="tf-sections-stack">

        {/* Sección 1: Información del Torneo */}
        <div className={`tf-section-card ${isInfoOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('info', isInfoOpen, setIsInfoOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <Trophy size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Información del Torneo</h3>
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('info', isInfoOpen, setIsInfoOpen); }}
              aria-label={isInfoOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isInfoOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isInfoOpen && (
            <div className="tf-section-body">
              {/* Nombre + Categoría */}
              <div className="responsive-form-grid">
                <div className="input-group">
                  <label>Nombre del torneo *</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <input
                      ref={nameInputRef}
                      type="text" required
                      value={formData.name}
                      onChange={e => {
                        setFormData({ ...formData, name: e.target.value });
                        setError('');
                        if (e.target.value.trim()) setNameError(false);
                      }}
                      placeholder="Ej. Torneo Apertura 2026"
                      style={{
                        paddingLeft: '40px',
                        height: '42px',
                        borderColor: nameError ? '#e07070' : (error ? '#e07070' : 'var(--border-subtle)'),
                        boxShadow: nameError ? '0 0 0 3px rgba(224, 112, 112, 0.25)' : 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                  {nameError && (
                    <span style={{ color: '#e07070', fontSize: '12px', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                      Debés ingresar un nombre para el torneo antes de poder seleccionar equipos.
                    </span>
                  )}
                </div>
                <div className="input-group">
                  <label>Categoría *</label>
                  <div style={{ position: 'relative' }}>
                    <Layers size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none', zIndex: 10 }} />
                    <select
                      required
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === 'CREATE_NEW') {
                          navigate('/categorias', { state: { openForm: true } });
                          return;
                        }
                        setFormData({ ...formData, category: e.target.value });
                      }}
                      style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)', width: '100%' }}
                    >
                      <option value="" disabled>Selecciona...</option>
                      {categories.length === 0 && (
                        <option value="CREATE_NEW" style={{ fontWeight: '600', color: '#cc7a5c' }}>
                          + Crea una Categoría nueva
                        </option>
                      )}
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fecha de Inicio + Duración de cada Tiempo */}
              <div className="responsive-form-grid">
                <div className="input-group">
                  <label>Fecha de Inicio</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Duración de cada Tiempo *</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <input
                      type="number"
                      required
                      min={1}
                      max={200}
                      value={formData.half_duration}
                      onChange={e => {
                        setFormData({ ...formData, half_duration: e.target.value });
                        setError('');
                      }}
                      placeholder="Ej. 25"
                      style={{
                        paddingLeft: '40px',
                        paddingRight: '56px',
                        height: '42px',
                        borderColor: isHalfDurationInvalid() ? '#e07070' : 'var(--border-subtle)'
                      }}
                    />
                    <span className="tf-input-suffix">min</span>
                  </div>
                  {isHalfDurationInvalid() && (
                    <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      Debe ingresar un número entre 1 y 200.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección 2: Configuración de Zonas y Equipos */}
        <div className={`tf-section-card ${isZonesOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('zones', isZonesOpen, setIsZonesOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <Layers size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Configuración de Zonas y Equipos</h3>
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('zones', isZonesOpen, setIsZonesOpen); }}
              aria-label={isZonesOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isZonesOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isZonesOpen && (
            <div className="tf-section-body">
              <ZonesBuilder
                zones={zones}
                onChange={setZones}
                categoryId={formData.category}
                savedZones={savedZones}
                tournamentId={tournamentId}
                onSaveFirst={saveAndGetZones}
                onZoneDeleted={(deletedZoneId) => {
                  setSavedZones(prev => prev.filter(z => z.id !== deletedZoneId));
                }}
              />
            </div>
          )}
        </div>

        {/* Sección 3: Lista de Buena Fe */}
        <div className={`tf-section-card ${isBuenaFeOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('buenaFe', isBuenaFeOpen, setIsBuenaFeOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <UserCheck size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Lista de Buena Fe</h3>
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('buenaFe', isBuenaFeOpen, setIsBuenaFeOpen); }}
              aria-label={isBuenaFeOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isBuenaFeOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isBuenaFeOpen && (
            <div className="tf-section-body">
              <div className="input-group">
                <label>Cupo máximo de jugadores por equipo</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={formData.max_players_buena_fe}
                    onChange={e => {
                      setFormData({ ...formData, max_players_buena_fe: e.target.value });
                      setError('');
                    }}
                    style={{
                      paddingLeft: '40px',
                      paddingRight: '88px',
                      height: '42px',
                      borderColor: isMaxPlayersInvalid() ? '#e07070' : 'var(--border-subtle)'
                    }}
                  />
                  <span className="tf-input-suffix">jugadores</span>
                </div>
                {isMaxPlayersInvalid() && (
                  <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                    Debe ingresar un número entre 0 y 200.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sección 4: Puntaje Fair Play */}
        <div className={`tf-section-card ${isFairPlayOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('fairPlay', isFairPlayOpen, setIsFairPlayOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <CheckCircle size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Puntaje Fair Play</h3>
                {renderPendingBadge('fairPlay')}
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('fairPlay', isFairPlayOpen, setIsFairPlayOpen); }}
              aria-label={isFairPlayOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isFairPlayOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isFairPlayOpen && (
            <div className="tf-section-body">
              <fieldset disabled={isRulesLocked} className={isRulesLocked ? 'locked-rules-fieldset' : ''} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {isRulesLocked && (
                    <div className="locked-rules-notice">
                      El puntaje Fair Play no puede modificarse una vez creado el torneo.
                    </div>
                  )}

                  {/* Tarjetas: Amarilla y Roja lado a lado incluso en celular */}
                  <div className="tf-cards-grid">
                    {/* AMARILLA */}
                    <div className="tf-card-box">
                      <div className="tf-card-label">
                        <span className="tf-soccer-card-icon yellow" />
                        Amarilla
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12.5px', fontWeight: '600', color: '#71717a' }}>
                          pts:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={formData.fp_yellow_pts}
                          onChange={e => {
                            setFormData({ ...formData, fp_yellow_pts: e.target.value });
                            setError('');
                          }}
                          style={{
                            paddingLeft: '44px',
                            height: '40px',
                            borderColor: isFpYellowInvalid() ? '#e07070' : 'var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            background: '#ffffff'
                          }}
                        />
                      </div>
                      {isFpYellowInvalid() && (
                        <span style={{ color: '#e07070', fontSize: '11.5px', display: 'block' }}>
                          Entre 1 y 300.
                        </span>
                      )}
                    </div>

                    {/* ROJA */}
                    <div className="tf-card-box">
                      <div className="tf-card-label">
                        <span className="tf-soccer-card-icon red" />
                        Roja
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12.5px', fontWeight: '600', color: '#71717a' }}>
                          pts:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={formData.fp_red_pts}
                          onChange={e => {
                            setFormData({ ...formData, fp_red_pts: e.target.value });
                            setError('');
                          }}
                          style={{
                            paddingLeft: '44px',
                            height: '40px',
                            borderColor: isFpRedInvalid() ? '#e07070' : 'var(--border-subtle)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            background: '#ffffff'
                          }}
                        />
                      </div>
                      {isFpRedInvalid() && (
                        <span style={{ color: '#e07070', fontSize: '11.5px', display: 'block' }}>
                          Entre 1 y 300.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Habilitar tarjeta azul */}
                  <div className={`tf-toggle-card ${formData.fp_blue_card_enabled ? 'is-active' : ''}`}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tf-soccer-card-icon blue" />
                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#1c1d21' }}>
                          Habilitar Tarjeta Azul
                        </span>
                      </div>
                      <div style={{
                        position: 'relative', width: '40px', height: '22px',
                        backgroundColor: formData.fp_blue_card_enabled ? '#0284c7' : '#d1d5db',
                        borderRadius: '999px', transition: 'background-color 0.2s', flexShrink: 0
                      }}>
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: formData.fp_blue_card_enabled ? '21px' : '3px',
                          width: '16px', height: '16px', backgroundColor: '#ffffff',
                          borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                        <input
                          type="checkbox"
                          checked={formData.fp_blue_card_enabled}
                          onChange={e => setFormData({ ...formData, fp_blue_card_enabled: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                      </div>
                    </label>

                    {formData.fp_blue_card_enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '8px', borderTop: '1px solid #e7e5e0' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1c1d21', textTransform: 'uppercase' }}>
                          Puntos Tarjeta Azul
                        </span>
                        <div style={{ position: 'relative', width: '120px' }}>
                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b' }}>
                            pts:
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={300}
                            value={formData.fp_blue_pts}
                            onChange={e => {
                              setFormData({ ...formData, fp_blue_pts: e.target.value });
                              setError('');
                            }}
                            style={{
                              paddingLeft: '38px',
                              height: '36px',
                              borderColor: isFpBlueInvalid() ? '#e07070' : 'var(--border-subtle)',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: '700',
                              background: '#ffffff'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {formData.fp_blue_card_enabled && isFpBlueInvalid() && (
                      <span style={{ color: '#e07070', fontSize: '12px', display: 'block' }}>
                        Debe ingresar un número entre 1 y 300.
                      </span>
                    )}
                  </div>

                  {/* Habilitar Walkover (WO) */}
                  <div className={`tf-toggle-card ${formData.fp_wo_enabled ? 'is-active' : ''}`}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#1c1d21' }}>
                          Puntos por Walkover (WO)
                        </span>
                      </div>
                      <div style={{
                        position: 'relative', width: '40px', height: '22px',
                        backgroundColor: formData.fp_wo_enabled ? '#0284c7' : '#d1d5db',
                        borderRadius: '999px', transition: 'background-color 0.2s', flexShrink: 0
                      }}>
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: formData.fp_wo_enabled ? '21px' : '3px',
                          width: '16px', height: '16px', backgroundColor: '#ffffff',
                          borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                        <input
                          type="checkbox"
                          checked={formData.fp_wo_enabled}
                          onChange={e => setFormData({ ...formData, fp_wo_enabled: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                      </div>
                    </label>

                    {formData.fp_wo_enabled && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '8px', borderTop: '1px solid #e7e5e0' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1c1d21', textTransform: 'uppercase' }}>
                          Puntos por WO
                        </span>
                        <div style={{ position: 'relative', width: '120px' }}>
                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b' }}>
                            pts:
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={formData.fp_wo_pts}
                            onChange={e => {
                              setFormData({ ...formData, fp_wo_pts: e.target.value });
                              setError('');
                            }}
                            style={{
                              paddingLeft: '38px',
                              height: '36px',
                              borderColor: isFpWoInvalid() ? '#e07070' : 'var(--border-subtle)',
                              borderRadius: '8px',
                              fontSize: '13.5px',
                              fontWeight: '700',
                              background: '#ffffff'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {formData.fp_wo_enabled && isFpWoInvalid() && (
                      <span style={{ color: '#e07070', fontSize: '12px', display: 'block' }}>
                        Debe ingresar un número entre 1 y 100.
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        {/* Sección 5: Configuraciones Extras */}
        <div className={`tf-section-card ${isExtrasOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('extras', isExtrasOpen, setIsExtrasOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <Settings size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Configuraciones Extras</h3>
                {renderPendingBadge('extras')}
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('extras', isExtrasOpen, setIsExtrasOpen); }}
              aria-label={isExtrasOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isExtrasOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isExtrasOpen && (
            <div className="tf-section-body">
              <fieldset disabled={isRulesLocked} className={isRulesLocked ? 'locked-rules-fieldset' : ''} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isRulesLocked && (
                  <div className="locked-rules-notice">
                    Los puntos por partido y las amarillas para suspensión no pueden modificarse una vez creado el torneo.
                  </div>
                )}

                {/* Puntos por Partido en grilla compacta de 3 columnas incluso en celular */}
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Puntaje por Resultado
                  </span>
                  <div className="tf-pts-3col">
                    <div className="tf-pts-card">
                      <label>Ganado</label>
                      <select
                        value={formData.pts_win}
                        onChange={e => setFormData({ ...formData, pts_win: Number(e.target.value) })}
                        style={{ height: '40px', borderColor: 'var(--border-subtle)', width: '100%', background: '#fff', fontWeight: '700' }}
                      >
                        {[1, 2, 3, 4, 5].map(pts => (
                          <option key={pts} value={pts}>{pts} {pts === 1 ? 'pt' : 'pts'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="tf-pts-card">
                      <label>Empatado</label>
                      <select
                        value={formData.pts_draw}
                        onChange={e => setFormData({ ...formData, pts_draw: Number(e.target.value) })}
                        style={{ height: '40px', borderColor: 'var(--border-subtle)', width: '100%', background: '#fff', fontWeight: '700' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map(pts => (
                          <option key={pts} value={pts}>{pts} {pts === 1 ? 'pt' : 'pts'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="tf-pts-card">
                      <label>Perdido</label>
                      <select
                        value={formData.pts_loss}
                        onChange={e => setFormData({ ...formData, pts_loss: Number(e.target.value) })}
                        style={{ height: '40px', borderColor: 'var(--border-subtle)', width: '100%', background: '#fff', fontWeight: '700' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map(pts => (
                          <option key={pts} value={pts}>{pts} {pts === 1 ? 'pt' : 'pts'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Amarillas para suspensión */}
                <div className="input-group">
                  <label>Acumulación de amarillas para suspensión</label>
                  <select
                    value={formData.yellow_cards_suspension}
                    onChange={e => setFormData({ ...formData, yellow_cards_suspension: e.target.value })}
                    style={{ height: '42px', borderColor: 'var(--border-subtle)', width: '100%' }}
                  >
                    <option value="none">Sin suspensión por acumulación</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={String(num)}>{num} {num === 1 ? 'amarilla' : 'amarillas'}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {/* Descripción / Modalidad del torneo */}
              <div className="input-group">
                <label>Descripción / Modalidad del torneo (opcional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingresá detalles de premiación, formato de juego o reglas específicas..."
                  style={{
                    padding: '12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sección 6: Criterio de Desempate */}
        <div className={`tf-section-card ${isTiebreakerOpen ? 'is-open' : ''}`}>
          <div
            className="tf-section-header"
            onClick={() => handleToggleSection('tiebreaker', isTiebreakerOpen, setIsTiebreakerOpen)}
          >
            <div className="tf-section-header-left">
              <div className="tf-section-icon">
                <ListOrdered size={16} />
              </div>
              <div className="tf-section-title-row">
                <h3 className="tf-section-title">Criterio de Desempate</h3>
              </div>
            </div>
            <button
              type="button"
              className="tf-section-toggle-btn"
              onClick={(e) => { e.stopPropagation(); handleToggleSection('tiebreaker', isTiebreakerOpen, setIsTiebreakerOpen); }}
              aria-label={isTiebreakerOpen ? 'Contraer sección' : 'Expandir sección'}
            >
              {isTiebreakerOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isTiebreakerOpen && (
            <div className="tf-section-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* CRITERIO 1: Puntos (Fijo y No Modificable) */}
                <div className="tf-tiebreaker-row">
                  <div className="tf-rank-badge first" title="Primer criterio obligatorio">1°</div>
                  <input
                    type="text"
                    value="Puntos"
                    disabled
                    readOnly
                    style={{
                      height: '40px',
                      borderColor: 'var(--border-subtle)',
                      width: '100%',
                      borderRadius: '9px',
                      background: '#ffffff',
                      color: '#1c1d21',
                      padding: '0 12px',
                      cursor: 'not-allowed',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* CRITERIO 2 A 5 */}
                {[
                  { key: 'tiebreaker_2', rank: '2°' },
                  { key: 'tiebreaker_3', rank: '3°' },
                  { key: 'tiebreaker_4', rank: '4°' },
                  { key: 'tiebreaker_5', rank: '5°' },
                ].map(item => (
                  <div key={item.key} className="tf-tiebreaker-row">
                    <div className="tf-rank-badge">{item.rank}</div>
                    <select
                      value={formData[item.key]}
                      onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                      style={{
                        height: '40px',
                        borderColor: 'var(--border-subtle)',
                        width: '100%',
                        borderRadius: '9px',
                        background: '#fff',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {SECONDARY_TIEBREAKER_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.08)', color: '#b85d3d', fontSize: '13px', fontWeight: '600', border: '1px solid #e5c5bb' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="tf-actions-footer">
          <button type="button" onClick={onClose} className="secondary" style={{ height: '42px' }}>
            {!isCreating && saved ? 'Cerrar' : 'Cancelar'}
          </button>
          <button type="submit" disabled={submitting || isAnyFieldInvalid()} style={{ height: '42px' }}>
            {submitting ? '...' : <><Check size={18} /> {!isCreating ? 'Guardar Cambios' : 'Crear Torneo'}</>}
          </button>
        </div>
      </form>

      {/* Modal de Alerta con diseño estándar del sistema antes de crear el torneo */}
      {showCreateConfirmModal && createPortal(
        <div
          className="modal-backdrop-custom premium-modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setShowCreateConfirmModal(false)}
        >
          <div
            className="modal-card-custom premium-modal-card"
            style={{
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
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div className="gx-icon-box sm amber" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', color: '#1c1d21', minWidth: 0 }}>
                  Atención
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateConfirmModal(false)}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#444', margin: 0, lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas crear el torneo ahora?
            </p>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: '#92400e',
              lineHeight: '1.45',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}>
              <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                Recordá revisar antes las demás secciones (<strong>Puntaje Fair Play</strong> y <strong>Configuraciones Extras</strong>), ya que una vez creado el torneo esas opciones no se podrán modificar.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowCreateConfirmModal(false)}
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
                  transition: 'all 0.15s ease',
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
                Revisar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setShowCreateConfirmModal(false);
                  await executeSaveTournament();
                }}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  background: 'var(--gx-primary)',
                  color: '#151515',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {submitting ? 'Creando...' : 'Crear Torneo'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TournamentForm;
