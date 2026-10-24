import React, { useState, useEffect } from 'react';
import api from '../../api';
import TeamForm from '../teams/TeamForm';
import PageHeader from '../ui/PageHeader';
import { Users } from 'lucide-react';

export default function DelegateTeamView({ user }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get(`teams/${user.team_id}/`);
      setTeam(res.data);
    } catch (e) {
      console.error("Error fetching team:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.team_id) {
      fetchTeam();
    }
  }, [user?.team_id]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando información del equipo...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No se encontró información de tu equipo.</p>
      </div>
    );
  }

  return (
    <div className="anthropic-theme animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        icon={Users}
        title="Mi Equipo"
        subtitle="Modificá la información de tu equipo, escudo o foto grupal."
      />

      {successMessage && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          marginBottom: '16px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {successMessage}
        </div>
      )}

      <div className="glass-card" style={{ padding: '0px', border: 'none' }}>
        <TeamForm 
          team={team} 
          onClose={fetchTeam}
          onSuccess={() => {
            setSuccessMessage('¡Información del equipo guardada con éxito!');
            fetchTeam();
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
        />
      </div>
    </div>
  );
}
