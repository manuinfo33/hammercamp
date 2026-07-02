import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/nosotros")({
  component: Page,
  head: () => ({ meta: [{ title: "Nosotros — Cancha 7" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-20 flex-1">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">El complejo</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-3">Nosotros</h1>
        <div className="mt-8 max-w-3xl text-muted-foreground space-y-5 text-base leading-relaxed">
          <p>
            Cancha 7 es un complejo deportivo dedicado al fútbol amateur desde 2008.
            Organizamos torneos en distintas categorías y abrimos las puertas a
            equipos de toda la región.
          </p>
          <p>
            Contamos con canchas de césped sintético de última generación,
            iluminación profesional, vestuarios, buffet y estacionamiento propio.
          </p>
          <p>
            Nuestra pasión es el juego: que cada jugador, sin importar la edad o
            el nivel, tenga la mejor experiencia dentro y fuera de la cancha.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
