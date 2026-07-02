import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api';

const formatARS = (num) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(num ?? 0);

const ESTADO_CONFIG = {
  al_dia:     { label: 'Al día',      color: '#6BCB77', bg: 'rgba(107,203,119,0.12)', icon: CheckCircle },
  debe:       { label: 'Debe',        color: '#e07070', bg: 'rgba(224,112,112,0.12)', icon: AlertCircle },
  suspendido: { label: 'Suspendido',  color: '#D4B896', bg: 'rgba(212,184,150,0.12)', icon: UserCheck  },
};

function EditSaldoModal({ show, onClose, onSave, item }) {
  const [form, setForm] = useState({ saldo: '', estado: 'al_dia', observaciones: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) setForm({ saldo: item.saldo ?? 0, estado: item.estado ?? 'al_dia', observaciones: item.observaciones ?? '' });
    setError('');
  }, [item, show]);

  if (!show || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.patch(`saldo-socios/${item.id}/`, { saldo: parseFloat(form.saldo), estado: form.estado, observaciones: form.observaciones });
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="form-container" style={{ width: '100%', maxWidth: '440px', margin: 0, animation: 'fadeIn 0.25s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Editar Saldo — {item.delegate_nombre}</h2>
          <button className="secondary icon-only" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div style={{ background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.25)', borderRadius: 10, padding: '10px 14px', color: '#e07070', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Saldo</label>
              <input type="number" step="0.01" value={form.saldo} onChange={e => setForm(p => ({ ...p, saldo: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Estado</label>
              <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}>
                <option value="al_dia">✅ Al día</option>
                <option value="debe">⚠️ Debe</option>
                <option value="suspendido">🚫 Suspendido</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 16px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', minHeight: '70px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}><Check size={14} /> {loading ? '...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SaldoSociosView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  const fetch = () => {
    setLoading(true);
    api.get('saldo-socios/').then(r => {
      let data = r.data;
      if (filtroEstado) data = data.filter(d => d.estado === filtroEstado);
      setItems(data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filtroEstado]);

  const handleSave = () => { setModal(false); setEditing(null); fetch(); };

  const totalDebe = items.filter(i => i.saldo < 0).reduce((a, i) => a + parseFloat(i.saldo), 0);
  const totalFavor = items.filter(i => i.saldo >= 0).reduce((a, i) => a + parseFloat(i.saldo), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-beige)' }}>👥 Saldo de Socios</h2>
          {!loading && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge" style={{ background: 'rgba(107,203,119,0.12)', color: '#6BCB77', border: '1px solid rgba(107,203,119,0.2)' }}>A favor: {formatARS(totalFavor)}</span>
              <span className="badge" style={{ background: 'rgba(224,112,112,0.12)', color: '#e07070', border: '1px solid rgba(224,112,112,0.2)' }}>Deben: {formatARS(Math.abs(totalDebe))}</span>
            </div>
          )}
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', width: 'auto', background: 'var(--input-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
          <option value="">Todos los estados</option>
          <option value="al_dia">✅ Al día</option>
          <option value="debe">⚠️ Debe</option>
          <option value="suspendido">🚫 Suspendido</option>
        </select>
      </div>

      {items.length === 0 && !loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No hay socios registrados en el sistema de saldos.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Los saldos se crean automáticamente al registrar delegados. Si no aparecen, podés crearlos desde el panel de administración.
          </p>
        </div>
      )}

      {(items.length > 0 || loading) && (
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Socio / Delegado</th><th>Equipo</th><th>Estado</th><th>Saldo</th><th>Observaciones</th><th></th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</td></tr>
              ) : items.map(item => {
                const cfg = ESTADO_CONFIG[item.estado] ?? ESTADO_CONFIG.al_dia;
                const isNeg = parseFloat(item.saldo) < 0;
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.delegate_nombre}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.equipo_nombre ?? '—'}</td>
                    <td>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ color: isNeg ? '#e07070' : '#6BCB77', fontWeight: 700 }}>{formatARS(item.saldo)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '200px' }}>
                      {item.observaciones || '—'}
                    </td>
                    <td>
                      <button className="secondary icon-only" title="Editar saldo" onClick={() => { setEditing(item); setModal(true); }}><Pencil size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EditSaldoModal show={modal} onClose={() => { setModal(false); setEditing(null); }} onSave={handleSave} item={editing} />
    </div>
  );
}
