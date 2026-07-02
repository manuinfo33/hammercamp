import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { news } from "@/lib/news";

export const Route = createFileRoute("/galerias")({
  component: Page,
  head: () => ({ meta: [{ title: "Galerías — Cancha 7" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-20 flex-1">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Imágenes</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-3">Galerías</h1>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...news, ...news].map((n, i) => (
            <div key={i} className="aspect-square overflow-hidden group">
              <img src={n.image} alt={n.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
