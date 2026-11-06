import { useBranding } from "@/lib/branding";
import { API_URL } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  Pin,
  X,
  Shield,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const NEWS_PER_PAGE = 4;

interface WeatherDay {
  date: string;
  dayLabel: string;
  dayNum: string;
  code: number;
  maxTemp: number;
  minTemp: number;
  rainProb: number;
}

interface CurrentWeather {
  temp: number;
  code: number;
}

function getWeatherMeta(code: number) {
  if (code === 0) {
    return { label: "Despejado", Icon: Sun, iconColor: "#d97706" };
  }
  if (code === 1 || code === 2) {
    return { label: "Algo nublado", Icon: CloudSun, iconColor: "#b45309" };
  }
  if (code === 3 || (code >= 45 && code <= 48)) {
    return { label: "Nublado", Icon: Cloud, iconColor: "#52525b" };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: "Lluvias", Icon: CloudRain, iconColor: "#2563eb" };
  }
  if (code >= 95) {
    return { label: "Tormenta", Icon: CloudLightning, iconColor: "#4f46e5" };
  }
  return { label: "Templado", Icon: CloudSun, iconColor: "#b45309" };
}

function buildFallbackForecast(): { current: CurrentWeather; days: WeatherDay[] } {
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const presetCodes = [1, 0, 2, 3, 1];
  const presetMax = [23, 25, 22, 19, 24];
  const presetMin = [12, 14, 13, 11, 12];
  const presetRain = [10, 5, 20, 40, 10];

  const days: WeatherDay[] = Array.from({ length: 5 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const iso = d.toISOString().slice(0, 10);
    return {
      date: iso,
      dayLabel: idx === 0 ? "Hoy" : dayNames[d.getDay()],
      dayNum: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      code: presetCodes[idx % presetCodes.length],
      maxTemp: presetMax[idx % presetMax.length],
      minTemp: presetMin[idx % presetMin.length],
      rainProb: presetRain[idx % presetRain.length],
    };
  });

  return {
    current: { temp: 22, code: 1 },
    days,
  };
}

