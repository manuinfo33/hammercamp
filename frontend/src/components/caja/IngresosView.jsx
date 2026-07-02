import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import api from '../../api';

const formatARS = (num) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(num ?? 0);

const EMPTY_FORM = { concepto: '', monto: '', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0], descripcion: '', equipo: '' };

function TransaccionModal({ show, onClose, onSave, initial, tipo, equipos }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setForm(initial ?? { ...EMPTY_FORM, fecha: new Date().toISOString().split('T')[0] }); setError(''); }, [initial, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.concepto.trim() || !form.monto) { setError('Concepto y monto son obligatorios.'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form, tipo, monto: parseFloat(form.monto), equipo: form.equipo || null };
      if (initial?.id) await api.put(`transacciones/${initial.id}/`, payload);
      else await api.post('transacciones/', payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="form-container" style={{ width: '100%', maxWidth: '520px', margin: 0, animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{initial?.id ? 'Editar' : 'Nuevo'} {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</h2>
          <button className="secondary icon-only" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div style={{ background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.25)', borderRadius: 10, padding: '10px 14px', color: '#e07070', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Concepto *</label>
              <input placeholder="Ej: Cuota mensual" value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Monto *</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Método de Pago</label>
              <select value={form.metodo_pago} onChange={e => setForm(p => ({ ...p, metodo_pago: e.target.value }))}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="banco">🏦 Banco</option>
              </select>
            </div>
            <div className="input-group">
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label>Equipo (opcional)</label>
            <select value={form.equipo} onChange={e => setForm(p => ({ ...p, equipo: e.target.value }))}>
              <option value="">— Sin equipo —</option>
              {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Descripción adicional</label>
            <textarea placeholder="Notas opcionales..." value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 16px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ background: tipo === 'ingreso' ? 'linear-gradient(135deg,#6BCB77,#4aaa55)' : 'linear-gradient(135deg,#e07070,#c05050)', color: '#fff', border: 'none' }}>
              {loading ? '...' : <><Check size={14} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IngresosView({ onTransaccion }) {
  const [items, setItems] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtroMetodo, setFiltroMetodo] = useState('');

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ tipo: 'ingreso' });
    if (filtroMetodo) params.set('metodo_pago', filtroMetodo);
    api.get(`transacciones/?${params}`).then(r => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filtroMetodo]);
  useEffect(() => { api.get('teams/').then(r => setEquipos(r.data)); }, []);

  const handleSave = () => { setModal(false); setEditing(null); fetch(); onTransaccion?.(); };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingreso?')) return;
    await api.delete(`transacciones/${id}/`);
    fetch(); onTransaccion?.();
  };

  const total = items.reduce((acc, i) => acc + parseFloat(i.monto), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6BCB77' }}>↑ Ingresos</h2>
          {!loading && <span className="badge" style={{ background: 'rgba(107,203,119,0.12)', color: '#6BCB77', border: '1px solid rgba(107,203,119,0.2)' }}>{formatARS(total)}</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}
            style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', width: 'auto', background: 'var(--input-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            <option value="">Todos</option>
            <option value="efectivo">💵 Efectivo</option>
            <option value="banco">🏦 Banco</option>
          </select>
          <button onClick={() => { setEditing(null); setModal(true); }} style={{ background: 'linear-gradient(135deg,#6BCB77,#4aaa55)', color: '#fff', border: 'none' }}>
            <Plus size={14} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead><tr>
            <th>Fecha</th><th>Concepto</th><th>Método</th><th>Equipo</th><th>Monto</th><th></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No hay ingresos registrados</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{item.fecha}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {item.concepto}
                  {item.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.descripcion}</div>}
                </td>
                <td>
                  <span className="badge" style={item.metodo_pago === 'banco' ? { background: 'rgba(126,184,212,0.12)', color: '#7EB8D4', border: '1px solid rgba(126,184,212,0.2)' } : {}}>
                    {item.metodo_pago === 'banco' ? '🏦 Banco' : '💵 Efectivo'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.equipo_nombre ?? '—'}</td>
                <td style={{ color: '#6BCB77', fontWeight: 700 }}>{formatARS(item.monto)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="secondary icon-only" title="Editar" onClick={() => { setEditing(item); setModal(true); }}><Pencil size={13} /></button>
                    <button className="danger icon-only" title="Eliminar" onClick={() => handleDelete(item.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransaccionModal
        show={modal}
        onClose={() => { setModal(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        tipo="ingreso"
        equipos={equipos}
      />
    </div>
  );
}
