import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, User, ChevronLeft, ChevronRight, Contact, Wallet, Trophy, UserCheck } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ padding: isCollapsed ? '2rem 0.5rem' : '2rem 1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      {/* Collapse Toggle Button */}
      <button 
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          right: '-16px',
          top: '32px',
          width: '32px',
          height: '32px',
          background: 'var(--brand-beige)',
          color: '#1a1512',
          border: '4px solid var(--bg-base)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 60,
          padding: 0,
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: isCollapsed ? '0' : '0 8px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          background: 'transparent', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <img src="/logo.png" alt="Hammercamp Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {!isCollapsed && <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>HAMMERCAMP</span>}
      </div>

      <div style={{ flex: 1 }}>
        {!isCollapsed && <p style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', padding: '0 12px' }}>Menú Principal</p>}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Dashboard" : ""}>
            <LayoutDashboard size={20} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>
          
          {user?.role === 'Administrador' && (
            <>
              <NavLink to="/equipos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Equipos" : ""}>
                <Users size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Equipos</span>}
              </NavLink>
              <NavLink to="/delegados" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Delegados" : ""}>
                <Contact size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Delegados</span>}
              </NavLink>
              <NavLink to="/jugadores" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Jugadores" : ""}>
                <UserCheck size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Jugadores</span>}
              </NavLink>
              <NavLink to="/caja" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Caja" : ""}>
                <Wallet size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Caja</span>}
              </NavLink>
              <NavLink to="/torneos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Torneos" : ""}>
                <Trophy size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Torneos</span>}
              </NavLink>
              <NavLink to="/configuracion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Configuración" : ""}>
                <Settings size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Configuración</span>}
              </NavLink>
            </>
          )}

          {user?.role === 'Delegado' && (
            <>
              <NavLink to="/equipo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Mi Equipo" : ""}>
                <Users size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Mi Equipo</span>}
              </NavLink>
              <NavLink to="/lista-buena-fe" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '10px' : '10px 14px' }} title={isCollapsed ? "Lista de Buena Fe" : ""}>
                <UserCheck size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Lista de Buena Fe</span>}
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto border-t pt-8" style={{ borderColor: 'var(--border-subtle)' }}>
        {user && (
          <div style={{ 
            padding: isCollapsed ? '8px' : '12px', 
            background: 'var(--brand-beige-subtle)', 
            borderRadius: '12px', 
            marginBottom: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            transition: 'all 0.3s'
          }}
          title={isCollapsed ? `${user.first_name} ${user.last_name} - ${user.role}` : ""}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px -4px rgba(212,184,150,0.3)',
              flexShrink: 0
            }}>
              <User size={16} color="#1a1512" />
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                  {user.first_name} {user.last_name}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {user.role}
                </p>
              </div>
            )}
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className="nav-item"
          style={{ 
            width: '100%', 
            background: 'rgba(220, 60, 60, 0.05)', 
            color: '#e07070', 
            border: '1px solid rgba(220, 60, 60, 0.15)',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0' : '0 14px',
            height: '36px'
          }}
          title={isCollapsed ? "Cerrar Sesión" : ""}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
