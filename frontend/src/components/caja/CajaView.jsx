import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import api from '../../api';
import IngresosView from './IngresosView';
import EgresosView from './EgresosView';
import SaldoSociosView from './SaldoSociosView';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'egresos', label: 'Egresos' },
  { id: 'saldo_socios', label: 'Saldo Socios' },
];

const formatARS = (num) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(num ?? 0);

function ResumenCard({ icon: Icon, label, value, color, sub }) {
  const isNeg = value < 0;
  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: color,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</p>
          <p style={{
            fontSize: '1.7rem', fontWeight: 700, fontFamily: 'var(--font-display)',
            color: isNeg ? '#dc2626' : 'var(--text-primary)',
            letterSpacing: '-1px',
          }}>
            {formatARS(value)}
          </p>
          {sub && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</p>}
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: color.includes('gradient') ? color : `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={22} color={isNeg ? '#dc2626' : (color.includes('gradient') ? '#151515' : color)} />
        </div>
      </div>
    </div>
  );
}

export default function CajaView() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResumen = () => {
    setLoading(true);
    api.get('caja/resumen/')
      .then(r => setResumen(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResumen(); }, []);

  return (
    <div className="anthropic-theme animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <PageHeader
        icon={Wallet}
        title="Caja"
        subtitle="Gestión financiera del club — Ingresos, egresos y saldos de socios."
        style={{ marginBottom: 0 }}
      />

      {/* Tarjetas de resumen siempre visibles */}
      {loading ? (
        <div className="gx-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card" style={{ height: '120px',
              background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : resumen ? (
        <div className="gx-grid">
          <ResumenCard
            icon={Wallet}
            label="Saldo Total"
            value={resumen.saldo_total}
            color="linear-gradient(135deg, #f2bb2b, #d99a0b)"
            sub="Efectivo + Banco"
          />
          <ResumenCard
            icon={DollarSign}
            label="Efectivo"
            value={resumen.saldo_efectivo}
            color="#d99a0b"
          />
          <ResumenCard
            icon={Building2}
            label="Banco"
            value={resumen.saldo_banco}
            color="#2563eb"
          />
          <ResumenCard
            icon={TrendingUp}
            label="Total Ingresos"
            value={resumen.ingresos_total}
            color="#059669"
          />
          <ResumenCard
            icon={TrendingDown}
            label="Total Egresos"
            value={-resumen.egresos_total}
            color="#dc2626"
          />
        </div>
      ) : null}

      {/* Tabs de navegación */}
      <div style={{ borderBottom: '1px solid #d8cfc0', display: 'flex', gap: '28px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--gx-coral)' : '#191919',
              border: 'none',
              borderBottom: activeTab === tab.id ? '4px solid var(--gx-coral)' : '4px solid transparent',
              borderRadius: 0,
              padding: '12px 4px',
              height: 'auto',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '14.5px',
              textTransform: 'none',
              letterSpacing: 0,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-1px',
              flexShrink: 0,
              boxShadow: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      <div>
        {activeTab === 'resumen' && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              📊 Resumen General
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Aquí podrás ver el estado financiero completo del club. Usá las pestañas
              de arriba para gestionar <strong style={{ color: 'var(--brand-beige)' }}>Ingresos</strong>,{' '}
              <strong style={{ color: 'var(--brand-beige)' }}>Egresos</strong> y el{' '}
              <strong style={{ color: 'var(--brand-beige)' }}>Saldo de Socios</strong>.
            </p>
          </div>
        )}
        {activeTab === 'ingresos'     && <IngresosView    onTransaccion={fetchResumen} />}
        {activeTab === 'egresos'      && <EgresosView     onTransaccion={fetchResumen} />}
        {activeTab === 'saldo_socios' && <SaldoSociosView />}
      </div>
    </div>
  );
}
