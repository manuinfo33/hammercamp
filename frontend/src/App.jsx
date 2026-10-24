import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Contact, UserCheck, Award, Trophy, Settings, FileText, ArrowRight, Wallet } from 'lucide-react';
import FinanzasView from './components/finanzas/FinanzasView';
import PageHeader from './components/ui/PageHeader';
import DashboardLayout from './components/DashboardLayout';
import EquiposView from './components/teams/EquiposView';
import DelegadosView from './components/delegates/DelegadosView';
import JugadoresView from './components/players/JugadoresView';
import CajaView from './components/caja/CajaView';
import TorneosView from './components/tournaments/TorneosView';
import TournamentDetailView from './components/tournaments/TournamentDetailView';
import UnirPDF from './components/UnirPDF';
import LoginView from './components/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';
import Typewriter from './components/Typewriter';

import CategoriasView from './components/categories/CategoriasView';
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

  const userName = user?.first_name || user?.username || '';

  const QUICK_LINKS = [
    { to: '/equipos', label: 'Equipos', desc: 'Clubes, escudos y delegados', icon: Users },
    { to: '/delegados', label: 'Delegados', desc: 'Responsables de cada equipo', icon: Contact },
    { to: '/jugadores', label: 'Jugadores', desc: 'Base general de jugadores', icon: UserCheck },
    { to: '/categorias', label: 'Categorías', desc: 'Reglas y edades por categoría', icon: Award },
    { to: '/torneos', label: 'Torneos', desc: 'Fixture, zonas y resultados', icon: Trophy },
    { to: '/finanzas', label: 'Finanzas', desc: 'Caja de fecha, socios y deudas', icon: Wallet },
    { to: '/configuracion', label: 'Configuración', desc: 'Carrusel, noticias y torneo actual', icon: Settings },
  ];

  return (
    <div className="anthropic-theme animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        icon={LayoutDashboard}
        title={<Typewriter text={`Hola, ${userName}`} />}
        subtitle="Bienvenido de nuevo al panel de control de La Superliga."
        actions={
          <button type="button" onClick={() => setShowMerger(true)}>
            <FileText size={16} /> Unir PDF
          </button>
        }
      />

      <div className="gx-card-dark" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gx-primary)' }} />
            Resumen General
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginTop: '6px', lineHeight: 1.2 }}>
            Panel de Gestión
          </p>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6, fontSize: '13.5px', marginTop: '6px' }}>
            Próximamente podrás visualizar estadísticas en tiempo real sobre equipos, categorías y torneos.
          </p>
        </div>
      </div>

      <div>
        <h3 className="gx-card-title" style={{ border: 'none', padding: 0, marginBottom: '12px' }}>Accesos rápidos</h3>
        <div className="gx-grid">
          {QUICK_LINKS.map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to} className="gx-quick">
              <div className="gx-icon-box"><Icon size={22} /></div>
              <div style={{ minWidth: 0 }}>
                <div className="t">{label}</div>
                <div className="s">{desc}</div>
              </div>
              <ArrowRight size={18} className="arrow" />
            </Link>
          ))}
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
                  <Route path="/finanzas" element={<AdminRoute><FinanzasView /></AdminRoute>} />
                  <Route path="/categorias" element={<AdminRoute><CategoriasView /></AdminRoute>} />
                  <Route path="/torneos" element={<AdminRoute><TorneosView /></AdminRoute>} />
                  <Route path="/torneos/:id" element={<AdminRoute><TournamentDetailView /></AdminRoute>} />
                  <Route path="/torneos/:id/:tab" element={<AdminRoute><TournamentDetailView /></AdminRoute>} />
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
