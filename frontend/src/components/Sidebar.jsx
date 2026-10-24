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
  X,
  Database,
  ChevronDown,
  Award,
  HelpCircle,
  Bell,
  ArrowLeft,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useHeaderInfo } from '../context/HeaderContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.011 2C6.5 2 2.011 6.489 2.011 12c0 2.13.67 4.104 1.815 5.727L2 22l4.417-1.782C8.01 21.282 9.948 22 12.011 22c5.511 0 10-4.489 10-10s-4.489-10-10-10zm5.632 14.289c-.235.66-1.168 1.203-1.905 1.365-.505.109-1.164.195-3.376-.719-2.83-1.168-4.646-4.048-4.787-4.237-.14-.19-1.144-1.523-1.144-2.906 0-1.383.722-2.062.981-2.345.258-.283.564-.353.753-.353.188 0 .376.002.541.01.176.008.411-.067.644.492.235.564.799 1.952.87 2.093.07.14.117.306.023.493-.094.188-.14.306-.283.471-.141.165-.297.368-.423.494-.141.141-.289.294-.124.577.165.283.73 1.204 1.567 1.947 1.076.958 1.982 1.254 2.265 1.395.283.141.447.118.612-.07.165-.188.706-.823.894-1.106.188-.283.376-.235.635-.141.259.094 1.646.776 1.929.917.283.141.471.212.541.33.07.118.07.683-.165 1.343z" fill="#25D366"/>
  </svg>
);

