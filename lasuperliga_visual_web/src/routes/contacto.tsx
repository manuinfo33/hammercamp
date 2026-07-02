import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MapPin, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  component: Page,
  head: () => ({ meta: [{ title: "Contacto — Cancha 7" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-20 flex-1 grid md:grid-cols-2 gap-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Hablemos</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-3">Contacto</h1>
          <ul className="mt-8 space-y-4 text-muted-foreground">
            <li className="flex items-start gap-3"><MapPin className="size-5 text-primary mt-0.5" /> Av. del Deporte 3600, La Plata</li>
            <li className="flex items-center gap-3"><Phone className="size-5 text-primary" /> +54 221 555-1736</li>
            <li className="flex items-center gap-3"><Mail className="size-5 text-primary" /> info@cancha7.com.ar</li>
          </ul>
        </div>
        <form className="bg-surface border border-border/60 p-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Nombre</label>
            <input className="mt-1 w-full bg-background/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Email</label>
            <input type="email" className="mt-1 w-full bg-background/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Mensaje</label>
            <textarea rows={5} className="mt-1 w-full bg-background/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <button type="button" className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs py-3 hover:brightness-110 transition">
            Enviar mensaje
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
