import React, { useState } from 'react';
import { LayoutDashboard, Users, Settings, LogOut, User, ChevronLeft, ChevronRight, Contact, Wallet, Trophy, UserCheck, Menu, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserOpen, setMobileUserOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="mobile-admin-header">
        <div className="mobile-header-container">
          <div className="mobile-header-brand" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
              <img src="/logo-superliga.png" alt="La Superliga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1.2' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>LA</span>
                <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--brand-beige)' }}>SUPERLIGA</span>
              </div>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '4px', color: 'var(--brand-beige)', textTransform: 'uppercase', marginTop: '-2px', lineHeight: '1' }}>GESTION</span>
            </div>
          </div>
          
          <div className="mobile-header-actions">
            {user && (
              <div className="mobile-action-wrapper">
                <button 
                  onClick={() => {
                    setMobileUserOpen(!mobileUserOpen);
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-action-btn ${mobileUserOpen ? 'active' : ''}`}
                >
                  <User size={24} color="var(--brand-beige)" />
                </button>
                {mobileUserOpen && (
                  <div className="mobile-dropdown-menu">
                    <div className="mobile-dropdown-profile">
                      <p className="profile-name">Hola {user.first_name} {user.last_name}</p>
                      <p className="profile-role">{user.role}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setMobileUserOpen(false);
                        handleLogout();
                      }}
                      className="mobile-logout-btn"
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileUserOpen(false);
              }}
              className={`mobile-action-btn ${mobileMenuOpen ? 'active' : ''}`}
            >
              {mobileMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Links Dropdown */}
        {mobileMenuOpen && (
          <nav className="mobile-navigation-dropdown">
            <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {user?.role === 'Administrador' && (
              <>
                <NavLink to="/equipos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={18} />
                  <span>Equipos</span>
                </NavLink>
                <NavLink to="/delegados" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Contact size={18} />
                  <span>Delegados</span>
                </NavLink>
                <NavLink to="/jugadores" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <UserCheck size={18} />
                  <span>Jugadores</span>
                </NavLink>
                <NavLink to="/caja" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Wallet size={18} />
                  <span>Caja</span>
                </NavLink>
                <NavLink to="/torneos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Trophy size={18} />
                  <span>Torneos</span>
                </NavLink>
                <NavLink to="/configuracion" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>Configuración</span>
                </NavLink>
              </>
            )}

            {user?.role === 'Delegado' && (
              <>
                <NavLink to="/equipo" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={18} />
                  <span>Mi Equipo</span>
                </NavLink>
                <NavLink to="/lista-buena-fe" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <UserCheck size={18} />
                  <span>Lista de Buena Fe</span>
                </NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
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
            width: '40px', 
            height: '40px', 
            background: 'transparent', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img src="/logo-superliga.png" alt="La Superliga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1.2' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>LA</span>
                <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--brand-beige)' }}>SUPERLIGA</span>
              </div>
              <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '4px', color: 'var(--brand-beige)', textTransform: 'uppercase', marginTop: '-2px', lineHeight: '1' }}>GESTION</span>
            </div>
          )}
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
    </>
  );
};

export default Sidebar;

