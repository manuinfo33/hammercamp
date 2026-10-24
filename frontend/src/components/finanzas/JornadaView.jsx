import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Wand2, Lock, Unlock, CalendarPlus, CheckCircle2 } from 'lucide-react';
import api from '../../api';
import { ars, num, errMsg, CATEGORIES, EXPENSE_METHODS, Field, Stat, Modal, Empty, Badge } from './common';

const list = (r) => r.data?.results || r.data;
const fmtDate = (d) => d.split('-').reverse().join('/');
const dayName = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long' });

/** Input numérico que guarda al perder foco. */
function Cell({ value, onSave, disabled, width = 110 }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input type="number" min="0" value={v} disabled={disabled} style={{ width, height: 34, padding: '0 8px', textAlign: 'right' }}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => num(v) !== num(value) && onSave(num(v))} />
  );
}

function AddIncomeModal({ day, onClose, onDone }) {
  const [f, setF] = useState({ kind: 'cancha', team: '', tournament: '', concept: '', amount_due: 0, cash: 0, transfer: 0 });
  const [teams, setTeams] = useState([]);
  const [tours, setTours] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('teams/').then((r) => setTeams(list(r)));
    api.get('finances/tournament-fees/').then((r) => setTours(r.data));
  }, []);

  const save = async () => {
    try {
      const body = { day: day.id, kind: f.kind, concept: f.concept, cash: num(f.cash), transfer: num(f.transfer), amount_due: f.kind === 'cancha' ? num(f.amount_due) : 0 };
      if (f.kind === 'cancha') { body.team = f.team; if (f.tournament) body.tournament = f.tournament; }
      await api.post('finances/day-incomes/', body);
      onDone();
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <Modal title="Agregar ingreso" onClose={onClose}>
      <Field label="Tipo">
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="cancha">Cobro de equipo</option><option value="buffet">Retiro de buffet</option><option value="otro">Otro ingreso</option>
        </select>
      </Field>
      {f.kind === 'cancha' ? (
        <>
          <Field label="Equipo"><select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}><option value="">Elegí…</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Torneo (define el arancel)">
            <select value={f.tournament} onChange={(e) => { const t = tours.find((x) => String(x.tournament) === e.target.value); setF({ ...f, tournament: e.target.value, amount_due: t ? t.amount : f.amount_due, concept: t ? t.tournament_name : f.concept }); }}>
              <option value="">Sin torneo</option>{tours.map((t) => <option key={t.tournament} value={t.tournament}>{t.tournament_name}</option>)}
            </select>
          </Field>
          <Field label="Monto a pagar"><input type="number" min="0" value={f.amount_due} onChange={(e) => setF({ ...f, amount_due: e.target.value })} /></Field>
        </>
      ) : (
        <Field label="Concepto"><input value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} placeholder={f.kind === 'buffet' ? 'Retiro 1' : 'Detalle'} /></Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Efectivo"><input type="number" min="0" value={f.cash} onChange={(e) => setF({ ...f, cash: e.target.value })} /></Field>
        <Field label="Transferencia"><input type="number" min="0" value={f.transfer} onChange={(e) => setF({ ...f, transfer: e.target.value })} /></Field>
      </div>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <button type="button" onClick={save} disabled={f.kind === 'cancha' && !f.team}>Agregar</button>
    </Modal>
  );
}

function AddExpenseModal({ day, partners, onClose, onDone }) {
  const [f, setF] = useState({ category: 'otro', staff_rate: '', concept: '', units: 1, unit_amount: 0, method: 'efectivo', partner: '' });
  const [rates, setRates] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('finances/staff-rates/').then((r) => setRates(list(r).filter((x) => x.active))); }, []);

  const pick = (id) => {
    const r = rates.find((x) => String(x.id) === id);
    setF(r ? { ...f, staff_rate: id, category: r.category, concept: r.name, unit_amount: r.amount } : { ...f, staff_rate: '' });
  };
  const save = async () => {
    try {
      await api.post('finances/day-expenses/', {
        day: day.id, category: f.category, concept: f.concept, units: num(f.units), unit_amount: num(f.unit_amount),
        method: f.method, staff_rate: f.staff_rate || null, partner: f.method === 'socio' ? f.partner || null : null,
      });
      onDone();
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <Modal title="Agregar gasto / pago" onClose={onClose}>
      <Field label="Tarifa predefinida (opcional)">
        <select value={f.staff_rate} onChange={(e) => pick(e.target.value)}><option value="">Gasto libre</option>{rates.map((r) => <option key={r.id} value={r.id}>{r.name} — {ars(r.amount)}</option>)}</select>
      </Field>
      <Field label="Concepto"><input value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} placeholder="Ej: Latas de pintura" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Categoría"><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Cantidad"><input type="number" min="0" step="0.5" value={f.units} onChange={(e) => setF({ ...f, units: e.target.value })} /></Field>
        <Field label="Monto unit."><input type="number" min="0" value={f.unit_amount} onChange={(e) => setF({ ...f, unit_amount: e.target.value })} /></Field>
      </div>
      <Field label="Se paga con">
        <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{EXPENSE_METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </Field>
      {f.method === 'socio' && (
        <Field label="Socio que puso el dinero"><select value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}><option value="">Elegí…</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      )}
      <div style={{ fontSize: 13, fontWeight: 700 }}>Total: {ars(num(f.units) * num(f.unit_amount))}</div>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <button type="button" onClick={save} disabled={!f.concept}>Agregar</button>
    </Modal>
  );
}

