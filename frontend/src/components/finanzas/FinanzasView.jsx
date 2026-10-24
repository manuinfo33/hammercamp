import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, ClipboardList, Landmark, Users, AlertCircle, SlidersHorizontal, Plus, Trash2, HandCoins } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import api from '../../api';
import '../../styles/config.css';
import JornadaView from './JornadaView';
import ConfigPagosView from './ConfigPagosView';
import { ars, num, errMsg, Field, Stat, Modal, Empty, Badge } from './common';

const list = (r) => r.data?.results || r.data;
const TABS = [
  { id: 'jornada', label: 'Caja de Fecha', icon: ClipboardList },
  { id: 'general', label: 'Caja General', icon: Landmark },
  { id: 'socios', label: 'Socios', icon: Users },
  { id: 'deudas', label: 'Deudas de Equipos', icon: AlertCircle },
  { id: 'config', label: 'Configuración de pagos', icon: SlidersHorizontal },
];
const today = () => new Date().toISOString().slice(0, 10);
const CATS = [['alquiler', 'Alquiler de cancha'], ['cobro_deuda', 'Cobro de deuda de equipo'], ['compra', 'Compra / mantenimiento'], ['inversion', 'Inversión'], ['reintegro_socio', 'Reintegro a socio'], ['otro', 'Otro']];

function MovementModal({ preset, teams, partners, onClose, onDone }) {
  const [f, setF] = useState({ type: 'egreso', category: 'otro', method: 'efectivo', concept: '', amount: '', date: today(), team: '', partner: '', ...preset });
  const [err, setErr] = useState('');
  const needsTeam = f.category === 'cobro_deuda';
  const needsPartner = f.category === 'reintegro_socio' || f.method === 'socio';
  const save = async () => {
    try {
      await api.post('finances/movements/', { ...f, amount: num(f.amount), team: needsTeam ? f.team || null : null, partner: needsPartner ? f.partner || null : null });
      onDone();
    } catch (e) { setErr(errMsg(e)); }
  };
  const setCat = (category) => setF({ ...f, category, type: category === 'cobro_deuda' || category === 'alquiler' ? 'ingreso' : category === 'reintegro_socio' || category === 'compra' || category === 'inversion' ? 'egreso' : f.type, method: category === 'cobro_deuda' && f.method === 'socio' ? 'efectivo' : f.method });
  return (
    <Modal title="Nuevo movimiento" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Categoría"><select value={f.category} onChange={(e) => setCat(e.target.value)}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Tipo"><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></Field>
        <Field label="Medio"><select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>{f.type === 'egreso' && f.category !== 'reintegro_socio' && <option value="socio">Puesto por socio</option>}</select></Field>
        <Field label="Fecha"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      {needsTeam && <Field label="Equipo"><select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}><option value="">Elegí…</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>}
      {needsPartner && <Field label="Socio"><select value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}><option value="">Elegí…</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
      <Field label="Concepto"><input value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} placeholder="Ej: Ferretería, pago de deuda…" /></Field>
      <Field label="Monto"><input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <button type="button" onClick={save} disabled={!f.concept || !f.amount}>Guardar</button>
    </Modal>
  );
}

function useBase() {
  const [summary, setSummary] = useState(null);
  const [teams, setTeams] = useState([]);
  const [partners, setPartners] = useState([]);
  const reload = useCallback(() => api.get('finances/summary/').then((r) => setSummary(r.data)), []);
  useEffect(() => {
    reload();
    api.get('teams/').then((r) => setTeams(list(r)));
    api.get('finances/partners/').then((r) => setPartners(list(r).filter((p) => p.active)));
  }, [reload]);
  return { summary, teams, partners, reload };
}

