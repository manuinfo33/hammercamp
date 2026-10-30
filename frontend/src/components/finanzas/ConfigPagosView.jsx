import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  History,
  Trophy,
  Users,
  Briefcase,
  TrendingUp,
  Check,
  Copy,
  Sparkles,
  Search,
  ArrowRight,
  Phone,
  CreditCard,
  Zap,
  CheckCircle2,
  Stethoscope,
  Ambulance,
  ClipboardCheck,
  Shield,
  Camera,
} from 'lucide-react';
import api from '../../api';
import { ars, num, errMsg, CATEGORIES, Field, Modal, Empty } from './common';

const today = () => new Date().toISOString().slice(0, 10);
const catLabel = (c) => CATEGORIES.find(([k]) => k === c)?.[1] || c;

const QUICK_PCTS = [10, 15, 20, 25, 30];

/* Paleta de cabeceras pastel editorial (estilo Anthropic / Claude Console) */
const CATEGORY_BANNER = {
  arbitro: { bg: '#eeece6', stroke: '#3d3929', Icon: ClipboardCheck },
  medico: { bg: '#c8ded3', stroke: '#1f3a2e', Icon: Stethoscope },
  ambulancia: { bg: '#e89d7c', stroke: '#3b1d11', Icon: Ambulance },
  planillero: { bg: '#7cb2f4', stroke: '#132a4a', Icon: ClipboardCheck },
  seguridad: { bg: '#dcd8ea', stroke: '#2c2545', Icon: Shield },
  fotografia: { bg: '#f2d5c4', stroke: '#422616', Icon: Camera },
  socio: { bg: '#fee2e2', stroke: '#991b1b', Icon: Users },
  semana: { bg: '#fef3c7', stroke: '#92400e', Icon: Briefcase },
  otro: { bg: '#e6e4dd', stroke: '#33312b', Icon: Briefcase },
};

const TOURNAMENT_BANNERS = [
  { bg: '#7cb2f4', stroke: '#132a4a' }, // Azul suave
  { bg: '#e89d7c', stroke: '#3b1d11' }, // Terracota / Coral cálido
  { bg: '#c8ded3', stroke: '#1f3a2e' }, // Verde salvia
  { bg: '#dcd8ea', stroke: '#2c2545' }, // Lavanda / Violeta pastel
  { bg: '#f5dd90', stroke: '#4d3d0d' }, // Mostaza suave / Ocre cálido
  { bg: '#eeece6', stroke: '#3d3929' }, // Arena / Gris cálido
];

function fmtDate(d) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

/* Botón secundario limpio estilo consola */
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
};

/* Botón primario negro estilo consola */
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
};

/* Etiqueta gris suave estilo consola */
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

/* ============================================================================
   MODAL: AUMENTO INDIVIDUAL (TORNEO O STAFF)
   ============================================================================ */
