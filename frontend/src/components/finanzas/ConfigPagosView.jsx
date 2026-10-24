import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, History } from 'lucide-react';
import api from '../../api';
import { ars, num, errMsg, CATEGORIES, Field, Modal, Empty, Badge } from './common';

const today = () => new Date().toISOString().slice(0, 10);
const catLabel = (c) => CATEGORIES.find(([k]) => k === c)?.[1] || c;

function Fees() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [effective, setEffective] = useState(today());
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api.get('finances/tournament-fees/').then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const save = async (row) => {
    try {
      const r = await api.post('finances/tournament-fees/', { tournament: row.tournament, amount: draft[row.tournament], effective_from: effective });
      setRows(r.data);
      setDraft((d) => { const n = { ...d }; delete n[row.tournament]; return n; });
      setMsg(`Arancel de ${row.tournament_name} actualizado.`);
    } catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <section className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Arancel por fecha — Equipos</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>Cuánto paga cada equipo por fecha según el torneo. Los aumentos quedan en el historial.</p>
        </div>
        <Field label="Vigente desde"><input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} /></Field>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{msg}</div>}
      {rows.length === 0 ? <Empty>No hay torneos creados.</Empty> : rows.map((r) => {
        const dirty = draft[r.tournament] !== undefined && num(draft[r.tournament]) !== num(r.amount);
        return (
          <div key={r.tournament} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <strong style={{ flex: '1 1 200px', fontSize: 14 }}>{r.tournament_name}</strong>
            <input type="number" min="0" style={{ width: 150 }} value={draft[r.tournament] ?? r.amount}
              onChange={(e) => setDraft({ ...draft, [r.tournament]: e.target.value })} />
            <button type="button" disabled={!dirty} onClick={() => save(r)}><Save size={15} /> Guardar</button>
          </div>
        );
      })}
    </section>
  );
}

function Staff() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get('finances/staff-rates/').then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      const body = { ...form, amount: num(form.amount) };
      form.id ? await api.put(`finances/staff-rates/${form.id}/`, body) : await api.post('finances/staff-rates/', body);
      setForm(null); setErr(''); load();
    } catch (e) { setErr(errMsg(e)); }
  };
  const del = async (r) => { if (window.confirm(`¿Eliminar "${r.name}"?`)) { await api.delete(`finances/staff-rates/${r.id}/`); load(); } };

  return (
    <section className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Tarifas de servicios y personal</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>Árbitros se cobran por partido; el resto por jornada. “Auto” los agrega solos a cada planilla.</p>
        </div>
        <button type="button" onClick={() => setForm({ name: '', category: 'otro', unit: 'jornada', amount: '', auto_include: false, active: true, effective_from: today() })}><Plus size={16} /> Nueva tarifa</button>
      </div>
      {rows.length === 0 ? <Empty>Todavía no cargaste tarifas.</Empty> : rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', opacity: r.active ? 1 : 0.5 }}>
          <div style={{ flex: '1 1 200px' }}>
            <strong style={{ fontSize: 14 }}>{r.name}</strong>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <Badge>{catLabel(r.category)}</Badge>
              <Badge tone="#2563eb">{r.unit === 'partido' ? 'por partido' : 'por jornada'}</Badge>
              {r.auto_include && <Badge tone="#059669">Auto</Badge>}
            </div>
          </div>
          <strong>{ars(r.amount)}</strong>
          <button type="button" className="secondary icon-only" onClick={() => setForm({ ...r, effective_from: today() })}><Pencil size={15} /></button>
          <button type="button" className="danger icon-only" onClick={() => del(r)}><Trash2 size={15} /></button>
        </div>
      ))}
      {form && (
        <Modal title={form.id ? 'Editar tarifa' : 'Nueva tarifa'} onClose={() => setForm(null)}>
          <Field label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ambulancia, Planillero…" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Categoría"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, unit: e.target.value === 'arbitro' ? 'partido' : form.unit })}>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Se paga"><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="jornada">Por jornada</option><option value="partido">Por partido</option></select></Field>
            <Field label="Monto"><input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Vigente desde"><input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} /></Field>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.auto_include} onChange={(e) => setForm({ ...form, auto_include: e.target.checked })} /> Agregar automáticamente a cada planilla de fecha</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Activa</label>
          {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
          <button type="button" onClick={submit} disabled={!form.name}><Save size={15} /> Guardar</button>
        </Modal>
      )}
    </section>
  );
}

function Partners() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const load = useCallback(() => api.get('finances/partners/').then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    form.id ? await api.put(`finances/partners/${form.id}/`, form) : await api.post('finances/partners/', form);
    setForm(null); load();
  };
  const del = async (p) => { if (window.confirm(`¿Eliminar a ${p.name}?`)) { await api.delete(`finances/partners/${p.id}/`); load(); } };
  return (
    <section className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Socios</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>Quienes pueden poner dinero propio y recibir reintegros (no necesitan usuario).</p>
        </div>
        <button type="button" onClick={() => setForm({ name: '', alias: '', phone: '', active: true })}><Plus size={16} /> Nuevo socio</button>
      </div>
      {rows.length === 0 ? <Empty>Sin socios cargados.</Empty> : rows.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-subtle)', opacity: p.active ? 1 : 0.5 }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>{p.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{[p.alias && `Alias: ${p.alias}`, p.phone].filter(Boolean).join(' · ') || '—'}</div>
          </div>
          <button type="button" className="secondary icon-only" onClick={() => setForm(p)}><Pencil size={15} /></button>
          <button type="button" className="danger icon-only" onClick={() => del(p)}><Trash2 size={15} /></button>
        </div>
      ))}
      {form && (
        <Modal title={form.id ? 'Editar socio' : 'Nuevo socio'} onClose={() => setForm(null)}>
          <Field label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Alias / CBU"><input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} /></Field>
          <Field label="Teléfono"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Activo</label>
          <button type="button" onClick={submit} disabled={!form.name}><Save size={15} /> Guardar</button>
        </Modal>
      )}
    </section>
  );
}

function HistoryLog() {
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState('');
  useEffect(() => { api.get('finances/rate-changes/', { params: kind ? { kind } : {} }).then((r) => setRows(r.data)); }, [kind]);
  return (
    <section className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}><History size={18} /> Historial de aumentos</h3>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 200 }}>
          <option value="">Todos</option><option value="equipo">Arancel de equipos</option><option value="staff">Tarifas de staff</option>
        </select>
      </div>
      {rows.length === 0 ? <Empty>Sin modificaciones registradas.</Empty> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Vigente desde</th><th>Concepto</th><th style={{ textAlign: 'right' }}>Anterior</th><th style={{ textAlign: 'right' }}>Nuevo</th><th>Variación</th><th>Por</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const old = Number(r.old_amount), nw = Number(r.new_amount);
                const pct = old > 0 ? ((nw - old) / old) * 100 : null;
                return (
                  <tr key={r.id}>
                    <td>{r.effective_from.split('-').reverse().join('/')}</td>
                    <td><Badge tone={r.kind === 'equipo' ? '#cc7a5c' : '#2563eb'}>{r.kind === 'equipo' ? 'Equipo' : 'Staff'}</Badge> {r.tournament_name || r.staff_name}</td>
                    <td style={{ textAlign: 'right' }}>{ars(old)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{ars(nw)}</td>
                    <td style={{ color: pct == null ? 'inherit' : pct >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>{pct == null ? 'Alta inicial' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}</td>
                    <td>{r.changed_by_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ConfigPagosView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Fees /><Staff /><Partners /><HistoryLog />
    </div>
  );
}
