import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/categorias/")({
  component: Page,
  head: () => ({ meta: [{ title: "Categorías — La Superliga" }] }),
});

function Page() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/categories/")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-6 py-20 flex-1">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Torneo</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-3">Categorías</h1>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="text-muted-foreground">Cargando categorías...</div>
          ) : (
            categories.map((c: any) => (
              <Link 
                key={c.id} 
                to={`/categorias/${c.id}`}
                className="bg-surface border border-border/60 p-6 hover:border-primary transition-colors flex flex-col items-start group"
              >
                <span className="inline-block bg-tag text-tag-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {c.name}
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase group-hover:text-primary transition-colors">{c.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Ver información, estadísticas y tablas de la categoría.</p>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
