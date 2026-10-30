import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MapPin, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  component: Page,
  head: () => ({ meta: [{ title: "Contacto — La Superliga" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1 grid md:grid-cols-2 gap-6 sm:gap-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
            <div>
              <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
                Hablemos
              </p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
                Contacto
              </h1>
            </div>
          </div>
          <ul className="mt-6 sm:mt-8 space-y-3.5 text-sm sm:text-base text-muted-foreground bg-surface md:bg-transparent p-4 md:p-0 rounded-2xl border border-border/60 md:border-0">
            <li className="flex items-start gap-3">
              <MapPin className="size-5 text-primary mt-0.5 shrink-0" />
              <span>Av. del Deporte 3600, La Plata</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-5 text-primary shrink-0" />
              <span>+54 221 555-1736</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-5 text-primary shrink-0" />
              <span>info@lasuperliga.com.ar</span>
            </li>
          </ul>
        </div>
        <form className="bg-surface rounded-2xl border border-border/70 p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-xs">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Nombre
            </label>
            <input className="mt-1.5 w-full bg-background/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              className="mt-1.5 w-full bg-background/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              Mensaje
            </label>
            <textarea
              rows={4}
              className="mt-1.5 w-full bg-background/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button
            type="button"
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs py-3.5 rounded-xl hover:brightness-110 shadow-xs transition-all cursor-pointer"
          >
            Enviar mensaje
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
