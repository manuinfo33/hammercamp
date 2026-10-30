import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/publicitar")({
  component: Page,
  head: () => ({ meta: [{ title: "Publicitar — La Superliga" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
            <div>
              <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
                Sponsors
              </p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
                Publicitar
              </h1>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 bg-surface rounded-2xl border border-border/70 p-5 sm:p-8 shadow-xs">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Llegá a miles de jugadores y familias del fútbol amateur con tu marca
              en nuestras canchas, sitio web y redes sociales. Escribinos y armamos
              el plan ideal para vos.
            </p>
            <a
              href="mailto:publicidad@lasuperliga.com.ar"
              className="mt-6 inline-flex items-center justify-center w-full sm:w-auto bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs px-6 py-3.5 rounded-xl hover:brightness-110 shadow-xs transition-all"
            >
              Quiero publicitar
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
