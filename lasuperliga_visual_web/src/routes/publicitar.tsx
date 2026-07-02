import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/publicitar")({
  component: Page,
  head: () => ({ meta: [{ title: "Publicitar — Cancha 7" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-20 flex-1 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Sponsors</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-3">Publicitar</h1>
        <p className="mt-6 text-muted-foreground">
          Llegá a miles de jugadores y familias del fútbol amateur con tu marca
          en nuestras canchas, sitio web y redes sociales. Escribinos y armamos
          el plan ideal para vos.
        </p>
        <a
          href="mailto:publicidad@cancha7.com.ar"
          className="mt-8 inline-flex items-center bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs px-6 py-3 hover:brightness-110 transition"
        >
          Quiero publicitar
        </a>
      </main>
      <Footer />
    </div>
  );
}
