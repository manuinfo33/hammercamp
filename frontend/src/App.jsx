import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import EquiposView from './components/teams/EquiposView';
import DelegadosView from './components/delegates/DelegadosView';
import JugadoresView from './components/players/JugadoresView';
import CajaView from './components/caja/CajaView';
import TorneosView from './components/tournaments/TorneosView';
import UnirPDF from './components/UnirPDF';
import LoginView from './components/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';

import ConfiguracionView from './components/config/ConfiguracionView';
import DelegateDashboard from './components/delegates/DelegateDashboard';
import DelegateWelcomeDashboard from './components/delegates/DelegateWelcomeDashboard';
import DelegateTeamView from './components/delegates/DelegateTeamView';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2" style={{ borderColor: 'var(--brand-beige) transparent transparent transparent' }}></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2" style={{ borderColor: 'var(--brand-beige) transparent transparent transparent' }}></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'Administrador') {
    return <Navigate to="/" />;
  }
  
  return children;
};

const DelegateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2" style={{ borderColor: 'var(--brand-beige) transparent transparent transparent' }}></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'Delegado') {
    return <Navigate to="/" />;
  }
  
  return children;
};

const DelegateTeamWrapper = () => {
  const { user } = useAuth();
  return <DelegateTeamView user={user} />;
};

const DelegateRosterWrapper = () => {
  const { user } = useAuth();
  return <DelegateDashboard user={user} />;
};

const HomeView = () => {
  const { user } = useAuth();
  const [showMerger, setShowMerger] = useState(false);

  if (user?.role === 'Delegado') {
    return <DelegateWelcomeDashboard user={user} />;
  }

  return (
    <div className="anthropic-theme animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="anthropic-title" style={{ marginBottom: '8px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Bienvenido de nuevo al panel de control de La Superliga.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowMerger(true)}
          style={{
            height: '42px', padding: '0 20px', fontSize: '14px'
          }}
        >
          📄 Unir PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="glass-card" style={{ transition: 'all 0.3s ease' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-beige)' }}></span>
            Resumen General
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Próximamente podrás visualizar estadísticas en tiempo real sobre equipos, categorías y torneos.
          </p>
        </div>
      </div>

      {showMerger && <UnirPDF onClose={() => setShowMerger(false)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<HomeView />} />
                  <Route path="/equipos" element={<AdminRoute><EquiposView /></AdminRoute>} />
                  <Route path="/delegados" element={<AdminRoute><DelegadosView /></AdminRoute>} />
                  <Route path="/jugadores" element={<AdminRoute><JugadoresView /></AdminRoute>} />
                  <Route path="/caja" element={<AdminRoute><CajaView /></AdminRoute>} />
                  <Route path="/torneos" element={<AdminRoute><TorneosView /></AdminRoute>} />
                  <Route path="/configuracion" element={<AdminRoute><ConfiguracionView /></AdminRoute>} />
                  
                  <Route path="/equipo" element={<DelegateRoute><DelegateTeamWrapper /></DelegateRoute>} />
                  <Route path="/lista-buena-fe" element={<DelegateRoute><DelegateRosterWrapper /></DelegateRoute>} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
