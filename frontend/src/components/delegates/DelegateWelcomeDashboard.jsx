import React from 'react';
import { User, AlertCircle, ShieldAlert } from 'lucide-react';
import Typewriter from '../Typewriter';

export default function DelegateWelcomeDashboard({ user }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>
          <Typewriter text={`¡Hola, ${user.first_name}!`} />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Bienvenido al Panel de Control de Delegado para <strong>{user.team_name}</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Team Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <User size={20} color="var(--brand-beige)" />
            Mi Equipo
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            Estás gestionando el equipo <strong>{user.team_name}</strong>. Desde la sección <strong>Mi Equipo</strong> podés actualizar los datos y fotos del club.
          </p>
        </div>

        {/* Alerts Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <AlertCircle size={20} color="var(--brand-beige)" />
            Panel de Alertas
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.9rem' }}>
            Sin alertas pendientes. Tu equipo se encuentra al día con la documentación y los requisitos de los torneos activos.
          </p>
        </div>

        {/* Sanctions Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <ShieldAlert size={20} color="var(--brand-beige)" />
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
