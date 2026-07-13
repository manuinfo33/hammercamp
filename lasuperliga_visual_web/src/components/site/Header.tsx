import { Link } from "@tanstack/react-router";
import { Search, Facebook, Instagram, Menu, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-superliga.png";
import adNike from "@/assets/ad-nike.png";
import adAdidas from "@/assets/ad-adidas.png";
import adCocacola from "@/assets/ad-cocacola.png";
import { LoginModal } from "./LoginModal";

const nav = [
  { label: "Inicio", to: "/" },
  { label: "Nosotros", to: "/nosotros" },
  { label: "Categorías", to: "/categorias" },
  { label: "Galerías", to: "/galerias" },
  { label: "Publicitar", to: "/publicitar" },
  { label: "Contacto", to: "/contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState<any>(null);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [desktopUserMenuOpen, setDesktopUserMenuOpen] = useState(false);

  const ads = [
    { id: 1, image: adNike, name: "Nike" },
    { id: 2, image: adAdidas, name: "Adidas" },
    { id: 3, image: adCocacola, name: "Coca Cola" }
  ];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const displayName = user ? (user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username) : "";

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
    fetch("http://127.0.0.1:8000/api/categories/")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  return (
    <header className="bg-surface text-foreground relative z-50">
      {/* top categories strip */}
      <div className="hidden lg:block border-b border-border/60 relative z-50">
        <div className="container mx-auto px-6 flex items-center justify-end gap-1 text-[11px] uppercase tracking-[0.18em] font-semibold py-3">
          <Link to="/categorias" className="text-primary hover:text-primary/80 px-3 underline-offset-4 underline decoration-primary/60">
            Categorías
          </Link>
          {categories.map((c) => (
            <span key={c.id} className="flex items-center gap-1">
              <span className="text-muted-foreground/40">/</span>
              <Link to={`/categorias/${c.id}`} className="px-3 hover:text-primary transition-colors">
                {c.name}
              </Link>
            </span>
          ))}
        </div>
      </div>

      {/* logo + search */}
      <div className="container mx-auto px-6 py-6 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="La Superliga Torneos" width={56} height={56} className="size-12 md:size-14 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl md:text-3xl font-bold tracking-tight uppercase">
              La <span className="text-primary">Superliga</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mt-1">Torneos</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* Mini Ads Carousel */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Auspicia:</span>
            <div className="w-[75px] h-[56px] relative overflow-hidden border border-border/30 rounded-sm bg-surface/30 flex items-center justify-center p-0">
              <img
                src={ads[currentAdIndex].image}
                alt={ads[currentAdIndex].name}
                className="w-full h-full object-cover animate-in fade-in duration-500"
                key={ads[currentAdIndex].id}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="#" aria-label="Facebook" className="p-2 border border-border/40 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center">
              <Facebook className="size-5" />
            </a>
            <a href="#" aria-label="Instagram" className="p-2 border border-border/40 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center">
              <Instagram className="size-5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <div className="relative">
              <button
                className="p-2 border border-border rounded-sm text-primary flex items-center justify-center"
                onClick={() => setMobileUserMenuOpen((v) => !v)}
                aria-label="User Menu"
              >
                <User className="size-5" />
              </button>
              {mobileUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border/60 shadow-xl z-50 text-foreground py-2 text-xs font-bold uppercase tracking-[0.15em] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/40 text-xs font-bold text-primary uppercase tracking-[0.15em] lowercase first-letter:uppercase">
                    Hola {displayName}
                  </div>
                  <button
                    onClick={() => {
                      setMobileUserMenuOpen(false);
                      alert(`Cuenta de Delegado:\nNombre: ${user.first_name} ${user.last_name}\nUsuario: ${user.username}`);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    Mi Cuenta
                  </button>
                  {user.role === "Delegado" && (
                    <Link
                      to="/mi-equipo"
                      onClick={() => setMobileUserMenuOpen(false)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                      activeProps={{
                        className: "w-full text-left px-4 py-3 bg-primary/10 text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em]"
                      }}
                    >
                      Mi Equipo
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors block border-t border-border/40 text-xs font-bold uppercase tracking-[0.15em]"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="p-2 border border-border rounded-sm text-muted-foreground flex items-center justify-center"
              onClick={() => setIsLoginOpen(true)}
              aria-label="Acceso"
            >
              <User className="size-5" />
            </button>
          )}

          <button
            className="p-2 border border-border rounded-sm flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* main nav */}
      <nav className="bg-surface border-t border-border/60 relative z-40">
        <div className="container mx-auto px-6 flex items-center">
          <ul className={`${open ? "flex" : "hidden"} md:flex flex-col md:flex-row w-full md:w-auto items-stretch md:items-center gap-0 md:gap-1`}>
            {(() => {
              const menuItems = [...nav];
              return menuItems.map((item, i) => (
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
                          {categories.map((c) => (
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
                      className="block px-6 py-5 text-xs font-bold uppercase tracking-[0.18em] hover:text-primary transition-colors"
                      activeProps={{
                        className:
                          "block px-6 py-5 text-xs font-bold uppercase tracking-[0.18em] bg-primary text-primary-foreground clip-tab hover:text-primary-foreground",
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                  {i < menuItems.length - 1 && (
                    <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-border" />
                  )}
                </li>
              ));
            })()}
          </ul>
          <div className="ml-auto hidden md:flex items-center gap-3 pl-6">
            {user ? (
              <div className="relative group">
                <button 
                  className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer bg-transparent border-0 p-0"
                >
                  <User className="size-3.5" />
                  Hola {displayName}
                  <ChevronDown className="size-3 opacity-50 transition-transform group-hover:rotate-180 duration-200" />
                </button>
                <div className="absolute right-0 top-full mt-3 w-48 bg-surface-elevated border border-border/60 shadow-xl z-50 text-foreground py-2 text-xs font-bold uppercase tracking-[0.15em] rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={() => {
                      alert(`Cuenta de Delegado:\nNombre: ${user.first_name} ${user.last_name}\nUsuario: ${user.username}`);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    Mi Cuenta
                  </button>
                  {user.role === "Delegado" && (
                    <Link
                      to="/mi-equipo"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
                      activeProps={{
                        className: "w-full text-left px-4 py-3 bg-primary/10 text-primary transition-colors block text-xs font-bold uppercase tracking-[0.15em]"
                      }}
                    >
                      Mi Equipo
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
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Acceso</span>
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

