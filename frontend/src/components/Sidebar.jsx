import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Wallet,
  Plus
} from 'lucide-react';
import { useHeaderInfo } from '../context/HeaderContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';

const IgReelIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
    <polygon points="10 8.5 16 12 10 15.5 10 8.5" fill="currentColor" stroke="none" />
  </svg>
);

const IgWhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

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
  const { logoSrc, brandName, brandNameUpper } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const { headerInfo } = useHeaderInfo();
  const isAdmin = user?.role === 'Administrador';
  const isDbActive = DATA_LINKS.some((l) => location.pathname.startsWith(l.to));
  const isTournamentDetail = /^\/torneos\/[^/]+/.test(location.pathname);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [dataSheetOpen, setDataSheetOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const dragStartYRef = useRef(null);
  const dragCurrentYRef = useRef(0);
  const openDataMenu = () => setDataMenuOpen(true);

  const closeUserSheet = () => {
    setIsSheetDragging(false);
    setSheetClosing(true);
    setTimeout(() => {
      setUserDropdownOpen(false);
      setSheetClosing(false);
      setSheetDragY(0);
      dragStartYRef.current = null;
      dragCurrentYRef.current = 0;
    }, 200);
  };

  // Bloquea el scroll del fondo cuando el menú inferior de usuario está abierto
  useEffect(() => {
    if (!userDropdownOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [userDropdownOpen]);

  const handleSheetDragStart = (clientY) => {
    dragStartYRef.current = clientY;
    dragCurrentYRef.current = 0;
    setIsSheetDragging(true);
  };

  const handleSheetDragMove = (clientY) => {
    if (dragStartYRef.current === null) return;
    const deltaY = Math.max(0, clientY - dragStartYRef.current);
    dragCurrentYRef.current = deltaY;
    setSheetDragY(deltaY);
  };

  const handleSheetDragEnd = () => {
    if (dragStartYRef.current === null) return;
    const finalDelta = dragCurrentYRef.current;
    dragStartYRef.current = null;
    dragCurrentYRef.current = 0;
    setIsSheetDragging(false);
    if (finalDelta > 45) {
      closeUserSheet();
    } else {
      setSheetDragY(0);
    }
  };

  useEffect(() => {
    if (!isSheetDragging) return;
    const onMouseMove = (e) => handleSheetDragMove(e.clientY);
    const onMouseUp = () => handleSheetDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isSheetDragging]);

  // Cierra menús al cambiar de ruta
  useEffect(() => {
    setDataMenuOpen(false);
    setDataSheetOpen(false);
    setMoreSheetOpen(false);
    setUserDropdownOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleToggleSheet = () => {
      setNotificationsOpen(false);
      setDataSheetOpen(false);
      setMoreSheetOpen(false);
      setUserDropdownOpen((prev) => !prev);
    };
    const handleCloseSheet = () => {
      setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('gx-toggle-user-sheet', handleToggleSheet);
    window.addEventListener('gx-close-user-sheet', handleCloseSheet);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('gx-toggle-user-sheet', handleToggleSheet);
      window.removeEventListener('gx-close-user-sheet', handleCloseSheet);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gx-user-sheet-changed', { detail: { open: userDropdownOpen } }));
  }, [userDropdownOpen]);

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
          <div className="gx-header-left" style={{ flex: isTournamentDetail ? 1 : 'none', minWidth: 0 }}>
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
                    style={{ flexShrink: 0 }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="gx-logo-link gx-mobile-only" onClick={() => navigate('/torneos')} title="Torneos" style={{ flexShrink: 0 }}>
                  <span className="gx-trophy-badge"><Trophy size={22} /></span>
                </div>
                <div className="gx-header-context gx-mobile-only" style={{ flex: 1, minWidth: 0 }}>
                  <span className="gx-hc-title">{headerInfo.title}</span>
                  {headerInfo.subtitle && <span className="gx-hc-sub">{headerInfo.subtitle}</span>}
                </div>
              </>
            )}

            {/* En PC (o en mobile cuando no hay headerInfo), siempre se muestra el logo y LA SUPERLIGA GESTION */}
            <div className={`gx-header-brand ${headerInfo ? 'desktop-only' : ''}`} onClick={() => navigate('/')} title={brandName}>
              <span className="gx-header-logo">
                <img src={logoSrc} alt={brandName} />
              </span>
              <span className="gx-header-brand-text">
                <b>{brandNameUpper}</b>
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
            <div className={`gx-popover-wrap ${isTournamentDetail ? 'desktop-only' : ''}`} ref={notificationsRef}>
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
                      <span className="t"><Bell size={16} color="var(--gx-primary-ink)" /> Notificaciones</span>
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

            <div className={`gx-popover-wrap gx-mobile-only ${isTournamentDetail ? 'hide-on-mobile' : ''}`} ref={userDropdownRef}>
              <button
                type="button"
                className={`gx-icon-btn ${userDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                  setDataSheetOpen(false);
                  setMoreSheetOpen(false);
                }}
                aria-label="Perfil de usuario"
                title="Mi cuenta"
              >
                <User size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú inferior estilo Instagram para el icono de usuario en vista celular */}
      {userDropdownOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="gx-ig-sheet-backdrop"
            onClick={closeUserSheet}
            onTouchMove={(e) => e.preventDefault()}
            style={{
              opacity: sheetClosing ? 0 : Math.max(0.15, 1 - sheetDragY / 320),
              transition: isSheetDragging ? 'none' : 'opacity 0.2s ease'
            }}
          />
          <div
            className="gx-ig-user-sheet"
            role="dialog"
            aria-label="Menú de usuario"
            onTouchStart={(e) => {
              if (e.touches && e.touches.length > 0) {
                handleSheetDragStart(e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches && e.touches.length > 0) {
                handleSheetDragMove(e.touches[0].clientY);
              }
            }}
            onTouchEnd={handleSheetDragEnd}
            onTouchCancel={handleSheetDragEnd}
            style={{
              transform: sheetClosing
                ? 'translateY(100%)'
                : sheetDragY > 0
                  ? `translateY(${sheetDragY}px)`
                  : undefined,
              transition: isSheetDragging ? 'none' : 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div
              className="gx-ig-drag-zone"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSheetDragStart(e.clientY);
              }}
            >
              <div className="gx-ig-handle" />
              <div className="gx-ig-header">
                <span className="gx-ig-title">{displayName}</span>
              </div>
            </div>

            <div className="gx-ig-list">
              <button
                type="button"
                className="gx-ig-row"
                onClick={() => { setUserDropdownOpen(false); setProfileModalOpen(true); }}
              >
                <span className="gx-ig-icon"><User size={22} strokeWidth={1.8} /></span>
                <span className="gx-ig-label">Mi Perfil</span>
                <span className="gx-ig-badge">{user?.role || 'Usuario'}</span>
              </button>

              <button
                type="button"
                className="gx-ig-row"
                onClick={() => { setUserDropdownOpen(false); setHelpModalOpen(true); }}
              >
                <span className="gx-ig-icon"><HelpCircle size={22} strokeWidth={1.8} /></span>
                <span className="gx-ig-label">Centro de Ayuda</span>
              </button>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="gx-ig-row"
                onClick={() => setUserDropdownOpen(false)}
              >
                <span className="gx-ig-icon"><IgReelIcon /></span>
                <span className="gx-ig-label">Videos Tutoriales</span>
              </a>

              <a
                href="https://wa.me/5491112345678"
                target="_blank"
                rel="noopener noreferrer"
                className="gx-ig-row"
                onClick={() => setUserDropdownOpen(false)}
              >
                <span className="gx-ig-icon"><IgWhatsAppIcon /></span>
                <span className="gx-ig-label">WhatsApp Soporte</span>
              </a>

              <button
                type="button"
                className="gx-ig-row gx-ig-row-logout"
                onClick={handleLogout}
              >
                <span className="gx-ig-icon"><LogOut size={22} strokeWidth={1.8} /></span>
                <span className="gx-ig-label">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

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
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setDataSheetOpen(false)}>
                <Icon size={18} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}

      {moreSheetOpen && isAdmin && (
        <>
          <div className="gx-sheet-backdrop" onClick={() => setMoreSheetOpen(false)} />
          <div className="gx-sheet" role="menu">
            <NavLink to="/categorias" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMoreSheetOpen(false)}>
              <Award size={18} /><span>Categorías</span>
            </NavLink>
            <NavLink to="/configuracion" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setMoreSheetOpen(false)}>
              <Settings size={18} /><span>Configuración WEB</span>
            </NavLink>
          </div>
        </>
      )}

      <nav className="gx-bottomnav" aria-label="Navegación móvil">
        <NavLink to="/" end className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && !moreSheetOpen && isActive ? 'active' : ''}`} onClick={() => { setDataSheetOpen(false); setMoreSheetOpen(false); }}>
          <LayoutDashboard size={20} /><span className="lbl">Inicio</span>
        </NavLink>

        {isAdmin ? (
          <>
            <button
              type="button"
              className={`gx-bottomnav-btn ${dataSheetOpen || isDbActive ? 'active' : ''}`}
              onClick={() => {
                setMoreSheetOpen(false);
                setDataSheetOpen(!dataSheetOpen);
              }}
            >
              <Database size={20} /><span className="lbl">Datos</span>
            </button>
            <NavLink to="/torneos" className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && !moreSheetOpen && isActive ? 'active' : ''}`} onClick={() => { setDataSheetOpen(false); setMoreSheetOpen(false); }}>
              <Trophy size={20} /><span className="lbl">Torneos</span>
            </NavLink>
            <NavLink to="/finanzas" className={({ isActive }) => `gx-bottomnav-btn ${!dataSheetOpen && !moreSheetOpen && isActive ? 'active' : ''}`} onClick={() => { setDataSheetOpen(false); setMoreSheetOpen(false); }}>
              <Wallet size={20} /><span className="lbl">Finanzas</span>
            </NavLink>
            <button
              type="button"
              className={`gx-bottomnav-btn ${moreSheetOpen || location.pathname.startsWith('/categorias') || location.pathname.startsWith('/configuracion') ? 'active' : ''}`}
              onClick={() => {
                setDataSheetOpen(false);
                setMoreSheetOpen(!moreSheetOpen);
              }}
            >
              <Plus size={20} /><span className="lbl">Más</span>
            </button>
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
        <div className="modal-backdrop-custom">
          <div className="modal-card-custom animate-fade-in" style={{ maxWidth: '460px', borderRadius: '20px' }}>
            <div className="modal-header-custom" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(var(--gx-primary-rgb), 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gx-primary-ink)', flexShrink: 0 }}>
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
        <div className="modal-backdrop-custom">
          <div className="modal-card-custom animate-fade-in" style={{ maxWidth: '460px', borderRadius: '20px' }}>
            <div className="modal-header-custom" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(var(--gx-primary-rgb), 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gx-primary-ink)', flexShrink: 0 }}>
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
                  <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(var(--gx-primary-rgb), 0.18)', color: 'var(--gx-primary-ink)', padding: '2px 8px', borderRadius: '6px' }}>
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
