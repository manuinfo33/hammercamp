import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const fixtures = [
  { home: "Tolosa", away: "Azulado", date: "Sáb 16/05", time: "15:00", field: "Cancha 1", category: "Primera A" },
  { home: "Borussia", away: "Villa Lenci", date: "Sáb 16/05", time: "16:30", field: "Cancha 2", category: "Senior C" },
  { home: "Criba", away: "Pelusa", date: "Sáb 16/05", time: "18:00", field: "Cancha 1", category: "Senior B" },
  { home: "Quilmes", away: "Criadores", date: "Dom 17/05", time: "10:00", field: "Cancha 3", category: "Senior A" },
];

function Index() {
  const [filter, setFilter] = useState("Todas");
  const [carouselImages, setCarouselImages] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/carousel-images/?is_active=true")
      .then(res => res.json())
      .then(data => {
        setCarouselImages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching carousel:", err);
        setLoading(false);
      });

    fetch("http://127.0.0.1:8000/api/news/")
      .then(res => res.json())
      .then(data => setNewsList(data))
      .catch(err => console.error("Error fetching news:", err));

    fetch("http://127.0.0.1:8000/api/categories/")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const filters = ["Todas", ...categories.map(c => c.name)];

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const filtered = newsList.filter((n) =>
    filter === "Todas" ? true : n.category.startsWith(filter),
  );

  // If we have API images, use the current one.
  const activeImage = carouselImages.length > 0 ? carouselImages[currentSlide] : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* HERO / CAROUSEL */}
      {(loading || carouselImages.length > 0) && (
        <section className="relative">
          <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-black">
            {loading ? (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <img
                  src={activeImage.image}
                  alt={activeImage.title || "Superliga"}
                  className="absolute inset-0 size-full object-cover animate-in fade-in duration-700"
                  key={activeImage.id}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1c1d1f]/40 via-[#1c1d1f]/30 to-[#1c1d1f]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1c1d1f]/70 via-transparent to-[#1c1d1f]/50" />

                <div className="relative container mx-auto h-full px-6 flex flex-col justify-center items-center text-center">
                  <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-bold uppercase max-w-4xl text-shadow-hero text-white animate-in slide-in-from-bottom-4 duration-700">
                    {activeImage.title || "LA SUPERLIGA"}
                  </h1>
                </div>

                {/* slider arrows */}
                {carouselImages.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-8 md:left-20 top-1/2 -translate-y-1/2 size-12 grid place-items-center bg-neutral-800/70 text-white hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm rounded-full" aria-label="Anterior">
                      <ChevronLeft className="size-6" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-8 md:right-20 top-1/2 -translate-y-1/2 size-12 grid place-items-center bg-neutral-800/70 text-white hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm rounded-full" aria-label="Siguiente">
                      <ChevronRight className="size-6" />
                    </button>
                  </>
                )}
                
                {/* slider dots */}
                {carouselImages.length > 1 && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`size-2.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-primary' : 'bg-white/40 hover:bg-white/70'}`}
                        aria-label={`Ir a la diapositiva ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* MAIN GRID */}
      <section className="container mx-auto px-6 py-16 grid lg:grid-cols-[1fr_360px] gap-10">
        {/* News column */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Sección</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase">Noticias</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-surface-elevated/60 p-1 rounded-full border border-border/40">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] uppercase tracking-[0.16em] font-bold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map((n) => (
              <article
                key={n.id}
                className="group bg-surface rounded-2xl border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-tag text-tag-foreground text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-md backdrop-blur-xs">
                    {n.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-bold uppercase leading-tight group-hover:text-primary transition-colors">
                    {n.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
                    {n.excerpt}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Calendar className="size-3 text-primary" />
                    {formatDate(n.date)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="bg-surface rounded-2xl border border-border/70 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3 bg-surface-elevated/40">
              <span className="w-1.5 h-6 bg-primary rounded-full inline-block shadow-sm" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Próxima</p>
                <h3 className="font-display text-2xl font-bold uppercase">Siguiente fecha</h3>
              </div>
            </div>
            <ul className="divide-y divide-border/60">
              {fixtures.map((f, i) => (
                <li key={i} className="px-5 py-4 hover:bg-surface-elevated/30 transition-colors">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-tag font-bold mb-2">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">{f.category}</span>
                    <span className="text-muted-foreground">{f.field}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-lg font-semibold flex-1 text-right truncate">{f.home}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-xs">VS</span>
                    <span className="font-display text-lg font-semibold flex-1 truncate">{f.away}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md"><Calendar className="size-3 text-primary" />{f.date}</span>
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md"><Clock className="size-3 text-primary" />{f.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative bg-surface rounded-2xl border border-border/70 p-6 overflow-hidden shadow-sm">
            <div className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Complejo</p>
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold uppercase">Vení a jugar</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Reservá tu cancha de fútbol 5, 7 o 11. Césped sintético de última
              generación e iluminación profesional para jugar a cualquier hora.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span>Av. del Deporte 3600 — La Plata</span>
            </div>
            <Link
              to="/contacto"
              className="mt-5 inline-flex items-center justify-center w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs py-3 rounded-xl hover:brightness-110 shadow-sm transition-all duration-200"
            >
              Reservar cancha
            </Link>
          </div>
        </aside>
      </section>

      <Footer />
    </div>
  );
}
