import { API_URL, BACKEND_URL, getMediaUrl } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ChevronRight, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/categorias/")({
  component: Page,
  head: () => ({ meta: [{ title: "Categorías — La Superliga" }] }),
});

function Page() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/categories/")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
              Torneo
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
              Categorías
            </h1>
          </div>
        </div>

        <div className="mt-6 sm:mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {loading ? (
            <div className="text-muted-foreground text-sm py-8">
              Cargando categorías...
            </div>
          ) : (
            categories.map((c: any) => (
              <Link
                key={c.id}
                to={`/categorias/${c.id}`}
                className="bg-surface rounded-2xl border border-border/70 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary/60 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-tag text-tag-foreground text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-primary-foreground shadow-xs transition-colors">
                      <Trophy className="size-3" />
                      {c.name}
                    </span>
                    <span className="size-8 rounded-xl bg-surface-elevated/80 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-all">
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold uppercase group-hover:text-primary transition-colors">
                    {c.name}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Ver información, fixture, estadísticas y tablas de posiciones de la categoría.
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