function Index() {
  const { brandName, contactAddress } = useBranding();
  const [filter, setFilter] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Torneos y Fechas
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [roundsByTournament, setRoundsByTournament] = useState<Record<number, any[]>>({});
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Clima próximos días
  const fallbackWeather = useMemo(() => buildFallbackForecast(), []);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>(fallbackWeather.current);
  const [forecastDays, setForecastDays] = useState<WeatherDay[]>(fallbackWeather.days);

  useEffect(() => {
    fetch(`${API_URL}/carousel-images/?is_active=true`)
      .then((res) => res.json())
      .then((data) => {
        setCarouselImages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching carousel:", err);
        setLoading(false);
      });

    fetch(`${API_URL}/news/`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)),
        );
        setNewsList(sorted);
      })
      .catch((err) => console.error("Error fetching news:", err));

    fetch(`${API_URL}/categories/`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));

    fetch(`${API_URL}/tournaments/`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const activeList = list.filter((t) => t.is_active !== false);
        const finalTournaments = activeList.length > 0 ? activeList : list;
        setTournaments(finalTournaments);
        if (finalTournaments.length > 0) {
          setSelectedTournamentId(finalTournaments[0].id);
        }
      })
      .catch((err) => console.error("Error fetching tournaments:", err));

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-34.9214&longitude=-57.9544&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=5",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.current) {
          setCurrentWeather({
            temp: Math.round(data.current.temperature_2m ?? 22),
            code: data.current.weather_code ?? 1,
          });
        }
        if (data?.daily?.time?.length) {
          const parsed: WeatherDay[] = data.daily.time
            .slice(0, 5)
            .map((dateStr: string, idx: number) => {
              const [y, m, d] = dateStr.split("-").map(Number);
              const dateObj = new Date(y, m - 1, d);
              return {
                date: dateStr,
                dayLabel: idx === 0 ? "Hoy" : dayNames[dateObj.getDay()],
                dayNum: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
                code: data.daily.weather_code?.[idx] ?? 1,
                maxTemp: Math.round(data.daily.temperature_2m_max?.[idx] ?? 22),
                minTemp: Math.round(data.daily.temperature_2m_min?.[idx] ?? 12),
                rainProb: Math.round(data.daily.precipitation_probability_max?.[idx] ?? 0),
              };
            });
          setForecastDays(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedTournamentId) || null,
    [tournaments, selectedTournamentId],
  );

  // Cargar fechas de todas las zonas del torneo seleccionado
  useEffect(() => {
    if (!selectedTournament) return;
    const tId = selectedTournament.id;
    if (roundsByTournament[tId]) return;

    let cancelled = false;
    async function fetchTournamentRounds() {
      setLoadingRounds(true);
      try {
        const zones = selectedTournament.zones || [];
        const logoMap: Record<string | number, string> = {};
        zones.forEach((z: any) => {
          (z.zone_teams || []).forEach((zt: any) => {
            if (zt.team_logo) {
              logoMap[zt.team] = zt.team_logo;
              logoMap[zt.team_name] = zt.team_logo;
            }
          });
        });

        const zoneResponses = await Promise.all(
          zones.map(async (z: any) => {
            const res = await fetch(`${API_URL}/match-rounds/?tournament_zone=${z.id}`);
            const data = await res.json();
            return { zoneName: z.name, rounds: Array.isArray(data) ? data : [] };
          }),
        );

        const roundMap = new Map<string, any>();
        zoneResponses.forEach(({ zoneName, rounds }) => {
          rounds.forEach((r: any) => {
            const key = r.name?.trim().toLowerCase() || `order_${r.order}`;
            const enrichedMatches = (r.matches || []).map((m: any) => ({
              ...m,
              zone_name: zoneName,
              date: m.date || r.date || null,
              time: m.time || r.time || null,
              local_logo:
                m.local_team_logo ||
                logoMap[m.local_team] ||
                logoMap[m.local_team_name] ||
                null,
              visitor_logo:
                m.visitor_team_logo ||
                logoMap[m.visitor_team] ||
                logoMap[m.visitor_team_name] ||
                null,
            }));

            if (!roundMap.has(key)) {
              roundMap.set(key, {
                id: r.id,
                name: r.name,
                order: r.order || 0,
                date: r.date || null,
                time: r.time || null,
                matches: [...enrichedMatches],
              });
            } else {
              const existing = roundMap.get(key)!;
              if (!existing.date && r.date) existing.date = r.date;
              if (!existing.time && r.time) existing.time = r.time;
              existing.matches.push(...enrichedMatches);
            }
          });
        });

        const unified = Array.from(roundMap.values()).sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        );

        if (!cancelled) {
          setRoundsByTournament((prev) => ({ ...prev, [tId]: unified }));
        }
      } catch (e) {
        console.error("Error fetching tournament rounds:", e);
      } finally {
        if (!cancelled) setLoadingRounds(false);
      }
    }

    fetchTournamentRounds();
    return () => {
      cancelled = true;
    };
  }, [selectedTournament, roundsByTournament]);

  // Determinar automáticamente la fecha más cercana (o con últimos resultados) del torneo
  const closestRound = useMemo(() => {
    const rounds = selectedTournamentId ? roundsByTournament[selectedTournamentId] || [] : [];
    if (!rounds.length) return null;

    const todayMs = new Date().setHours(0, 0, 0, 0);
    let bestRound = rounds[0];
    let bestDiff = Number.POSITIVE_INFINITY;
    let foundDatedOrPlayed = false;

    rounds.forEach((r) => {
      const roundDateStr = r.date || r.matches?.find((m: any) => m.date)?.date || null;
      const hasPlayed = r.matches?.some((m: any) => m.played);

      if (roundDateStr) {
        const [y, m, d] = roundDateStr.split("-").map(Number);
        const rMs = new Date(y, m - 1, d).getTime();
        const diff = Math.abs(rMs - todayMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestRound = r;
          foundDatedOrPlayed = true;
        }
      } else if (hasPlayed && !foundDatedOrPlayed) {
        bestRound = r;
        foundDatedOrPlayed = true;
      }
    });

    return bestRound;
  }, [selectedTournamentId, roundsByTournament]);

  // Ordenar los partidos de la fecha por zona (primera zona arriba, siguientes abajo) sin discriminar con títulos de zona
  const roundMatches = useMemo(() => {
    if (!closestRound?.matches?.length) return [];
    const groups: { zoneName: string; matches: any[] }[] = [];
    const map = new Map<string, any[]>();

    closestRound.matches.forEach((m: any) => {
      const z = m.zone_name || "General";
      if (!map.has(z)) {
        const arr: any[] = [];
        map.set(z, arr);
        groups.push({ zoneName: z, matches: arr });
      }
      map.get(z)!.push(m);
    });

    return groups.flatMap((g) => g.matches);
  }, [closestRound]);

  const formatCanchaLabel = (val: any) => {
    if (!val || !String(val).trim()) return null;
    const clean = String(val).trim().replace(/^cancha\s*:?\s*/i, "");
    return `Cancha: ${clean || String(val).trim()}`;
  };

  useEffect(() => {
    if (!selectedNews) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNews(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedNews]);

  const filters = ["Todas", ...categories.map((c) => c.name)];

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / NEWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNews = filtered.slice(
    (safePage - 1) * NEWS_PER_PAGE,
    safePage * NEWS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === safePage) return;
    setCurrentPage(page);
    const sectionEl = document.getElementById("noticias-section");
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeImage = carouselImages.length > 0 ? carouselImages[currentSlide] : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatRoundDate = (dateString: string | null) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatTournamentLabel = (t: any) => {
    if (!t) return "";
    if (t.category_name && !t.name.toLowerCase().includes(t.category_name.toLowerCase())) {
      return `${t.category_name} · ${t.name}`;
    }
    return t.name;
  };

  const currentWeatherMeta = getWeatherMeta(currentWeather.code);
  const CurrentWeatherIcon = currentWeatherMeta.Icon;
  const roundDateStr =
    closestRound?.date || closestRound?.matches?.find((m: any) => m.date)?.date || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* HERO / CAROUSEL */}
      {(loading || carouselImages.length > 0) && (
        <section className="relative">
          <div className="relative h-[48vh] min-h-[350px] sm:h-[58vh] md:h-[78vh] md:min-h-[560px] w-full overflow-hidden bg-black">
            {loading ? (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <img
                  src={activeImage.image}
                  alt={activeImage.title || brandName}
                  className="absolute inset-0 size-full object-cover object-center animate-in fade-in duration-700"
                  key={activeImage.id}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1c1d1f]/40 via-[#1c1d1f]/25 to-[#1c1d1f]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1c1d1f]/65 via-transparent to-[#1c1d1f]/50" />

                <div className="relative container mx-auto h-full px-12 sm:px-16 md:px-6 flex flex-col justify-center items-center text-center">
                  <h1 className="mt-2 md:mt-6 font-display text-2xl sm:text-4xl md:text-7xl lg:text-8xl font-bold uppercase max-w-4xl leading-[1.05] text-shadow-hero text-white animate-in slide-in-from-bottom-4 duration-700">
                    {activeImage.title || brandName.toUpperCase()}
                  </h1>
                </div>

                {/* slider arrows */}
                {carouselImages.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 sm:left-5 md:left-16 top-1/2 -translate-y-1/2 size-7 sm:size-10 md:size-12 grid place-items-center bg-neutral-900/70 text-white hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm rounded-full border border-white/10"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="size-5 md:size-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 sm:right-5 md:right-16 top-1/2 -translate-y-1/2 size-7 sm:size-10 md:size-12 grid place-items-center bg-neutral-900/70 text-white hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm rounded-full border border-white/10"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="size-5 md:size-6" />
                    </button>
                  </>
                )}

                {/* slider dots */}
                {carouselImages.length > 1 && (
                  <div className="absolute bottom-4 sm:bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide
                            ? "w-6 bg-primary"
                            : "w-2 bg-white/45 hover:bg-white/75"
                        }`}
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
      <section className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 md:py-16 grid lg:grid-cols-[1fr_360px] gap-8 md:gap-10">
        {/* News column */}
        <div id="noticias-section" className="min-w-0 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
              <div>
                <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
                  Sección
                </p>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold uppercase leading-none mt-0.5">
                  Noticias
                </h2>
              </div>
            </div>

            {/* Horizontal scrollable filter pills on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full bg-surface-elevated/60 p-1.5 rounded-2xl sm:rounded-full border border-border/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.15em] font-bold px-3.5 py-1.5 rounded-xl sm:rounded-full transition-all duration-200 cursor-pointer ${
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {paginatedNews.map((n) => (
              <article
                key={n.id}
                onClick={() => setSelectedNews(n)}
                className="group bg-surface rounded-2xl border border-border/70 hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-tag text-tag-foreground text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs">
                    {n.category}
                  </span>
                  {n.is_pinned && (
                    <span
                      title="Noticia fijada"
                      className="absolute top-3 right-3 size-7 bg-primary text-primary-foreground rounded-full shadow-md grid place-items-center"
                    >
                      <Pin className="size-3.5 fill-current" />
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase leading-tight group-hover:text-primary transition-colors">
                    {n.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                    {n.excerpt}
                  </p>
                  <div className="mt-3.5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-primary shrink-0" />
                      <span>{formatDate(n.date)}</span>
                    </span>
                    <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                      Ver más →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Paginación centrada debajo de las noticias actuales */}
          {filtered.length > 0 && (
            <nav
              aria-label="Paginación de noticias"
              className="mt-6 sm:mt-8 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap"
            >
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label="Página anterior"
                  className="size-9 sm:size-10 rounded-xl border border-border/70 bg-surface text-foreground hover:border-primary/60 hover:text-primary disabled:opacity-35 disabled:pointer-events-none grid place-items-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                const isActive = page === safePage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    aria-current={isActive ? "page" : undefined}
                    className={`min-w-9 h-9 sm:min-w-10 sm:h-10 px-3 rounded-xl font-display text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs border border-primary"
                        : "bg-surface text-muted-foreground border border-border/70 hover:border-primary/60 hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage === totalPages}
                  aria-label="Página siguiente"
                  className="size-9 sm:size-10 rounded-xl border border-border/70 bg-surface text-foreground hover:border-primary/60 hover:text-primary disabled:opacity-35 disabled:pointer-events-none grid place-items-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </nav>
          )}
        </div>

        {/* ====================================================================
            SIDEBAR SOBRIO Y EDITORIAL
           ==================================================================== */}
        <aside className="space-y-6 min-w-0">
          {/* 1. PRÓXIMA FECHA POR TORNEO */}
          <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            {/* Cabecera limpia con selector de torneo integrado */}
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/70 bg-surface">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-5 bg-primary rounded-full inline-block" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold leading-none">
                      Torneos
                    </p>
                    <h3 className="font-display text-xl font-bold uppercase leading-none mt-1 text-foreground">
                      Próxima Fecha
                    </h3>
                  </div>
                </div>

                {closestRound && (
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[#18181b] text-white px-2.5 py-1 rounded-md shrink-0">
                    {closestRound.name}
                    {roundDateStr ? ` · ${formatRoundDate(roundDateStr).slice(0, 5)}` : ""}
                  </span>
                )}
              </div>

              {/* Único menú desplegable acoplado para elegir el torneo */}
              <div className="relative">
                <select
                  aria-label="Seleccionar torneo"
                  value={selectedTournamentId ?? ""}
                  onChange={(e) => setSelectedTournamentId(Number(e.target.value))}
                  className="w-full appearance-none bg-[#f4f4f5] hover:bg-[#ececef] text-[#18181b] font-semibold text-xs rounded-xl border border-[#e4e4e7] focus:border-[#18181b] focus:outline-none pl-3.5 pr-9 py-2.5 transition-colors cursor-pointer"
                >
                  {tournaments.length === 0 ? (
                    <option value="">Sin torneos disponibles</option>
                  ) : (
                    tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {formatTournamentLabel(t)}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="size-4 text-[#52525b] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Listado unificado de partidos de la fecha más cercana (ordenados por zona, sin títulos de zona ni escudos) */}
            <div>
              {loadingRounds ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Cargando fecha…
                </div>
              ) : roundMatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No hay partidos cargados en esta fecha.
                </div>
              ) : (
                <div className="divide-y divide-[#f0eae1]">
                  {roundMatches.map((m: any, idx: number) => {
                    const localName = m.local_team_name || "A confirmar";
                    const visitorName = m.visitor_team_name || "A confirmar";
                    const isPlayed = Boolean(m.played);
                    const hasScore =
                      isPlayed && m.local_score !== null && m.visitor_score !== null;
                    const canchaLabel = formatCanchaLabel(m.cancha);

                    return (
                      <div
                        key={m.id || idx}
                        className="px-4 py-2.5 grid grid-cols-[1fr_92px_1fr] items-center gap-2 bg-white hover:bg-[#faf9f6] transition-colors"
                      >
                        {/* Local (sin escudo) */}
                        <div className="text-[12.5px] font-medium text-[#1c1d21] text-right leading-snug break-words pr-1">
                          {localName}
                        </div>

                        {/* Centro: Resultado o Fecha / Hora / Cancha */}
                        <div className="flex flex-col items-center justify-center text-center gap-0.5">
                          {hasScore ? (
                            <>
                              <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#1c1d21]">
                                FINALIZADO
                              </span>
                              <div className="inline-flex items-center justify-center gap-3 text-[14px] font-extrabold text-[#18181b]">
                                <span>{m.local_score}</span>
                                <span className="text-[#a1a1aa] font-normal">-</span>
                                <span>{m.visitor_score}</span>
                              </div>
                              {canchaLabel && (
                                <span className="text-[10px] font-semibold text-[#6f737b] leading-tight">
                                  {canchaLabel}
                                </span>
                              )}
                            </>
                          ) : m.date || m.time || canchaLabel ? (
                            <>
                              {m.date && (
                                <span className="text-[11px] font-bold text-[#1c1d21] leading-tight">
                                  {m.date.split("-").reverse().slice(0, 2).join("/")}
                                </span>
                              )}
                              {m.time && (
                                <span className="text-[10.5px] font-semibold text-[#52525b] leading-tight">
                                  {m.time.slice(0, 5)} Hs
                                </span>
                              )}
                              {canchaLabel && (
                                <span className="text-[10px] font-semibold text-[#6f737b] leading-tight">
                                  {canchaLabel}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-3 text-[13px] font-bold text-[#6f737b]">
                              <span>-</span>
                              <span>-</span>
                            </div>
                          )}
                        </div>

                        {/* Visitante (sin escudo) */}
                        <div className="text-[12.5px] font-medium text-[#1c1d21] text-left leading-snug break-words pl-1">
                          {visitorName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedTournament?.category && (
              <div className="px-4 py-2.5 bg-[#faf9f6] border-t border-border/70 text-center">
                <Link
                  to="/categorias/$id"
                  params={{ id: String(selectedTournament.category) }}
                  className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#18181b] hover:text-primary transition-colors"
                >
                  Ver tabla y fixture completo →
                </Link>
              </div>
            )}
          </div>

          {/* 2. SUBSECCIÓN CLIMA PARA LOS PRÓXIMOS DÍAS (DISEÑO SOBRIO Y CLARO) */}
          <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-5 bg-primary rounded-full inline-block" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold leading-none">
                    Pronóstico
                  </p>
                  <h3 className="font-display text-xl font-bold uppercase leading-none mt-1 text-foreground">
                    Clima en el Complejo
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#f4f4f5] border border-[#e4e4e7] px-2.5 py-1.5 rounded-xl">
                <CurrentWeatherIcon
                  className="size-4 shrink-0"
                  style={{ color: currentWeatherMeta.iconColor }}
                />
                <span className="text-xs font-extrabold text-[#18181b]">
                  {currentWeather.temp}°C
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 divide-x divide-[#f0eae1] bg-white">
              {forecastDays.map((day, i) => {
                const meta = getWeatherMeta(day.code);
                const DayIcon = meta.Icon;
                const isToday = i === 0;
                return (
                  <div
                    key={day.date}
                    className={`py-3 px-1.5 flex flex-col items-center text-center ${
                      isToday ? "bg-[#faf9f6]" : "bg-white"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase ${
                        isToday ? "text-[#18181b]" : "text-[#52525b]"
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa] mt-0.5">{day.dayNum}</span>

                    <div className="my-2.5 grid place-items-center" title={meta.label}>
                      <DayIcon className="size-5" style={{ color: meta.iconColor }} />
                    </div>

                    <div className="text-xs font-bold text-[#18181b]">
                      {day.maxTemp}°{" "}
                      <span className="text-[#a1a1aa] font-medium text-[11px]">
                        {day.minTemp}°
                      </span>
                    </div>

                    <span className="mt-1 text-[10px] font-medium text-[#71717a]">
                      {day.rainProb}% ll.
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TARJETA DEL COMPLEJO */}
          <div className="relative bg-surface rounded-2xl border border-border/80 p-5 sm:p-6 overflow-hidden shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
                Complejo
              </p>
            </div>
            <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold uppercase text-foreground">
              Vení a jugar
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Reservá tu cancha de fútbol 5, 7 o 11. Césped sintético de última
              generación e iluminación profesional para jugar a cualquier hora.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2.5 rounded-xl">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                {contactAddress || "Av. del Deporte 3600 — La Plata"}
              </span>
            </div>
            <Link
              to="/contacto"
              className="mt-4 inline-flex items-center justify-center w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs py-3 rounded-xl hover:brightness-110 shadow-xs transition-all duration-200"
            >
              Reservar cancha
            </Link>
          </div>
        </aside>
      </section>

      {/* VENTANA DE DETALLE DE NOTICIA (ADAPTADA A CELULAR Y PC) */}
      {selectedNews && (
        <div
          onClick={() => setSelectedNews(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Cabecera con imagen */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[260px] sm:max-h-[340px] bg-neutral-900 shrink-0 overflow-hidden">
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                aria-label="Cerrar noticia"
                className="absolute top-3 right-3 size-9 sm:size-10 rounded-full bg-black/65 text-white hover:bg-primary hover:text-primary-foreground grid place-items-center transition-colors cursor-pointer border border-white/15"
              >
                <X className="size-5" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 flex-wrap">
                <span className="bg-tag text-tag-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-md">
                  {selectedNews.category}
                </span>
                {selectedNews.is_pinned && (
                  <span
                    title="Noticia fijada"
                    className="size-7 bg-primary text-primary-foreground rounded-full shadow-md grid place-items-center"
                  >
                    <Pin className="size-3.5 fill-current" />
                  </span>
                )}
              </div>
            </div>

            {/* Contenido desplazable */}
            <div className="p-4 sm:p-6 md:p-7 overflow-y-auto overscroll-contain flex-1 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span>{formatDate(selectedNews.date)}</span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold uppercase leading-tight text-foreground">
                {selectedNews.title}
              </h2>

              <div className="pt-2 border-t border-border/60">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                  {selectedNews.excerpt}
                </p>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border/60 bg-surface-elevated/40 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-[0.16em] text-xs hover:brightness-110 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
