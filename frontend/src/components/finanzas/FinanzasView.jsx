import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  ClipboardList,
  Landmark,
  Users,
  AlertCircle,
  SlidersHorizontal,
  Plus,
  Trash2,
  HandCoins,
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import api from '../../api';
import '../../styles/config.css';
import JornadaView from './JornadaView';
import ConfigPagosView from './ConfigPagosView';
import DeudasEquiposView from './DeudasEquiposView';
import { ars, num, errMsg, Field, Modal, Empty } from './common';

const list = (r) => r.data?.results || r.data;
const TABS = [
  { id: 'jornada', label: 'Caja de Fecha', icon: ClipboardList },
  { id: 'general', label: 'Caja General', icon: Landmark },
  { id: 'socios', label: 'Socios', icon: Users },
  { id: 'deudas', label: 'Deudas e Inscripciones', icon: AlertCircle },
  { id: 'config', label: 'Configuración de pagos', icon: SlidersHorizontal },
];
const today = () => new Date().toISOString().slice(0, 10);
const ALL_CATS = [
  ['caja_fecha', 'Caja de Fecha'],
  ['alquiler', 'Alquiler de cancha'],
  ['cobro_deuda', 'Cobro de deuda de equipo'],
  ['compra', 'Compra / mantenimiento'],
  ['inversion', 'Inversión'],
  ['reintegro_socio', 'Reintegro a socio'],
  ['otro', 'Otro'],
];
const MANUAL_CATS = ALL_CATS.filter(([k]) => k !== 'caja_fecha');

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

