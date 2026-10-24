import React from 'react';
import { X } from 'lucide-react';

export const ars = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const num = (v) => (v === '' || v == null ? 0 : Number(v));

export const errMsg = (e) => {
  const d = e?.response?.data;
  if (!d) return 'Error de conexión.';
  if (typeof d === 'string') return d;
  return d.detail || Object.values(d).flat().join(' ') || 'Error.';
};

export const EXPENSE_METHODS = [['efectivo', 'Efectivo'], ['transferencia', 'Transferencia'], ['socio', 'Puesto por socio']];
export const CATEGORIES = [['arbitro', 'Árbitro'], ['medico', 'Médico'], ['ambulancia', 'Ambulancia'], ['planillero', 'Planillero'], ['seguridad', 'Seguridad'], ['fotografia', 'Fotografía'], ['otro', 'Otro']];

export const Field = ({ label, children, style }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', ...style }}>
    {label}
    {children}
  </label>
);

export const Stat = ({ label, value, tone, sub }) => (
  <div className="glass-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tone || 'var(--gx-primary)' }} />
    <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</p>
    <p style={{ margin: '6px 0 0', fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: Number(value) < 0 ? '#dc2626' : 'var(--text-primary)' }}>{ars(value)}</p>
    {sub && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>}
  </div>
);

export const Modal = ({ title, onClose, children, width = 480 }) => (
  <div className="modal-backdrop-custom" onClick={onClose}>
    <div className="modal-card-custom animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: width, borderRadius: 20 }}>
      <div className="modal-header-custom" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{title}</h3>
        <button type="button" className="modal-close-btn" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body-custom" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  </div>
);

export const Empty = ({ children }) => (
  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{children}</div>
);

export const Badge = ({ children, tone = '#71717a' }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: tone, background: `${tone}1f`, border: `1px solid ${tone}40` }}>{children}</span>
);
