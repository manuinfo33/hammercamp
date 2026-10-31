import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  Trophy,
  CheckCircle2,
  Percent,
  HandCoins,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowRight,
  Save,
  Plus,
  AlertCircle,
  Check,
  XCircle,
} from 'lucide-react';
import api from '../../api';
import { ars, num, errMsg, Field, Modal, Empty } from './common';

const today = () => new Date().toISOString().slice(0, 10);

const TOURNAMENT_BANNERS = [
  { bg: '#7cb2f4', stroke: '#132a4a' },
  { bg: '#e89d7c', stroke: '#3b1d11' },
  { bg: '#c8ded3', stroke: '#1f3a2e' },
  { bg: '#dcd8ea', stroke: '#2c2545' },
  { bg: '#f5dd90', stroke: '#4d3d0d' },
  { bg: '#eeece6', stroke: '#3d3929' },
];

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

function fmtDate(d) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

const QUICK_DISCOUNTS = [
  { label: 'Sin dto. (0%)', pct: 0, status: 'activa' },
  { label: '-10%', pct: 10, status: 'activa' },
  { label: '-20%', pct: 20, status: 'activa' },
  { label: '-25%', pct: 25, status: 'activa' },
  { label: '-50%', pct: 50, status: 'activa' },
  { label: '100% Bonificada', pct: 100, status: 'bonificada' },
];

/* ============================================================================
   MODAL 1: INSCRIPCIÓN Y DESCUENTO DE UN EQUIPO
   ============================================================================ */
