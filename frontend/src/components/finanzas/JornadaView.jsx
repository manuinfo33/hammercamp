import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Wand2,
  Lock,
  Unlock,
  CalendarPlus,
  CheckCircle2,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ars, num, errMsg, CATEGORIES, EXPENSE_METHODS, Field, Stat, Modal, Empty, Badge } from './common';

const list = (r) => r.data?.results || r.data;
// Función auxiliar para normalizar valores a enteros sin decimales
const toIntStr = (val) => {
  if (val === '' || val == null) return '';
  const n = Math.round(Number(val));
  return isNaN(n) ? '' : String(n);
};
const fmtDate = (d) => d.split('-').reverse().join('/');
const dayName = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long' });

function computeTotals(incomes, expenses, cashCounted) {
  let cash_in = 0;
  let transfer_in = 0;
  let due = 0;
  let paid_teams = 0;

  for (const i of incomes) {
    const c = num(i.cash);
    const tr = num(i.transfer);
    const d = num(i.amount_due);
    cash_in += c;
    transfer_in += tr;
    if (i.kind === 'cancha') {
      due += d;
      paid_teams += c + tr;
    }
  }

  let cash_out = 0;
  let transfer_out = 0;
  let partner_out = 0;

  for (const e of expenses) {
    const amt = num(e.amount);
    if (e.method === 'efectivo') cash_out += amt;
    else if (e.method === 'transferencia') transfer_out += amt;
    else if (e.method === 'socio') partner_out += amt;
  }

  const expected_cash = cash_in - cash_out;
  return {
    due,
    paid_teams,
    team_debt: due - paid_teams,
    cash_in,
    transfer_in,
    total_in: cash_in + transfer_in,
    cash_out,
    transfer_out,
    partner_out,
    total_out: cash_out + transfer_out + partner_out,
    net: cash_in + transfer_in - cash_out - transfer_out - partner_out,
    expected_cash,
    cash_diff: cashCounted !== '' && cashCounted != null ? num(cashCounted) - expected_cash : null,
  };
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

function DaySheet({ dayId, partners, onChanged, onDeleted, onRequestSwitchDay }) {
  const navigate = useNavigate();
  const [day, setDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [counted, setCounted] = useState('');
  const [msg, setMsg] = useState('');

  // Control de autoguardado y cambios pendientes
  const [savingCount, setSavingCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [leavePrompt, setLeavePrompt] = useState(null); // { onProceed: fn }

  const dirtyIncomesRef = useRef({});
  const dirtyExpensesRef = useRef({});
  const timersRef = useRef({});
  const [dirtyVersion, setDirtyVersion] = useState(0);

  const hasUnsaved = useMemo(() => {
    const incCount = Object.keys(dirtyIncomesRef.current).length;
    const expCount = Object.keys(dirtyExpensesRef.current).length;
    return incCount > 0 || expCount > 0 || savingCount > 0;
  }, [dirtyVersion, savingCount]);

  const load = useCallback(async () => {
    const r = await api.get(`finances/days/${dayId}/`);
    const dayData = r.data;
    if (dayData) {
      if (dayData.incomes) {
        dayData.incomes = dayData.incomes.map((i) => ({
          ...i,
          amount_due: toIntStr(i.amount_due),
          cash: toIntStr(i.cash),
          transfer: toIntStr(i.transfer),
        }));
      }
      if (dayData.expenses) {
        dayData.expenses = dayData.expenses.map((e) => ({
          ...e,
          unit_amount: toIntStr(e.unit_amount),
          units: String(e.units).endsWith('.00') ? toIntStr(e.units) : e.units,
        }));
      }
    }
    setDay(dayData);
    setCounted(dayData.cash_counted != null ? toIntStr(dayData.cash_counted) : '');
    onChanged?.();
  }, [dayId, onChanged]);

  useEffect(() => {
    load();
  }, [load]);

  // Guarda inmediatamente un ingreso específico
  const flushIncome = useCallback(async (id) => {
    if (timersRef.current[`inc_${id}`]) {
      clearTimeout(timersRef.current[`inc_${id}`]);
      delete timersRef.current[`inc_${id}`];
    }
    const payload = dirtyIncomesRef.current[id];
    if (!payload) return;
    delete dirtyIncomesRef.current[id];
    setDirtyVersion((v) => v + 1);

    setSavingCount((c) => c + 1);
    try {
      const res = await api.patch(`finances/day-incomes/${id}/`, payload);
      setDay((prev) => {
        if (!prev) return prev;
        const normalized = {
          ...res.data,
          amount_due: toIntStr(res.data.amount_due),
          cash: toIntStr(res.data.cash),
          transfer: toIntStr(res.data.transfer),
        };
        return {
          ...prev,
          incomes: prev.incomes.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...normalized,
                  // Preservar si el usuario siguió escribiendo mientras guardaba
                  ...(dirtyIncomesRef.current[id] || {}),
                }
              : item
          ),
        };
      });
      setLastSavedAt(new Date());
      onChanged?.();
    } catch (e) {
      setMsg(errMsg(e));
    } finally {
      setSavingCount((c) => Math.max(0, c - 1));
    }
  }, [onChanged]);

  // Guarda inmediatamente un egreso específico
  const flushExpense = useCallback(async (id) => {
    if (timersRef.current[`exp_${id}`]) {
      clearTimeout(timersRef.current[`exp_${id}`]);
      delete timersRef.current[`exp_${id}`];
    }
    const payload = dirtyExpensesRef.current[id];
    if (!payload) return;
    delete dirtyExpensesRef.current[id];
    setDirtyVersion((v) => v + 1);

    setSavingCount((c) => c + 1);
    try {
      const res = await api.patch(`finances/day-expenses/${id}/`, payload);
      setDay((prev) => {
        if (!prev) return prev;
        const normalized = {
          ...res.data,
          unit_amount: toIntStr(res.data.unit_amount),
          units: String(res.data.units).endsWith('.00') ? toIntStr(res.data.units) : res.data.units,
        };
        return {
          ...prev,
          expenses: prev.expenses.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...normalized,
                  ...(dirtyExpensesRef.current[id] || {}),
                }
              : item
          ),
        };
      });
      setLastSavedAt(new Date());
      onChanged?.();
    } catch (e) {
      setMsg(errMsg(e));
    } finally {
      setSavingCount((c) => Math.max(0, c - 1));
    }
  }, [onChanged]);

  // Guarda absolutamente todos los cambios pendientes en la planilla
  const flushAll = useCallback(async () => {
    const incIds = Object.keys(dirtyIncomesRef.current).map(Number);
    const expIds = Object.keys(dirtyExpensesRef.current).map(Number);
    if (incIds.length === 0 && expIds.length === 0) return;
    await Promise.all([
      ...incIds.map((id) => flushIncome(id)),
      ...expIds.map((id) => flushExpense(id)),
    ]);
  }, [flushIncome, flushExpense]);

  // Autoguardado periódico cada 8 segundos por seguridad adicional
  useEffect(() => {
    const interval = setInterval(() => {
      flushAll();
    }, 8000);
    return () => clearInterval(interval);
  }, [flushAll]);

  // Alerta nativa del navegador al tocar F5, cerrar pestaña o recargar si hay cambios o si está abierta la planilla
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = 'Tenés cambios en la planilla. ¿Estás seguro de salir?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsaved]);

  // Interceptar salida a otra pestaña de Finanzas o enlace del menú lateral cuando hay cambios sin guardar
  useEffect(() => {
    window.__finanzasDayBeforeLeave = (proceedCallback) => {
      if (hasUnsaved) {
        setLeavePrompt({ onProceed: proceedCallback });
        return false;
      }
      return true;
    };
    return () => {
      delete window.__finanzasDayBeforeLeave;
    };
  }, [hasUnsaved]);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (!hasUnsaved) return;
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setLeavePrompt({
        onProceed: () => navigate(href),
      });
    };
    document.addEventListener('click', handleDocClick, true);
    return () => document.removeEventListener('click', handleDocClick, true);
  }, [hasUnsaved, navigate]);

  // Actualización optimista e instantánea en memoria + autoguardado con debounce (450ms)
  const updateIncomeField = (id, field, rawValue) => {
    const val = rawValue === '' ? '' : num(rawValue);
    setDay((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        incomes: prev.incomes.map((inc) => {
          if (inc.id !== id) return inc;
          const updated = { ...inc, [field]: rawValue };
          const due = num(field === 'amount_due' ? val : updated.amount_due);
          const c = num(field === 'cash' ? val : updated.cash);
          const tr = num(field === 'transfer' ? val : updated.transfer);
          updated.debt = updated.kind === 'cancha' ? due - c - tr : 0;
          return updated;
        }),
      };
    });

    dirtyIncomesRef.current[id] = {
      ...(dirtyIncomesRef.current[id] || {}),
      [field]: num(rawValue),
    };
    setDirtyVersion((v) => v + 1);

    if (timersRef.current[`inc_${id}`]) clearTimeout(timersRef.current[`inc_${id}`]);
    timersRef.current[`inc_${id}`] = setTimeout(() => {
      flushIncome(id);
    }, 450);
  };

  const updateExpenseField = (row, changes, immediate = false) => {
    const id = row.id;
    setDay((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: prev.expenses.map((exp) => {
          if (exp.id !== id) return exp;
          const next = { ...exp, ...changes };
          const u = num(next.units);
          const ua = num(next.unit_amount);
          next.amount = u * ua;
          return next;
        }),
      };
    });

    const merged = {
      ...(dirtyExpensesRef.current[id] || {}),
      ...changes,
    };
    const finalUnits = num(merged.units !== undefined ? merged.units : row.units);
    const finalUnitAmount = num(merged.unit_amount !== undefined ? merged.unit_amount : row.unit_amount);
    merged.units = finalUnits;
    merged.unit_amount = finalUnitAmount;
    merged.amount = finalUnits * finalUnitAmount;

    dirtyExpensesRef.current[id] = merged;
    setDirtyVersion((v) => v + 1);

    if (timersRef.current[`exp_${id}`]) clearTimeout(timersRef.current[`exp_${id}`]);
    if (immediate) {
      flushExpense(id);
    } else {
      timersRef.current[`exp_${id}`] = setTimeout(() => {
        flushExpense(id);
      }, 450);
    }
  };

  const run = async (fn) => {
    try {
      setMsg('');
      await flushAll();
      await fn();
      await load();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  if (!day) return <Empty>Cargando…</Empty>;

  const closed = day.status === 'cerrada';
  const t = computeTotals(day.incomes, day.expenses, counted);
  const remove = (url, id) =>
    window.confirm('¿Eliminar este renglón?') && run(() => api.delete(`finances/${url}/${id}/`));
  const diff = counted === '' ? null : num(counted) - Number(t.expected_cash);

  const deleteDay = async () => {
    const confirmMsg = closed
      ? `¿Eliminar la planilla de la jornada (${fmtDate(day.date)})?\nEstá cerrada, por lo que también se eliminará su registro de ingreso en Caja General.`
      : `¿Eliminar la planilla de la jornada (${fmtDate(day.date)})?\nSe borrarán todos sus ingresos y gastos cargados.`;
    if (window.confirm(confirmMsg)) {
      try {
        await api.delete(`finances/days/${day.id}/`);
        onDeleted?.();
      } catch (e) {
        setMsg(errMsg(e));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cabecera de la planilla con indicador de autoguardado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', textTransform: 'capitalize' }}>
              {dayName(day.date)} {fmtDate(day.date)}
            </h2>
            {closed ? (
              <Badge tone="#059669">Cerrada y aprobada</Badge>
            ) : (
              <Badge tone="#d99a0b">Abierta</Badge>
            )}

            {/* Estado de autoguardado en tiempo real */}
            {!closed && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: hasUnsaved ? '#fef9c3' : '#f0fdf4',
                  color: hasUnsaved ? '#854d0e' : '#166534',
                  border: hasUnsaved ? '1px solid #fde047' : '1px solid #bbf7d0',
                }}
              >
                {hasUnsaved ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Guardando cambios…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />{' '}
                    {lastSavedAt
                      ? `Autoguardado (${lastSavedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
                      : 'Planilla sincronizada'}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!closed && (
            <button
              type="button"
              className="secondary"
              onClick={() => flushAll()}
              disabled={!hasUnsaved}
              title="Guardar todos los cambios ahora"
            >
              <Save size={15} /> {hasUnsaved ? 'Guardar ahora' : 'Guardado'}
            </button>
          )}
          {!closed && (
            <button type="button" onClick={() => run(() => api.post(`finances/days/${day.id}/prefill/`))}>
              <Wand2 size={16} /> Precargar desde fixture
            </button>
          )}
          <button type="button" className="danger" onClick={deleteDay} title="Eliminar planilla de la jornada">
            <Trash2 size={16} /> Eliminar planilla
          </button>
        </div>
      </div>

      {msg && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      {/* KPIs calculados instantáneamente en tiempo real */}
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
                {day.incomes.map((i) => {
                  const rowDebt = i.kind === 'cancha' ? num(i.amount_due) - num(i.cash) - num(i.transfer) : 0;
                  return (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.team_name || (i.kind === 'buffet' ? 'Retiro de buffet' : 'Otro')}</strong>
                        {i.concept && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{i.concept}</div>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {i.kind === 'cancha' ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={toIntStr(i.amount_due)}
                            disabled={closed}
                            style={{ width: 115, height: 34, padding: '0 8px', textAlign: 'right' }}
                            onChange={(e) => updateIncomeField(i.id, 'amount_due', e.target.value)}
                            onBlur={() => flushIncome(i.id)}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={toIntStr(i.cash)}
                          disabled={closed}
                          style={{ width: 115, height: 34, padding: '0 8px', textAlign: 'right' }}
                          onChange={(e) => updateIncomeField(i.id, 'cash', e.target.value)}
                          onBlur={() => flushIncome(i.id)}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={toIntStr(i.transfer)}
                          disabled={closed}
                          style={{ width: 115, height: 34, padding: '0 8px', textAlign: 'right' }}
                          onChange={(e) => updateIncomeField(i.id, 'transfer', e.target.value)}
                          onBlur={() => flushIncome(i.id)}
                        />
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: rowDebt > 0 ? '#dc2626' : rowDebt < 0 ? '#2563eb' : '#059669',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {i.kind === 'cancha' ? (
                          rowDebt > 0 ? (
                            ars(rowDebt)
                          ) : rowDebt < 0 ? (
                            <span title="Saldo a favor del equipo">+ {ars(Math.abs(rowDebt))} a favor</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                              <CheckCircle2 size={16} /> Al día
                            </span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {!closed && (
                          <button type="button" className="danger icon-only" onClick={() => remove('day-incomes', i.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                    <td>
                      <strong>{e.concept}</strong>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {CATEGORIES.find(([k]) => k === e.category)?.[1]}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={e.units}
                        disabled={closed}
                        style={{ width: 75, height: 34, padding: '0 8px', textAlign: 'right' }}
                        onChange={(ev) => updateExpenseField(e, { units: ev.target.value })}
                        onBlur={() => flushExpense(e.id)}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={toIntStr(e.unit_amount)}
                        disabled={closed}
                        style={{ width: 115, height: 34, padding: '0 8px', textAlign: 'right' }}
                        onChange={(ev) => updateExpenseField(e, { unit_amount: ev.target.value })}
                        onBlur={() => flushExpense(e.id)}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{ars(num(e.units) * num(e.unit_amount))}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <select
                          disabled={closed}
                          value={e.method}
                          style={{ minHeight: 36, height: 36, minWidth: 130, padding: '4px 34px 4px 10px' }}
                          onChange={(ev) => {
                            const m = ev.target.value;
                            if (m === 'socio' && !partners.length)
                              return setMsg('Cargá primero un socio en Configuración de pagos.');
                            updateExpenseField(
                              e,
                              m === 'socio'
                                ? { method: m, partner: e.partner || partners[0].id }
                                : { method: m, partner: null },
                              true
                            );
                          }}
                        >
                          {EXPENSE_METHODS.map(([k, l]) => (
                            <option key={k} value={k}>
                              {l}
                            </option>
                          ))}
                        </select>
                        {e.method === 'socio' && (
                          <select
                            disabled={closed}
                            value={e.partner || ''}
                            style={{ minHeight: 36, height: 36, padding: '4px 34px 4px 10px' }}
                            onChange={(ev) => updateExpenseField(e, { partner: ev.target.value }, true)}
                          >
                            {partners.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      {!closed && (
                        <button type="button" className="danger icon-only" onClick={() => remove('day-expenses', e.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
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
          <Field label="Efectivo contado"><input type="number" min="0" step="1" disabled={closed} value={toIntStr(counted)} onChange={(e) => setCounted(e.target.value)} style={{ width: 170 }} /></Field>
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

      {/* Modal de alerta si intenta salir con cambios en curso */}
      {leavePrompt && (
        <Modal
          title="Cambios pendientes en la planilla"
          onClose={() => setLeavePrompt(null)}
          width={440}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Tenés modificaciones en la planilla que se están procesando. ¿Querés guardar la planilla antes de salir de esta sección?
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setLeavePrompt(null)}
              >
                Cancelar y seguir acá
              </button>
              <button
                type="button"
                onClick={async () => {
                  const proceed = leavePrompt.onProceed;
                  setLeavePrompt(null);
                  await flushAll();
                  proceed?.();
                }}
              >
                <Save size={15} /> Guardar planilla y salir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function JornadaView({ onDayChanged }) {
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

  const handleChanged = useCallback(() => {
    loadDays();
    onDayChanged?.();
  }, [loadDays, onDayChanged]);

  const handleDeleted = useCallback(() => {
    setSel(null);
    loadDays();
    onDayChanged?.();
  }, [loadDays, onDayChanged]);

  const selectDay = (nextId) => {
    if (typeof window.__finanzasDayBeforeLeave === 'function') {
      const proceed = window.__finanzasDayBeforeLeave(() => setSel(nextId));
      if (!proceed) return;
    }
    setSel(nextId);
  };

  const create = async () => {
    try {
      const r = await api.post('finances/days/', { date: newDate });
      await loadDays();
      setSel(r.data.id);
      setErr('');
      onDayChanged?.();
    } catch (e) {
      const ex = days.find((d) => d.date === newDate);
      ex ? selectDay(ex.id) : setErr(errMsg(e));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Nueva jornada / abrir fecha"><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></Field>
        <button type="button" onClick={create}><CalendarPlus size={16} /> Abrir jornada</button>
        <Field label="Jornadas anteriores" style={{ flex: '1 1 220px' }}>
          <select value={sel || ''} onChange={(e) => selectDay(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleccioná…</option>
            {days.map((d) => <option key={d.id} value={d.id}>{fmtDate(d.date)} — {d.status === 'cerrada' ? 'Cerrada' : 'Abierta'} · {ars(d.totals.net)}</option>)}
          </select>
        </Field>
        {err && <span style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</span>}
      </div>
      {sel ? <DaySheet key={sel} dayId={sel} partners={partners} onChanged={handleChanged} onDeleted={handleDeleted} /> : <Empty>Abrí o seleccioná una jornada para ver su planilla de caja.</Empty>}
    </div>
  );
}