function MovementModal({ preset, teams, partners, onClose, onDone }) {
  const [f, setF] = useState({
    type: 'egreso',
    category: 'otro',
    method: 'efectivo',
    concept: '',
    amount: '',
    date: today(),
    team: '',
    partner: '',
    ...preset,
  });
  const [err, setErr] = useState('');
  const needsTeam = f.category === 'cobro_deuda';
  const needsPartner = f.category === 'reintegro_socio' || f.method === 'socio';
  const save = async () => {
    try {
      await api.post('finances/movements/', {
        ...f,
        amount: num(f.amount),
        team: needsTeam ? f.team || null : null,
        partner: needsPartner ? f.partner || null : null,
      });
      onDone();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const setCat = (category) =>
    setF({
      ...f,
      category,
      type:
        category === 'cobro_deuda' || category === 'alquiler'
          ? 'ingreso'
          : category === 'reintegro_socio' || category === 'compra' || category === 'inversion'
            ? 'egreso'
            : f.type,
      method: category === 'cobro_deuda' && f.method === 'socio' ? 'efectivo' : f.method,
    });
  return (
    <Modal title="Nuevo movimiento en Caja General" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Categoría">
          <select value={f.category} onChange={(e) => setCat(e.target.value)}>
            {MANUAL_CATS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </Field>
        <Field label="Medio">
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            {f.type === 'egreso' && f.category !== 'reintegro_socio' && (
              <option value="socio">Puesto por socio</option>
            )}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </Field>
      </div>
      {needsTeam && (
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
      )}
      {needsPartner && (
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
      <Field label="Concepto">
        <input
          value={f.concept}
          onChange={(e) => setF({ ...f, concept: e.target.value })}
          placeholder="Ej: Ferretería, pago de deuda…"
        />
      </Field>
      <Field label="Monto">
        <input
          type="number"
          min="0"
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
        />
      </Field>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" style={btnOutline} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" style={btnDark} onClick={save} disabled={!f.concept || !f.amount}>
          Guardar movimiento
        </button>
      </div>
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
  useEffect(() => {
    load();
  }, [load]);
  const done = () => {
    setModal(false);
    load();
    reload();
  };
  const del = async (m) => {
    if (m.financial_day) {
      alert(
        'Este movimiento proviene del cierre de una Caja de Fecha. Para eliminarlo o modificarlo, reabrí o eliminá la jornada desde la pestaña Caja de Fecha.',
      );
      return;
    }
    if (window.confirm('¿Eliminar movimiento?')) {
      await api.delete(`finances/movements/${m.id}/`);
      done();
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: 14,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>Saldo total</span>
              <span style={tagPill}>Tesorería</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#141413' }}>
              {ars(summary.total)}
            </div>
            <div style={{ fontSize: 12, color: '#787772' }}>
              Efectivo + Banco / MP (fechas cerradas + movimientos)
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Efectivo disponible
              </span>
              <span style={tagPill}>Caja física</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#141413' }}>
              {ars(summary.cash)}
            </div>
            <div style={{ fontSize: 12, color: '#787772' }}>Arqueos aprobados y efectivo</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b6a65', fontWeight: 500 }}>
                Banco / Mercado Pago
              </span>
              <span style={tagPill}>Transferencias</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#141413' }}>
              {ars(summary.bank)}
            </div>
            <div style={{ fontSize: 12, color: '#787772' }}>Cuentas digitales y transferencias</div>
          </div>
        </div>
      )}

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
            padding: '16px 20px',
            borderBottom: '1px solid #efeee9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#141413' }}>
              Movimientos de Caja General ({rows.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
              Ingresos de cajas de fecha cerradas, cobros de deuda, alquileres, compras y reintegros.
            </p>
          </div>
          <button type="button" style={btnDark} onClick={() => setModal(true)}>
            <Plus size={14} /> Nuevo movimiento
          </button>
        </div>

        {rows.length === 0 ? (
          <Empty>Sin movimientos registrados aún.</Empty>
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
                  <th style={{ padding: '10px 20px' }}>Fecha</th>
                  <th style={{ padding: '10px 14px' }}>Concepto</th>
                  <th style={{ padding: '10px 14px' }}>Medio</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const amt = Number(m.amount);
                  const isNegative = amt < 0 || m.type === 'egreso';
                  const sign = isNegative ? '-' : '+';
                  const color = isNegative ? '#dc2626' : '#166534';
                  const isCajaFecha = m.category === 'caja_fecha' || Boolean(m.financial_day);
                  const catLabel = ALL_CATS.find(([k]) => k === m.category)?.[1] || m.category;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f0ec' }}>
                      <td style={{ padding: '11px 20px', color: '#6b6a65' }}>
                        {m.date.split('-').reverse().join('/')}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <strong style={{ color: '#141413' }}>{m.concept}</strong>
                        <div style={{ fontSize: 11.5, color: '#787772' }}>
                          {catLabel}
                          {m.team_name && ` · ${m.team_name}`}
                          {m.partner_name && ` · ${m.partner_name}`}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={tagPill}>
                          {isCajaFecha
                            ? 'Caja de Fecha'
                            : m.method === 'socio'
                              ? 'Socio'
                              : m.method}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '11px 14px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {sign}
                        {ars(Math.abs(amt))}
                      </td>
                      <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                        {isCajaFecha ? (
                          <span
                            title="Generado automáticamente al cerrar la Caja de Fecha"
                            style={{ fontSize: 11, color: '#787772' }}
                          >
                            Automático
                          </span>
                        ) : (
                          <button
                            type="button"
                            style={{
                              ...btnOutline,
                              height: 28,
                              padding: '0 8px',
                              color: '#991b1b',
                            }}
                            title="Eliminar movimiento"
                            onClick={() => del(m)}
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
      {modal && (
        <MovementModal
          teams={teams}
          partners={partners}
          onClose={() => setModal(false)}
          onDone={done}
        />
      )}
    </div>
  );
}

function SociosTab({ summary, teams, partners, reload }) {
  const [modal, setModal] = useState(null);
  const bal = summary?.partner_balances || [];
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #e5e4df',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #efeee9' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#141413' }}>
          Cuenta corriente de socios
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#787772' }}>
          Lo que La Superliga le debe a cada socio por gastos pagados con dinero propio.
        </p>
      </div>
      {bal.length === 0 ? (
        <Empty>Ningún socio adelantó dinero todavía.</Empty>
      ) : (
        <div style={{ padding: '6px 20px' }}>
          {bal.map((b) => (
            <div
              key={b.partner}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid #f1f0ec',
              }}
            >
              <strong style={{ flex: 1, color: '#141413' }}>{b.partner_name}</strong>
              <span
                style={{
                  fontWeight: 700,
                  color: Number(b.owed) > 0 ? '#dc2626' : '#166534',
                }}
              >
                {Number(b.owed) > 0 ? (
                  `Se le debe ${ars(b.owed)}`
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> Al día
                  </span>
                )}
              </span>
              {Number(b.owed) > 0 && (
                <button
                  type="button"
                  style={btnDark}
                  onClick={() =>
                    setModal({
                      type: 'egreso',
                      category: 'reintegro_socio',
                      partner: b.partner,
                      amount: b.owed,
                      concept: `Reintegro a ${b.partner_name}`,
                    })
                  }
                >
                  <HandCoins size={14} /> Reintegrar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {modal && (
        <MovementModal
          preset={modal}
          teams={teams}
          partners={partners}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </section>
  );
}

export default function FinanzasView() {
  const [tab, setTab] = useState('jornada');
  const base = useBase();
  return (
    <div
      className="anthropic-theme animate-fade-in"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <PageHeader
        icon={Wallet}
        title="Finanzas"
        subtitle="Caja de cada fecha, tesorería, socios, inscripciones y cuentas corrientes de equipos. Solo administradores."
      />
      <div className="cf-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`cf-tab ${tab === id ? 'active' : ''}`}
            onClick={() => {
              if (id === tab) return;
              if (typeof window.__finanzasDayBeforeLeave === 'function') {
                const proceed = window.__finanzasDayBeforeLeave(() => {
                  setTab(id);
                  base.reload();
                });
                if (!proceed) return;
              }
              setTab(id);
              base.reload();
            }}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>
      {tab === 'jornada' && <JornadaView onDayChanged={base.reload} />}
      {tab === 'general' && <GeneralTab {...base} />}
      {tab === 'socios' && <SociosTab {...base} />}
      {tab === 'deudas' && <DeudasEquiposView onChanged={base.reload} />}
      {tab === 'config' && <ConfigPagosView />}
    </div>
  );
}
