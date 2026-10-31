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
  Check,
  Calendar,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ars, num, errMsg, CATEGORIES, EXPENSE_METHODS, Field, Modal, Empty } from './common';

const list = (r) => r.data?.results || r.data;

const toIntStr = (val) => {
  if (val === '' || val == null) return '';
  const n = Math.round(Number(val));
  return isNaN(n) ? '' : String(n);
};

const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '—');
const dayName = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long' });

const btnOutline = {
  height: 32,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 500,
  background: '#ffffff',
  color: '#18181b',
  border: '1px solid #d4d3ce',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
};

const btnDark = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  background: '#141413',
  color: '#ffffff',
  border: '1px solid #141413',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
};

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  fontWeight: 500,
  padding: '3px 8px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
};

const tagBlue = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dbeafe',
  color: '#1d4ed8',
};

const tagGreen = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dcfce7',
  color: '#166534',
};

const tagRed = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#fee2e2',
  color: '#991b1b',
};

const tagAmber = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#fef3c7',
  color: '#92400e',
};

const cellInputStyle = {
  width: 112,
  height: 32,
  padding: '0 8px',
  textAlign: 'right',
  fontSize: 12.5,
  fontWeight: 600,
  borderRadius: 8,
  background: '#faf9f6',
  border: '1px solid #e5e4df',
};

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
    cash_diff:
      cashCounted !== '' && cashCounted != null ? num(cashCounted) - expected_cash : null,
  };
}

