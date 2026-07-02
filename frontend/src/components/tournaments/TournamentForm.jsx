import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Trophy } from 'lucide-react';
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
      if (tournamentId) {
        res = await api.patch(`tournaments/${tournamentId}/`, payload);
      } else {
        res = await api.post('tournaments/', payload);
      }
      setTournamentId(res.data.id);
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
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: '20px', padding: '28px', marginBottom: '24px'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy size={20} color="#1a1512" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', color: 'var(--text-primary)' }}>
              {tournamentId ? 'Editar Torneo' : 'Nuevo Torneo'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0 }}>
              Completá la información del torneo y sus zonas
            </p>
          </div>
        </div>
        <button onClick={onClose} className="secondary" style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0 }}>
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Nombre + Categoría */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Nombre del Torneo *
            </label>
            <input
              type="text" required
              value={formData.name}
              onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }}
              placeholder="Ej. Torneo Apertura 2025"
              style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Categoría *
            </label>
            <select
              required
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={{ height: '40px', borderColor: 'var(--border-subtle)' }}
            >
              <option value="" disabled>Selecciona...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              style={{ height: '40px', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Fecha Est. de Finalización
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              style={{ height: '40px', borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>

        {/* Límite Lista de Buena Fe */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Límite Lista Buena Fe *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.max_players_buena_fe}
              onChange={e => setFormData({ ...formData, max_players_buena_fe: parseInt(e.target.value) || '' })}
              style={{ height: '40px', borderColor: 'var(--border-subtle)' }}
            />
          </div>
          <div></div>
        </div>

        {/* Zonas */}
        <div>
          <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Zonas *
            </label>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Cada zona genera su tabla de posiciones. Podés agregar equipos directamente desde cada zona.
            </p>
          </div>
          <ZonesBuilder
            zones={zones}
            onChange={setZones}
            categoryId={formData.category}
            savedZones={savedZones}
            onSaveFirst={saveAndGetZones}
          />
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(220,60,60,0.1)', color: '#e07070', fontSize: '13px', border: '1px solid rgba(220,60,60,0.2)' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
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