const DATA_LINKS = [
  { to: '/equipos', label: 'Equipos', icon: Users },
  { to: '/delegados', label: 'Delegados', icon: Contact },
  { to: '/jugadores', label: 'Jugadores', icon: UserCheck },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { headerInfo } = useHeaderInfo();
  const isAdmin = user?.role === 'Administrador';
  const isDbActive = DATA_LINKS.some((l) => location.pathname.startsWith(l.to));
  const isTournamentDetail = /^\/torneos\/[^/]+/.test(location.pathname);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [dataSheetOpen, setDataSheetOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const openDataMenu = () => setDataMenuOpen(true);

  // Cierra menús al cambiar de ruta
  useEffect(() => {
    setDataMenuOpen(false);
    setDataSheetOpen(false);
    setUserDropdownOpen(false);
    setNotificationsOpen(false);
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
    logout();
    navigate('/login');
  };

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Usuario';
  const greetingName = user?.first_name || user?.username || 'Usuario';

  const sideClass = ({ isActive }) => `gx-side-item ${isActive ? 'active' : ''}`;
  const bottomClass = ({ isActive }) => `gx-bottomnav-btn ${isActive ? 'active' : ''}`;

  return (
    <>
      {/* ============================================
          HEADER SUPERIOR (oscuro, mismo estilo que "Mi Equipo")
          ============================================ */}
      <header className="gx-header">
        <div className="gx-header-inner">
          <div className="gx-header-left">
            {/* En celular dentro del torneo muestra botón volver y título del torneo */}
            {headerInfo && (
              <>
                {isTournamentDetail && (
                  <button
                    type="button"
                    className="gx-icon-btn gx-mobile-only"
                    onClick={() => navigate('/torneos')}
                    aria-label="Volver a Torneos"
                    title="Volver a Torneos"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="gx-logo-link gx-mobile-only" onClick={() => navigate('/torneos')} title="Torneos">
                  <span className="gx-trophy-badge"><Trophy size={22} /></span>
                </div>
                <div className="gx-header-context gx-mobile-only">
                  <span className="gx-hc-title">{headerInfo.title}</span>
                  {headerInfo.subtitle && <span className="gx-hc-sub">{headerInfo.subtitle}</span>}
                </div>
              </>
            )}

            {/* En PC (o en mobile cuando no hay headerInfo), siempre se muestra el logo y LA SUPERLIGA GESTION */}
            <div className={`gx-header-brand ${headerInfo ? 'desktop-only' : ''}`} onClick={() => navigate('/')} title="La Superliga">
              <span className="gx-header-logo">
                <img src="/logo-superliga.png" alt="La Superliga" />
              </span>
              <span className="gx-header-brand-text">
                <b>LA SUPERLIGA</b>
                <i>GESTIÓN</i>
              </span>
            </div>
          </div>

          <div className="gx-header-right">
            {/* Centro de Ayuda (desktop) */}
            <button
              type="button"
              className="gx-icon-btn desktop-only"
              onClick={() => setHelpModalOpen(true)}
              aria-label="Centro de ayuda"
              title="Centro de Ayuda"
            >
              <HelpCircle size={20} />
            </button>

            {/* Notificaciones */}
            <div className="gx-popover-wrap" ref={notificationsRef}>
              <button
                type="button"
                className={`gx-icon-btn ${notificationsOpen ? 'active' : ''}`}
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <Bell size={20} />
                <span className="gx-notif-dot" />
              </button>
              {notificationsOpen && (
                <>
                  <div className="gx-sheet-backdrop" onClick={() => setNotificationsOpen(false)} />
                  <div className="gx-popover gx-popover-notif">
                    <div className="gx-popover-head">
                      <span className="t"><Bell size={16} color="#b98a10" /> Notificaciones</span>
                      <span className="gx-pill">Nuevas</span>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      <div className="gx-notif-item">
                        <span className="dot" />
                        <div>
                          <p className="title">Sistema de Gestión Actualizado</p>
                          <p className="time">Hace 10 minutos</p>
                        </div>
                      </div>
                      <div className="gx-notif-item">
                        <span className="dot" />
                        <div>
                          <p className="title">Nuevos torneos disponibles</p>
                          <p className="time">Hace 1 hora</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ paddingTop: '10px', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#d4d4d8',
                          width: '100%',
                          height: '32px',
                          padding: '0 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#d4d4d8'; }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Usuario: en desktop abre directamente 'Mi Perfil' modal; en mobile despliega el menú */}
            <button
              type="button"
              className="gx-icon-btn desktop-only"
              onClick={() => {
                setNotificationsOpen(false);
                setProfileModalOpen(true);
              }}
              aria-label="Mi Perfil"
              title="Mi Cuenta"
            >
              <User size={20} />
            </button>

            <div className="gx-popover-wrap gx-mobile-only" ref={userDropdownRef}>
              <button
                type="button"
                className={`gx-icon-btn ${userDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                aria-label="Perfil de usuario"
                title="Mi cuenta"
              >
                <User size={20} />
              </button>
              {userDropdownOpen && (
                <>
                  <div className="gx-sheet-backdrop" onClick={() => setUserDropdownOpen(false)} />
                  <div className="gx-popover gx-popover-user">
                  <div className="gx-user-profile-header">
                    <div className="gx-user-avatar-badge">
                      <User size={20} />
                    </div>
                    <div className="gx-user-details">
                      <span className="name">{displayName}</span>
                      <span className="role-tag">{user?.role || 'Usuario'}</span>
                    </div>
                  </div>

                  <div className="gx-menu-group">
                    <button
                      type="button"
                      className="gx-menu-item"
                      onClick={() => { setUserDropdownOpen(false); setProfileModalOpen(true); }}
                    >
                      <span className="gx-menu-icon"><User size={16} /></span>
                      <span className="gx-menu-lbl">Mi Perfil</span>
                      <ChevronRight size={14} className="gx-menu-arrow" />
                    </button>
                    <button
                      type="button"
                      className="gx-menu-item"
                      onClick={() => { setUserDropdownOpen(false); setHelpModalOpen(true); }}
                    >
                      <span className="gx-menu-icon"><HelpCircle size={16} /></span>
                      <span className="gx-menu-lbl">Centro de Ayuda</span>
                      <ChevronRight size={14} className="gx-menu-arrow" />
                    </button>
                  </div>

                  <div className="gx-menu-group">
                    <a
                      href="https://www.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gx-menu-item"
                    >
                      <span className="gx-menu-icon"><YouTubeIcon /></span>
                      <span className="gx-menu-lbl">Videos Tutoriales</span>
                      <ChevronRight size={14} className="gx-menu-arrow" />
                    </a>
                    <a
                      href="https://wa.me/5491112345678"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gx-menu-item"
                    >
                      <span className="gx-menu-icon"><WhatsAppIcon /></span>
                      <span className="gx-menu-lbl">WhatsApp Soporte</span>
                      <ChevronRight size={14} className="gx-menu-arrow" />
                    </a>
                  </div>

                  <div className="gx-menu-footer">
                    <button type="button" className="gx-menu-item gx-menu-logout" onClick={handleLogout}>
                      <span className="gx-menu-icon"><LogOut size={16} /></span>
                      <span className="gx-menu-lbl">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================
          MENÚ LATERAL VERTICAL (desktop) — se expande al pasar el mouse
          ============================================ */}
      <aside className="gx-sidebar" aria-label="Navegación principal" onMouseLeave={() => setDataMenuOpen(false)}>
        <div className="gx-side-body">
          <nav className="gx-side-nav">
            <NavLink to="/" end className={sideClass} onMouseEnter={() => setDataMenuOpen(false)}>
              <span className="gx-side-icon"><LayoutDashboard size={20} /></span>
              <span className="gx-side-text">Dashboard</span>
            </NavLink>

            {isAdmin ? (
              <>
                <button
                  type="button"
                  className={`gx-side-item ${isDbActive ? 'active' : ''} ${dataMenuOpen ? 'open' : ''}`}
                  onMouseEnter={openDataMenu}
                  onClick={() => (dataMenuOpen ? setDataMenuOpen(false) : openDataMenu())}
                  aria-haspopup="true"
                  aria-expanded={dataMenuOpen}
                >
                  <span className="gx-side-icon"><Database size={20} /></span>
                  <span className="gx-side-text">Datos</span>
                  <ChevronRight size={16} className="gx-side-chev" />
                </button>

                <NavLink to="/categorias" className={sideClass} onMouseEnter={() => setDataMenuOpen(false)}>
                  <span className="gx-side-icon"><Award size={20} /></span>
                  <span className="gx-side-text">Categorías</span>
                </NavLink>
                <NavLink to="/torneos" className={sideClass} onMouseEnter={() => setDataMenuOpen(false)}>
                  <span className="gx-side-icon"><Trophy size={20} /></span>
                  <span className="gx-side-text">Torneos</span>
                </NavLink>
                <NavLink to="/finanzas" className={sideClass} onMouseEnter={() => setDataMenuOpen(false)}>
                  <span className="gx-side-icon"><Wallet size={20} /></span>
                  <span className="gx-side-text">Finanzas</span>
                </NavLink>
                <NavLink to="/configuracion" className={sideClass} onMouseEnter={() => setDataMenuOpen(false)}>
                  <span className="gx-side-icon"><Settings size={20} /></span>
                  <span className="gx-side-text">Configuración</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/equipo" className={sideClass}>
                  <span className="gx-side-icon"><Users size={20} /></span>
                  <span className="gx-side-text">Mi Equipo</span>
                </NavLink>
                <NavLink to="/lista-buena-fe" className={sideClass}>
                  <span className="gx-side-icon"><UserCheck size={20} /></span>
                  <span className="gx-side-text">Lista de Buena Fe</span>
                </NavLink>
              </>
            )}
          </nav>

          <div className="gx-side-bottom" onMouseEnter={() => setDataMenuOpen(false)}>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="gx-side-item">
              <span className="gx-side-icon"><YouTubeIcon /></span>
              <span className="gx-side-text">Videos Tutoriales</span>
            </a>
            <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" className="gx-side-item">
              <span className="gx-side-icon"><WhatsAppIcon /></span>
              <span className="gx-side-text">WhatsApp</span>
            </a>
            <button type="button" className="gx-side-item gx-side-logout" onClick={handleLogout}>
              <span className="gx-side-icon"><LogOut size={20} /></span>
              <span className="gx-side-text">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {isAdmin && dataMenuOpen && (
          <div className="gx-side-panel gx-side-flyout">
            <div className="gx-side-body">
              <nav className="gx-side-nav">
                {DATA_LINKS.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className={sideClass}>
                    <span className="gx-side-icon"><Icon size={20} /></span>
                    <span className="gx-side-text">{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}
      </aside>

      {/* ============================================
          BARRA INFERIOR (celular)
          ============================================ */}
      {dataSheetOpen && isAdmin && (
        <>
          <div className="gx-sheet-backdrop" onClick={() => setDataSheetOpen(false)} />
          <div className="gx-sheet" role="menu">
            {DATA_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} /><span>{label}</span>
              </NavLink>
            ))}
            <NavLink to="/finanzas" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setDataSheetOpen(false)}>
              <Wallet size={18} /><span>Finanzas</span>
            </NavLink>
          </div>
        </>
      )}

      <nav className="gx-bottomnav" aria-label="Navegación móvil">
        <NavLink to="/" end className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && isActive ? 'active' : ''}`} onClick={() => setDataSheetOpen(false)}>
          <LayoutDashboard size={20} /><span className="lbl">Inicio</span>
        </NavLink>

        {isAdmin ? (
          <>
            <button
              type="button"
              className={`gx-bottomnav-btn ${dataSheetOpen || isDbActive ? 'active' : ''}`}
              onClick={() => setDataSheetOpen(!dataSheetOpen)}
            >
              <Database size={20} /><span className="lbl">Datos</span>
            </button>
            <NavLink to="/torneos" className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && isActive ? 'active' : ''}`} onClick={() => setDataSheetOpen(false)}>
              <Trophy size={20} /><span className="lbl">Torneos</span>
            </NavLink>
            <NavLink to="/categorias" className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && isActive ? 'active' : ''}`} onClick={() => setDataSheetOpen(false)}>
              <Award size={20} /><span className="lbl">Categorías</span>
            </NavLink>
            <NavLink to="/configuracion" className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && isActive ? 'active' : ''}`} onClick={() => setDataSheetOpen(false)}>
              <Settings size={20} /><span className="lbl">Config.</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/equipo" className={bottomClass}>
              <Users size={20} /><span className="lbl">Mi Equipo</span>
            </NavLink>
            <NavLink to="/lista-buena-fe" className={bottomClass}>
              <UserCheck size={20} /><span className="lbl">Buena Fe</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* MODAL CENTRO DE AYUDA */}
      {helpModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setHelpModalOpen(false)}>
          <div className="modal-card-custom animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', borderRadius: '20px' }}>
            <div className="modal-header-custom" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(242, 187, 43, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b98a10', flexShrink: 0 }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Centro de Ayuda</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Soporte y asistencia técnica</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setHelpModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body-custom" style={{ padding: '22px 24px' }}>
              <div style={{ background: '#fafafb', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: '1.5', fontSize: '14px', fontWeight: 500 }}>
                  El módulo de guías interactivas y preguntas frecuentes se encuentra en constante actualización.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                  ¿Tenés consultas operativas o necesitás soporte en vivo? Podés contactarte directamente por WhatsApp con nuestro equipo.
                </p>
              </div>
              <a
                href="https://wa.me/5491112345678"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#25D366',
                  color: '#fff',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
                  transition: 'opacity 0.15s ease'
                }}
              >
                <WhatsAppIcon /><span>Contactar por WhatsApp</span>
              </a>
            </div>
            <div className="modal-footer-custom" style={{ padding: '14px 24px', background: '#fafafb', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setHelpModalOpen(false)}
                style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MI PERFIL */}
      {profileModalOpen && (
        <div className="modal-backdrop-custom" onClick={() => setProfileModalOpen(false)}>
          <div className="modal-card-custom animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', borderRadius: '20px' }}>
            <div className="modal-header-custom" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(242, 187, 43, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b98a10', flexShrink: 0 }}>
                  <User size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Mi Cuenta</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Detalles de sesión y credenciales</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setProfileModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body-custom" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '14px', background: '#fafafb', border: '1px solid var(--border-subtle)', borderRadius: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gx-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gx-primary)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <User size={26} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>{displayName}</h4>
                  <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(242, 187, 43, 0.18)', color: '#b98a10', padding: '2px 8px', borderRadius: '6px' }}>
                    {user?.role || 'Administrador'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13.5px' }}>{user?.username}</span>
                </div>
                {user?.email && (
                  <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Electrónico</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13.5px', wordBreak: 'break-all' }}>{user.email}</span>
                  </div>
                )}
                <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol de Acceso</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13.5px' }}>{user?.role || 'Administrador'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer-custom" style={{ padding: '14px 24px', background: '#fafafb', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setProfileModalOpen(false)}
                style={{ height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
