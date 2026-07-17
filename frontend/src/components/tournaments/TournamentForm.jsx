import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { X, Check, Trophy, Calendar, Users, Layers, FileText } from 'lucide-react';
import ZonesBuilder from './ZonesBuilder';

const TournamentForm = ({ tournament, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    category: tournament?.category || '',
    start_date: tournament?.start_date || '',
    end_date: tournament?.end_date || '',
    max_players_buena_fe: tournament?.max_players_buena_fe || 25,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name: formData.name,
      category: formData.category,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      max_players_buena_fe: formData.max_players_buena_fe,
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
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_players_buena_fe: formData.max_players_buena_fe,
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

  return (
    <div className="responsive-form-card anthropic-theme animate-fade-in">

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sección 1: Información del Torneo */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={14} /> Información del Torneo
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Nombre + Categoría */}
            <div className="responsive-form-grid">
              <div className="input-group">
                <label>Nombre del Torneo *</label>
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
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)', width: '100%' }}
                  >
                    <option value="" disabled>Selecciona...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fechas */}
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
                <label>Fecha Est. de Finalización</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            </div>

            {/* Límite Lista de Buena Fe */}
            <div className="responsive-form-grid">
              <div className="input-group">
                <label>Límite Lista Buena Fe *</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_players_buena_fe}
                    onChange={e => setFormData({ ...formData, max_players_buena_fe: parseInt(e.target.value) || '' })}
                    style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
              <div></div>
            </div>
          </div>
        </div>

        {/* Sección 2: Estructura de Zonas */}
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={14} /> Configuración de Zonas
          </h3>
          
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
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
          <button type="submit" disabled={submitting} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {tournamentId ? 'Guardar Cambios' : 'Crear Torneo'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TournamentForm;
