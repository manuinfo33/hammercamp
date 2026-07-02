import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign } from 'lucide-react';
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
    <div className="glass-card" style={{ flex: 1, minWidth: '220px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: color,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{label}</p>
          <p style={{
            fontSize: '1.8rem', fontWeight: 800,
            color: isNeg ? '#e07070' : 'var(--text-primary)',
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
          <Icon size={22} color={isNeg ? '#e07070' : '#D4B896'} />
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '6px' }}>Caja</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Gestión financiera del club — Ingresos, egresos y saldos de socios.
        </p>
      </div>

      {/* Tarjetas de resumen siempre visibles */}
      {loading ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card" style={{ flex: 1, minWidth: '220px', height: '120px',
              background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : resumen ? (
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <ResumenCard
            icon={Wallet}
            label="Saldo Total"
            value={resumen.saldo_total}
            color="linear-gradient(135deg, #D4B896, #A08060)"
            sub="Efectivo + Banco"
          />
          <ResumenCard
            icon={DollarSign}
            label="Efectivo"
            value={resumen.saldo_efectivo}
            color="#D4B896"
          />
          <ResumenCard
            icon={Building2}
            label="Banco"
            value={resumen.saldo_banco}
            color="#7EB8D4"
          />
          <ResumenCard
            icon={TrendingUp}
            label="Total Ingresos"
            value={resumen.ingresos_total}
            color="#6BCB77"
          />
          <ResumenCard
            icon={TrendingDown}
            label="Total Egresos"
            value={-resumen.egresos_total}
            color="#e07070"
          />
        </div>
      ) : null}

      {/* Tabs de navegación */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '4px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--brand-beige)' : 'transparent',
              color: activeTab === tab.id ? '#1a1512' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-beige)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              padding: '8px 20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-1px',
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
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
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
