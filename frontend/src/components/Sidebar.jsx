import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  User, 
  Contact, 
  Trophy, 
  UserCheck, 
  Menu, 
  X, 
  Database, 
  ChevronDown, 
  Award, 
  HelpCircle, 
  Bell,
  ChevronRight
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.011 2C6.5 2 2.011 6.489 2.011 12c0 2.13.67 4.104 1.815 5.727L2 22l4.417-1.782C8.01 21.282 9.948 22 12.011 22c5.511 0 10-4.489 10-10s-4.489-10-10-10zm5.632 14.289c-.235.66-1.168 1.203-1.905 1.365-.505.109-1.164.195-3.376-.719-2.83-1.168-4.646-4.048-4.787-4.237-.14-.19-1.144-1.523-1.144-2.906 0-1.383.722-2.062.981-2.345.258-.283.564-.353.753-.353.188 0 .376.002.541.01.176.008.411-.067.644.492.235.564.799 1.952.87 2.093.07.14.117.306.023.493-.094.188-.14.306-.283.471-.141.165-.297.368-.423.494-.141.141-.289.294-.124.577.165.283.73 1.204 1.567 1.947 1.076.958 1.982 1.254 2.265 1.395.283.141.447.118.612-.07.165-.188.706-.823.894-1.106.188-.283.376-.235.635-.141.259.094 1.646.776 1.929.917.283.141.471.212.541.33.07.118.07.683-.165 1.343z" fill="#25D366"/>
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDbActive = ['/equipos', '/delegados', '/jugadores'].includes(location.pathname);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Mobile accordion states
  const [mobileDatosOpen, setMobileDatosOpen] = useState(isDbActive);
  const [mobilePerfilOpen, setMobilePerfilOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username 
    : 'Usuario';

  return (
    <>
      {/* ============================================
          MENU SUPERIOR (HEADER)
          ============================================ */}
      <header className="top-header-bar">

        {/* Hamburger (visible solo en mobile, va ANTES del logo) */}
        <button 
          className="mobile-hamburger-btn header-icon-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menú de navegación"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* LOGO Y NOMBRE - flex: 1 para empujar acciones a la derecha */}
        <div className="header-brand" onClick={() => navigate('/')}>
          <div className="header-logo-wrapper">
            <img src="/logo-superliga.png" alt="La Superliga Logo" className="header-logo-img" />
          </div>
          <div className="header-brand-text">
            <div className="brand-title">
              <span className="brand-la">LA</span>
              <span className="brand-superliga">SUPERLIGA</span>
            </div>
            <span className="brand-sub">GESTIÓN</span>
          </div>
        </div>

        {/* PARTE DERECHA: botones (solo desktop) */}
        <div className="header-right-actions">
          {/* Centro de Ayuda */}
          <button 
            className="header-icon-btn desktop-only" 
            onClick={() => setHelpModalOpen(true)}
          >
            <HelpCircle size={20} />
          </button>

          {/* Notificaciones */}
          <div className="header-popover-wrapper desktop-only" ref={notificationsRef}>
            <button 
              className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserDropdownOpen(false);
              }}
            >
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            {notificationsOpen && (
              <div className="notifications-popover animate-fade-in">
                <div className="popover-header">
                  <h4>Notificaciones</h4>
                  <span className="badge-new">Nuevas</span>
                </div>
                <div className="popover-body">
                  <div className="notification-item">
                    <div className="notif-dot-active"></div>
                    <div>
                      <p className="notif-title">Sistema de Gestión Actualizado</p>
                      <p className="notif-time">Hace 10 minutos</p>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notif-dot-active"></div>
                    <div>
                      <p className="notif-title">Nuevos torneos disponibles</p>
                      <p className="notif-time">Hace 1 hora</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usuario (Dropdown) */}
          <div className="header-user-wrapper desktop-only" ref={userDropdownRef}>
            <button 
              className={`header-user-btn ${userDropdownOpen ? 'active' : ''}`}
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotificationsOpen(false);
              }}
            >
              <div className="user-avatar-circle"><User size={16} /></div>
              <span className="user-display-name">{displayName}</span>
              <ChevronDown size={14} className={`user-chevron ${userDropdownOpen ? 'open' : ''}`} />
            </button>
            {userDropdownOpen && (
              <div className="user-dropdown-menu animate-fade-in">
                <div className="user-dropdown-profile-info">
                  <p className="profile-full-name">{displayName}</p>
                  <span className="profile-role-badge">{user?.role || 'Usuario'}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-menu-item"
                  onClick={() => { setUserDropdownOpen(false); setProfileModalOpen(true); }}
                >
                  <User size={16} /><span>Mi Perfil</span>
                </button>
                <button 
                  className="dropdown-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /><span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================
          OVERLAY MOBILE
          ============================================ */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ============================================
          DESKTOP SIDEBAR (hover-expand)
          ============================================ */}
      <aside className="sidebar-left desktop-sidebar">
        <div className="sidebar-top-section">
          <nav className="sidebar-nav-list">
            <NavLink to="/" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <div className="nav-item-left">
                <div className="nav-icon-box"><LayoutDashboard size={20} /></div>
                <span className="nav-text">Dashboard</span>
              </div>
            </NavLink>

            {user?.role === 'Administrador' ? (
              <>
                <div className="sidebar-flyout-wrapper">
                  <div className={`sidebar-nav-item ${isDbActive ? 'active' : ''}`}>
                    <div className="nav-item-left">
                      <div className="nav-icon-box"><Database size={20} /></div>
                      <span className="nav-text">Datos</span>
                    </div>
                    <ChevronDown size={16} className="flyout-chevron" style={{ transform: 'rotate(-90deg)' }} />
                  </div>
                  <div className="sidebar-flyout-panel">
                    <NavLink to="/equipos" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`}>
                      <Users size={16} /><span>Equipos</span>
                    </NavLink>
                    <NavLink to="/delegados" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`}>
                      <Contact size={16} /><span>Delegados</span>
                    </NavLink>
                    <NavLink to="/jugadores" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`}>
                      <UserCheck size={16} /><span>Jugadores</span>
                    </NavLink>
                  </div>
                </div>

                <NavLink to="/categorias" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Award size={20} /></div>
                    <span className="nav-text">Categorías</span>
                  </div>
                </NavLink>

                <NavLink to="/torneos" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Trophy size={20} /></div>
                    <span className="nav-text">Torneos</span>
                  </div>
                </NavLink>

                <div className="sidebar-divider"></div>

                <NavLink to="/configuracion" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Settings size={20} /></div>
                    <span className="nav-text">Configuración</span>
                  </div>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/equipo" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Users size={20} /></div>
                    <span className="nav-text">Mi Equipo</span>
                  </div>
                </NavLink>
                <NavLink to="/lista-buena-fe" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><UserCheck size={20} /></div>
                    <span className="nav-text">Lista de Buena Fe</span>
                  </div>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="sidebar-bottom-link youtube-link">
            <div className="link-icon-box"><YouTubeIcon /></div>
            <span className="nav-text">Videos Tutoriales</span>
          </a>
          <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" className="sidebar-bottom-link whatsapp-link">
            <div className="link-icon-box"><WhatsAppIcon /></div>
            <span className="nav-text">WhatsApp</span>
          </a>
        </div>
      </aside>

      {/* ============================================
          MOBILE DRAWER — mismo estilo visual que desktop
          ============================================ */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>

        {/* PARTE SUPERIOR: navegación principal */}
        <div className="mobile-drawer-top">
          <nav className="mobile-drawer-nav">

            <NavLink to="/" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
              <div className="nav-item-left">
                <div className="nav-icon-box"><LayoutDashboard size={20} /></div>
                <span className="nav-text">Dashboard</span>
              </div>
            </NavLink>

            {user?.role === 'Administrador' ? (
              <>
                {/* Datos — acordeón: sub-ítems debajo */}
                <div className="mobile-accordion">
                  <button
                    className={`sidebar-nav-item mobile-accordion-toggle ${isDbActive ? 'active' : ''}`}
                    onClick={() => setMobileDatosOpen(!mobileDatosOpen)}
                  >
                    <div className="nav-item-left">
                      <div className="nav-icon-box"><Database size={20} /></div>
                      <span className="nav-text">Datos</span>
                    </div>
                    <ChevronRight size={16} className={`flyout-chevron mobile-accordion-chevron ${mobileDatosOpen ? 'open' : ''}`} style={{ opacity: 1, visibility: 'visible' }} />
                  </button>
                  {mobileDatosOpen && (
                    <div className="mobile-accordion-body">
                      <NavLink to="/equipos" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Users size={16} /><span>Equipos</span>
                      </NavLink>
                      <NavLink to="/delegados" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Contact size={16} /><span>Delegados</span>
                      </NavLink>
                      <NavLink to="/jugadores" className={({ isActive }) => `flyout-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <UserCheck size={16} /><span>Jugadores</span>
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink to="/categorias" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Award size={20} /></div>
                    <span className="nav-text">Categorías</span>
                  </div>
                </NavLink>

                <NavLink to="/torneos" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Trophy size={20} /></div>
                    <span className="nav-text">Torneos</span>
                  </div>
                </NavLink>

                <div className="sidebar-divider"></div>

                <NavLink to="/configuracion" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Settings size={20} /></div>
                    <span className="nav-text">Configuración</span>
                  </div>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/equipo" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><Users size={20} /></div>
                    <span className="nav-text">Mi Equipo</span>
                  </div>
                </NavLink>
                <NavLink to="/lista-buena-fe" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <div className="nav-item-left">
                    <div className="nav-icon-box"><UserCheck size={20} /></div>
                    <span className="nav-text">Lista de Buena Fe</span>
                  </div>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* PARTE INFERIOR: Notificaciones, Mi Perfil, YouTube, WhatsApp */}
        <div className="mobile-drawer-bottom">
          <div className="sidebar-divider"></div>

          {/* Notificaciones (sin sub-menú) */}
          <button
            className="sidebar-nav-item"
            onClick={() => { setMobileMenuOpen(false); }}
          >
            <div className="nav-item-left">
              <div className="nav-icon-box">
                <Bell size={20} />
              </div>
              <span className="nav-text">Notificaciones</span>
            </div>
          </button>

          {/* Mi Perfil — acordeón con Configuración y Cerrar Sesión */}
          <div className="mobile-accordion">
            <button
              className={`sidebar-nav-item mobile-accordion-toggle`}
              onClick={() => setMobilePerfilOpen(!mobilePerfilOpen)}
            >
              <div className="nav-item-left">
                <div className="nav-icon-box"><User size={20} /></div>
                <span className="nav-text">Mi Perfil</span>
              </div>
              <ChevronRight size={16} className={`flyout-chevron mobile-accordion-chevron ${mobilePerfilOpen ? 'open' : ''}`} style={{ opacity: 1, visibility: 'visible' }} />
            </button>
            {mobilePerfilOpen && (
              <div className="mobile-accordion-body">
                <button
                  className="flyout-item"
                  onClick={() => { setMobileMenuOpen(false); setProfileModalOpen(true); }}
                >
                  <Settings size={16} /><span>Configuración</span>
                </button>
                <button className="flyout-item mobile-flyout-logout" onClick={handleLogout}>
                  <LogOut size={16} /><span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* YouTube y WhatsApp — mismo estilo que desktop bottom */}
          <div className="sidebar-bottom-section mobile-bottom-links">
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="sidebar-bottom-link youtube-link">
              <div className="link-icon-box"><YouTubeIcon /></div>
              <span className="nav-text">Videos Tutoriales</span>
            </a>
            <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" className="sidebar-bottom-link whatsapp-link">
              <div className="link-icon-box"><WhatsAppIcon /></div>
              <span className="nav-text">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* MODAL CENTRO DE AYUDA */}
      {helpModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setHelpModalOpen(false)}>
          <div className="modal-card-custom animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={22} color="var(--brand-beige)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Centro de Ayuda</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setHelpModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body-custom">
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.6' }}>
                El Centro de Ayuda con guías interactivas y preguntas frecuentes se encuentra actualmente en desarrollo.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Si necesitas ayuda inmediata, puedes escribirnos a través del botón de <strong>WhatsApp</strong> ubicado en el menú lateral.
              </p>
            </div>
            <div className="modal-footer-custom">
              <button onClick={() => setHelpModalOpen(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MI PERFIL */}
      {profileModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setProfileModalOpen(false)}>
          <div className="modal-card-custom animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={22} color="var(--brand-beige)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Mi Perfil</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setProfileModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--brand-beige-subtle)', border: '1px solid var(--brand-beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-beige-light)' }}>
                  <User size={28} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{displayName}</h4>
                  <span className="profile-role-badge" style={{ marginTop: '4px', display: 'inline-block' }}>{user?.role || 'Usuario'}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nombre de Usuario</label>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user?.username}</span>
                </div>
                {user?.email && (
                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Correo Electrónico</label>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.email}</span>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Rol en el Sistema</label>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user?.role || 'Administrador'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button onClick={() => setProfileModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
