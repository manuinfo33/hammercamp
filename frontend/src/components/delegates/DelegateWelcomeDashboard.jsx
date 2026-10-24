import React from 'react';
import { User, AlertCircle, ShieldAlert } from 'lucide-react';
import Typewriter from '../Typewriter';
import PageHeader from '../ui/PageHeader';

export default function DelegateWelcomeDashboard({ user }) {
  return (
    <div className="anthropic-theme animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        icon={User}
        title={<Typewriter text={`¡Hola, ${user.first_name}!`} />}
        subtitle={<>Bienvenido al Panel de Control de Delegado para <strong>{user.team_name}</strong>.</>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
        {/* Team Card */}
        <div className="gx-card-dark" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <User size={20} color="var(--gx-primary)" />
            Mi Equipo
          </h3>
          <p style={{ color: '#a1a1aa', lineHeight: '1.6', fontSize: '0.9rem' }}>
            Estás gestionando el equipo <strong>{user.team_name}</strong>. Desde la sección <strong>Mi Equipo</strong> podés actualizar los datos y fotos del club.
          </p>
        </div>

        {/* Alerts Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <AlertCircle size={20} color="var(--gx-primary-ink)" />
            Panel de Alertas
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            Sin alertas pendientes. Tu equipo se encuentra al día con la documentación y los requisitos de los torneos activos.
          </p>
        </div>

        {/* Sanctions Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <ShieldAlert size={20} color="var(--gx-primary-ink)" />
            Sanciones del Roster
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            No se registran jugadores suspendidos o sancionados actualmente en la lista de buena fe de tu plantel.
          </p>
        </div>
      </div>
    </div>
  );
}