function AumentoModal({ title, subtitle, currentAmount, badgeText, onClose, onConfirm }) {
  const current = Number(currentAmount) || 0;
  const [pct, setPct] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const applyPct = (val) => {
    setPct(val);
    if (val === '') {
      setNewAmount('');
    } else {
      const p = Number(val);
      const inc = current * (p / 100);
      setNewAmount(Math.round(current + inc));
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setNewAmount(val);
    if (val === '' || current === 0) {
      setPct('');
    } else {
      const a = Number(val);
      const diff = a - current;
      const p = (diff / current) * 100;
      setPct(Number(p.toFixed(1)));
    }
  };

  const finalAmount = newAmount !== '' ? Number(newAmount) : current;
  const diff = finalAmount - current;
  const hasChange = newAmount !== '' && finalAmount !== current;

  const submit = async () => {
    if (!hasChange) return;
    setSaving(true);
    setErr('');
    try {
      const finalNote =
        note.trim() || `Ajuste ${pct !== '' ? `${pct >= 0 ? '+' : ''}${pct}%` : ''}`.trim();
      await onConfirm({
        amount: finalAmount,
        effective_from: effectiveFrom,
        note: finalNote,
      });
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} width={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <div style={{ fontSize: 12, color: '#6b6a65', fontWeight: 500 }}>Valor actual</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#141413', marginTop: 2 }}>
              {ars(current)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {badgeText && <span style={tagBlue}>{badgeText}</span>}
            {subtitle && (
              <div style={{ fontSize: 12, color: '#6b6a65', marginTop: 4 }}>{subtitle}</div>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#6b6a65',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={13} /> Aplicar porcentaje rápido:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PCTS.map((q) => {
              const active = Number(pct) === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => applyPct(String(q))}
                  style={{
                    ...(active ? btnDark : btnOutline),
                    height: 32,
                  }}
                >
                  +{q}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="cf-grid-2">
          <Field label="Porcentaje de ajuste (%)">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.5"
                placeholder="Ej: 15"
                value={pct}
                onChange={(e) => applyPct(e.target.value)}
                style={{ paddingRight: 30 }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b6a65',
                  fontWeight: 600,
                }}
              >
                %
              </span>
            </div>
          </Field>
          <Field label="Nuevo valor final ($)">
            <input
              type="number"
              min="0"
              step="100"
              placeholder={`Ej: ${current ? Math.round(current * 1.15) : 15000}`}
              value={newAmount}
              onChange={handleAmountChange}
            />
          </Field>
        </div>

        {hasChange && (
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
              <span style={{ color: '#787772', textDecoration: 'line-through' }}>
                {ars(current)}
              </span>
              <ArrowRight size={14} style={{ color: '#787772' }} />
              <strong style={{ fontSize: '1.1rem', fontWeight: 700, color: '#141413' }}>
                {ars(finalAmount)}
              </strong>
            </div>
            <span
              style={{
                ...tagPill,
                background: diff >= 0 ? '#dcfce7' : '#fee2e2',
                color: diff >= 0 ? '#166534' : '#991b1b',
                fontWeight: 600,
              }}
            >
              {diff >= 0 ? '+' : ''}
              {ars(diff)} {pct !== '' && `(${pct >= 0 ? '+' : ''}${pct}%)`}
            </span>
          </div>
        )}

        <div className="cf-grid-2">
          <Field label="Vigente desde">
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </Field>
          <Field label="Motivo / Nota (opcional)">
            <input
              type="text"
              placeholder="Ej: Ajuste Fecha 8"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>

        {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" style={btnDark} onClick={submit} disabled={!hasChange || saving}>
            <TrendingUp size={14} /> {saving ? 'Aplicando…' : 'Confirmar nuevo valor'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MODAL: AUMENTO MASIVO EN LOTE
   ============================================================================ */
function BulkIncreaseModal({ title, items, nameKey, onClose, onApplyBulk }) {
  const [pct, setPct] = useState('15');
  const [roundStep, setRoundStep] = useState('500');
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const previewRows = useMemo(() => {
    const p = Number(pct) || 0;
    const step = Number(roundStep) || 1;
    return items.map((item) => {
      const oldVal = Number(item.amount) || 0;
      const rawNew = oldVal * (1 + p / 100);
      const newVal = step > 1 ? Math.round(rawNew / step) * step : Math.round(rawNew);
      return {
        ...item,
        oldVal,
        newVal,
        diff: newVal - oldVal,
      };
    });
  }, [items, pct, roundStep]);

  const handleConfirm = async () => {
    setSaving(true);
    setErr('');
    try {
      const finalNote = note.trim() || `Aumento masivo +${pct}%`;
      await onApplyBulk(previewRows, effectiveFrom, finalNote);
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_PCTS.map((q) => {
            const active = Number(pct) === q;
            return (
              <button
                key={q}
                type="button"
                onClick={() => setPct(String(q))}
                style={{
                  ...(active ? btnDark : btnOutline),
                  height: 30,
                }}
              >
                +{q}%
              </button>
            );
          })}
        </div>

        <div className="cf-grid-2">
          <Field label="Porcentaje a aplicar (%)">
            <input
              type="number"
              step="1"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </Field>
          <Field label="Redondear a múltiplos de">
            <select value={roundStep} onChange={(e) => setRoundStep(e.target.value)}>
              <option value="1">Sin redondeo ($1)</option>
              <option value="100">$ 100</option>
              <option value="500">$ 500</option>
              <option value="1000">$ 1.000</option>
            </select>
          </Field>
          <Field label="Vigente desde">
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </Field>
          <Field label="Nota para el historial">
            <input
              type="text"
              placeholder={`Ej: Aumento general +${pct}%`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>

        <div
          style={{
            maxHeight: 240,
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid #e6e4dd',
            background: '#faf9f6',
          }}
        >
          <table className="compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e6e4dd', textAlign: 'left' }}>
                <th>Concepto</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Nuevo</th>
                <th style={{ textAlign: 'right' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #efeee9' }}>
                  <td style={{ fontWeight: 500 }}>{r[nameKey]}</td>
                  <td style={{ textAlign: 'right', color: '#787772' }}>{ars(r.oldVal)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{ars(r.newVal)}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: r.diff >= 0 ? '#166534' : '#991b1b',
                    }}
                  >
                    {r.diff >= 0 ? '+' : ''}
                    {ars(r.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={btnOutline} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            style={btnDark}
            onClick={handleConfirm}
            disabled={saving || !pct || Number(pct) === 0}
          >
            <TrendingUp size={14} /> {saving ? 'Actualizando…' : `Aplicar a ${previewRows.length} ítems`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   VISTA PRINCIPAL: CONFIGURACIÓN DE PAGOS (DISEÑO EDITORIAL LIMPIO)
   ============================================================================ */
export default function ConfigPagosView() {
  const [fees, setFees] = useState([]);
  const [staff, setStaff] = useState([]);
  const [partners, setPartners] = useState([]);
  const [history, setHistory] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  // Estados de Aranceles de Torneos
  const [feeDraft, setFeeDraft] = useState({});
  const [savingFeeId, setSavingFeeId] = useState(null);
  const [aumentoFeeTarget, setAumentoFeeTarget] = useState(null);
  const [bulkFeesOpen, setBulkFeesOpen] = useState(false);

  // Estados de Staff
  const [catFilter, setCatFilter] = useState('todas');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDraft, setStaffDraft] = useState({});
  const [savingStaffId, setSavingStaffId] = useState(null);
  const [staffFormModal, setStaffFormModal] = useState(null);
  const [aumentoStaffRate, setAumentoStaffRate] = useState(null);
  const [bulkStaffOpen, setBulkStaffOpen] = useState(false);
  const [staffErr, setStaffErr] = useState('');

  // Estados de Socios
  const [partnerForm, setPartnerForm] = useState(null);
  const [copiedPartnerId, setCopiedPartnerId] = useState(null);

  // Estados de Historial
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [histKind, setHistKind] = useState('');
  const [histSearch, setHistSearch] = useState('');

  const loadAll = useCallback(() => {
    api.get('finances/tournament-fees/').then((r) => setFees(r.data));
    api.get('finances/staff-rates/').then((r) => setStaff(r.data));
    api.get('finances/partners/').then((r) => setPartners(r.data));
    api.get('finances/rate-changes/').then((r) => setHistory(r.data));
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

  /* --- Lógica de Aranceles de Torneos --- */
  const saveFeeDirect = async (row, customAmount, effective_from = today(), note = '') => {
    setSavingFeeId(row.tournament);
    try {
      const amount = customAmount ?? feeDraft[row.tournament];
      await api.post('finances/tournament-fees/', {
        tournament: row.tournament,
        amount,
        effective_from,
        note,
      });
      setFeeDraft((d) => {
        const n = { ...d };
        delete n[row.tournament];
        return n;
      });
      notify(`Arancel de "${row.tournament_name}" actualizado a ${ars(amount)}.`);
      loadAll();
    } finally {
      setSavingFeeId(null);
    }
  };

  const applyBulkFees = async (previewRows, effectiveFrom, note) => {
    for (const r of previewRows) {
      if (r.newVal !== r.oldVal) {
        await api.post('finances/tournament-fees/', {
          tournament: r.tournament,
          amount: r.newVal,
          effective_from: effectiveFrom,
          note,
        });
      }
    }
    setBulkFeesOpen(false);
    notify('Aranceles de torneos actualizados masivamente.');
    loadAll();
  };

  /* --- Lógica de Staff --- */
  const filteredStaff = useMemo(() => {
    return staff.filter((r) => {
      if (catFilter !== 'todas' && r.category !== catFilter) return false;
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        const name = (r.name || '').toLowerCase();
        const cat = catLabel(r.category).toLowerCase();
        if (!name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [staff, catFilter, staffSearch]);

  const groupedStaff = useMemo(() => {
    const groups = [];
    const order = CATEGORIES.map(([k]) => k);
    for (const k of order) {
      const items = filteredStaff.filter((r) => r.category === k);
      if (items.length > 0) {
        groups.push({
          key: k,
          label: catLabel(k),
          items,
          totalJornada: items
            .filter((i) => i.active && i.unit === 'jornada')
            .reduce((acc, i) => acc + num(i.amount), 0),
        });
      }
    }
    return groups;
  }, [filteredStaff]);

  const saveStaffDirectAmount = async (rate) => {
    const draftAmount = staffDraft[rate.id];
    if (draftAmount === undefined || num(draftAmount) === num(rate.amount)) return;
    setSavingStaffId(rate.id);
    try {
      await api.put(`finances/staff-rates/${rate.id}/`, {
        ...rate,
        amount: num(draftAmount),
        effective_from: today(),
        note: 'Edición directa en tabla',
      });
      setStaffDraft((d) => {
        const n = { ...d };
        delete n[rate.id];
        return n;
      });
      notify(`Tarifa "${rate.name}" actualizada a ${ars(draftAmount)}.`);
      loadAll();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setSavingStaffId(null);
    }
  };

  const presentCategories = useMemo(() => {
    const set = new Set(staff.map((r) => r.category));
    return CATEGORIES.filter(([k]) => set.has(k));
  }, [staff]);

  const saveStaffForm = async () => {
    setStaffErr('');
    try {
      const body = { ...staffFormModal, amount: num(staffFormModal.amount) };
      if (staffFormModal.id) {
        await api.put(`finances/staff-rates/${staffFormModal.id}/`, body);
        notify(`Tarifa "${staffFormModal.name}" actualizada.`);
      } else {
        await api.post('finances/staff-rates/', body);
        notify(`Nueva tarifa "${staffFormModal.name}" creada.`);
      }
      setStaffFormModal(null);
      loadAll();
    } catch (e) {
      setStaffErr(errMsg(e));
    }
  };

  const toggleStaffProp = async (rate, prop) => {
    try {
      const updated = { ...rate, [prop]: !rate[prop] };
      await api.put(`finances/staff-rates/${rate.id}/`, updated);
      notify(
        prop === 'auto_include'
          ? `"${rate.name}": ${updated.auto_include ? 'Precarga automática activada' : 'Carga manual'}.`
          : `"${rate.name}": ${updated.active ? 'Activada' : 'Desactivada'}.`,
      );
      loadAll();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const deleteStaff = async (r) => {
    if (window.confirm(`¿Eliminar la tarifa "${r.name}"?`)) {
      await api.delete(`finances/staff-rates/${r.id}/`);
      notify(`Tarifa "${r.name}" eliminada.`);
      loadAll();
    }
  };

  const applyBulkStaff = async (previewRows, effectiveFrom, note) => {
    for (const r of previewRows) {
      if (r.newVal !== r.oldVal) {
        await api.put(`finances/staff-rates/${r.id}/`, {
          ...r,
          amount: r.newVal,
          effective_from: effectiveFrom,
          note,
        });
      }
    }
    setBulkStaffOpen(false);
    notify('Tarifas de staff actualizadas masivamente.');
    loadAll();
  };

  /* --- Lógica de Socios --- */
  const savePartner = async () => {
    if (partnerForm.id) {
      await api.put(`finances/partners/${partnerForm.id}/`, partnerForm);
      notify(`Socio "${partnerForm.name}" actualizado.`);
    } else {
      await api.post('finances/partners/', partnerForm);
      notify(`Socio "${partnerForm.name}" registrado.`);
    }
    setPartnerForm(null);
    loadAll();
  };

  const deletePartner = async (p) => {
    if (window.confirm(`¿Eliminar al socio "${p.name}"?`)) {
      await api.delete(`finances/partners/${p.id}/`);
      notify(`Socio "${p.name}" eliminado.`);
      loadAll();
    }
  };

  const copyAlias = (p) => {
    if (!p.alias) return;
    navigator.clipboard?.writeText(p.alias);
    setCopiedPartnerId(p.id);
    setTimeout(() => setCopiedPartnerId(null), 1800);
  };

  /* --- Métricas superiores --- */
  const activeStaff = staff.filter((s) => s.active);
  const autoStaff = activeStaff.filter((s) => s.auto_include);
  const fixedJornadaTotal = autoStaff
    .filter((s) => s.unit === 'jornada')
    .reduce((acc, s) => acc + num(s.amount), 0);
  const avgFee =
    fees.length > 0
      ? Math.round(fees.reduce((acc, f) => acc + num(f.amount), 0) / fees.length)
      : 0;
  const activePartners = partners.filter((p) => p.active);

  const filteredHistory = useMemo(() => {
    return history.filter((r) => {
      if (histKind && r.kind !== histKind) return false;
      if (histSearch.trim()) {
        const q = histSearch.toLowerCase();
        const name = (r.tournament_name || r.staff_name || '').toLowerCase();
        const note = (r.note || '').toLowerCase();
        if (!name.includes(q) && !note.includes(q)) return false;
      }
      return true;
    });
  }, [history, histKind, histSearch]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
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
            Configuración de pagos y tarifas
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={btnOutline}
              onClick={() => setBulkStaffOpen(true)}
            >
              <TrendingUp size={13.5} /> Aumento masivo %
            </button>
            <button
              type="button"
              style={btnDark}
              onClick={() => {
                setStaffErr('');
                setStaffFormModal({
                  name: '',
                  category: 'arbitro',
                  unit: 'partido',
                  amount: '',
                  auto_include: true,
                  active: true,
                  effective_from: today(),
                });
              }}
            >
              <Plus size={14} /> Nueva tarifa
            </button>
          </div>
        </div>

        {/* 3 Tarjetas superiores estilo "Créditos / Gasto de este mes / Caché" */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: 14,
          }}
        >
          {/* Card 1: Arancel de Torneos */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Arancel promedio por equipo
              </span>
              <span style={tagPill}>{fees.length} torneos</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.55rem',
                    fontWeight: 700,
                    color: '#141413',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {ars(avgFee)}
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    marginTop: 8,
                    height: 'auto',
                    minWidth: 0,
                    fontSize: 12,
                    fontWeight: 400,
                    color: '#6b6a65',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    textTransform: 'none',
                    letterSpacing: 0,
                    boxShadow: 'none',
                  }}
                >
                  Ver historial ({history.length} ajustes)
                </button>
              </div>

              {fees.length > 0 && (
                <button
                  type="button"
                  style={btnOutline}
                  onClick={() => setBulkFeesOpen(true)}
                >
                  Ajustar aranceles
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Base fija por jornada (Staff Auto) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Costo fijo de Staff por jornada
              </span>
              <span style={tagPill}>{autoStaff.length} auto en fecha</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.55rem',
                    fontWeight: 700,
                    color: '#141413',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {ars(fixedJornadaTotal)}
                </div>
                <div style={{ fontSize: 12, color: '#787772', marginTop: 6, lineHeight: 1.35 }}>
                  de {activeStaff.length} tarifas activas en el sistema
                  <br />
                  (sin contar árbitros por partido)
                </div>
              </div>

              {/* Anillo indicador minimalista como en la imagen */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '3.5px solid #d6d5d0',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>

          {/* Card 3: Socios habilitados */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Socios y reintegros
              </span>
              <span style={tagPill}>
                {activePartners.length === 0 ? 'Sin habilitar' : `${activePartners.length} activos`}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 600,
                    color: '#141413',
                    lineHeight: 1.1,
                  }}
                >
                  {activePartners.length > 0 ? activePartners.length : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#787772', marginTop: 8 }}>
                  socios para adelantos de caja
                </div>
              </div>

              <button
                type="button"
                style={btnOutline}
                onClick={() => setPartnerForm({ name: '', alias: '', phone: '', active: true })}
              >
                Agregar socio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
         2. SECCIÓN: ARANCELES DE TORNEOS (ESTILO TARJETAS CON CABECERA DE COLOR)
         ==================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#141413' }}>
            Aranceles por torneo
          </h3>
          {fees.length > 1 && (
            <button
              type="button"
              onClick={() => setBulkFeesOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                height: 'auto',
                minWidth: 0,
                fontSize: 12.5,
                fontWeight: 400,
                color: '#52514e',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                textTransform: 'none',
                letterSpacing: 0,
                boxShadow: 'none',
              }}
            >
              Ajustar todos por porcentaje
            </button>
          )}
        </div>

        {fees.length === 0 ? (
          <Empty>No hay torneos creados todavía.</Empty>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
              gap: 14,
            }}
          >
            {fees.map((r, idx) => {
              const banner = TOURNAMENT_BANNERS[idx % TOURNAMENT_BANNERS.length];
              const currentVal = num(r.amount);
              const draftVal = feeDraft[r.tournament];
              const isEditing = draftVal !== undefined && num(draftVal) !== currentVal;

              return (
                <div
                  key={r.tournament}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e4df',
                    borderRadius: 12,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Cabecera pastel estilo "Modelos" de la imagen */}
                  <div
                    style={{
                      height: 82,
                      borderRadius: 8,
                      background: banner.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Trophy size={30} strokeWidth={1.6} style={{ color: banner.stroke }} />
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div style={{ padding: '12px 10px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>
                        {r.tournament_name}
                      </strong>
                      <span style={tagBlue}>Vigente</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={tagPill}>{ars(currentVal)}</span>
                      <span style={tagPill}>Por equipo</span>
                      <span style={tagPill}>Por fecha</span>
                    </div>

                    {/* Edición rápida o ajuste por % */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                        paddingTop: 10,
                        borderTop: '1px solid #f1f0ec',
                      }}
                    >
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: 9,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 12,
                            color: '#787772',
                            fontWeight: 600,
                          }}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={draftVal ?? r.amount}
                          onChange={(e) => setFeeDraft({ ...feeDraft, [r.tournament]: e.target.value })}
                          style={{
                            height: 32,
                            paddingLeft: 22,
                            paddingRight: 8,
                            fontSize: 12.5,
                            fontWeight: 600,
                            borderRadius: 8,
                            background: '#faf9f6',
                            border: '1px solid #e5e4df',
                          }}
                        />
                      </div>

                      {isEditing ? (
                        <button
                          type="button"
                          style={{ ...btnDark, height: 32, padding: '0 10px' }}
                          disabled={savingFeeId === r.tournament}
                          onClick={() => saveFeeDirect(r)}
                        >
                          <Save size={13} /> Guardar
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={btnOutline}
                          title="Ajustar por porcentaje"
                          onClick={() => setAumentoFeeTarget(r)}
                        >
                          <TrendingUp size={13} /> Ajustar %
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================
         3. SECCIÓN: TARIFAS DE SERVICIOS Y PERSONAL (TABLA AGRUPADA POR RUBRO)
         ==================================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Barra superior de la tabla: Título + Buscador + Filtros de Rubro */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #efeee9',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#141413' }}>
                Tarifas de servicios y personal ({filteredStaff.length})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
                Podés editar cualquier monto directamente sobre la fila o aplicar un ajuste porcentual.
              </p>
            </div>

            {/* Buscador rápido */}
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
                  placeholder="Buscar nombre o servicio…"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
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
            </div>
          </div>

          {/* Pestañas de filtro por categoría */}
          {presentCategories.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCatFilter('todas')}
                style={{
                  ...(catFilter === 'todas' ? btnDark : btnOutline),
                  height: 28,
                  padding: '0 10px',
                  fontSize: 12,
                }}
              >
                Todas ({staff.length})
              </button>
              {presentCategories.map(([k, label]) => {
                const count = staff.filter((r) => r.category === k).length;
                const active = catFilter === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCatFilter(k)}
                    style={{
                      ...(active ? btnDark : btnOutline),
                      height: 28,
                      padding: '0 10px',
                      fontSize: 12,
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabla agrupada por categoría */}
        {groupedStaff.length === 0 ? (
          <Empty>No se encontraron tarifas con los filtros actuales.</Empty>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
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
                  <th style={{ padding: '10px 20px' }}>Personal / Servicio</th>
                  <th style={{ padding: '10px 14px' }}>Liquidación</th>
                  <th style={{ padding: '10px 14px' }}>Precarga en fecha</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Tarifa vigente</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {groupedStaff.map((group) => {
                  const catInfo = CATEGORY_BANNER[group.key] || CATEGORY_BANNER.otro;
                  const CatIcon = catInfo.Icon;

                  return (
                    <React.Fragment key={group.key}>
                      {/* Cabecera de grupo (Categoría) */}
                      <tr
                        style={{
                          background: '#f6f5f1',
                          borderTop: '1px solid #e5e4df',
                          borderBottom: '1px solid #e5e4df',
                        }}
                      >
                        <td
                          colSpan={5}
                          style={{
                            padding: '8px 20px',
                          }}
                        >
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
                                  background: catInfo.bg,
                                  color: catInfo.stroke,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CatIcon size={13} strokeWidth={2} />
                              </span>
                              <strong
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: '#141413',
                                  letterSpacing: '0.01em',
                                }}
                              >
                                {group.label}
                              </strong>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: '#787772',
                                  fontWeight: 500,
                                }}
                              >
                                ({group.items.length})
                              </span>
                            </div>

                            {group.totalJornada > 0 && (
                              <span style={{ fontSize: 11.5, color: '#6b6a65' }}>
                                Subtotal por jornada:{' '}
                                <strong style={{ color: '#141413' }}>{ars(group.totalJornada)}</strong>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Filas de cada tarifa dentro del grupo */}
                      {group.items.map((r) => {
                        const currentVal = num(r.amount);
                        const draftVal = staffDraft[r.id];
                        const isDirty = draftVal !== undefined && num(draftVal) !== currentVal;

                        return (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: '1px solid #f1f0ec',
                              opacity: r.active ? 1 : 0.5,
                              background: isDirty ? '#fefce8' : '#ffffff',
                              transition: 'background 0.12s ease',
                            }}
                          >
                            {/* Columna 1: Nombre */}
                            <td style={{ padding: '11px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: currentVal > 0 ? catInfo.bg : '#d4d3ce',
                                    border: `1px solid ${catInfo.stroke}40`,
                                    flexShrink: 0,
                                  }}
                                />
                                <strong style={{ fontSize: 13.5, fontWeight: 600, color: '#141413' }}>
                                  {r.name}
                                </strong>
                                {!r.active && (
                                  <span style={{ ...tagPill, color: '#991b1b', background: '#fee2e2' }}>
                                    Inactiva
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Columna 2: Modalidad de cobro */}
                            <td style={{ padding: '11px 14px' }}>
                              <span style={tagPill}>
                                {r.unit === 'partido' ? 'Por partido' : 'Por jornada'}
                              </span>
                            </td>

                            {/* Columna 3: Toggle Auto en planilla */}
                            <td style={{ padding: '11px 14px' }}>
                              <button
                                type="button"
                                onClick={() => toggleStaffProp(r, 'auto_include')}
                                title="Clic para cambiar entre precarga automática o manual al abrir una fecha"
                                style={{
                                  ...(r.auto_include ? tagBlue : tagPill),
                                  height: 24,
                                  minWidth: 0,
                                  padding: '0 9px',
                                  cursor: 'pointer',
                                  textTransform: 'none',
                                  letterSpacing: 0,
                                  boxShadow: 'none',
                                }}
                              >
                                <Zap size={11} />
                                {r.auto_include ? 'Auto en fecha' : 'Manual'}
                              </button>
                            </td>

                            {/* Columna 4: Monto editable al instante */}
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 6,
                                }}
                              >
                                <div style={{ position: 'relative', width: 122 }}>
                                  <span
                                    style={{
                                      position: 'absolute',
                                      left: 9,
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      fontSize: 12,
                                      color: '#787772',
                                      fontWeight: 600,
                                    }}
                                  >
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={draftVal ?? r.amount}
                                    onChange={(e) =>
                                      setStaffDraft({ ...staffDraft, [r.id]: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && isDirty) {
                                        saveStaffDirectAmount(r);
                                      }
                                    }}
                                    style={{
                                      height: 30,
                                      paddingLeft: 20,
                                      paddingRight: 8,
                                      textAlign: 'right',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      borderRadius: 7,
                                      background: isDirty ? '#ffffff' : '#faf9f6',
                                      border: isDirty
                                        ? '1px solid #141413'
                                        : '1px solid #e5e4df',
                                      color: currentVal === 0 && !isDirty ? '#a1a09a' : '#141413',
                                    }}
                                  />
                                </div>

                                {isDirty && (
                                  <button
                                    type="button"
                                    style={{ ...btnDark, height: 30, padding: '0 10px', fontSize: 11.5 }}
                                    disabled={savingStaffId === r.id}
                                    onClick={() => saveStaffDirectAmount(r)}
                                  >
                                    <Check size={12} /> Guardar
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Columna 5: Acciones */}
                            <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    ...btnOutline,
                                    height: 28,
                                    padding: '0 9px',
                                    fontSize: 11.5,
                                  }}
                                  title="Calcular aumento por porcentaje"
                                  onClick={() => setAumentoStaffRate(r)}
                                >
                                  <TrendingUp size={12} /> Ajustar %
                                </button>

                                <button
                                  type="button"
                                  title="Editar nombre, categoría o modalidad"
                                  onClick={() => {
                                    setStaffErr('');
                                    setStaffFormModal({ ...r, effective_from: today() });
                                  }}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    minWidth: 28,
                                    padding: 0,
                                    borderRadius: 6,
                                    background: '#ffffff',
                                    color: '#52514e',
                                    border: '1px solid #e5e4df',
                                    boxShadow: 'none',
                                  }}
                                >
                                  <Pencil size={13} />
                                </button>

                                <button
                                  type="button"
                                  title="Eliminar tarifa"
                                  onClick={() => deleteStaff(r)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    minWidth: 28,
                                    padding: 0,
                                    borderRadius: 6,
                                    background: '#ffffff',
                                    color: '#787772',
                                    border: '1px solid #e5e4df',
                                    boxShadow: 'none',
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
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

      {/* ====================================================================
         4. SECCIÓN: SOCIOS Y HISTORIAL RECIENTE (EN 2 COLUMNAS LIMPIAS)
         ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {/* Socios */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#141413' }}>
                Socios habilitados
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
                Adelantos de gastos y reintegros por transferencia.
              </p>
            </div>
            <button
              type="button"
              style={btnOutline}
              onClick={() => setPartnerForm({ name: '', alias: '', phone: '', active: true })}
            >
              <Plus size={13} /> Nuevo socio
            </button>
          </div>

          {partners.length === 0 ? (
            <div style={{ padding: '16px 0', fontSize: 12.5, color: '#787772' }}>
              Sin socios cargados todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partners.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#faf9f6',
                    border: '1px solid #efeee9',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#141413' }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#787772',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      {p.alias ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CreditCard size={12} /> {p.alias}
                          <button
                            type="button"
                            onClick={() => copyAlias(p)}
                            style={{
                              height: 20,
                              minWidth: 20,
                              padding: '0 4px',
                              borderRadius: 4,
                              background: 'transparent',
                              color: '#52514e',
                              border: 'none',
                              boxShadow: 'none',
                            }}
                          >
                            {copiedPartnerId === p.id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </span>
                      ) : (
                        <span>Sin alias</span>
                      )}
                      {p.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} /> {p.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setPartnerForm(p)}
                      style={{
                        width: 28,
                        height: 28,
                        minWidth: 28,
                        padding: 0,
                        borderRadius: 6,
                        background: '#ffffff',
                        color: '#52514e',
                        border: '1px solid #e5e4df',
                        boxShadow: 'none',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePartner(p)}
                      style={{
                        width: 28,
                        height: 28,
                        minWidth: 28,
                        padding: 0,
                        borderRadius: 6,
                        background: '#ffffff',
                        color: '#787772',
                        border: '1px solid #e5e4df',
                        boxShadow: 'none',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos cambios en el historial */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#141413' }}>
                Últimas actualizaciones
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
                Registro de aumentos y cambios de tarifas.
              </p>
            </div>
            <button
              type="button"
              style={btnOutline}
              onClick={() => setHistoryModalOpen(true)}
            >
              <History size={13} /> Ver todo ({history.length})
            </button>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '16px 0', fontSize: 12.5, color: '#787772' }}>
              Sin modificaciones registradas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 4).map((h) => {
                const old = Number(h.old_amount);
                const nw = Number(h.new_amount);
                return (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#faf9f6',
                      border: '1px solid #efeee9',
                      fontSize: 12.5,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: '#141413' }}>
                        {h.tournament_name || h.staff_name}
                      </strong>
                      <div style={{ fontSize: 11.5, color: '#787772' }}>
                        {fmtDate(h.effective_from)} {h.note ? `· ${h.note}` : ''}
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#141413' }}>
                      {old > 0 && (
                        <span style={{ color: '#787772', fontWeight: 400, marginRight: 6 }}>
                          {ars(old)} →
                        </span>
                      )}
                      {ars(nw)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
         MODALES
         ==================================================================== */}
      {aumentoFeeTarget && (
        <AumentoModal
          title={`Ajustar arancel — ${aumentoFeeTarget.tournament_name}`}
          subtitle="Arancel de equipo por fecha"
          currentAmount={aumentoFeeTarget.amount}
          badgeText="Por fecha"
          onClose={() => setAumentoFeeTarget(null)}
          onConfirm={async ({ amount, effective_from, note }) => {
            await saveFeeDirect(aumentoFeeTarget, amount, effective_from, note);
            setAumentoFeeTarget(null);
          }}
        />
      )}

      {bulkFeesOpen && (
        <BulkIncreaseModal
          title="Aumento masivo — Aranceles de Equipos"
          items={fees}
          nameKey="tournament_name"
          onClose={() => setBulkFeesOpen(false)}
          onApplyBulk={applyBulkFees}
        />
      )}

      {aumentoStaffRate && (
        <AumentoModal
          title={`Ajustar tarifa — ${aumentoStaffRate.name}`}
          subtitle={catLabel(aumentoStaffRate.category)}
          currentAmount={aumentoStaffRate.amount}
          badgeText={aumentoStaffRate.unit === 'partido' ? 'Por partido' : 'Por jornada'}
          onClose={() => setAumentoStaffRate(null)}
          onConfirm={async ({ amount, effective_from, note }) => {
            await api.put(`finances/staff-rates/${aumentoStaffRate.id}/`, {
              ...aumentoStaffRate,
              amount,
              effective_from,
              note,
            });
            setAumentoStaffRate(null);
            notify(`Tarifa "${aumentoStaffRate.name}" actualizada a ${ars(amount)}.`);
            loadAll();
          }}
        />
      )}

      {bulkStaffOpen && (
        <BulkIncreaseModal
          title="Aumento masivo — Tarifas de Staff"
          items={staff.filter((r) => r.active)}
          nameKey="name"
          onClose={() => setBulkStaffOpen(false)}
          onApplyBulk={applyBulkStaff}
        />
      )}

      {staffFormModal && (
        <Modal
          title={
            staffFormModal.id
              ? `Editar tarifa — ${staffFormModal.name}`
              : 'Nueva tarifa de servicio / staff'
          }
          onClose={() => setStaffFormModal(null)}
        >
          <Field label="Nombre del puesto o servicio">
            <input
              value={staffFormModal.name}
              onChange={(e) => setStaffFormModal({ ...staffFormModal, name: e.target.value })}
              placeholder="Ej: Ambulancia, Médico 1, Planillero…"
            />
          </Field>

          <div className="cf-grid-2">
            <Field label="Categoría">
              <select
                value={staffFormModal.category}
                onChange={(e) =>
                  setStaffFormModal({
                    ...staffFormModal,
                    category: e.target.value,
                    unit: e.target.value === 'arbitro' ? 'partido' : staffFormModal.unit,
                  })
                }
              >
                {CATEGORIES.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Modalidad de cobro">
              <select
                value={staffFormModal.unit}
                onChange={(e) => setStaffFormModal({ ...staffFormModal, unit: e.target.value })}
              >
                <option value="jornada">Por jornada completa</option>
                <option value="partido">Por partido dirigido</option>
              </select>
            </Field>

            <Field label="Monto ($)">
              <input
                type="number"
                min="0"
                step="100"
                value={staffFormModal.amount}
                onChange={(e) => setStaffFormModal({ ...staffFormModal, amount: e.target.value })}
              />
            </Field>

            <Field label="Vigente desde">
              <input
                type="date"
                value={staffFormModal.effective_from || today()}
                onChange={(e) =>
                  setStaffFormModal({ ...staffFormModal, effective_from: e.target.value })
                }
              />
            </Field>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#faf9f6',
              border: '1px solid #e6e4dd',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={staffFormModal.auto_include}
                onChange={(e) =>
                  setStaffFormModal({ ...staffFormModal, auto_include: e.target.checked })
                }
              />
              Agregar automáticamente al precargar cada Caja de Fecha
            </label>
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={staffFormModal.active}
                onChange={(e) =>
                  setStaffFormModal({ ...staffFormModal, active: e.target.checked })
                }
              />
              Tarifa activa
            </label>
          </div>

          {staffErr && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{staffErr}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" style={btnOutline} onClick={() => setStaffFormModal(null)}>
              Cancelar
            </button>
            <button
              type="button"
              style={btnDark}
              onClick={saveStaffForm}
              disabled={!staffFormModal.name}
            >
              <Save size={14} /> Guardar tarifa
            </button>
          </div>
        </Modal>
      )}

      {partnerForm && (
        <Modal
          title={partnerForm.id ? 'Editar socio' : 'Nuevo socio'}
          onClose={() => setPartnerForm(null)}
        >
          <Field label="Nombre y apellido">
            <input
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
            />
          </Field>
          <Field label="Alias / CBU para reintegros">
            <input
              value={partnerForm.alias}
              onChange={(e) => setPartnerForm({ ...partnerForm, alias: e.target.value })}
              placeholder="Ej: juan.perez.mp"
            />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input
              value={partnerForm.phone}
              onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
              placeholder="Ej: 221 555-1234"
            />
          </Field>
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={partnerForm.active}
              onChange={(e) => setPartnerForm({ ...partnerForm, active: e.target.checked })}
            />
            Socio activo
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" style={btnOutline} onClick={() => setPartnerForm(null)}>
              Cancelar
            </button>
            <button
              type="button"
              style={btnDark}
              onClick={savePartner}
              disabled={!partnerForm.name}
            >
              <Save size={14} /> Guardar socio
            </button>
          </div>
        </Modal>
      )}

      {historyModalOpen && (
        <Modal
          title="Historial completo de aumentos y tarifas"
          onClose={() => setHistoryModalOpen(false)}
          width={760}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#787772',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar torneo, tarifa o nota…"
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  style={{ height: 34, paddingLeft: 32, fontSize: 12.5 }}
                />
              </div>
              <select
                value={histKind}
                onChange={(e) => setHistKind(e.target.value)}
                style={{ width: 190, height: 34, fontSize: 12.5 }}
              >
                <option value="">Todos los registros</option>
                <option value="equipo">Aranceles de equipos</option>
                <option value="staff">Tarifas de staff</option>
              </select>
            </div>

            <div
              style={{
                maxHeight: 400,
                overflowY: 'auto',
                border: '1px solid #e5e4df',
                borderRadius: 10,
              }}
            >
              {filteredHistory.length === 0 ? (
                <Empty>No se encontraron modificaciones.</Empty>
              ) : (
                <table className="compact-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e4df', textAlign: 'left' }}>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th style={{ textAlign: 'right' }}>Cambio</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((r) => {
                      const old = Number(r.old_amount);
                      const nw = Number(r.new_amount);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f0ec' }}>
                          <td style={{ fontSize: 12 }}>{fmtDate(r.effective_from)}</td>
                          <td>
                            <span style={{ ...tagPill, marginRight: 6 }}>
                              {r.kind === 'equipo' ? 'Torneo' : 'Staff'}
                            </span>
                            <strong style={{ fontSize: 13 }}>
                              {r.tournament_name || r.staff_name}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: 12.5 }}>
                            {old > 0 && (
                              <span style={{ color: '#787772', marginRight: 6 }}>
                                {ars(old)} →
                              </span>
                            )}
                            <strong>{ars(nw)}</strong>
                          </td>
                          <td style={{ fontSize: 12, color: '#787772' }}>{r.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
