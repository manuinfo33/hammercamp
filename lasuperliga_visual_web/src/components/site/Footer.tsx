import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { useBranding } from "@/lib/branding";

export function Footer() {
  const {
    logoSrc: logo,
    brandName,
    brandLead,
    brandAccent,
    contactAddress,
    contactPhone,
    contactEmail,
  } = useBranding();

  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border/60 mt-6 md:mt-20">
      {/* =========================================================
          VISTA MOBILE (< 768px): Compacta y minimalista tipo App
          ========================================================= */}
      <div className="md:hidden container mx-auto px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src={logo}
              alt={brandName}
              width={32}
              height={32}
              className="size-8 object-contain shrink-0"
            />
            <div className="leading-none truncate">
              <div className="font-display text-base font-bold uppercase text-white tracking-tight truncate">
                {brandLead}
                {brandLead ? " " : ""}
                <span className="text-primary">{brandAccent}</span>
              </div>
              <div className="text-[8.5px] uppercase tracking-[0.28em] text-primary/80 font-semibold mt-0.5">
                Torneos
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                className="size-8 grid place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 active:scale-95 transition"
                aria-label="Teléfono"
                title={contactPhone}
              >
                <Phone className="size-3.5 text-primary" />
              </a>
            )}
            <a
              href="#"
              className="size-8 grid place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 active:scale-95 transition"
              aria-label="Instagram"
            >
              <Instagram className="size-3.5" />
            </a>
            <a
              href="#"
              className="size-8 grid place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 active:scale-95 transition"
              aria-label="Facebook"
            >
              <Facebook className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.07] text-[10.5px] text-neutral-400">
          <span className="truncate">
            © {year} {brandName}
          </span>
          {contactAddress ? (
            <span className="inline-flex items-center gap-1 text-neutral-400 truncate max-w-[55%]">
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate">{contactAddress}</span>
            </span>
          ) : (
            <span className="text-neutral-500">App Oficial</span>
          )}
        </div>
      </div>

      {/* =========================================================
          VISTA DESKTOP (>= 768px): Footer completo original
          ========================================================= */}
      <div className="hidden md:block">
        <div className="container mx-auto px-6 py-14 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt={brandName}
                width={48}
                height={48}
                className="size-12 object-contain"
              />
              <div className="font-display text-2xl font-bold uppercase leading-tight text-white">
                {brandLead}
                {brandLead ? " " : ""}
                <span className="text-primary">{brandAccent}</span>
                <div className="text-[10px] tracking-[0.35em] text-primary/80 font-semibold mt-0.5">
                  Torneos
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
              {brandName} — torneos de fútbol amateur F11 y F7. Resultados,
              fechas y todas las novedades de cada categoría.
            </p>
            <div className="flex gap-2.5 mt-4">
              <a
                href="#"
                className="size-9 grid place-items-center border border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                className="size-9 grid place-items-center border border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Secciones
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-foreground">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="hover:text-foreground">
                  Categorías
                </Link>
              </li>
              <li>
                <Link to="/galerias" className="hover:text-foreground">
                  Galerías
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-foreground">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              Contacto
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {contactAddress && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                  <span>{contactAddress}</span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 text-primary shrink-0" />
                  <span>{contactPhone}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-primary shrink-0" />
                  <span className="break-all">{contactEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="container mx-auto px-6 py-4 text-xs text-muted-foreground flex flex-row gap-1.5 justify-between text-left">
            <span>
              © {year} {brandName} Torneos. Todos los derechos reservados.
            </span>
            <span>Hecho con pasión por el fútbol amateur.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
