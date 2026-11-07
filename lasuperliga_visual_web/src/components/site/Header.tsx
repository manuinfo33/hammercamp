import { API_URL, BACKEND_URL, getMediaUrl } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Instagram,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Trophy,
  Image as ImageIcon,
  Megaphone,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useBranding } from "@/lib/branding";
import adNike from "@/assets/ad-nike.png";
import adAdidas from "@/assets/ad-adidas.png";
import adCocacola from "@/assets/ad-cocacola.png";
import { LoginModal } from "./LoginModal";

const nav = [
  { label: "Inicio", to: "/", icon: Home },
  { label: "Nosotros", to: "/nosotros", icon: Users },
  { label: "Categorías", to: "/categorias", icon: Trophy },
  { label: "Galerías", to: "/galerias", icon: ImageIcon },
  { label: "Publicitar", to: "/publicitar", icon: Megaphone },
  { label: "Contacto", to: "/contacto", icon: Mail },
];

export function Header({
  mobileContext,
}: {
  mobileContext?: { title: string; subtitle?: string; backTo?: string };
} = {}) {
  const { logoSrc: logo, brandName, brandLead, brandAccent } = useBranding();
  const [open, setOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!open || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      toggleBtnRef.current?.focus();
      return;
    }
    const menuLinks = menuRef.current?.querySelectorAll<HTMLElement>(".nav__link");
    if (!menuLinks || menuLinks.length === 0) return;

    if (e.key === "Tab" || e.keyCode === 9) {
      if (e.shiftKey) {
        if (document.activeElement === menuLinks[0]) {
          toggleBtnRef.current?.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === toggleBtnRef.current) {
        menuLinks[0].focus();
        e.preventDefault();
      }
    }
  };

  const ads = [
    { id: 1, image: adNike, name: "Nike" },
    { id: 2, image: adAdidas, name: "Adidas" },
    { id: 3, image: adCocacola, name: "Coca Cola" },
  ];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const displayName = user
    ? user.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user.username
    : "";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    fetch(`${API_URL}/tournaments/`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <header className="bg-surface text-foreground sticky top-0 md:relative z-50 border-b border-white/[0.08] md:border-b-0">
      {/* Top Bar: Logo + Actions */}
      <div className="container mx-auto px-3.5 py-2.5 md:px-6 md:py-6 flex items-center justify-between gap-2.5 md:gap-4 relative z-50">
        {mobileContext && (
          <div className="flex md:hidden items-center gap-2.5 min-w-0 flex-1 relative z-[60]">
            <Link
              to={mobileContext.backTo || "/categorias"}
              onClick={() => {
                setOpen(false);
                setMobileUserMenuOpen(false);
              }}
              className="size-9 border border-white/15 bg-white/[0.04] rounded-xl text-neutral-200 hover:text-white flex items-center justify-center shrink-0 transition-colors"
              aria-label="Volver a Categorías"
              title="Volver"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/35 text-primary flex items-center justify-center shrink-0">
              <Trophy className="size-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-[14px] font-bold text-white truncate tracking-tight">
                {mobileContext.title}
              </span>
              {mobileContext.subtitle && (
                <span className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {mobileContext.subtitle}
                </span>
              )}
            </div>
          </div>
        )}

        <Link
          to="/"
          onClick={() => {
            setOpen(false);
            setMobileUserMenuOpen(false);
          }}
          className={`${mobileContext ? "hidden md:flex" : "flex"} items-center gap-2.5 md:gap-3 group relative z-[60]`}
        >
          <img
            src={logo}
            alt={brandName}
            width={56}
            height={56}
            className="size-10 md:size-14 object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase">
              {brandLead}{brandLead ? " " : ""}<span className="text-primary">{brandAccent}</span>
            </span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-primary/80 mt-0.5 md:mt-1">
              Torneos
            </span>
          </span>
        </Link>

        {/* Desktop Right Side: Sponsors + Social */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
              Auspicia:
            </span>
            <div className="w-[75px] h-[56px] relative overflow-hidden border border-border/40 rounded-xl bg-surface/30 flex items-center justify-center p-0 shadow-xs">
              <img
                src={ads[currentAdIndex].image}
                alt={ads[currentAdIndex].name}
                className="w-full h-full object-cover animate-in fade-in duration-500 rounded-xl"
                key={ads[currentAdIndex].id}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="Facebook"
              className="p-2.5 border border-border/40 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="p-2.5 border border-border/40 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
            >
              <Instagram className="size-4" />
            </a>
          </div>
        </div>

        {/* Mobile Right Actions: User + Animated Hamburger Menu */}
        <div className="flex items-center gap-2 md:hidden shrink-0">
          {!mobileContext &&
            (user ? (
              <div className="relative z-[60]">
                <button
                  className={`size-9 border rounded-xl flex items-center justify-center transition-all ${
                    mobileUserMenuOpen
                      ? "border-white/25 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-neutral-300"
                  }`}
                  onClick={() => {
                    setOpen(false);
                    setMobileUserMenuOpen((v) => !v);
                  }}
                  aria-label="Menú de usuario"
                >
                  <User className="size-4" />
                </button>
                {mobileUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#16171a]/98 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.65)] z-50 text-foreground p-1.5 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2.5 mb-1 border-b border-white/[0.07]">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                          Sesión activa
                        </p>
                        <p className="text-xs font-semibold text-white truncate mt-0.5">
                          Hola, {displayName}
                        </p>
                      </div>
                      <Link
                        to="/mi-cuenta"
                        onClick={() => setMobileUserMenuOpen(false)}
                        className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-white/[0.06] text-neutral-300 hover:text-white transition-colors block text-xs font-medium uppercase tracking-[0.14em]"
                        activeProps={{
                          className:
                            "w-full text-left px-3.5 py-2.5 rounded-lg bg-white/[0.08] text-white font-semibold transition-colors block text-xs uppercase tracking-[0.14em]",
                        }}
                      >
                        Mi Cuenta
                      </Link>
                      {user.role === "Delegado" && (
                        <Link
                          to="/mi-equipo"
                          onClick={() => setMobileUserMenuOpen(false)}
                          className="flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-white/[0.06] text-neutral-300 hover:text-white transition-colors text-xs font-medium uppercase tracking-[0.14em]"
                          activeProps={{
                            className:
                              "flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-lg bg-white/[0.08] text-white font-semibold transition-colors text-xs uppercase tracking-[0.14em]",
                          }}
                        >
                          <span>Mi Equipo</span>
                          <span className="size-1.5 rounded-full bg-primary" />
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3.5 py-2.5 mt-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors block border-t border-white/[0.07] text-xs font-medium uppercase tracking-[0.14em]"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                className="size-9 border border-white/10 bg-white/[0.03] rounded-xl text-neutral-300 hover:text-white flex items-center justify-center transition-colors relative z-[60]"
                onClick={() => {
                  setOpen(false);
                  setIsLoginOpen(true);
                }}
                aria-label="Acceso"
              >
                <User className="size-4" />
              </button>
            ))}

          <nav
            id="nav"
            ref={navRef}
            onKeyDown={handleNavKeyDown}
            className={`nav ${open ? "nav--open" : ""}`}
            role="navigation"
          >
            {/* MENU TOGGLE BUTTON */}
            <button
              type="button"
              ref={toggleBtnRef}
              className="nav__toggle"
              aria-expanded={open}
              aria-controls="menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={(e) => {
                e.preventDefault();
                setMobileUserMenuOpen(false);
                setOpen((v) => !v);
              }}
            >
              <svg
                className="menuicon"
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 50 50"
              >
                <title>Alternar Menú</title>
                <g>
                  <line className="menuicon__bar" x1="13" y1="16.5" x2="37" y2="16.5" />
                  <line className="menuicon__bar" x1="13" y1="24.5" x2="37" y2="24.5" />
                  <line className="menuicon__bar" x1="13" y1="24.5" x2="37" y2="24.5" />
                  <line className="menuicon__bar" x1="13" y1="32.5" x2="37" y2="32.5" />
                  <circle className="menuicon__circle" r="23" cx="25" cy="25" />
                </g>
              </svg>
            </button>

            <div className="nav__overlay md:hidden">
              {/* ANIMATED BACKGROUND ELEMENT */}
              <div className="splash" />

              {/* ACTUAL NAVIGATION MENU */}
              <ul
                ref={menuRef}
                className="nav__menu"
                id="menu"
                tabIndex={-1}
                aria-label="main navigation"
                aria-hidden={!open}
              >
                {nav.map((item) => (
                  <li key={item.to} className="nav__item">
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      onClick={() => setOpen(false)}
                      className="nav__link"
                      activeProps={{
                        className: "nav__link nav__link--active",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* =========================================================
          DESKTOP NAVIGATION BAR (md and up)
         ========================================================= */}
      <nav className="hidden md:block bg-surface border-t border-border/60 relative z-40">
        <div className="container mx-auto px-6 flex items-center">
          <ul className="flex flex-row items-center gap-1">
            {nav.map((item, i) => (
              <li key={item.to} className="relative group">
                {item.label === "Categorías" ? (
                  <>
                    <div className="flex items-center cursor-pointer px-6 py-5 hover:text-primary transition-colors">
                      <Link
                        to={item.to}
                        activeOptions={{ exact: item.to === "/" }}
                        className="text-xs font-bold uppercase tracking-[0.18em]"
                        activeProps={{
                          className:
                            "text-xs font-bold uppercase tracking-[0.18em] text-primary",
                        }}
                      >
                        {item.label}
                      </Link>
                      <ChevronDown className="size-4 ml-1 opacity-50 group-hover:rotate-180 transition-transform" />
                    </div>
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 min-w-[220px] bg-surface-elevated border border-border/60 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                      <ul className="flex flex-col py-2">
                        {categories.map((c: any) => (
                          <li key={c.id}>
                            <Link
                              to={`/categorias/${c.id}`}
                              className="block px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className="flex items-center gap-2 px-6 py-5 text-xs font-bold uppercase tracking-[0.18em] hover:text-primary transition-colors"
                    activeProps={{
                      className:
                        "flex items-center gap-2 px-6 py-5 text-xs font-bold uppercase tracking-[0.18em] bg-primary text-primary-foreground clip-tab hover:text-primary-foreground",
                    }}
                  >
                    <span>{item.label}</span>
                  </Link>
                )}
                {i < nav.length - 1 && (
                  <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-border" />
                )}
              </li>
            ))}
          </ul>
          <div className="ml-auto hidden md:flex items-center gap-3 pl-6">
            {user ? (
              <div className="relative group">
                <button className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer bg-transparent border-0 p-0">
                  <User className="size-3.5" />
                  Hola {displayName}
                  <ChevronDown className="size-3 opacity-50 transition-transform group-hover:rotate-180 duration-200" />
                </button>
                <div className="absolute right-0 top-full mt-3 w-48 bg-surface-elevated border border-border/60 shadow-xl z-50 text-foreground py-2 text-xs font-bold uppercase tracking-[0.15em] rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                  <Link
                    to="/mi-cuenta"
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                    activeProps={{
                      className:
                        "w-full text-left px-4 py-3 bg-primary/10 text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em]",
                    }}
                  >
                    Mi Cuenta
                  </Link>
                  {user.role === "Delegado" && (
                    <Link
                      to="/mi-equipo"
                      className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                      activeProps={{
                        className:
                          "flex items-center justify-between w-full text-left px-4 py-3 bg-primary/10 text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em]",
                      }}
                    >
                      <span>Mi Equipo</span>
                      <span className="size-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] animate-pulse" />
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors block border-t border-border/40 text-xs font-bold uppercase tracking-[0.15em]"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                aria-label="Login"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <User className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">
                  Acceso
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(userData) => {
          setUser(userData);
          setIsLoginOpen(false);
        }}
      />
    </header>
  );
}
