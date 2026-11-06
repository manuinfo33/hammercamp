import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { API_URL } from "@/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/galerias")({
  component: Page,
  head: () => ({ meta: [{ title: "Galerías — La Superliga" }] }),
});

function Page() {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/gallery-images/?is_active=true`)
      .then((res) => res.json())
      .then((data) => {
        setGalleryImages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching gallery images:", err);
        setLoading(false);
      });
  }, []);

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

        {loading ? (
          <div className="mt-6 sm:mt-10 grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl sm:rounded-2xl border border-border/40 bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="mt-8 bg-surface rounded-2xl border border-border/70 p-8 text-center text-muted-foreground text-sm">
            Todavía no hay imágenes publicadas en la galería.
          </div>
        ) : (
          <div className="mt-6 sm:mt-10 grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
            {galleryImages.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-xl sm:rounded-2xl border border-border/40 shadow-xs overflow-hidden group bg-surface"
              >
                <img
                  src={item.image}
                  alt={item.title || "Galería"}
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
