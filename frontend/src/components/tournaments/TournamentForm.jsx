import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { X, Check, Trophy, Calendar, Users, Layers, FileText, Plus, Minus, Clock, ListOrdered, CheckCircle } from 'lucide-react';
import ZonesBuilder from './ZonesBuilder';

const TournamentForm = ({ tournament, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isZonesOpen, setIsZonesOpen] = useState(false);
  const [isTiebreakerOpen, setIsTiebreakerOpen] = useState(false);
  const [isFairPlayOpen, setIsFairPlayOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    category: tournament?.category || '',
    start_date: tournament?.start_date || '',
    end_date: tournament?.end_date || '',
    max_players_buena_fe: tournament?.max_players_buena_fe || 25,
    half_duration: tournament?.half_duration !== undefined && tournament?.half_duration !== null ? tournament.half_duration : 40,
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
    fp_wo_pts: tournament?.fp_wo_pts !== undefined && tournament?.fp_wo_pts !== null ? tournament.fp_wo_pts : 50,
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
  const [saved, setSaved] = useState(!!tournament); // true if we already have an ID

  const isDraftCreated = useRef(false);
  const isSubmitted = useRef(false);
  const currentIdRef = useRef(null);

  // Sync tournamentId ref so it's always accessible in cleanup
  useEffect(() => {
    currentIdRef.current = tournamentId;
  }, [tournamentId]);

  useEffect(() => {
    return () => {
      // If we created a new draft during this session, but user didn't submit successfully, delete it.
      if (isDraftCreated.current && !isSubmitted.current && currentIdRef.current) {
        api.delete(`tournaments/${currentIdRef.current}/`).catch(err => {
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
    return isHalfDurationInvalid() || isFpYellowInvalid() || isFpRedInvalid() || isFpBlueInvalid() || isFpWoInvalid();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isAnyFieldInvalid()) {
      setError('Por favor, verificá que los campos numéricos contengan valores válidos.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name,
      category: formData.category,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      max_players_buena_fe: formData.max_players_buena_fe,
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
      zones_data: zones.map((z, i) => ({
        id: z.id,
        name: z.name,
        order: i,
      })),
    };

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
        setError('Ya existe un torneo con ese nombre.');
      } else {
        setError('Error al guardar el torneo. Verificá los datos.');
      }
      setSubmitting(false);
    }
  };

  const saveAndGetZones = async () => {
    if (!formData.name || !formData.category) return null;
    if (isAnyFieldInvalid()) {
      setError('Por favor, verificá que los campos numéricos contengan valores válidos.');
      return null;
    }

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_players_buena_fe: formData.max_players_buena_fe,
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
        zones_data: zones.map((z, i) => ({ id: z.id, name: z.name, order: i })),
      };
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
      setError('Para agregar equipos, completá el nombre y la categoría primero.');
      return null;
    }
  };

  const SECONDARY_TIEBREAKER_OPTIONS = [
    'Dif. de goles',
    'Goles a favor',
    'Fair Play',
    'Resultado entre ellos',
  ];

  return (
    <div className="responsive-form-card anthropic-theme animate-fade-in">

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sección 1: Información del Torneo */}
        <div>
          <div
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: isInfoOpen ? '16px' : '0', cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={14} /> Información del Torneo
            </h3>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsInfoOpen(!isInfoOpen); }}
              style={{
                width: '28px', height: '28px', padding: 0, minWidth: 'unset',
                borderRadius: '6px', border: '1px solid var(--border-subtle)',
                background: 'transparent', color: '#cc7a5c', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isInfoOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          {isInfoOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nombre + Categoría */}
              <div className="responsive-form-grid">
                <div className="input-group">
                  <label>Nombre del torneo *</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                    <input
                      type="text" required
                      value={formData.name}
                      onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }}
                      placeholder="Ej. Torneo Apertura 2025"
                      style={{ paddingLeft: '40px', height: '42px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Categoría *</label>
                  <div style={{ position: 'relative' }}>
                    <Layers size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c', pointerEvents: 'none', zIndex: 10 }} />
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
                    <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
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
                    <Clock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
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
                      placeholder="1 a 200"
                      style={{
                        paddingLeft: '40px',
                        height: '42px',
                        borderColor: isHalfDurationInvalid() ? '#e07070' : 'var(--border-subtle)'
                      }}
                    />
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
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <div
            onClick={() => setIsZonesOpen(!isZonesOpen)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: isZonesOpen ? '16px' : '0', cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={14} /> Configuración de Zonas y Equipos
            </h3>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsZonesOpen(!isZonesOpen); }}
              style={{
                width: '28px', height: '28px', padding: 0, minWidth: 'unset',
                borderRadius: '6px', border: '1px solid var(--border-subtle)',
                background: 'transparent', color: '#cc7a5c', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isZonesOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          {isZonesOpen && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Cada zona genera su propia tabla de posiciones. Podés agregar y distribuir equipos directamente desde cada zona.
              </p>
              
              <ZonesBuilder
                zones={zones}
                onChange={setZones}
                categoryId={formData.category}
                savedZones={savedZones}
                onSaveFirst={saveAndGetZones}
              />
            </div>
          )}
        </div>

        {/* Sección 3: Criterio de desempate */}
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <div
            onClick={() => setIsTiebreakerOpen(!isTiebreakerOpen)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: isTiebreakerOpen ? '16px' : '0', cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListOrdered size={14} /> Criterio de desempate
            </h3>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsTiebreakerOpen(!isTiebreakerOpen); }}
              style={{
                width: '28px', height: '28px', padding: 0, minWidth: 'unset',
                borderRadius: '6px', border: '1px solid var(--border-subtle)',
                background: 'transparent', color: '#cc7a5c', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isTiebreakerOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          {isTiebreakerOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                En caso de empate en puntos en la tabla de posiciones los equipos se ordenaran siguiendo los siguientes criterios.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* CRITERIO 1: Puntos (Fijo y No Modificable) */}
                <div className="input-group">
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    CRITERIO 1
                  </label>
                  <input
                    type="text"
                    value="Puntos"
                    disabled
                    readOnly
                    style={{
                      height: '42px',
                      borderColor: 'var(--border-subtle)',
                      width: '100%',
                      borderRadius: '8px',
                      background: '#f8f6f2',
                      color: '#666',
                      padding: '0 12px',
                      cursor: 'not-allowed',
                      fontWeight: '500'
                    }}
                  />
                </div>

                {/* CRITERIO 2 A 5 */}
                {[
                  { key: 'tiebreaker_2', label: 'CRITERIO 2' },
                  { key: 'tiebreaker_3', label: 'CRITERIO 3' },
                  { key: 'tiebreaker_4', label: 'CRITERIO 4' },
                  { key: 'tiebreaker_5', label: 'CRITERIO 5' },
                ].map(item => (
                  <div key={item.key} className="input-group">
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.label}
                    </label>
                    <select
                      value={formData[item.key]}
                      onChange={e => setFormData({ ...formData, [item.key]: e.target.value })}
                      style={{
                        height: '42px',
                        borderColor: 'var(--border-subtle)',
                        width: '100%',
                        borderRadius: '8px',
                        background: '#fff',
                        padding: '0 12px'
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

        {/* Sección 4: Puntaje fair play */}
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <div
            onClick={() => setIsFairPlayOpen(!isFairPlayOpen)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: isFairPlayOpen ? '16px' : '0', cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} /> Puntaje fair play
            </h3>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsFairPlayOpen(!isFairPlayOpen); }}
              style={{
                width: '28px', height: '28px', padding: 0, minWidth: 'unset',
                borderRadius: '6px', border: '1px solid var(--border-subtle)',
                background: 'transparent', color: '#cc7a5c', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isFairPlayOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          
          {isFairPlayOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                El puntaje de cada tarjeta se utiliza para definir las posiciones de los equipos en la tabla de Fair Play.
              </p>

              {/* Tarjetas: Amarilla y Roja */}
              <div className="responsive-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                {/* AMARILLA */}
                <div className="input-group">
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    AMARILLA
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888' }}>
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
                        paddingLeft: '45px',
                        height: '40px',
                        borderColor: isFpYellowInvalid() ? '#e07070' : 'var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  {isFpYellowInvalid() && (
                    <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Debe ingresar un número entre 1 y 300.
                    </span>
                  )}
                </div>

                {/* ROJA */}
                <div className="input-group">
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ROJA
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888' }}>
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
                        paddingLeft: '45px',
                        height: '40px',
                        borderColor: isFpRedInvalid() ? '#e07070' : 'var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  {isFpRedInvalid() && (
                    <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Debe ingresar un número entre 1 y 300.
                    </span>
                  )}
                </div>
              </div>

              {/* Habilitar tarjeta azul */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{
                      position: 'relative', width: '36px', height: '20px',
                      backgroundColor: formData.fp_blue_card_enabled ? '#0284c7' : '#d1d5db',
                      borderRadius: '10px', transition: 'background-color 0.2s', flexShrink: 0
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: formData.fp_blue_card_enabled ? '18px' : '2px',
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
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>
                      Habilitar tarjeta azul
                    </span>
                  </label>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                    Nuevo parámetro que sirve para sumar puntos en la tabla de Fair Play en base a alguna opcion a elección como (Indumentaria, Llegada tarde, Conducta, etc) elegida por la organización.
                  </p>
                </div>

                {formData.fp_blue_card_enabled && (
                  <div className="input-group" style={{ maxWidth: '180px', marginTop: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      AZUL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888' }}>
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
                          paddingLeft: '45px',
                          height: '38px',
                          borderColor: isFpBlueInvalid() ? '#e07070' : 'var(--border-subtle)',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    {isFpBlueInvalid() && (
                      <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Debe ingresar un número entre 1 y 300.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Habilitar puntos por Walkover (WO) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #e6dfd3' }}>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{
                      position: 'relative', width: '36px', height: '20px',
                      backgroundColor: formData.fp_wo_enabled ? '#0284c7' : '#d1d5db',
                      borderRadius: '10px', transition: 'background-color 0.2s', flexShrink: 0
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: formData.fp_wo_enabled ? '18px' : '2px',
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
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>
                      Habilitar puntos por Walkover (WO)
                    </span>
                  </label>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                    Sumar puntos en la tabla del Fair Play cuando el equipo no se presenta
                  </p>
                </div>

                {formData.fp_wo_enabled && (
                  <div className="input-group" style={{ maxWidth: '180px', marginTop: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PUNTOS POR WO
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#888' }}>
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
                          paddingLeft: '45px',
                          height: '38px',
                          borderColor: isFpWoInvalid() ? '#e07070' : 'var(--border-subtle)',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    {isFpWoInvalid() && (
                      <span style={{ color: '#e07070', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Debe ingresar un número entre 1 y 100.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.05)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e6dfd3' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '40px' }}>
            {saved ? 'Cerrar' : 'Cancelar'}
          </button>
          <button type="submit" disabled={submitting || isAnyFieldInvalid()} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {tournamentId ? 'Guardar Cambios' : 'Crear Torneo'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TournamentForm;
