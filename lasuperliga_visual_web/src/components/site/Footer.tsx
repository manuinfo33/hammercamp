import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import logo from "@/assets/logo-superliga.png";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border/60 mt-20">
      <div className="container mx-auto px-6 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="La Superliga" width={48} height={48} className="size-12 object-contain" />
            <div className="font-display text-2xl font-bold uppercase leading-tight text-white">
              La <span className="text-primary">Superliga</span>
              <div className="text-[10px] tracking-[0.35em] text-primary/80 font-semibold mt-0.5">Torneos</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            La Superliga — torneos de fútbol amateur F11 y F7. Resultados,
            fechas y todas las novedades de cada categoría.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" className="size-9 grid place-items-center border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Facebook">
              <Facebook className="size-4" />
            </a>
            <a href="#" className="size-9 grid place-items-center border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Instagram">
              <Instagram className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Secciones</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Inicio</Link></li>
            <li><Link to="/nosotros" className="hover:text-foreground">Nosotros</Link></li>
            <li><Link to="/categorias" className="hover:text-foreground">Categorías</Link></li>
            <li><Link to="/galerias" className="hover:text-foreground">Galerías</Link></li>
            <li><Link to="/contacto" className="hover:text-foreground">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Contacto</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3"><MapPin className="size-4 mt-0.5 text-primary" /><span>Av. del Deporte 3600, La Plata</span></li>
            <li className="flex items-center gap-3"><Phone className="size-4 text-primary" /><span>+54 221 555-1736</span></li>
            <li className="flex items-center gap-3"><Mail className="size-4 text-primary" /><span>info@lasuperliga.com.ar</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto px-6 py-5 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <span>© {new Date().getFullYear()} La Superliga Torneos. Todos los derechos reservados.</span>
          <span>Hecho con pasión por el fútbol amateur.</span>
        </div>
      </div>
    </footer>
  );
}