function DaySheet({ dayId, partners, onChanged }) {
  const [day, setDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [counted, setCounted] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await api.get(`finances/days/${dayId}/`);
    setDay(r.data);
    setCounted(r.data.cash_counted ?? '');
    onChanged?.();
  }, [dayId, onChanged]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => { try { setMsg(''); await fn(); await load(); } catch (e) { setMsg(errMsg(e)); } };
  if (!day) return <Empty>Cargando…</Empty>;

  const closed = day.status === 'cerrada';
  const t = day.totals;
  const patchInc = (id, data) => run(() => api.patch(`finances/day-incomes/${id}/`, data));
  const patchExp = (id, data) => run(() => api.patch(`finances/day-expenses/${id}/`, data));
  const remove = (url, id) => window.confirm('¿Eliminar este renglón?') && run(() => api.delete(`finances/${url}/${id}/`));
  const diff = counted === '' ? null : num(counted) - Number(t.expected_cash);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', textTransform: 'capitalize' }}>{dayName(day.date)} {fmtDate(day.date)}</h2>
          <div style={{ marginTop: 4 }}>{closed ? <Badge tone="#059669">Cerrada y aprobada</Badge> : <Badge tone="#d99a0b">Abierta</Badge>}</div>
        </div>
        {!closed && <button type="button" onClick={() => run(() => api.post(`finances/days/${day.id}/prefill/`))}><Wand2 size={16} /> Precargar desde fixture</button>}
      </div>
      {msg && <div style={{ color: '#dc2626', fontSize: 13 }}>{msg}</div>}

      <div className="gx-grid">
        <Stat label="Cobrado" value={t.total_in} tone="#059669" sub={`Efvo ${ars(t.cash_in)} · Transf ${ars(t.transfer_in)}`} />
        <Stat label="Gastos" value={-t.total_out} tone="#dc2626" sub={`Efvo ${ars(t.cash_out)} · Transf ${ars(t.transfer_out)} · Socios ${ars(t.partner_out)}`} />
        <Stat label="Resultado de la fecha" value={t.net} />
        <Stat label="Deuda de equipos" value={t.team_debt} tone="#cc7a5c" sub="Pasa a cuenta corriente" />
      </div>

      {/* INGRESOS */}
      <section className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Ingresos — Cobros de equipos y buffet</h3>
          {!closed && <button type="button" onClick={() => setModal('income')}><Plus size={15} /> Ingreso</button>}
        </div>
        {day.incomes.length === 0 ? <Empty>Sin ingresos. Usá “Precargar desde fixture” o agregá uno.</Empty> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th>Concepto</th><th style={{ textAlign: 'right' }}>Debe pagar</th><th style={{ textAlign: 'right' }}>Efectivo</th><th style={{ textAlign: 'right' }}>Transf.</th><th style={{ textAlign: 'right' }}>Deuda</th><th /></tr></thead>
              <tbody>
                {day.incomes.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.team_name || (i.kind === 'buffet' ? 'Retiro de buffet' : 'Otro')}</strong>{i.concept && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{i.concept}</div>}</td>
                    <td style={{ textAlign: 'right' }}>{i.kind === 'cancha' ? <Cell value={i.amount_due} disabled={closed} onSave={(v) => patchInc(i.id, { amount_due: v })} /> : '—'}</td>
                    <td style={{ textAlign: 'right' }}><Cell value={i.cash} disabled={closed} onSave={(v) => patchInc(i.id, { cash: v })} /></td>
                    <td style={{ textAlign: 'right' }}><Cell value={i.transfer} disabled={closed} onSave={(v) => patchInc(i.id, { transfer: v })} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: Number(i.debt) > 0 ? '#dc2626' : '#059669' }}>{i.kind === 'cancha' ? (Number(i.debt) > 0 ? ars(i.debt) : <CheckCircle2 size={16} />) : '—'}</td>
                    <td>{!closed && <button type="button" className="danger icon-only" onClick={() => remove('day-incomes', i.id)}><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* EGRESOS */}
      <section className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Egresos — Staff, servicios y gastos</h3>
          {!closed && <button type="button" onClick={() => setModal('expense')}><Plus size={15} /> Gasto / Pago</button>}
        </div>
        {day.expenses.length === 0 ? <Empty>Sin gastos cargados.</Empty> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th>Concepto</th><th style={{ textAlign: 'right' }}>Cant.</th><th style={{ textAlign: 'right' }}>Unitario</th><th style={{ textAlign: 'right' }}>Total</th><th>Se paga con</th><th /></tr></thead>
              <tbody>
                {day.expenses.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.concept}</strong><div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{CATEGORIES.find(([k]) => k === e.category)?.[1]}</div></td>
                    <td style={{ textAlign: 'right' }}><Cell width={70} value={e.units} disabled={closed} onSave={(v) => patchExp(e.id, { units: v, amount: v * Number(e.unit_amount) })} /></td>
                    <td style={{ textAlign: 'right' }}><Cell value={e.unit_amount} disabled={closed} onSave={(v) => patchExp(e.id, { unit_amount: v, amount: v * Number(e.units) })} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{ars(e.amount)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <select disabled={closed} value={e.method} style={{ height: 34, minWidth: 130 }} onChange={(ev) => {
                          const m = ev.target.value;
                          if (m === 'socio' && !partners.length) return setMsg('Cargá primero un socio en Configuración de pagos.');
                          patchExp(e.id, m === 'socio' ? { method: m, partner: e.partner || partners[0].id } : { method: m, partner: null });
                        }}>{EXPENSE_METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                        {e.method === 'socio' && (
                          <select disabled={closed} value={e.partner || ''} style={{ height: 34 }} onChange={(ev) => patchExp(e.id, { partner: ev.target.value })}>
                            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>{!closed && <button type="button" className="danger icon-only" onClick={() => remove('day-expenses', e.id)}><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ARQUEO */}
      <section className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Arqueo y cierre</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>EFECTIVO ESPERADO</div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{ars(t.expected_cash)}</div></div>
          <Field label="Efectivo contado"><input type="number" min="0" disabled={closed} value={counted} onChange={(e) => setCounted(e.target.value)} style={{ width: 170 }} /></Field>
          {diff !== null && (
            <div><div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>DIFERENCIA</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: diff === 0 ? '#059669' : '#dc2626' }}>{diff === 0 ? 'Cuadra ✔' : `${diff > 0 ? '+' : ''}${ars(diff)}`}</div></div>
          )}
        </div>
        {closed ? (
          <button type="button" className="secondary" onClick={() => run(() => api.post(`finances/days/${day.id}/reopen/`))}><Unlock size={15} /> Reabrir jornada</button>
        ) : (
          <button type="button" disabled={counted === ''} onClick={() => window.confirm('¿Aprobar y cerrar la jornada? El resultado impactará en la caja general.') && run(() => api.post(`finances/days/${day.id}/close/`, { cash_counted: num(counted) }))}><Lock size={15} /> Aprobar y cerrar jornada</button>
        )}
      </section>

      {modal === 'income' && <AddIncomeModal day={day} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {modal === 'expense' && <AddExpenseModal day={day} partners={partners} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}

export default function JornadaView() {
  const [days, setDays] = useState([]);
  const [sel, setSel] = useState(null);
  const [partners, setPartners] = useState([]);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState('');

  const loadDays = useCallback(() => api.get('finances/days/').then((r) => setDays(list(r))), []);
  useEffect(() => {
    loadDays();
    api.get('finances/partners/').then((r) => setPartners(list(r).filter((p) => p.active)));
  }, [loadDays]);

  const create = async () => {
    try {
      const r = await api.post('finances/days/', { date: newDate });
      await loadDays(); setSel(r.data.id); setErr('');
    } catch (e) {
      const ex = days.find((d) => d.date === newDate);
      ex ? setSel(ex.id) : setErr(errMsg(e));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Nueva jornada / abrir fecha"><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></Field>
        <button type="button" onClick={create}><CalendarPlus size={16} /> Abrir jornada</button>
        <Field label="Jornadas anteriores" style={{ flex: '1 1 220px' }}>
          <select value={sel || ''} onChange={(e) => setSel(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleccioná…</option>
            {days.map((d) => <option key={d.id} value={d.id}>{fmtDate(d.date)} — {d.status === 'cerrada' ? 'Cerrada' : 'Abierta'} · {ars(d.totals.net)}</option>)}
          </select>
        </Field>
        {err && <span style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</span>}
      </div>
      {sel ? <DaySheet key={sel} dayId={sel} partners={partners} onChanged={loadDays} /> : <Empty>Abrí o seleccioná una jornada para ver su planilla de caja.</Empty>}
    </div>
  );
}
