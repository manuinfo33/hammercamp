import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Settings, LogOut, User, ChevronLeft, ChevronRight, Contact, Wallet, Trophy, UserCheck, Menu, X, Database, ChevronDown } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
  const [mobileDbOpen, setMobileDbOpen] = useState(false);

  const isDbActive = ['/equipos', '/delegados', '/jugadores'].includes(location.pathname);

  useEffect(() => {
    const handleToggleMenu = () => {
      setMobileMenuOpen(prev => !prev);
      setMobileUserOpen(false);
    };
    const handleToggleUser = () => {
      setMobileUserOpen(prev => !prev);
      setMobileMenuOpen(false);
    };
    window.addEventListener('toggle-mobile-menu', handleToggleMenu);
    window.addEventListener('toggle-mobile-user', handleToggleUser);
    return () => {
      window.removeEventListener('toggle-mobile-menu', handleToggleMenu);
      window.removeEventListener('toggle-mobile-user', handleToggleUser);
    };
  }, []);

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
                <span className="brand-text-la" style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px' }}>LA</span>
                <span className="brand-text-superliga" style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.5px' }}>SUPERLIGA</span>
              </div>
              <span className="brand-text-gestion" style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '-2px', lineHeight: '1' }}>GESTION</span>
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
                  <User size={20} color="#383530" />
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
              {mobileMenuOpen ? <X size={20} color="#383530" /> : <Menu size={20} color="#383530" />}
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
                <div className="mobile-nav-dropdown-wrapper" style={{ width: '100%' }}>
                  <div 
                    role="button"
                    onClick={() => setMobileDbOpen(!mobileDbOpen)}
                    className={`mobile-nav-item ${isDbActive ? 'active' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Database size={18} />
                      <span>Datos</span>
                    </div>
                    <ChevronDown size={16} style={{ transform: mobileDbOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                  
                  {mobileDbOpen && (
                    <div className="mobile-submenu">
                      <NavLink to="/equipos" onClick={() => { setMobileMenuOpen(false); setMobileDbOpen(false); }} className={({ isActive }) => `mobile-nav-item team-nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={18} />
                        <span>Equipos</span>
                      </NavLink>
                      <NavLink to="/delegados" onClick={() => { setMobileMenuOpen(false); setMobileDbOpen(false); }} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <Contact size={18} />
                        <span>Delegados</span>
                      </NavLink>
                      <NavLink to="/jugadores" onClick={() => { setMobileMenuOpen(false); setMobileDbOpen(false); }} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <UserCheck size={18} />
                        <span>Jugadores</span>
                      </NavLink>
                    </div>
                  )}
                </div>
                <NavLink to="/torneos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Trophy size={18} />
                  <span>Torneos</span>
                </NavLink>
                <NavLink to="/caja" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                  <Wallet size={18} />
                  <span>Caja</span>
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

      {/* Desktop Sidebar as Top Horizontal Navbar */}
      <aside className="sidebar">
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          padding: '0 24px'
        }}>
          {/* Lado Izquierdo: Marca y Logotipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
              <img src="/logo-superliga.png" alt="La Superliga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', textAlign: 'left', lineHeight: '1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span className="brand-text-la" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '-0.3px' }}>LA</span>
                <span className="brand-text-superliga" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '-0.3px' }}>SUPERLIGA</span>
              </div>
              <span className="brand-text-gestion" style={{ fontSize: '6px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>GESTION</span>
            </div>
          </div>

          {/* Contenedor Derecho: Navegación + Separador + Acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Navegación Horizontal */}
            <nav style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              
              {user?.role === 'Administrador' && (
                <>
                  <div 
                    className={`nav-dropdown-wrapper ${dbDropdownOpen ? 'open' : ''}`}
                    onMouseEnter={() => setDbDropdownOpen(true)}
                    onMouseLeave={() => setDbDropdownOpen(false)}
                  >
                    <div 
                      role="button"
                      onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
                      className={`nav-item ${isDbActive ? 'active' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <Database size={16} />
                      <span>Datos</span>
                      <ChevronDown size={14} style={{ transform: dbDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '4px' }} />
                    </div>
                    
                    <div className="nav-dropdown-menu">
                      <NavLink to="/equipos" onClick={() => setDbDropdownOpen(false)} className={({ isActive }) => `nav-item team-nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                        <Users size={16} />
                        <span>Equipos</span>
                      </NavLink>
                      <NavLink to="/delegados" onClick={() => setDbDropdownOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                        <Contact size={16} />
                        <span>Delegados</span>
                      </NavLink>
                      <NavLink to="/jugadores" onClick={() => setDbDropdownOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                        <UserCheck size={16} />
                        <span>Jugadores</span>
                      </NavLink>
                    </div>
                  </div>
                  <NavLink to="/torneos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                    <Trophy size={16} />
                    <span>Torneos</span>
                  </NavLink>
                  <NavLink to="/caja" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                    <Wallet size={16} />
                    <span>Caja</span>
                  </NavLink>
                </>
              )}

              {user?.role === 'Delegado' && (
                <>
                  <NavLink to="/equipo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                    <Users size={16} />
                    <span>Mi Equipo</span>
                  </NavLink>
                  <NavLink to="/lista-buena-fe" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ padding: '6px 12px', height: '36px' }}>
                    <UserCheck size={16} />
                    <span>Lista de Buena Fe</span>
                  </NavLink>
                </>
              )}
            </nav>

            {/* Línea Divisoria Vertical */}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-strong)', opacity: 1 }}></div>

            {/* Lado Derecho: Configuración y Botón Cerrar Sesión */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {user?.role === 'Administrador' && (
                <NavLink 
                  to="/configuracion" 
                  className={({ isActive }) => `sidebar-logout-btn nav-item icon-only ${isActive ? 'active' : ''}`}
                  style={{ 
                    height: '32px',
                    width: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    border: '1px solid #d8cfc0',
                    color: 'var(--text-muted)'
                  }}
                  title="Configuración"
                >
                  <Settings size={14} style={{ flexShrink: 0 }} />
                </NavLink>
              )}
              
              <button 
                onClick={handleLogout}
                className="sidebar-logout-btn nav-item icon-only"
                style={{ 
                  height: '32px',
                  width: '32px',
                  borderRadius: '50%',
                  border: '1px solid #d8cfc0',
                  color: 'var(--text-muted)'
                }}
                title="Cerrar Sesión"
              >
                <LogOut size={14} style={{ flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

