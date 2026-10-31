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
} from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-superliga.png";
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

export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

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
    fetch(`${API_URL}/categories/`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  return (
    <header className="bg-surface text-foreground sticky top-0 md:relative z-50 border-b border-white/[0.08] md:border-b-0">
      {/* Top Bar: Logo + Actions */}
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-6 flex items-center justify-between gap-4 relative z-50">
        <Link
          to="/"
          onClick={() => {
            setOpen(false);
            setMobileUserMenuOpen(false);
          }}
          className="flex items-center gap-2.5 md:gap-3 group"
        >
          <img
            src={logo}
            alt="La Superliga Torneos"
            width={56}
            height={56}
            className="size-10 md:size-14 object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase">
              La <span className="text-primary">Superliga</span>
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

        {/* Mobile Right Actions: User + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <div className="relative">
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
              className="size-9 border border-white/10 bg-white/[0.03] rounded-xl text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              onClick={() => {
                setOpen(false);
                setIsLoginOpen(true);
              }}
              aria-label="Acceso"
            >
              <User className="size-4" />
            </button>
          )}

          <button
            className={`size-9 border rounded-xl flex items-center justify-center transition-all ${
              open
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.03] text-neutral-300"
            }`}
            onClick={() => {
              setMobileUserMenuOpen(false);
              setOpen((v) => !v);
            }}
            aria-label="Menú"
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================
          MOBILE MENU: Full-width, flush with header, refined & minimal
         ========================================================= */}
      {open && (
        <>
          {/* Invisible click-outside catcher so background page stays visible */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 top-full w-full z-50 md:hidden bg-[#141518]/98 backdrop-blur-xl border-b border-white/10 rounded-b-2xl shadow-[0_24px_48px_rgba(0,0,0,0.65)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="divide-y divide-white/[0.05] max-h-[75vh] overflow-y-auto px-4">
              {nav.map((item) => {
                const Icon = item.icon;
                if (item.label === "Categorías") {
                  return (
                    <div key={item.to} className="py-0.5">
                      <div className="flex items-center justify-between">
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className="flex-1 flex items-center gap-3.5 py-3.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-neutral-300 hover:text-white transition-colors"
                          activeProps={{
                            className:
                              "flex-1 flex items-center gap-3.5 py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white",
                          }}
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={`w-0.5 h-3.5 rounded-full transition-colors ${
                                  isActive ? "bg-primary" : "bg-transparent"
                                }`}
                              />
                              <Icon
                                className={`size-4 shrink-0 transition-colors ${
                                  isActive ? "text-white" : "text-neutral-500"
                                }`}
                              />
                              <span>{item.label}</span>
                            </>
                          )}
                        </Link>
                        {categories.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setMobileCatOpen((v) => !v)}
                            className="p-3 -mr-2 text-neutral-500 hover:text-white transition-colors flex items-center"
                            aria-label="Desplegar categorías"
                          >
                            <ChevronDown
                              className={`size-4 transition-transform duration-200 ${
                                mobileCatOpen ? "rotate-180 text-white" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {mobileCatOpen && categories.length > 0 && (
                        <div className="mb-2.5 ml-6 pl-3.5 border-l border-white/10 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                          {categories.map((c: any) => (
                            <Link
                              key={c.id}
                              to={`/categorias/${c.id}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center justify-between py-2 px-2 rounded-lg text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                              activeProps={{
                                className:
                                  "flex items-center justify-between py-2 px-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.15em] text-white bg-white/[0.06]",
                              }}
                            >
                              <span>{c.name}</span>
                              <ChevronRight className="size-3.5 text-neutral-600" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.to === "/" }}
                    className="flex items-center justify-between py-3.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-neutral-300 hover:text-white transition-colors group"
                    activeProps={{
                      className:
                        "flex items-center justify-between py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white",
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-0.5 h-3.5 rounded-full transition-colors ${
                              isActive ? "bg-primary" : "bg-transparent"
                            }`}
                          />
                          <Icon
                            className={`size-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-neutral-500 group-hover:text-neutral-300"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight
                          className={`size-3.5 transition-transform ${
                            isActive
                              ? "text-neutral-300"
                              : "text-neutral-600 group-hover:translate-x-0.5"
                          }`}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Subtle minimal footer row inside mobile menu */}
            <div className="px-4 py-2.5 bg-black/25 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Auspicia
                </span>
                <div className="w-10 h-6 rounded overflow-hidden border border-white/10 bg-black/40">
                  <img
                    src={ads[currentAdIndex].image}
                    alt={ads[currentAdIndex].name}
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="size-7 rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Facebook className="size-3.5" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="size-7 rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Instagram className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}

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
                      <span className="size-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15] animate-pulse" />
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