function GeneralTab({ summary, teams, partners, reload }) {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(false);
  const load = useCallback(() => api.get('finances/movements/').then((r) => setRows(list(r))), []);
  useEffect(() => { load(); }, [load]);
  const done = () => { setModal(false); load(); reload(); };
  const del = async (m) => { if (window.confirm('¿Eliminar movimiento?')) { await api.delete(`finances/movements/${m.id}/`); done(); } };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {summary && (
        <div className="gx-grid">
          <Stat label="Saldo total" value={summary.total} sub="Efectivo + Banco / MP (fechas cerradas + movimientos)" />
          <Stat label="Efectivo" value={summary.cash} tone="#d99a0b" />
          <Stat label="Banco / Mercado Pago" value={summary.bank} tone="#2563eb" />
        </div>
      )}
      <section className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Movimientos fuera de fecha</h3>
          <button type="button" onClick={() => setModal(true)}><Plus size={15} /> Movimiento</button>
        </div>
        {rows.length === 0 ? <Empty>Sin movimientos. Acá van alquileres, compras, cobros de deuda y reintegros.</Empty> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th>Fecha</th><th>Concepto</th><th>Medio</th><th style={{ textAlign: 'right' }}>Monto</th><th /></tr></thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>{m.date.split('-').reverse().join('/')}</td>
                    <td><strong>{m.concept}</strong><div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{CATS.find(([k]) => k === m.category)?.[1]}{m.team_name && ` · ${m.team_name}`}{m.partner_name && ` · ${m.partner_name}`}</div></td>
                    <td><Badge tone={m.method === 'socio' ? '#cc7a5c' : '#71717a'}>{m.method === 'socio' ? 'Socio' : m.method}</Badge></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: m.type === 'ingreso' ? '#059669' : '#dc2626' }}>{m.type === 'ingreso' ? '+' : '-'}{ars(m.amount)}</td>
                    <td><button type="button" className="danger icon-only" onClick={() => del(m)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && <MovementModal teams={teams} partners={partners} onClose={() => setModal(false)} onDone={done} />}
    </div>
  );
}

function SociosTab({ summary, teams, partners, reload }) {
  const [modal, setModal] = useState(null);
  const bal = summary?.partner_balances || [];
  return (
    <section className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Cuenta corriente de socios</h3>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>Lo que La Superliga le debe a cada socio por gastos pagados con dinero propio.</p>
      </div>
      {bal.length === 0 ? <Empty>Ningún socio adelantó dinero todavía.</Empty> : bal.map((b) => (
        <div key={b.partner} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <strong style={{ flex: 1 }}>{b.partner_name}</strong>
          <span style={{ fontWeight: 700, color: Number(b.owed) > 0 ? '#dc2626' : '#059669' }}>{Number(b.owed) > 0 ? `Se le debe ${ars(b.owed)}` : 'Al día'}</span>
          {Number(b.owed) > 0 && <button type="button" onClick={() => setModal({ type: 'egreso', category: 'reintegro_socio', partner: b.partner, amount: b.owed, concept: `Reintegro a ${b.partner_name}` })}><HandCoins size={15} /> Reintegrar</button>}
        </div>
      ))}
      {modal && <MovementModal preset={modal} teams={teams} partners={partners} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
    </section>
  );
}

function DeudasTab({ summary, teams, partners, reload }) {
  const [modal, setModal] = useState(null);
  const debts = summary?.team_debts || [];
  return (
    <section className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Deudas de equipos</h3>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>Se generan solas con lo que falta pagar en cada fecha. Al registrar el cobro se descuenta.</p>
      </div>
      {debts.length === 0 ? <Empty>Ningún equipo tiene deuda. 🎉</Empty> : debts.map((d) => (
        <div key={d.team} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <strong style={{ flex: 1 }}>{d.team_name}</strong>
          <span style={{ fontWeight: 700, color: Number(d.debt) > 0 ? '#dc2626' : '#059669' }}>{Number(d.debt) > 0 ? ars(d.debt) : `A favor ${ars(-d.debt)}`}</span>
          {Number(d.debt) > 0 && <button type="button" onClick={() => setModal({ type: 'ingreso', category: 'cobro_deuda', team: d.team, amount: d.debt, concept: `Pago de deuda ${d.team_name}` })}><HandCoins size={15} /> Registrar pago</button>}
        </div>
      ))}
      {modal && <MovementModal preset={modal} teams={teams} partners={partners} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
    </section>
  );
}

export default function FinanzasView() {
  const [tab, setTab] = useState('jornada');
  const base = useBase();
  return (
    <div className="anthropic-theme animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader icon={Wallet} title="Finanzas" subtitle="Caja de cada fecha, tesorería, socios y deudas de equipos. Solo administradores." />
      <div className="cf-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={`cf-tab ${tab === id ? 'active' : ''}`} onClick={() => { setTab(id); base.reload(); }}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>
      {tab === 'jornada' && <JornadaView />}
      {tab === 'general' && <GeneralTab {...base} />}
      {tab === 'socios' && <SociosTab {...base} />}
      {tab === 'deudas' && <DeudasTab {...base} />}
      {tab === 'config' && <ConfigPagosView />}
    </div>
  );
}