function RegistrationDiscountModal({ teamRow, registration, tournaments, onClose, onSaved }) {
  const isNew = !registration?.id;
  const [tournamentId, setTournamentId] = useState(
    registration?.tournament || teamRow?.tournaments?.[0]?.tournament_id || (tournaments[0]?.tournament ?? ''),
  );
  const selectedTourFee = useMemo(() => {
    const t = tournaments.find((x) => String(x.tournament) === String(tournamentId));
    return t ? num(t.registration_fee || t.amount) : 0;
  }, [tournaments, tournamentId]);

  const [baseAmount, setBaseAmount] = useState(
    registration ? Math.round(num(registration.base_amount)) : Math.round(selectedTourFee),
  );
  const [discount, setDiscount] = useState(registration ? Math.round(num(registration.discount)) : 0);
  const [pct, setPct] = useState(() => {
    if (!registration) return '0';
    if (registration.status === 'bonificada') return '100';
    const b = num(registration.base_amount);
    const d = num(registration.discount);
    return b > 0 ? String(Number(((d / b) * 100).toFixed(1))) : '0';
  });
  const [status, setStatus] = useState(registration?.status || 'activa');
  const [note, setNote] = useState(registration?.note || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleTournamentChange = (val) => {
    setTournamentId(val);
    const t = tournaments.find((x) => String(x.tournament) === String(val));
    if (t) {
      const b = Math.round(num(t.registration_fee || t.amount));
      setBaseAmount(b);
      if (pct !== '') {
        setDiscount(Math.round(b * (Number(pct) / 100)));
      }
    }
  };

  const applyPct = (val, nextStatus = 'activa') => {
    setStatus(nextStatus);
    setPct(String(val));
    const b = num(baseAmount);
    const p = Number(val) || 0;
    const d = Math.min(b, Math.max(0, Math.round(b * (p / 100))));
    setDiscount(d);
  };

  const handlePctInputChange = (val) => {
    setPct(val);
    const p = Math.max(0, Math.min(100, Number(val) || 0));
    const b = num(baseAmount);
    const d = Math.round(b * (p / 100));
    setDiscount(d);
    if (p >= 100) setStatus('bonificada');
    else if (status === 'bonificada') setStatus('activa');
  };

  const handleDiscountChange = (val) => {
    const d = Math.max(0, num(val));
    setDiscount(val);
    const b = num(baseAmount);
    if (b > 0) {
      const p = Math.min(100, Number(((d / b) * 100).toFixed(1)));
      setPct(String(p));
      if (p >= 100) setStatus('bonificada');
      else if (status === 'bonificada') setStatus('activa');
    }
  };

  const handleNetChange = (val) => {
    const net = Math.max(0, num(val));
    const b = num(baseAmount);
    const d = Math.max(0, b - net);
    setDiscount(d);
    if (b > 0) {
      const p = Math.min(100, Number(((d / b) * 100).toFixed(1)));
      setPct(String(p));
      if (net === 0 && b > 0) setStatus('bonificada');
      else if (status === 'bonificada') setStatus('activa');
    }
  };

  const netAmount =
    status === 'bonificada' || status === 'baja'
      ? 0
      : Math.max(0, num(baseAmount) - num(discount));

  const submit = async () => {
    setSaving(true);
    setErr('');
    try {
      const payload = {
        team: teamRow.team,
        tournament: tournamentId,
        base_amount: num(baseAmount),
        discount: status === 'bonificada' ? num(baseAmount) : num(discount),
        status,
        note: note.trim(),
      };
      if (registration?.id) {
        await api.patch(`finances/registrations/${registration.id}/`, payload);
      } else {
        await api.post('finances/registrations/', payload);
      }
      onSaved(`Inscripción de "${teamRow.team_name}" actualizada.`);
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Inscripción y descuento — ${teamRow.team_name}`}
      onClose={onClose}
      width={540}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cabecera resumen estilo AumentoModal */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: '#faf9f6',
            border: '1px solid #e6e4dd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#6b6a65', fontWeight: 500 }}>
              Inscripción base del torneo
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#141413', marginTop: 2 }}>
              {ars(baseAmount)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={tagBlue}>
              {registration?.tournament_name ||
                tournaments.find((t) => String(t.tournament) === String(tournamentId))
                  ?.tournament_name ||
                'Torneo'}
            </span>
            <div style={{ fontSize: 12, color: '#6b6a65', marginTop: 4 }}>
              {teamRow.category_name}
            </div>
          </div>
        </div>

        {isNew && (
          <Field label="Torneo">
            <select value={tournamentId} onChange={(e) => handleTournamentChange(e.target.value)}>
              <option value="">Seleccionar torneo…</option>
              {tournaments.map((t) => (
                <option key={t.tournament} value={t.tournament}>
                  {t.tournament_name} (Inscripción: {ars(t.registration_fee || t.amount)})
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Descuento por porcentaje manual y condición de inscripción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Porcentaje de descuento (%)">
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0"
                  value={status === 'bonificada' ? '100' : status === 'baja' ? '0' : pct}
                  disabled={status === 'baja'}
                  onChange={(e) => handlePctInputChange(e.target.value)}
                  style={{ paddingRight: 28 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#787772',
                  }}
                >
                  %
                </span>
              </div>
            </Field>

            <Field label="Condición de inscripción">
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value;
                  setStatus(s);
                  if (s === 'bonificada') {
                    setPct('100');
                    setDiscount(num(baseAmount));
                  } else if (s === 'baja') {
                    setDiscount(0);
                  } else {
                    const p = Number(pct) >= 100 ? 0 : Number(pct) || 0;
                    setPct(String(p));
                    setDiscount(Math.round(num(baseAmount) * (p / 100)));
                  }
                }}
              >
                <option value="activa">Inscripción estándar / con descuento</option>
                <option value="bonificada">100% Bonificada ($ 0)</option>
                <option value="baja">Eximida / Baja ($ 0)</option>
              </select>
            </Field>
          </div>

          {status !== 'baja' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Valor base ($)">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={baseAmount}
                  onChange={(e) => {
                    setBaseAmount(e.target.value);
                    const b = num(e.target.value);
                    const p = Number(pct) || 0;
                    setDiscount(Math.round(b * (p / 100)));
                  }}
                />
              </Field>
              <Field label="Descuento ($)">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={status === 'bonificada' ? baseAmount : discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                />
              </Field>
              <Field label="Total a pagar ($)">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={netAmount}
                  onChange={(e) => handleNetChange(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Vista previa del impacto */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: '#f5f4f0',
            border: '1px solid #e6e4dd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
            <span
              style={{
                color: '#787772',
                textDecoration: netAmount !== num(baseAmount) ? 'line-through' : 'none',
              }}
            >
              {ars(baseAmount)}
            </span>
            <ArrowRight size={14} style={{ color: '#787772' }} />
            <strong style={{ fontSize: '1.1rem', fontWeight: 700, color: '#141413' }}>
              {ars(netAmount)}
            </strong>
          </div>
          {status === 'baja' ? (
            <span style={tagPill}>Inscripción dada de baja / sin cargo</span>
          ) : status === 'bonificada' ? (
            <span style={tagGreen}>Bonificada 100% (-{ars(baseAmount)})</span>
          ) : num(discount) > 0 ? (
            <span style={tagGreen}>
              Descuento -{ars(discount)} ({pct}%)
            </span>
          ) : (
            <span style={tagPill}>Tarifa estándar completa</span>
          )}
        </div>

        <Field label="Motivo del descuento / Observación (opcional)">
          <input
            type="text"
            placeholder="Ej: Descuento acordado al inscribirse, Campeón torneo previo…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            style={btnDark}
            onClick={submit}
            disabled={saving || !tournamentId}
          >
            <Save size={14} /> {saving ? 'Guardando…' : 'Guardar inscripción'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MODAL 2: MIGRACIÓN MASIVA / RÁPIDA DE SALDOS INICIALES (EXCEL)
   ============================================================================ */
function ExcelMigrationModal({ accounts, onClose, onSaved }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const categories = useMemo(() => {
    const s = new Set(accounts.map((a) => a.category_name || 'Sin Asignar'));
    return Array.from(s).sort();
  }, [accounts]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (catFilter !== 'todas' && (a.category_name || 'Sin Asignar') !== catFilter) return false;
      const currentVal = drafts[a.team] !== undefined ? num(drafts[a.team]) : num(a.initial_debt);
      if (onlyWithBalance && currentVal === 0) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const tName = (a.team_name || '').toLowerCase();
        const cName = (a.category_name || '').toLowerCase();
        const tours = (a.tournaments || []).map((t) => t.tournament_name.toLowerCase()).join(' ');
        if (!tName.includes(q) && !cName.includes(q) && !tours.includes(q)) return false;
      }
      return true;
    });
  }, [accounts, catFilter, onlyWithBalance, search, drafts]);

  const changedItems = useMemo(() => {
    const list = [];
    for (const a of accounts) {
      const hasAmountChange =
        drafts[a.team] !== undefined && num(drafts[a.team]) !== num(a.initial_debt);
      const hasNoteChange =
        notes[a.team] !== undefined && notes[a.team] !== (a.initial_note || '');
      if (hasAmountChange || hasNoteChange) {
        list.push({
          team: a.team,
          initial_debt: drafts[a.team] !== undefined ? num(drafts[a.team]) : num(a.initial_debt),
          note:
            notes[a.team] !== undefined
              ? notes[a.team]
              : a.initial_note || 'Saldo inicial migrado',
        });
      }
    }
    return list;
  }, [accounts, drafts, notes]);

  const handleSave = async () => {
    if (changedItems.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await api.post('finances/team-initial-balances/', { items: changedItems });
      onSaved(
        `Saldos iniciales actualizados para ${changedItems.length} ${
          changedItems.length === 1 ? 'equipo' : 'equipos'
        }.`,
      );
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Migración de saldos históricos"
      onClose={onClose}
      width={780}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#faf9f6',
            border: '1px solid #e6e4dd',
            fontSize: 12.5,
            color: '#52514e',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: '#141413' }}>¿Cómo funciona esta carga inicial?</strong> Ingresá
          acá la deuda previa que cada equipo arrastraba antes de usar el sistema. Si un
          equipo tenía dinero a favor, ingresalo con signo negativo (ej: <code>-15000</code>). Estos
          montos se integran automáticamente a su cuenta corriente unificada.
        </div>

        {/* Barra de filtros */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
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
              placeholder="Buscar equipo o torneo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: 32,
                paddingLeft: 30,
                fontSize: 12.5,
                borderRadius: 8,
                background: '#faf9f6',
                border: '1px solid #e5e4df',
              }}
            />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{
              height: 32,
              fontSize: 12.5,
              borderRadius: 8,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
              width: 190,
            }}
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyWithBalance((v) => !v)}
            style={{
              ...(onlyWithBalance ? btnDark : btnOutline),
              height: 32,
            }}
          >
            Con saldo ({accounts.filter((a) => num(a.initial_debt) !== 0).length})
          </button>
        </div>

        {/* Tabla editable */}
        <div
          style={{
            maxHeight: 390,
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid #e5e4df',
            background: '#ffffff',
          }}
        >
          {filtered.length === 0 ? (
            <Empty>No hay equipos que coincidan con la búsqueda.</Empty>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
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
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <th style={{ padding: '10px 14px' }}>Equipo</th>
                  <th style={{ padding: '10px 10px' }}>Categoría / Torneo</th>
                  <th style={{ padding: '10px 10px', width: 155, textAlign: 'right' }}>
                    Deuda inicial ($)
                  </th>
                  <th style={{ padding: '10px 14px', width: 210 }}>Nota / Origen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const val =
                    drafts[a.team] !== undefined
                      ? drafts[a.team]
                      : num(a.initial_debt) === 0
                        ? ''
                        : Math.round(num(a.initial_debt));
                  const noteVal =
                    notes[a.team] !== undefined ? notes[a.team] : a.initial_note || '';
                  const isDirty =
                    (drafts[a.team] !== undefined && num(drafts[a.team]) !== num(a.initial_debt)) ||
                    (notes[a.team] !== undefined && notes[a.team] !== (a.initial_note || ''));

                  return (
                    <tr
                      key={a.team}
                      style={{
                        borderBottom: '1px solid #f1f0ec',
                        background: isDirty ? '#fefce8' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: '#141413' }}>
                        {a.team_name}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={tagPill}>{a.category_name}</span>
                        {a.tournaments?.length > 0 && (
                          <span style={{ ...tagBlue, marginLeft: 6 }}>
                            {a.tournaments[0].tournament_name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="500"
                          placeholder="0"
                          value={val}
                          onChange={(e) => setDrafts({ ...drafts, [a.team]: e.target.value })}
                          style={{
                            height: 30,
                            textAlign: 'right',
                            fontWeight: 600,
                            fontSize: 12.5,
                            borderRadius: 6,
                            background: '#faf9f6',
                            border: '1px solid #e5e4df',
                            padding: '0 8px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 14px' }}>
                        <input
                          type="text"
                          placeholder="Ej: Saldo Excel anterior"
                          value={noteVal}
                          onChange={(e) => setNotes({ ...notes, [a.team]: e.target.value })}
                          style={{
                            height: 30,
                            fontSize: 12,
                            borderRadius: 6,
                            background: '#faf9f6',
                            border: '1px solid #e5e4df',
                            padding: '0 8px',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: '#6b6a65' }}>
            {changedItems.length > 0
              ? `${changedItems.length} equipo(s) modificado(s) listos para guardar`
              : 'Sin modificaciones pendientes'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="button"
              style={btnDark}
              onClick={handleSave}
              disabled={saving || changedItems.length === 0}
            >
              <Save size={14} />{' '}
              {saving ? 'Guardando…' : `Guardar saldos (${changedItems.length})`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MODAL 3: REGISTRAR COBRO DE DEUDA / INSCRIPCIÓN EN CAJA GENERAL
   ============================================================================ */
function CobroDeudaModal({ preset, accounts, onClose, onSaved }) {
  const [f, setF] = useState({
    team: preset?.team || '',
    amount: preset?.amount ? Math.round(num(preset.amount)) : '',
    method: 'efectivo',
    date: today(),
    concept: preset?.concept || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const selectedTeam = useMemo(
    () => accounts.find((a) => String(a.team) === String(f.team)),
    [accounts, f.team],
  );

  const handleTeamSelect = (teamId) => {
    const acc = accounts.find((a) => String(a.team) === String(teamId));
    const debt = acc && num(acc.total_debt) > 0 ? Math.round(num(acc.total_debt)) : '';
    setF({
      ...f,
      team: teamId,
      amount: debt,
      concept: acc ? `Cobro cuenta corriente / inscripción — ${acc.team_name}` : f.concept,
    });
  };

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await api.post('finances/movements/', {
        type: 'ingreso',
        category: 'cobro_deuda',
        method: f.method,
        concept:
          f.concept.trim() ||
          `Cobro de deuda — ${selectedTeam ? selectedTeam.team_name : 'Equipo'}`,
        amount: num(f.amount),
        date: f.date,
        team: f.team,
      });
      onSaved('Cobro registrado correctamente en Caja General y descontado del equipo.');
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal title="Registrar cobro fuera de planilla de fecha" onClose={onClose} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#faf9f6',
            border: '1px solid #e6e4dd',
            fontSize: 12,
            color: '#6b6a65',
            lineHeight: 1.4,
          }}
        >
          Si el equipo abona durante el sábado en la cancha, cargalo directamente en su fila de{' '}
          <strong style={{ color: '#141413' }}>Caja de Fecha</strong> para que sume al arqueo del
          día. Usá este formulario solo para pagos recibidos entre semana o fuera de fecha.
        </div>

        <Field label="Equipo">
          <select value={f.team} onChange={(e) => handleTeamSelect(e.target.value)}>
            <option value="">Seleccionar equipo…</option>
            {accounts.map((a) => (
              <option key={a.team} value={a.team}>
                {a.team_name}{' '}
                {num(a.total_debt) > 0 ? `(Debe ${ars(a.total_debt)})` : '(Al día)'}
              </option>
            ))}
          </select>
        </Field>

        {selectedTeam && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#f5f4f0',
              border: '1px solid #e6e4dd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
            }}
          >
            <span>Saldo actual en cuenta corriente:</span>
            <strong
              style={{
                color: num(selectedTeam.total_debt) > 0 ? '#dc2626' : '#166534',
                fontSize: 14,
              }}
            >
              {num(selectedTeam.total_debt) > 0
                ? `Debe ${ars(selectedTeam.total_debt)}`
                : 'Al día'}
            </strong>
          </div>
        )}

        <div className="cf-grid-2">
          <Field label="Medio de cobro">
            <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia / MP</option>
            </select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Concepto">
          <input
            type="text"
            value={f.concept}
            onChange={(e) => setF({ ...f, concept: e.target.value })}
            placeholder="Ej: Pago de inscripción / deuda por transferencia"
          />
        </Field>

        <Field label="Monto cobrado ($)">
          <input
            type="number"
            min="0"
            step="500"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
          />
        </Field>

        {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            style={btnDark}
            onClick={save}
            disabled={saving || !f.team || !num(f.amount)}
          >
            <HandCoins size={14} /> {saving ? 'Registrando…' : 'Confirmar cobro'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MODAL 4: FICHA DETALLADA / ESTADO DE CUENTA CORRIENTE DEL EQUIPO
   ============================================================================ */
function TeamLedgerModal({ teamRow, onClose, onOpenDiscount, onOpenPay }) {
  const debt = num(teamRow.total_debt);
  const history = teamRow.history || [];

  return (
    <Modal
      title={`Estado de Cuenta Corriente — ${teamRow.team_name}`}
      onClose={onClose}
      width={720}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Resumen en 4 bloques */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: 10,
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
            }}
          >
            <div style={{ fontSize: 11, color: '#6b6a65', fontWeight: 500 }}>
              Saldo inicial (Excel)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#141413', marginTop: 4 }}>
              {ars(teamRow.initial_debt)}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
            }}
          >
            <div style={{ fontSize: 11, color: '#6b6a65', fontWeight: 500 }}>
              Inscripción neta
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#141413', marginTop: 4 }}>
              {ars(teamRow.registration_due)}
            </div>
            {num(teamRow.registration_discount) > 0 && (
              <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                Dto: -{ars(teamRow.registration_discount)}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e5e4df',
            }}
          >
            <div style={{ fontSize: 11, color: '#6b6a65', fontWeight: 500 }}>
              Partidos ({teamRow.matches_count} fechas)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#141413', marginTop: 4 }}>
              {ars(teamRow.matches_due)}
            </div>
            <div style={{ fontSize: 11, color: '#6b6a65', marginTop: 2 }}>
              Abonado: {ars(num(teamRow.matches_paid) + num(teamRow.general_paid))}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: debt > 0 ? '#fef2f2' : debt < 0 ? '#eff6ff' : '#f0fdf4',
              border: `1px solid ${debt > 0 ? '#fecaca' : debt < 0 ? '#bfdbfe' : '#bbf7d0'}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: debt > 0 ? '#991b1b' : debt < 0 ? '#1e40af' : '#166534',
                fontWeight: 600,
              }}
            >
              {debt > 0 ? 'Deuda actual total' : debt < 0 ? 'Saldo a favor' : 'Estado actual'}
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: debt > 0 ? '#dc2626' : debt < 0 ? '#1d4ed8' : '#166534',
                marginTop: 4,
              }}
            >
              {debt > 0 ? ars(debt) : debt < 0 ? `+ ${ars(Math.abs(debt))}` : 'Al día ✔'}
            </div>
          </div>
        </div>

        {/* Tabla de movimientos del equipo */}
        <div
          style={{
            maxHeight: 340,
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid #e5e4df',
            background: '#ffffff',
          }}
        >
          {history.length === 0 ? (
            <Empty>Este equipo aún no registra cargos ni pagos.</Empty>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
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
                  <th style={{ padding: '10px 14px' }}>Fecha</th>
                  <th style={{ padding: '10px 10px' }}>Concepto / Detalle</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Cargo</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Pagado</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const imp = num(h.balance_impact);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f0ec' }}>
                      <td style={{ padding: '9px 14px', color: '#6b6a65', whiteSpace: 'nowrap' }}>
                        {fmtDate(h.date)}
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <strong style={{ color: '#141413' }}>{h.title}</strong>
                        {h.subtitle && (
                          <div style={{ fontSize: 11.5, color: '#787772' }}>{h.subtitle}</div>
                        )}
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', color: '#52514e' }}>
                        {num(h.charge) > 0 ? ars(h.charge) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 10px',
                          textAlign: 'right',
                          color: num(h.payment) > 0 ? '#166534' : '#787772',
                          fontWeight: num(h.payment) > 0 ? 600 : 400,
                        }}
                      >
                        {num(h.payment) > 0 ? ars(h.payment) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 14px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: imp > 0 ? '#dc2626' : imp < 0 ? '#166534' : '#787772',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {imp > 0
                          ? `Debe ${ars(imp)}`
                          : imp < 0
                            ? `Canceló ${ars(Math.abs(imp))}`
                            : 'Saldado'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btnOutline} onClick={onOpenDiscount}>
              <Percent size={13.5} /> Configurar inscripción / descuento
            </button>
            {debt > 0 && (
              <button type="button" style={btnDark} onClick={onOpenPay}>
                <HandCoins size={14} /> Registrar cobro
              </button>
            )}
          </div>
          <button type="button" style={btnOutline} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   VISTA PRINCIPAL: CUENTAS CORRIENTES, INSCRIPCIONES Y DEUDAS DE EQUIPOS
   (DISEÑO EDITORIAL CONSOLA IDÉNTICO A CONFIGURACIÓN DE PAGOS)
   ============================================================================ */
export default function DeudasEquiposView({ onChanged }) {
  const [accounts, setAccounts] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // todos | deuda | descuento | favor | al_dia
  const [tourFilter, setTourFilter] = useState('todos');

  // Modales
  const [discountModal, setDiscountModal] = useState(null); // { teamRow, registration }
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [cobroModal, setCobroModal] = useState(null); // null or preset
  const [ledgerModal, setLedgerModal] = useState(null); // teamRow

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, feesRes] = await Promise.all([
        api.get('finances/team-accounts/'),
        api.get('finances/tournament-fees/'),
      ]);
      setAccounts(accRes.data || []);
      setTournaments(feesRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 3800);
  };

  /* --- KPIs Superiores --- */
  const metrics = useMemo(() => {
    let totalDebt = 0;
    let teamsWithDebt = 0;
    let teamsUpToDate = 0;
    let totalFavor = 0;
    let totalRegNet = 0;
    let totalRegDiscount = 0;
    let activeRegsCount = 0;
    let discountedRegsCount = 0;
    let totalInitialDebt = 0;
    let teamsWithInitial = 0;

    for (const a of accounts) {
      const d = num(a.total_debt);
      if (d > 0) {
        totalDebt += d;
        teamsWithDebt += 1;
      } else if (d < 0) {
        totalFavor += Math.abs(d);
        teamsUpToDate += 1;
      } else {
        teamsUpToDate += 1;
      }

      totalRegNet += num(a.registration_due);
      totalRegDiscount += num(a.registration_discount);

      for (const r of a.registrations || []) {
        if (r.status !== 'baja') {
          activeRegsCount += 1;
          if (r.status === 'bonificada' || num(r.discount) > 0) {
            discountedRegsCount += 1;
          }
        }
      }

      if (num(a.initial_debt) !== 0) {
        totalInitialDebt += num(a.initial_debt);
        teamsWithInitial += 1;
      }
    }

    return {
      totalDebt,
      teamsWithDebt,
      teamsUpToDate,
      totalFavor,
      totalRegNet,
      totalRegDiscount,
      activeRegsCount,
      discountedRegsCount,
      totalInitialDebt,
      teamsWithInitial,
    };
  }, [accounts]);

  /* --- Filtrado y Agrupación por Torneo --- */
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const d = num(a.total_debt);
      const hasDiscount =
        num(a.registration_discount) > 0 ||
        (a.registrations || []).some((r) => r.status === 'bonificada');

      if (statusFilter === 'deuda' && d <= 0) return false;
      if (statusFilter === 'descuento' && !hasDiscount) return false;
      if (statusFilter === 'favor' && d >= 0) return false;
      if (statusFilter === 'al_dia' && d > 0) return false;

      if (tourFilter !== 'todos') {
        if (tourFilter === 'sin_torneo') {
          if ((a.tournaments || []).length > 0 || (a.registrations || []).length > 0) return false;
        } else {
          const inTour =
            (a.tournaments || []).some((t) => String(t.tournament_id) === String(tourFilter)) ||
            (a.registrations || []).some((r) => String(r.tournament) === String(tourFilter));
          if (!inTour) return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (a.team_name || '').toLowerCase();
        const cat = (a.category_name || '').toLowerCase();
        const tours = (a.tournaments || []).map((t) => t.tournament_name.toLowerCase()).join(' ');
        if (!name.includes(q) && !cat.includes(q) && !tours.includes(q)) return false;
      }

      return true;
    });
  }, [accounts, statusFilter, tourFilter, search]);

  const groupedAccounts = useMemo(() => {
    const groupsMap = new Map();

    for (const acc of filteredAccounts) {
      const primaryTour =
        acc.tournaments?.[0] ||
        (acc.registrations?.[0]
          ? {
              tournament_id: acc.registrations[0].tournament,
              tournament_name: acc.registrations[0].tournament_name,
            }
          : null);

      const groupKey = primaryTour ? `tour_${primaryTour.tournament_id}` : 'sin_torneo';
      const groupLabel = primaryTour
        ? primaryTour.tournament_name
        : 'Equipos sin torneo activo asignado';

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          label: groupLabel,
          isTournament: Boolean(primaryTour),
          items: [],
          totalGroupDebt: 0,
        });
      }
      const g = groupsMap.get(groupKey);
      g.items.push(acc);
      if (num(acc.total_debt) > 0) {
        g.totalGroupDebt += num(acc.total_debt);
      }
    }

    return Array.from(groupsMap.values());
  }, [filteredAccounts]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1180,
        margin: '0 auto',
        width: '100%',
        paddingBottom: 32,
      }}
    >
      {/* Notificación sutil */}
      {toastMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid #d4d3ce',
            color: '#141413',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <CheckCircle2 size={15} style={{ color: '#166534', flexShrink: 0 }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ====================================================================
         1. ENCABEZADO EDITORIAL + 3 TARJETAS DE RESUMEN (ESTILO CONSOLA)
         ==================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.55rem',
              fontWeight: 500,
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#141413',
              letterSpacing: '-0.02em',
            }}
          >
            Cuentas corrientes, inscripciones y deudas
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={btnOutline}
              onClick={() => setExcelModalOpen(true)}
            >
              <FileSpreadsheet size={14} /> Migración de saldos
            </button>
            <button
              type="button"
              style={btnDark}
              onClick={() => setCobroModal({})}
            >
              <HandCoins size={14} /> Registrar cobro
            </button>
          </div>
        </div>

        {/* 3 Tarjetas Superiores estilo Consola */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
            alignItems: 'stretch',
          }}
        >
          {/* Card 1: Deuda Total Acumulada */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: 146,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 22 }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Total pendiente de cobro
              </span>
              <span style={metrics.teamsWithDebt > 0 ? tagRed : tagGreen}>
                {metrics.teamsWithDebt} con deuda
              </span>
            </div>

            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 700,
                color: metrics.totalDebt > 0 ? '#dc2626' : '#141413',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginTop: 12,
              }}
            >
              {ars(metrics.totalDebt)}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#787772',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`${metrics.teamsUpToDate} equipos al día${metrics.totalFavor > 0 ? ` · A favor: ${ars(metrics.totalFavor)}` : ''}`}
              >
                {metrics.teamsUpToDate} equipos al día
                {metrics.totalFavor > 0 && ` · A favor: ${ars(metrics.totalFavor)}`}
              </div>

              <button
                type="button"
                style={{
                  ...btnOutline,
                  height: 30,
                  padding: '0 12px',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onClick={() =>
                  setStatusFilter(statusFilter === 'deuda' ? 'todos' : 'deuda')
                }
              >
                {statusFilter === 'deuda' ? 'Ver todos' : 'Ver deudores'}
              </button>
            </div>
          </div>

          {/* Card 2: Inscripciones y Descuentos */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: 146,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 22 }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Inscripciones activas (neto)
              </span>
              <span style={tagPill}>{metrics.activeRegsCount} inscriptos</span>
            </div>

            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 700,
                color: '#141413',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginTop: 12,
              }}
            >
              {ars(metrics.totalRegNet)}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#787772',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`Descuentos otorgados: ${ars(metrics.totalRegDiscount)} (${metrics.discountedRegsCount} eq.)`}
              >
                Descuentos: {ars(metrics.totalRegDiscount)} ({metrics.discountedRegsCount} eq.)
              </div>

              <button
                type="button"
                style={{
                  ...btnOutline,
                  height: 30,
                  padding: '0 12px',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onClick={() =>
                  setStatusFilter(statusFilter === 'descuento' ? 'todos' : 'descuento')
                }
              >
                {statusFilter === 'descuento' ? 'Ver todos' : 'Con descuento'}
              </button>
            </div>
          </div>

          {/* Card 3: Saldos Iniciales Migrados (Excel) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              minHeight: 146,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 22 }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Saldos iniciales migrados
              </span>
              <span style={tagPill}>{metrics.teamsWithInitial} equipos</span>
            </div>

            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 700,
                color: '#141413',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginTop: 12,
              }}
            >
              {ars(metrics.totalInitialDebt)}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#787772',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title="deuda previa importada"
              >
                deuda previa importada
              </div>

              <button
                type="button"
                style={{
                  ...btnOutline,
                  height: 30,
                  padding: '0 12px',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onClick={() => setExcelModalOpen(true)}
              >
                Cargar saldos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
         2. TABLA AGRUPADA DE CUENTAS CORRIENTES E INSCRIPCIONES
         ==================================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Cabecera de la tabla con buscador y filtros alineados en la misma barra */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #efeee9',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#141413' }}>
              Estado de cuenta por equipo ({filteredAccounts.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
              Al agregar un equipo a una zona se genera su inscripción estándar. Si paga de más en
              una fecha, el excedente descuenta automáticamente su inscripción o deuda previa.
            </p>
          </div>

          {/* Fila única de controles: Buscador + Desplegable Estado + Desplegable Torneo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Buscador a la izquierda */}
            <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
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
                placeholder="Buscar equipo o categoría…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  height: 34,
                  paddingLeft: 30,
                  paddingRight: 10,
                  fontSize: 12.5,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                  margin: 0,
                }}
              />
            </div>

            {/* Desplegables a la derecha (Estado y Torneo en la misma línea) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#787772', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Estado:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: 34,
                    minWidth: 190,
                    fontSize: 12.5,
                    fontWeight: 500,
                    borderRadius: 8,
                    background: '#faf9f6',
                    border: '1px solid #e5e4df',
                    padding: '0 32px 0 10px',
                    margin: 0,
                  }}
                >
                  <option value="todos">Todos ({accounts.length})</option>
                  <option value="deuda">Con deuda ({metrics.teamsWithDebt})</option>
                  <option value="descuento">Con dto. inscripción ({metrics.discountedRegsCount})</option>
                  <option value="al_dia">Al día ({metrics.teamsUpToDate})</option>
                  <option value="favor">Saldo a favor</option>
                </select>
              </div>

              {tournaments.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#787772', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Torneo:
                  </span>
                  <select
                    value={tourFilter}
                    onChange={(e) => setTourFilter(e.target.value)}
                    style={{
                      height: 34,
                      minWidth: 200,
                      fontSize: 12.5,
                      fontWeight: 500,
                      borderRadius: 8,
                      background: '#faf9f6',
                      border: '1px solid #e5e4df',
                      padding: '0 32px 0 10px',
                      margin: 0,
                    }}
                  >
                    <option value="todos">Todos los torneos</option>
                    {tournaments.map((t) => (
                      <option key={t.tournament} value={t.tournament}>
                        {t.tournament_name}
                      </option>
                    ))}
                    <option value="sin_torneo">Sin torneo activo</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpo de la tabla agrupada */}
        {loading ? (
          <Empty>Cargando cuentas corrientes…</Empty>
        ) : groupedAccounts.length === 0 ? (
          <Empty>No se encontraron equipos con los filtros seleccionados.</Empty>
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
                  <th style={{ padding: '10px 20px' }}>Equipo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Saldo Inicial</th>
                  <th style={{ padding: '10px 14px' }}>Inscripción Torneo</th>
                  <th style={{ padding: '10px 14px' }}>Fechas Jugadas / Pagos</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Saldo Total</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {groupedAccounts.map((group, gIdx) => {
                  const banner = TOURNAMENT_BANNERS[gIdx % TOURNAMENT_BANNERS.length];

                  return (
                    <React.Fragment key={group.key}>
                      {/* Cabecera de Grupo (Torneo) estilo ConfigPagosView */}
                      <tr
                        style={{
                          background: '#f6f5f1',
                          borderTop: '1px solid #e5e4df',
                          borderBottom: '1px solid #e5e4df',
                        }}
                      >
                        <td colSpan={6} style={{ padding: '8px 20px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  background: banner.bg,
                                  color: banner.stroke,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trophy size={13} strokeWidth={2} />
                              </span>
                              <strong style={{ fontSize: 12.5, fontWeight: 700, color: '#141413' }}>
                                {group.label}
                              </strong>
                              <span style={{ fontSize: 11.5, color: '#787772' }}>
                                ({group.items.length}{' '}
                                {group.items.length === 1 ? 'equipo' : 'equipos'})
                              </span>
                            </div>

                            {group.totalGroupDebt > 0 && (
                              <span style={{ fontSize: 11.5, color: '#6b6a65' }}>
                                Pendiente en este grupo:{' '}
                                <strong style={{ color: '#dc2626' }}>
                                  {ars(group.totalGroupDebt)}
                                </strong>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Filas de Equipos */}
                      {group.items.map((row) => {
                        const reg = row.registrations?.[0] || null;
                        const initDebt = num(row.initial_debt);
                        const totalDebt = num(row.total_debt);
                        const overpaidInMatches =
                          num(row.matches_paid) - num(row.matches_due);

                        return (
                          <tr
                            key={row.team}
                            style={{
                              borderBottom: '1px solid #f1f0ec',
                              background: '#ffffff',
                            }}
                          >
                            {/* 1. Equipo */}
                            <td style={{ padding: '12px 20px' }}>
                              <div style={{ fontWeight: 600, color: '#141413', fontSize: 13.5 }}>
                                {row.team_name}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{ ...tagPill, fontSize: 11, padding: '1px 7px' }}>
                                  {row.category_name}
                                </span>
                                {row.tournaments?.[0]?.zone_name && (
                                  <span style={{ fontSize: 11.5, color: '#787772' }}>
                                    {row.tournaments[0].zone_name}
                                  </span>
                                )}
                                {reg && !reg.in_zone && reg.status === 'activa' && (
                                  <span
                                    style={tagRed}
                                    title="El equipo ya jugó partidos y salió de la zona, pero conserva su cargo de inscripción"
                                  >
                                    Fuera de zona (conserva inscripción)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 2. Saldo inicial (Excel) */}
                            <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                              {initDebt !== 0 ? (
                                <div>
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: initDebt > 0 ? '#141413' : '#1d4ed8',
                                    }}
                                  >
                                    {initDebt > 0
                                      ? ars(initDebt)
                                      : `+ ${ars(Math.abs(initDebt))} a favor`}
                                  </span>
                                  {row.initial_note && (
                                    <div style={{ fontSize: 11, color: '#787772' }}>
                                      {row.initial_note}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#a1a09a', fontSize: 12 }}>$ 0</span>
                              )}
                            </td>

                            {/* 3. Inscripción al Torneo */}
                            <td style={{ padding: '12px 14px' }}>
                              {reg ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {reg.status === 'baja' ? (
                                      <span style={tagPill}>Eximida ($ 0)</span>
                                    ) : reg.status === 'bonificada' ? (
                                      <>
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: '#787772',
                                            textDecoration: 'line-through',
                                          }}
                                        >
                                          {ars(reg.base_amount)}
                                        </span>
                                        <span style={tagGreen}>Bonificada 100%</span>
                                      </>
                                    ) : num(reg.discount) > 0 ? (
                                      <>
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: '#787772',
                                            textDecoration: 'line-through',
                                          }}
                                        >
                                          {ars(reg.base_amount)}
                                        </span>
                                        <strong style={{ color: '#141413' }}>
                                          {ars(reg.net_amount)}
                                        </strong>
                                        <span style={tagGreen}>-{ars(reg.discount)} dto.</span>
                                      </>
                                    ) : (
                                      <>
                                        <strong style={{ color: '#141413' }}>
                                          {ars(reg.net_amount)}
                                        </strong>
                                        <span style={{ ...tagPill, fontSize: 10.5 }}>Estándar</span>
                                      </>
                                    )}
                                  </div>
                                  {reg.note && (
                                    <div style={{ fontSize: 11, color: '#787772' }}>{reg.note}</div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: '#a1a09a' }}>
                                  Sin inscripción activa
                                </span>
                              )}
                            </td>

                            {/* 4. Partidos Jugados y Pagos */}
                            <td style={{ padding: '12px 14px' }}>
                              {row.matches_count > 0 || num(row.general_paid) > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <div style={{ fontSize: 12.5, color: '#141413' }}>
                                    <strong>{row.matches_count}</strong>{' '}
                                    {row.matches_count === 1 ? 'fecha' : 'fechas'} · Cargos{' '}
                                    {ars(row.matches_due)}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      flexWrap: 'wrap',
                                      fontSize: 11.5,
                                      color: '#6b6a65',
                                    }}
                                  >
                                    <span>
                                      Pagado: {ars(num(row.matches_paid) + num(row.general_paid))}
                                    </span>
                                    {overpaidInMatches > 0 && (
                                      <span
                                        style={tagBlue}
                                        title="El equipo pagó por encima del arancel del día en las fechas, cancelando inscripción o deuda previa"
                                      >
                                        + {ars(overpaidInMatches)} a cuenta en fechas
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: '#a1a09a' }}>
                                  Sin fechas registradas
                                </span>
                              )}
                            </td>

                            {/* 5. Saldo Total Actual */}
                            <td
                              style={{
                                padding: '12px 14px',
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {totalDebt > 0 ? (
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#dc2626',
                                  }}
                                >
                                  Debe {ars(totalDebt)}
                                </span>
                              ) : totalDebt < 0 ? (
                                <span style={tagBlue}>
                                  + {ars(Math.abs(totalDebt))} a favor
                                </span>
                              ) : (
                                <span style={tagGreen}>
                                  <CheckCircle2 size={12.5} /> Al día
                                </span>
                              )}
                            </td>

                            {/* 6. Acciones */}
                            <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <button
                                  type="button"
                                  style={{ ...btnOutline, height: 30, padding: '0 10px' }}
                                  title="Aplicar descuento o editar inscripción"
                                  onClick={() =>
                                    setDiscountModal({
                                      teamRow: row,
                                      registration: reg,
                                    })
                                  }
                                >
                                  <Percent size={12.5} /> Dto. Insc.
                                </button>

                                <button
                                  type="button"
                                  style={{ ...btnOutline, height: 30, padding: '0 10px' }}
                                  title="Ver estado de cuenta detallado"
                                  onClick={() => setLedgerModal(row)}
                                >
                                  <FileText size={13} /> Ficha
                                </button>

                                {totalDebt > 0 && (
                                  <button
                                    type="button"
                                    style={{ ...btnDark, height: 30, padding: '0 10px' }}
                                    onClick={() =>
                                      setCobroModal({
                                        team: row.team,
                                        amount: totalDebt,
                                        concept: `Cobro cuenta corriente — ${row.team_name}`,
                                      })
                                    }
                                  >
                                    <HandCoins size={13} /> Cobrar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALES */}
      {discountModal && (
        <RegistrationDiscountModal
          teamRow={discountModal.teamRow}
          registration={discountModal.registration}
          tournaments={tournaments}
          onClose={() => setDiscountModal(null)}
          onSaved={(msg) => {
            setDiscountModal(null);
            notify(msg);
            loadAll();
            onChanged?.();
          }}
        />
      )}

      {excelModalOpen && (
        <ExcelMigrationModal
          accounts={accounts}
          onClose={() => setExcelModalOpen(false)}
          onSaved={(msg) => {
            setExcelModalOpen(false);
            notify(msg);
            loadAll();
            onChanged?.();
          }}
        />
      )}

      {cobroModal && (
        <CobroDeudaModal
          preset={cobroModal}
          accounts={accounts}
          onClose={() => setCobroModal(null)}
          onSaved={(msg) => {
            setCobroModal(null);
            notify(msg);
            loadAll();
            onChanged?.();
          }}
        />
      )}

      {ledgerModal && (
        <TeamLedgerModal
          teamRow={ledgerModal}
          onClose={() => setLedgerModal(null)}
          onOpenDiscount={() => {
            const row = ledgerModal;
            setLedgerModal(null);
            setDiscountModal({
              teamRow: row,
              registration: row.registrations?.[0] || null,
            });
          }}
          onOpenPay={() => {
            const row = ledgerModal;
            setLedgerModal(null);
            setCobroModal({
              team: row.team,
              amount: num(row.total_debt),
              concept: `Cobro cuenta corriente — ${row.team_name}`,
            });
          }}
        />
      )}
    </div>
  );
}

