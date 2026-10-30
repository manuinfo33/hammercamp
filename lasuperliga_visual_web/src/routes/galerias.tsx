import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { news } from "@/lib/news";

export const Route = createFileRoute("/galerias")({
  component: Page,
  head: () => ({ meta: [{ title: "Galerías — La Superliga" }] }),
});

function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
              Imágenes
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
              Galerías
            </h1>
          </div>
        </div>
        <div className="mt-6 sm:mt-10 grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
          {[...news, ...news].map((n, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl sm:rounded-2xl border border-border/40 shadow-xs overflow-hidden group"
            >
              <img
                src={n.image}
                alt={n.title}
                loading="lazy"
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
