import { Link } from "@tanstack/react-router";
import { Search, Facebook, Instagram, Menu, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-superliga.png";
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

        <div className="hidden md:flex flex-1 max-w-md ml-auto">
          <div className="flex w-full items-center bg-background/40 border border-border rounded-sm overflow-hidden">
            <input
              type="search"
              placeholder="Ingresar su búsqueda acá…"
              className="flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/60 outline-none"
            />
            <button className="px-4 py-3 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              <Search className="size-4" />
            </button>
          </div>
        </div>

        <button
          className="md:hidden p-2 border border-border rounded-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* main nav */}
      <nav className="bg-surface border-t border-border/60 relative z-40">
        <div className="container mx-auto px-6 flex items-center">
          <ul className={`${open ? "flex" : "hidden"} md:flex flex-col md:flex-row w-full md:w-auto items-stretch md:items-center gap-0 md:gap-1`}>
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
                    <div className="absolute top-full left-0 min-w-[220px] bg-surface-elevated border border-border/60 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
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
                        "block px-6 py-5 text-xs font-bold uppercase tracking-[0.18em] bg-primary text-primary-foreground clip-tab",
                    }}
                  >
                    {item.label}
                  </Link>
                )}
                {i < nav.length - 1 && (
                  <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-border" />
                )}
              </li>
            ))}
          </ul>
          <div className="ml-auto hidden md:flex items-center gap-3 pl-6">
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook className="size-4" />
            </a>
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="size-4" />
            </a>
            <div className="w-px h-4 bg-border mx-1" />
            <button 
              onClick={() => setIsLoginOpen(true)}
              aria-label="Login" 
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <User className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Acceso</span>
            </button>
          </div>
        </div>
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}