function AddIncomeModal({ day, onClose, onDone }) {
  const [f, setF] = useState({
    kind: 'cancha',
    team: '',
    tournament: '',
    concept: '',
    amount_due: 0,
    cash: 0,
    transfer: 0,
  });
  const [teams, setTeams] = useState([]);
  const [tours, setTours] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('teams/').then((r) => setTeams(list(r)));
    api.get('finances/tournament-fees/').then((r) => setTours(r.data));
  }, []);

  const save = async () => {
    try {
      const body = {
        day: day.id,
        kind: f.kind,
        concept: f.concept,
        cash: num(f.cash),
        transfer: num(f.transfer),
        amount_due: f.kind === 'cancha' ? num(f.amount_due) : 0,
      };
      if (f.kind === 'cancha') {
        body.team = f.team;
        if (f.tournament) body.tournament = f.tournament;
      }
      await api.post('finances/day-incomes/', body);
      onDone();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <Modal title="Agregar ingreso" onClose={onClose}>
      <Field label="Tipo">
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="cancha">Cobro de equipo</option>
          <option value="buffet">Retiro de buffet</option>
          <option value="otro">Otro ingreso</option>
        </select>
      </Field>
      {f.kind === 'cancha' ? (
        <>
          <Field label="Equipo">
            <select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>
              <option value="">Elegí…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Torneo">
            <select
              value={f.tournament}
              onChange={(e) => {
                const t = tours.find((x) => String(x.tournament) === e.target.value);
                setF({
                  ...f,
                  tournament: e.target.value,
                  amount_due: t ? t.amount : f.amount_due,
                  concept: t ? t.tournament_name : f.concept,
                });
              }}
            >
              <option value="">Sin torneo</option>
              {tours.map((t) => (
                <option key={t.tournament} value={t.tournament}>
                  {t.tournament_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto a pagar">
            <input
              type="number"
              min="0"
              value={f.amount_due}
              onChange={(e) => setF({ ...f, amount_due: e.target.value })}
            />
          </Field>
        </>
      ) : (
        <Field label="Concepto">
          <input
            value={f.concept}
            onChange={(e) => setF({ ...f, concept: e.target.value })}
            placeholder={f.kind === 'buffet' ? 'Retiro 1' : 'Detalle'}
          />
        </Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Efectivo">
          <input
            type="number"
            min="0"
            value={f.cash}
            onChange={(e) => setF({ ...f, cash: e.target.value })}
          />
        </Field>
        <Field label="Transferencia">
          <input
            type="number"
            min="0"
            value={f.transfer}
            onChange={(e) => setF({ ...f, transfer: e.target.value })}
          />
        </Field>
      </div>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" style={btnOutline} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          style={btnDark}
          onClick={save}
          disabled={f.kind === 'cancha' && !f.team}
        >
          Agregar
        </button>
      </div>
    </Modal>
  );
}

function AddExpenseModal({ day, partners, onClose, onDone }) {
  const [f, setF] = useState({
    category: 'otro',
    staff_rate: '',
    concept: '',
    units: 1,
    unit_amount: 0,
    method: 'efectivo',
    partner: '',
    paid: false,
  });
  const [rates, setRates] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api
      .get('finances/staff-rates/')
      .then((r) => setRates(list(r).filter((x) => x.active)));
  }, []);

  const pick = (id) => {
    const r = rates.find((x) => String(x.id) === id);
    setF(
      r
        ? {
            ...f,
            staff_rate: id,
            category: r.category,
            concept: r.name,
            unit_amount: r.amount,
          }
        : { ...f, staff_rate: '' },
    );
  };

  const save = async () => {
    try {
      await api.post('finances/day-expenses/', {
        day: day.id,
        category: f.category,
        concept: f.concept,
        units: num(f.units),
        unit_amount: num(f.unit_amount),
        method: f.method,
        paid: Boolean(f.paid),
        staff_rate: f.staff_rate || null,
        partner: f.method === 'socio' ? f.partner || null : null,
      });
      onDone();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <Modal title="Agregar gasto / pago" onClose={onClose}>
      <Field label="Tarifa predefinida (opcional)">
        <select value={f.staff_rate} onChange={(e) => pick(e.target.value)}>
          <option value="">Gasto libre</option>
          {rates.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {ars(r.amount)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Concepto">
        <input
          value={f.concept}
          onChange={(e) => setF({ ...f, concept: e.target.value })}
          placeholder="Ej: Árbitro extra, hielo, médico…"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Categoría">
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATEGORIES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cantidad">
          <input
            type="number"
            min="0"
            step="0.5"
            value={f.units}
            onChange={(e) => setF({ ...f, units: e.target.value })}
          />
        </Field>
        <Field label="Unitario">
          <input
            type="number"
            min="0"
            value={f.unit_amount}
            onChange={(e) => setF({ ...f, unit_amount: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Medio de pago">
        <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
          {EXPENSE_METHODS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      {f.method === 'socio' && (
        <Field label="Socio">
          <select value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}>
            <option value="">Elegí…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: '#faf9f6',
          border: '1px solid #e5e4df',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
        }}
      >
        <span style={{ color: '#6b6a65' }}>Total del ítem:</span>
        <strong style={{ color: '#141413' }}>{ars(num(f.units) * num(f.unit_amount))}</strong>
      </div>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" style={btnOutline} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" style={btnDark} onClick={save} disabled={!f.concept}>
          Agregar
        </button>
      </div>
    </Modal>
  );
}

function DaySheet({ dayId, partners, onChanged, onDeleted }) {
  const navigate = useNavigate();
  const [day, setDay] = useState(null);
  const [modal, setModal] = useState(null);
  const [counted, setCounted] = useState('');
  const [msg, setMsg] = useState('');
  const [incomeSearch, setIncomeSearch] = useState('');

  const [savingCount, setSavingCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [leavePrompt, setLeavePrompt] = useState(null);

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

  const flushIncome = useCallback(
    async (id) => {
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
                    ...(dirtyIncomesRef.current[id] || {}),
                  }
                : item,
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
    },
    [onChanged],
  );

  const flushExpense = useCallback(
    async (id) => {
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
            units: String(res.data.units).endsWith('.00')
              ? toIntStr(res.data.units)
              : res.data.units,
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
                : item,
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
    },
    [onChanged],
  );

  const filteredIncomes = useMemo(() => {
    if (!day || !day.incomes) return [];
    if (!incomeSearch.trim()) return day.incomes;
    const q = incomeSearch.toLowerCase();
    return day.incomes.filter((i) => {
      const name = (i.team_name || (i.kind === 'buffet' ? 'retiro de buffet' : 'otro')).toLowerCase();
      const conc = (i.concept || '').toLowerCase();
      return name.includes(q) || conc.includes(q);
    });
  }, [day, incomeSearch]);

  const flushAll = useCallback(async () => {
    const incIds = Object.keys(dirtyIncomesRef.current).map(Number);
    const expIds = Object.keys(dirtyExpensesRef.current).map(Number);
    if (incIds.length === 0 && expIds.length === 0) return;
    await Promise.all([
      ...incIds.map((id) => flushIncome(id)),
      ...expIds.map((id) => flushExpense(id)),
    ]);
  }, [flushIncome, flushExpense]);

  useEffect(() => {
    const interval = setInterval(() => {
      flushAll();
    }, 8000);
    return () => clearInterval(interval);
  }, [flushAll]);

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
    const finalUnitAmount = num(
      merged.unit_amount !== undefined ? merged.unit_amount : row.unit_amount,
    );
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

  if (!day) return <Empty>Cargando planilla…</Empty>;

  const closed = day.status === 'cerrada';
  const t = computeTotals(day.incomes, day.expenses, counted);
  const remove = (url, id) =>
    window.confirm('¿Eliminar este renglón?') && run(() => api.delete(`finances/${url}/${id}/`));
  const diff = counted === '' ? null : num(counted) - Number(t.expected_cash);

  const paidExpensesCount = day.expenses.filter((e) => e.paid).length;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ====================================================================
         1. BARRA SUPERIOR DE LA PLANILLA
         ==================================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 500,
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#141413',
              textTransform: 'capitalize',
            }}
          >
            {dayName(day.date)} {fmtDate(day.date)}
          </h2>

          {closed ? (
            <span style={tagGreen}>Cerrada y aprobada</span>
          ) : (
            <span style={tagAmber}>Abierta</span>
          )}

          {!closed && (
            <span style={hasUnsaved ? tagAmber : tagPill}>
              {hasUnsaved ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Guardando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} style={{ color: '#166534' }} />{' '}
                  {lastSavedAt
                    ? `Guardado ${lastSavedAt.toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Sincronizado'}
                </>
              )}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!closed && (
            <button
              type="button"
              style={btnOutline}
              onClick={() => flushAll()}
              disabled={!hasUnsaved}
            >
              <Save size={13.5} /> {hasUnsaved ? 'Guardar ahora' : 'Guardado'}
            </button>
          )}
          {!closed && (
            <button
              type="button"
              style={btnDark}
              onClick={() => run(() => api.post(`finances/days/${day.id}/prefill/`))}
            >
              <Wand2 size={14} /> Precargar fixture
            </button>
          )}
          <button
            type="button"
            style={{ ...btnOutline, color: '#991b1b' }}
            onClick={deleteDay}
            title="Eliminar planilla"
          >
            <Trash2 size={13.5} /> Eliminar
          </button>
        </div>
      </div>

      {msg && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      {/* ====================================================================
         2. 4 TARJETAS DE RESUMEN DE LA JORNADA (ESTILO CONSOLA)
         ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6b6a65', fontWeight: 500 }}>Cobrado</span>
            <span style={tagGreen}>Ingresos</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#141413', lineHeight: 1.1 }}>
            {ars(t.total_in)}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={tagPill}>Efvo: {ars(t.cash_in)}</span>
            <span style={tagPill}>Transf: {ars(t.transfer_in)}</span>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6b6a65', fontWeight: 500 }}>Gastos</span>
            <span style={tagRed}>Egresos</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#141413', lineHeight: 1.1 }}>
            {ars(t.total_out)}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={tagPill}>Efvo: {ars(t.cash_out)}</span>
            {t.transfer_out > 0 && <span style={tagPill}>Transf: {ars(t.transfer_out)}</span>}
            {t.partner_out > 0 && <span style={tagPill}>Socios: {ars(t.partner_out)}</span>}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6b6a65', fontWeight: 500 }}>
              Resultado de la fecha
            </span>
            <span style={tagPill}>Neto</span>
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: t.net < 0 ? '#dc2626' : '#141413',
              lineHeight: 1.1,
            }}
          >
            {ars(t.net)}
          </div>
          <div style={{ fontSize: 11.5, color: '#787772' }}>
            Efectivo esperado en caja: <strong>{ars(t.expected_cash)}</strong>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#6b6a65', fontWeight: 500 }}>
              Saldo de equipos hoy
            </span>
            <span style={tagPill}>Cta. Cte.</span>
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: t.team_debt > 0 ? '#dc2626' : t.team_debt < 0 ? '#1d4ed8' : '#166534',
              lineHeight: 1.1,
            }}
          >
            {t.team_debt < 0 ? `+ ${ars(Math.abs(t.team_debt))}` : ars(t.team_debt)}
          </div>
          <div style={{ fontSize: 11.5, color: '#787772' }}>
            {t.team_debt < 0 ? 'Cobrado a cuenta de inscripción/deuda' : 'Impacta en cuenta corriente'}
          </div>
        </div>
      </div>

      {/* ====================================================================
         3. TABLA DE INGRESOS — COBROS DE EQUIPOS Y BUFFET
         ==================================================================== */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #efeee9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#141413' }}>
              Ingresos — Cobros de equipos y buffet
            </h3>
            <span style={tagPill}>{filteredIncomes.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 230 }}>
              <Search
                size={13.5}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#787772',
                }}
              />
              <input
                type="text"
                placeholder="Buscar equipo o ingreso…"
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                style={{
                  height: 32,
                  paddingLeft: 30,
                  paddingRight: 10,
                  fontSize: 12.5,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                }}
              />
            </div>

            {!closed && (
              <button type="button" style={btnDark} onClick={() => setModal('income')}>
                <Plus size={14} /> Ingreso
              </button>
            )}
          </div>
        </div>

        {day.incomes.length === 0 ? (
          <Empty>Sin ingresos. Usá “Precargar fixture” o agregá uno.</Empty>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    background: '#faf9f6',
                    borderBottom: '1px solid #e5e4df',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#787772',
                  }}
                >
                  <th style={{ padding: '10px 20px' }}>Equipo / Concepto</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Debe pagar</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Efectivo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Transf.</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Deuda</th>
                  <th style={{ padding: '10px 16px', width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.map((i) => {
                  const rowDebt =
                    i.kind === 'cancha' ? num(i.amount_due) - num(i.cash) - num(i.transfer) : 0;
                  const priorDebt = i.kind === 'cancha' ? num(i.prior_debt) : 0;
                  const totalAfterRow = priorDebt + rowDebt;

                  return (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f1f0ec' }}>
                      <td style={{ padding: '10px 20px' }}>
                        <strong style={{ color: '#141413', fontSize: 13.5 }}>
                          {i.team_name || (i.kind === 'buffet' ? 'Retiro de buffet' : 'Otro')}
                        </strong>
                        {i.concept && (
                          <div style={{ fontSize: 11.5, color: '#787772', marginTop: 2 }}>
                            {i.concept}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {i.kind === 'cancha' ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={toIntStr(i.amount_due)}
                            disabled={closed}
                            style={cellInputStyle}
                            onChange={(e) => updateIncomeField(i.id, 'amount_due', e.target.value)}
                            onBlur={() => flushIncome(i.id)}
                          />
                        ) : (
                          <span style={{ color: '#a1a09a' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={toIntStr(i.cash)}
                          disabled={closed}
                          style={cellInputStyle}
                          onChange={(e) => updateIncomeField(i.id, 'cash', e.target.value)}
                          onBlur={() => flushIncome(i.id)}
                        />
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={toIntStr(i.transfer)}
                          disabled={closed}
                          style={cellInputStyle}
                          onChange={(e) => updateIncomeField(i.id, 'transfer', e.target.value)}
                          onBlur={() => flushIncome(i.id)}
                        />
                      </td>

                      <td
                        style={{
                          padding: '10px 16px',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {i.kind === 'cancha' ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 2,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                color:
                                  rowDebt > 0 ? '#dc2626' : rowDebt < 0 ? '#1d4ed8' : '#166534',
                              }}
                            >
                              {rowDebt > 0 ? (
                                ars(rowDebt)
                              ) : rowDebt < 0 ? (
                                <span>
                                  + {ars(Math.abs(rowDebt))}{' '}
                                  {priorDebt > 0 ? 'a cuenta' : 'a favor'}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <CheckCircle2 size={14} /> Al día
                                </span>
                              )}
                            </div>
                            {priorDebt !== 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color:
                                    totalAfterRow > 0
                                      ? '#991b1b'
                                      : totalAfterRow < 0
                                        ? '#1d4ed8'
                                        : '#166534',
                                }}
                              >
                                {totalAfterRow > 0
                                  ? `Total cta.: ${ars(totalAfterRow)}`
                                  : totalAfterRow < 0
                                    ? `Total: + ${ars(Math.abs(totalAfterRow))}`
                                    : 'Cta. saldada ✔'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#a1a09a' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        {!closed && (
                          <button
                            type="button"
                            style={{
                              ...btnOutline,
                              height: 28,
                              padding: '0 7px',
                              color: '#991b1b',
                            }}
                            onClick={() => remove('day-incomes', i.id)}
                          >
                            <Trash2 size={13} />
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

      {/* ====================================================================
         4. TABLA DE EGRESOS — STAFF, SERVICIOS Y GASTOS (CON COLUMNA ABONADO)
         ==================================================================== */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #efeee9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#141413' }}>
              Egresos — Staff, servicios y gastos
            </h3>
            <span style={tagPill}>{day.expenses.length}</span>
            {day.expenses.length > 0 && (
              <span
                style={
                  paidExpensesCount === day.expenses.length && day.expenses.length > 0
                    ? tagGreen
                    : tagPill
                }
              >
                {paidExpensesCount}/{day.expenses.length} abonados
              </span>
            )}
          </div>
          {!closed && (
            <button type="button" style={btnDark} onClick={() => setModal('expense')}>
              <Plus size={14} /> Gasto / Pago
            </button>
          )}
        </div>

        {day.expenses.length === 0 ? (
          <Empty>Sin gastos cargados.</Empty>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    background: '#faf9f6',
                    borderBottom: '1px solid #e5e4df',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#787772',
                  }}
                >
                  <th style={{ padding: '10px 20px' }}>Concepto</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Unitario</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '10px 12px' }}>Se paga con</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: 95 }}>
                    Abonado
                  </th>
                  <th style={{ padding: '10px 16px', width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {day.expenses.map((e) => {
                  const isPaid = Boolean(e.paid);
                  return (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: '1px solid #f1f0ec',
                        background: isPaid ? '#fafdf9' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '10px 20px' }}>
                        <strong style={{ color: '#141413', fontSize: 13.5 }}>{e.concept}</strong>
                        <div style={{ fontSize: 11.5, color: '#787772', marginTop: 2 }}>
                          {CATEGORIES.find(([k]) => k === e.category)?.[1]}
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={e.units}
                          disabled={closed}
                          style={{ ...cellInputStyle, width: 72 }}
                          onChange={(ev) => updateExpenseField(e, { units: ev.target.value })}
                          onBlur={() => flushExpense(e.id)}
                        />
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={toIntStr(e.unit_amount)}
                          disabled={closed}
                          style={cellInputStyle}
                          onChange={(ev) =>
                            updateExpenseField(e, { unit_amount: ev.target.value })
                          }
                          onBlur={() => flushExpense(e.id)}
                        />
                      </td>

                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#141413',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ars(num(e.units) * num(e.unit_amount))}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <select
                            disabled={closed}
                            value={e.method}
                            style={{
                              height: 32,
                              minWidth: 130,
                              padding: '0 28px 0 10px',
                              fontSize: 12.5,
                              borderRadius: 8,
                              background: '#faf9f6',
                              border: '1px solid #e5e4df',
                            }}
                            onChange={(ev) => {
                              const m = ev.target.value;
                              if (m === 'socio' && !partners.length)
                                return setMsg(
                                  'Cargá primero un socio en Configuración de pagos.',
                                );
                              updateExpenseField(
                                e,
                                m === 'socio'
                                  ? { method: m, partner: e.partner || partners[0].id }
                                  : { method: m, partner: null },
                                true,
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
                              style={{
                                height: 32,
                                padding: '0 28px 0 10px',
                                fontSize: 12.5,
                                borderRadius: 8,
                                background: '#faf9f6',
                                border: '1px solid #e5e4df',
                              }}
                              onChange={(ev) =>
                                updateExpenseField(e, { partner: ev.target.value }, true)
                              }
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

                      {/* Columna Abonado: Recuadrito de Tic verde */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => updateExpenseField(e, { paid: !isPaid }, true)}
                          title={isPaid ? 'Marcado como abonado' : 'Marcar como abonado'}
                          style={{
                            width: 26,
                            height: 26,
                            minWidth: 26,
                            padding: 0,
                            borderRadius: 7,
                            background: isPaid ? '#16a34a' : '#faf9f6',
                            border: isPaid ? '1.5px solid #15803d' : '1.5px solid #d4d3ce',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isPaid && <Check size={15} strokeWidth={3} />}
                        </button>
                      </td>

                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        {!closed && (
                          <button
                            type="button"
                            style={{
                              ...btnOutline,
                              height: 28,
                              padding: '0 7px',
                              color: '#991b1b',
                            }}
                            onClick={() => remove('day-expenses', e.id)}
                          >
                            <Trash2 size={13} />
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

      {/* ====================================================================
         5. ARQUEO Y CIERRE DE JORNADA
         ==================================================================== */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#6b6a65', fontWeight: 500 }}>
              Efectivo esperado
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#141413', marginTop: 2 }}>
              {ars(t.expected_cash)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: '#6b6a65', fontWeight: 500, marginBottom: 4 }}>
              Efectivo contado
            </div>
            <input
              type="number"
              min="0"
              step="1"
              disabled={closed}
              placeholder="Ingresar monto…"
              value={toIntStr(counted)}
              onChange={(e) => setCounted(e.target.value)}
              style={{
                width: 160,
                height: 34,
                padding: '0 10px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                background: '#faf9f6',
                border: '1px solid #e5e4df',
              }}
            />
          </div>

          {diff !== null && (
            <div>
              <div style={{ fontSize: 11.5, color: '#6b6a65', fontWeight: 500 }}>Diferencia</div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: diff === 0 ? '#166534' : '#dc2626',
                  marginTop: 2,
                }}
              >
                {diff === 0 ? 'Cuadra ✔' : `${diff > 0 ? '+' : ''}${ars(diff)}`}
              </div>
            </div>
          )}
        </div>

        <div>
          {closed ? (
            <button
              type="button"
              style={btnOutline}
              onClick={() => run(() => api.post(`finances/days/${day.id}/reopen/`))}
            >
              <Unlock size={14} /> Reabrir jornada
            </button>
          ) : (
            <button
              type="button"
              style={btnDark}
              disabled={counted === ''}
              onClick={() =>
                window.confirm(
                  '¿Aprobar y cerrar la jornada? El resultado impactará en la Caja General.',
                ) &&
                run(() =>
                  api.post(`finances/days/${day.id}/close/`, {
                    cash_counted: num(counted),
                  }),
                )
              }
            >
              <Lock size={14} /> Aprobar y cerrar jornada
            </button>
          )}
        </div>
      </section>

      {modal === 'income' && (
        <AddIncomeModal
          day={day}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal === 'expense' && (
        <AddExpenseModal
          day={day}
          partners={partners}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {leavePrompt && (
        <Modal
          title="Cambios pendientes en la planilla"
          onClose={() => setLeavePrompt(null)}
          width={440}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: '#141413', lineHeight: 1.5 }}>
                Tenés modificaciones en la planilla que se están procesando. ¿Querés guardar la
                planilla antes de salir de esta sección?
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" style={btnOutline} onClick={() => setLeavePrompt(null)}>
                Cancelar
              </button>
              <button
                type="button"
                style={btnDark}
                onClick={async () => {
                  const proceed = leavePrompt.onProceed;
                  setLeavePrompt(null);
                  await flushAll();
                  proceed?.();
                }}
              >
                <Save size={14} /> Guardar y salir
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
    api
      .get('finances/partners/')
      .then((r) => setPartners(list(r).filter((p) => p.active)));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Selector superior de jornadas estilo Consola */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6a65', whiteSpace: 'nowrap' }}>Jornada:</span>
          <select
            value={sel || ''}
            onChange={(e) => selectDay(e.target.value ? Number(e.target.value) : null)}
            style={{
              height: 36,
              width: '100%',
              maxWidth: 420,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
              padding: '0 34px 0 12px',
              margin: 0,
            }}
          >
            <option value="">Seleccionar fecha cargada…</option>
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {fmtDate(d.date)} — {d.status === 'cerrada' ? 'Cerrada' : 'Abierta'} ·{' '}
                {ars(d.totals.net)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{
              height: 36,
              fontSize: 13,
              borderRadius: 8,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
              padding: '0 10px',
              width: 150,
              margin: 0,
            }}
          />
          <button type="button" style={{ ...btnDark, height: 36 }} onClick={create}>
            <CalendarPlus size={14} /> Abrir jornada
          </button>
        </div>

        {err && <span style={{ color: '#dc2626', fontSize: 12.5, width: '100%' }}>{err}</span>}
      </div>

      {/* Si hay una jornada seleccionada muestra la planilla; si no, muestra las jornadas recientes en tarjetas limpias */}
      {sel ? (
        <DaySheet
          key={sel}
          dayId={sel}
          partners={partners}
          onChanged={handleChanged}
          onDeleted={handleDeleted}
        />
      ) : days.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: 32,
          }}
        >
          <Empty>Abrí una fecha arriba para iniciar su planilla de caja.</Empty>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {days.map((d) => {
            const isClosed = d.status === 'cerrada';
            return (
              <div
                key={d.id}
                onClick={() => selectDay(d.id)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e4df',
                  borderRadius: 12,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} style={{ color: '#6b6a65' }} />
                    <strong
                      style={{
                        fontSize: 14,
                        color: '#141413',
                        textTransform: 'capitalize',
                      }}
                    >
                      {dayName(d.date)} {fmtDate(d.date)}
                    </strong>
                  </div>
                  <span style={isClosed ? tagGreen : tagAmber}>
                    {isClosed ? 'Cerrada' : 'Abierta'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11.5, color: '#787772' }}>Resultado neto</div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#141413',
                        marginTop: 2,
                      }}
                    >
                      {ars(d.totals.net)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={btnOutline}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectDay(d.id);
                    }}
                  >
                    Abrir planilla
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
