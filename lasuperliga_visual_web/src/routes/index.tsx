import { useBranding } from "@/lib/branding";
import { API_URL } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
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

/* ============================================================================
   8 TEMAS Y COPAS ESTILO "NOCHE DE REFLECTORES" (IDÉNTICOS A LAS CARDS DE TORNEOS)
   ============================================================================ */
const FLOODLIGHT_THEMES = [
  // 0: Azul Noche Profundo
  {
    bg: "#132a4a",
    sideBeam: "#7cb2f4",
    centerBeam: "#f5dd90",
    arch: "#7cb2f4",
    star: "#f5dd90",
    cupMain: "#f5dd90",
    cupShade: "#e0be5a",
    cupBase: "#faf9f6",
    emblem: "#132a4a",
  },
  // 1: Verde Esmeralda Estadio
  {
    bg: "#133829",
    sideBeam: "#6ee7b7",
    centerBeam: "#fde68a",
    arch: "#6ee7b7",
    star: "#fde68a",
    cupMain: "#fde68a",
    cupShade: "#eab308",
    cupBase: "#faf9f6",
    emblem: "#133829",
  },
  // 2: Bordó / Carmesí Imperial
  {
    bg: "#3f1420",
    sideBeam: "#fda4af",
    centerBeam: "#fcd34d",
    arch: "#fda4af",
    star: "#fcd34d",
    cupMain: "#fcd34d",
    cupShade: "#d99b26",
    cupBase: "#faf9f6",
    emblem: "#3f1420",
  },
  // 3: Violeta / Índigo Real
  {
    bg: "#261b47",
    sideBeam: "#c4b5fd",
    centerBeam: "#f5dd90",
    arch: "#c4b5fd",
    star: "#f5dd90",
    cupMain: "#f5dd90",
    cupShade: "#dfba48",
    cupBase: "#faf9f6",
    emblem: "#261b47",
  },
  // 4: Carbón Nocturno & Ámbar
  {
    bg: "#1b1d24",
    sideBeam: "#fbbf24",
    centerBeam: "#fef08a",
    arch: "#9ca3af",
    star: "#fbbf24",
    cupMain: "#fde047",
    cupShade: "#ca8a04",
    cupBase: "#faf9f6",
    emblem: "#1b1d24",
  },
  // 5: Azul Petróleo / Océano
  {
    bg: "#0f333e",
    sideBeam: "#67e8f9",
    centerBeam: "#f5dd90",
    arch: "#67e8f9",
    star: "#f5dd90",
    cupMain: "#f5dd90",
    cupShade: "#d4af37",
    cupBase: "#faf9f6",
    emblem: "#0f333e",
  },
  // 6: Terracota / Bronce Nocturno
  {
    bg: "#3c1f14",
    sideBeam: "#fdba74",
    centerBeam: "#fde68a",
    arch: "#fdba74",
    star: "#fde68a",
    cupMain: "#fde68a",
    cupShade: "#d97706",
    cupBase: "#faf9f6",
    emblem: "#3c1f14",
  },
  // 7: Azul Acero / Pizarra
  {
    bg: "#1e293b",
    sideBeam: "#93c5fd",
    centerBeam: "#fde68a",
    arch: "#93c5fd",
    star: "#fde68a",
    cupMain: "#f5dd90",
    cupShade: "#cda434",
    cupBase: "#faf9f6",
    emblem: "#1e293b",
  },
];

function TrophyIllustration({
  variant,
  theme,
  x = 200,
  y = 62,
  scale = 1,
}: {
  variant: number;
  theme: (typeof FLOODLIGHT_THEMES)[number];
  x?: number;
  y?: number;
  scale?: number;
}) {
  const transform = `translate(${x}, ${y}) scale(${scale})`;
  switch (variant) {
    case 0:
      return (
        <g transform={transform}>
          <path
            d="M -20,-28 L 20,-28 L 14,2 C 12,12 -12,12 -14,2 Z"
            fill={theme.cupMain}
          />
          <path
            d="M -20,-22 L -28,-22 L -25,-6 L -15,-4"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 20,-22 L 28,-22 L 25,-6 L 15,-4"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="-5" y="9" width="10" height="12" fill={theme.cupShade} />
          <rect x="-16" y="21" width="32" height="7" rx="3" fill={theme.cupBase} />
          <circle cx="0" cy="-12" r="6" fill={theme.emblem} />
        </g>
      );
    case 1:
      return (
        <g transform={transform}>
          <path
            d="M -13,-18 C -30,-30 -30,0 -11,4"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 13,-18 C 30,-30 30,0 11,4"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M -14,-28 L 14,-28 L 17,-8 C 17,6 8,12 0,12 C -8,12 -17,6 -17,-8 Z"
            fill={theme.cupMain}
          />
          <ellipse cx="0" cy="-28" rx="14" ry="3.5" fill={theme.cupShade} />
          <rect x="-6" y="11" width="12" height="9" rx="2" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
          <polygon points="0,-19 5,-11 0,-3 -5,-11" fill={theme.emblem} />
        </g>
      );
    case 2:
      return (
        <g transform={transform}>
          <polyline
            points="-17,-22 -27,-18 -23,-4 -12,-2"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="17,-22 27,-18 23,-4 12,-2"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polygon
            points="-19,-26 19,-26 23,-12 11,6 -11,6 -23,-12"
            fill={theme.cupMain}
          />
          <polygon
            points="-8,-26 8,-26 10,-12 4,6 -4,6 -10,-12"
            fill={theme.cupShade}
            opacity="0.55"
          />
          <rect x="-4" y="6" width="8" height="11" fill={theme.cupShade} />
          <rect x="-13" y="17" width="26" height="4" rx="1.5" fill={theme.cupMain} />
          <rect x="-19" y="21" width="38" height="7" rx="2.5" fill={theme.cupBase} />
        </g>
      );
    case 3:
      return (
        <g transform={transform}>
          <path
            d="M -14,18 L -6,0 L -16,-14 L -6,-14 L 0,2 L 6,-14 L 16,-14 L 6,0 L 14,18 Z"
            fill={theme.cupShade}
          />
          <path d="M -10,18 L 0,-4 L 10,18 Z" fill={theme.cupMain} />
          <circle cx="0" cy="-16" r="14" fill={theme.cupMain} />
          <polygon points="0,-22 5.5,-18 3.5,-11.5 -3.5,-11.5 -5.5,-18" fill={theme.emblem} />
          <rect x="-15" y="16" width="30" height="4" rx="2" fill={theme.cupMain} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 4:
      return (
        <g transform={transform}>
          <polygon
            points="-16,-22 -12,-31 -5,-24 0,-33 5,-24 12,-31 16,-22"
            fill={theme.cupShade}
          />
          <path
            d="M -18,-22 L 18,-22 L 18,-4 C 18,9 0,16 0,16 C 0,16 -18,9 -18,-4 Z"
            fill={theme.cupMain}
          />
          <path
            d="M -18,-16 L -26,-16 L -26,-5 L -16,-1"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M 18,-16 L 26,-16 L 26,-5 L 16,-1"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <line x1="-18" y1="-9" x2="18" y2="-9" stroke={theme.emblem} strokeWidth="2.5" />
          <circle cx="0" cy="-1" r="4.5" fill={theme.emblem} />
          <rect x="-6" y="14" width="12" height="7" fill={theme.cupShade} />
          <rect x="-17" y="21" width="34" height="7" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 5:
      return (
        <g transform={transform}>
          <polygon points="-10,-8 -32,-24 -26,-12 -30,-4 -12,2" fill={theme.cupShade} />
          <polygon points="10,-8 32,-24 26,-12 30,-4 12,2" fill={theme.cupShade} />
          <polygon points="-16,-28 16,-28 8,12 -8,12" fill={theme.cupMain} />
          <polygon
            points="0,-20 2.5,-14 9,-14 3.8,-10 5.8,-4 0,-8 -5.8,-4 -3.8,-10 -9,-14 -2.5,-14"
            fill={theme.emblem}
          />
          <rect x="-5" y="12" width="10" height="8" fill={theme.cupShade} />
          <rect x="-16" y="20" width="32" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
    case 6:
      return (
        <g transform={transform}>
          <circle cx="-16" cy="-12" r="6" fill="none" stroke={theme.cupMain} strokeWidth="2.6" />
          <circle cx="16" cy="-12" r="6" fill="none" stroke={theme.cupMain} strokeWidth="2.6" />
          <circle cx="0" cy="-29" r="4.5" fill={theme.cupBase} />
          <path
            d="M -14,-18 C -14,-26 14,-26 14,-18 L 11,2 L -11,2 Z"
            fill={theme.cupMain}
          />
          <rect x="-15" y="-19" width="30" height="3.5" rx="1.5" fill={theme.cupShade} />
          <rect x="-7" y="2" width="14" height="6" rx="2" fill={theme.cupShade} />
          <polygon points="-11,8 11,8 15,20 -15,20" fill={theme.cupMain} />
          <rect x="-19" y="20" width="38" height="8" rx="2.5" fill={theme.cupBase} />
          <circle cx="0" cy="-9" r="4.5" fill={theme.emblem} />
        </g>
      );
    default:
      return (
        <g transform={transform}>
          <polygon
            points="0,-34 2.5,-28 9,-28 4,-24 6,-18 0,-22 -6,-18 -4,-24 -9,-28 -2.5,-28"
            fill={theme.cupBase}
          />
          <polygon points="0,-18 18,-6 10,16 -10,16 -18,-6" fill={theme.cupMain} />
          <polygon points="0,-18 18,-6 0,16" fill={theme.cupShade} opacity="0.5" />
          <polygon points="-18,-6 -26,-14 -20,4 -12,8" fill={theme.cupShade} />
          <polygon points="18,-6 26,-14 20,4 12,8" fill={theme.cupShade} />
          <polygon points="0,-9 6,-2 0,5 -6,-2" fill={theme.emblem} />
          <rect x="-13" y="16" width="26" height="4" rx="1.5" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
  }
}

interface WeatherDay {
  date: string;
  dayLabel: string;
  dayNum: string;
  code: number;
  maxTemp: number;
  minTemp: number;
  rainProb: number;
  windSpeed: number;
}

interface CurrentWeather {
  temp: number;
  code: number;
  humidity: number;
  windSpeed: number;
}

type WeatherKind = "sunny" | "partly_cloudy" | "cloudy" | "rainy" | "stormy";

function getWeatherMeta(code: number): {
  kind: WeatherKind;
  label: string;
  skyGradient: string;
  accentColor: string;
} {
  if (code === 0) {
    return {
      kind: "sunny",
      label: "Cielo despejado",
      skyGradient: "linear-gradient(135deg, #075985 0%, #0284c7 55%, #38bdf8 100%)",
      accentColor: "#fbbf24",
    };
  }
  if (code === 1 || code === 2) {
    return {
      kind: "partly_cloudy",
      label: "Parcialmente nublado",
      skyGradient: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 52%, #0ea5e9 100%)",
      accentColor: "#fde047",
    };
  }
  if (code === 3 || (code >= 45 && code <= 48)) {
    return {
      kind: "cloudy",
      label: "Mayormente nublado",
      skyGradient: "linear-gradient(135deg, #1e293b 0%, #334155 55%, #475569 100%)",
      accentColor: "#cbd5e1",
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      kind: "rainy",
      label: "Probabilidad de lluvias",
      skyGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)",
      accentColor: "#60a5fa",
    };
  }
  if (code >= 95) {
    return {
      kind: "stormy",
      label: "Tormentas eléctricas",
      skyGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)",
      accentColor: "#facc15",
    };
  }
  return {
    kind: "partly_cloudy",
    label: "Clima templado",
    skyGradient: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 52%, #0ea5e9 100%)",
    accentColor: "#fde047",
  };
}

function WeatherGraphic({ kind, size = 36 }: { kind: WeatherKind; size?: number }) {
  switch (kind) {
    case "sunny":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="22" fill="#fbbf24" opacity="0.22" />
          <g stroke="#fbbf24" strokeWidth="3.2" strokeLinecap="round">
            <line x1="32" y1="6" x2="32" y2="12" />
            <line x1="32" y1="52" x2="32" y2="58" />
            <line x1="6" y1="32" x2="12" y2="32" />
            <line x1="52" y1="32" x2="58" y2="32" />
            <line x1="13.6" y1="13.6" x2="17.8" y2="17.8" />
            <line x1="46.2" y1="46.2" x2="50.4" y2="50.4" />
            <line x1="50.4" y1="13.6" x2="46.2" y2="17.8" />
            <line x1="17.8" y1="46.2" x2="13.6" y2="50.4" />
          </g>
          <circle cx="32" cy="32" r="14" fill="#facc15" />
          <circle cx="28" cy="28" r="11" fill="#fde047" opacity="0.6" />
        </svg>
      );
    case "partly_cloudy":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="13" fill="#fbbf24" opacity="0.25" />
          <g stroke="#fbbf24" strokeWidth="2.8" strokeLinecap="round">
            <line x1="24" y1="6" x2="24" y2="10" />
            <line x1="6" y1="24" x2="10" y2="24" />
            <line x1="11.3" y1="11.3" x2="14.2" y2="14.2" />
            <line x1="36.7" y1="11.3" x2="33.8" y2="14.2" />
          </g>
          <circle cx="24" cy="24" r="10" fill="#facc15" />
          <path
            d="M22 48H46C51.5228 48 56 43.5228 56 38C56 32.7902 52.0125 28.5112 46.9178 28.0422C45.4021 21.7099 39.7082 17 32.9 17C24.9471 17 18.5 23.4471 18.5 31.4C18.5 31.784 18.515 32.1645 18.5444 32.5408C14.8473 33.6252 12.15 37.0439 12.15 41.1C12.15 44.9108 15.2392 48 19.05 48H22Z"
            fill="#f8fafc"
          />
          <path
            d="M24 48H46C50.4183 48 54 44.4183 54 40C54 35.5817 50.4183 32 46 32H24C19.5817 32 16 35.5817 16 40C16 44.4183 19.5817 48 24 48Z"
            fill="#e2e8f0"
            opacity="0.55"
          />
        </svg>
      );
    case "cloudy":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M26 38H48C52.4183 38 56 34.4183 56 30C56 25.85 52.84 22.44 48.8 22.04C47.55 16.86 42.9 13 37.3 13C30.78 13 25.5 18.28 25.5 24.8C20.8 25.4 17.2 29.4 17.2 34.2C17.2 36.3 18.9 38 21 38H26Z"
            fill="#94a3b8"
            opacity="0.75"
          />
          <path
            d="M18 50H44C49.5228 50 54 45.5228 54 40C54 34.7902 50.0125 30.5112 44.9178 30.0422C43.4021 23.7099 37.7082 19 30.9 19C22.9471 19 16.5 25.4471 16.5 33.4C16.5 33.784 16.515 34.1645 16.5444 34.5408C12.8473 35.6252 10.15 39.0439 10.15 43.1C10.15 46.9108 13.2392 50 17.05 50H18Z"
            fill="#f8fafc"
          />
        </svg>
      );
    case "rainy":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M18 43H45C50.2 43 54.4 38.8 54.4 33.6C54.4 28.7 50.6 24.7 45.8 24.2C44.4 18.3 39.1 14 32.7 14C25.2 14 19.2 20 19.2 27.5C19.2 27.9 19.2 28.2 19.3 28.6C15.8 29.6 13.2 32.8 13.2 36.6C13.2 40.1 16.1 43 19.6 43H18Z"
            fill="#e2e8f0"
          />
          <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round">
            <line x1="23" y1="48" x2="20" y2="56" />
            <line x1="33" y1="48" x2="30" y2="56" />
            <line x1="43" y1="48" x2="40" y2="56" />
          </g>
        </svg>
      );
    case "stormy":
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M18 42H45C50.2 42 54.4 37.8 54.4 32.6C54.4 27.7 50.6 23.7 45.8 23.2C44.4 17.3 39.1 13 32.7 13C25.2 13 19.2 19 19.2 26.5C19.2 26.9 19.2 27.2 19.3 27.6C15.8 28.6 13.2 31.8 13.2 35.6C13.2 39.1 16.1 42 19.6 42H18Z"
            fill="#cbd5e1"
          />
          <polygon points="34,37 25,49 32,49 29,59 41,45 34,45" fill="#facc15" />
          <g stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round">
            <line x1="20" y1="47" x2="18" y2="54" />
            <line x1="45" y1="47" x2="43" y2="54" />
          </g>
        </svg>
      );
  }
}

function buildFallbackForecast(): { current: CurrentWeather; days: WeatherDay[] } {
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const presetCodes = [1, 0, 2, 3, 1];
  const presetMax = [23, 25, 22, 19, 24];
  const presetMin = [12, 14, 13, 11, 12];
  const presetRain = [10, 5, 20, 40, 10];
  const presetWind = [14, 12, 18, 22, 15];

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
      windSpeed: presetWind[idx % presetWind.length],
    };
  });

  return {
    current: { temp: 22, code: 1, humidity: 58, windSpeed: 14 },
    days,
  };
}

function getTournamentVariant(tournamentOrId: any): number {
  const rawId = typeof tournamentOrId === "object" ? tournamentOrId?.id : tournamentOrId;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  if (id === 16) return 0;
  if (id === 2) return 1;
  return Math.abs(id * 3 + Math.floor(id / 2)) % FLOODLIGHT_THEMES.length;
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
  const [selectedWeatherIdx, setSelectedWeatherIdx] = useState(0);

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
        const list = (Array.isArray(data) ? data : []).map((t) => ({
          ...t,
          _themeIndex: getTournamentVariant(t),
        }));
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
      "https://api.open-meteo.com/v1/forecast?latitude=-34.9214&longitude=-57.9544&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=5",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.current) {
          setCurrentWeather({
            temp: Math.round(data.current.temperature_2m ?? 22),
            code: data.current.weather_code ?? 1,
            humidity: Math.round(data.current.relative_humidity_2m ?? 58),
            windSpeed: Math.round(data.current.wind_speed_10m ?? 14),
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
                windSpeed: Math.round(data.daily.wind_speed_10m_max?.[idx] ?? 14),
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

  const selectedTournamentIndex = useMemo(() => {
    if (!selectedTournament) return 0;
    return getTournamentVariant(selectedTournament);
  }, [selectedTournament]);

  const activeVariant = selectedTournamentIndex % FLOODLIGHT_THEMES.length;
  const activeTheme = FLOODLIGHT_THEMES[activeVariant];

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

  const activeWeatherDay = forecastDays[selectedWeatherIdx] || forecastDays[0];
  const activeWeatherCode =
    selectedWeatherIdx === 0 ? currentWeather.code : activeWeatherDay?.code ?? 1;
  const activeWeatherMeta = getWeatherMeta(activeWeatherCode);
  const activeDisplayTemp =
    selectedWeatherIdx === 0 ? currentWeather.temp : activeWeatherDay?.maxTemp ?? 22;
  const activeWindSpeed =
    selectedWeatherIdx === 0
      ? currentWeather.windSpeed
      : activeWeatherDay?.windSpeed ?? 14;
  const activeRainProb = activeWeatherDay?.rainProb ?? 0;
  const roundDateStr =
    closestRound?.date || closestRound?.matches?.find((m: any) => m.date)?.date || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        .sl-news-card {
          background: #ffffff;
          border: 1px solid #e6e4dd;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(20, 20, 19, 0.04);
          cursor: pointer;
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.24s ease;
        }
        .sl-news-card:hover {
          border-color: #c9c6bc;
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(20, 20, 19, 0.08);
        }
        .sl-news-card-title {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          letter-spacing: -0.02em !important;
          text-transform: none !important;
        }
        .sl-news-card-cta {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #f4f3ef;
          color: #18181b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .sl-news-card:hover .sl-news-card-cta {
          background: #18181b;
          color: #ffffff;
          transform: translateX(2px);
        }
      `}</style>
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
        {/* News column — Diseño Editorial Limpio (Regla 60-30-10 sin saturación de amarillo) */}
        <div id="noticias-section" className="min-w-0 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
              <div>
                <p className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-[#787772] font-bold">
                  Actualidad
                </p>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold uppercase leading-none mt-0.5 text-[#141413]">
                  Noticias
                </h2>
              </div>
            </div>

            {/* Barra de filtros editorial: activo en carbón oscuro (#18181b) con sutil punto de acento */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full bg-white p-1.5 rounded-2xl border border-[#e6e4dd] shadow-2xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setCurrentPage(1);
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.12em] font-bold px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#18181b] text-white shadow-xs"
                        : "text-[#6f6e69] hover:text-[#141413] hover:bg-[#f4f3ef]"
                    }`}
                  >
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <span>{f}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            {paginatedNews.map((n) => (
              <article
                key={n.id}
                onClick={() => setSelectedNews(n)}
                className="sl-news-card group"
              >
                {/* Imagen con etiquetas en cristal oscuro (sin bloques amarillos invasivos) */}
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#18181b] border-b border-[#f0efe9]">
                    <img
                      src={n.image}
                      alt={n.title}
                      loading="lazy"
                      width={800}
                      height={500}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 opacity-75" />

                    {/* Etiqueta de categoría en vidrio oscuro con punto de acento */}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[#141413]/82 text-white text-[10.5px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md shadow-sm">
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      <span>{n.category}</span>
                    </span>

                    {/* Indicador de noticia fijada sobrio */}
                    {n.is_pinned && (
                      <span
                        title="Noticia destacada"
                        className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#141413]/82 text-white text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md shadow-sm"
                      >
                        <Pin className="size-3 text-primary fill-current" />
                        <span>Destacada</span>
                      </span>
                    )}
                  </div>

                  {/* Cuerpo editorial */}
                  <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#787772]">
                      <Calendar className="size-3.5 text-[#8c8b85] shrink-0" />
                      <span>{formatDate(n.date)}</span>
                    </div>

                    <h3
                      className="sl-news-card-title text-[18px] sm:text-[19px] font-extrabold text-[#141413] leading-[1.3] line-clamp-2"
                    >
                      {n.title}
                    </h3>

                    <p className="text-[13.5px] text-[#575652] line-clamp-2 leading-[1.55] mt-0.5">
                      {n.excerpt}
                    </p>
                  </div>
                </div>

                {/* Pie de tarjeta minimalista (idéntico al lenguaje visual de Torneos) */}
                <div className="px-5 pb-4 pt-3 mt-2">
                  <div className="pt-3 border-t border-[#f0efe9] flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold text-[#6f6e69] group-hover:text-[#141413] transition-colors">
                      Leer nota completa
                    </span>
                    <span className="sl-news-card-cta">
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Paginación sobria en carbón oscuro */}
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
                  className="size-9 sm:size-10 rounded-xl border border-[#e6e4dd] bg-white text-[#141413] hover:border-[#18181b] disabled:opacity-35 disabled:pointer-events-none grid place-items-center transition-colors cursor-pointer"
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
                    className={`min-w-9 h-9 sm:min-w-10 sm:h-10 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#18181b] text-white shadow-xs border border-[#18181b]"
                        : "bg-white text-[#6f6e69] border border-[#e6e4dd] hover:border-[#18181b] hover:text-[#141413]"
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
                  className="size-9 sm:size-10 rounded-xl border border-[#e6e4dd] bg-white text-[#141413] hover:border-[#18181b] disabled:opacity-35 disabled:pointer-events-none grid place-items-center transition-colors cursor-pointer"
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
          {/* 1. PRÓXIMA FECHA POR TORNEO (FONDO DINÁMICO SEGÚN TORNEO + TABLA ZEBRA) */}
          <div
            className="relative rounded-2xl shadow-md overflow-hidden transition-colors duration-500"
            style={{
              backgroundColor: activeTheme.bg,
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            {/* Escena de fondo "Noche de Reflectores" del torneo seleccionado (solo en el fondo de la sección) */}
            <svg
              viewBox="0 0 400 220"
              width="100%"
              height="220"
              preserveAspectRatio="xMidYMin slice"
              className="pointer-events-none absolute top-0 left-0 right-0 z-0"
              aria-hidden="true"
            >
              {/* Haces de luz diagonales y central */}
              <polygon
                points="15,0 85,0 215,200 95,200"
                fill={activeTheme.sideBeam}
                opacity="0.18"
              />
              <polygon
                points="385,0 315,0 185,200 305,200"
                fill={activeTheme.sideBeam}
                opacity="0.18"
              />
              <polygon
                points="145,0 255,0 290,200 110,200"
                fill={activeTheme.centerBeam}
                opacity="0.13"
              />

              {/* Arcos geométricos de estadio */}
              <circle
                cx="52"
                cy="135"
                r="64"
                fill="none"
                stroke={activeTheme.arch}
                strokeWidth="2"
                strokeOpacity="0.26"
              />
              <circle
                cx="348"
                cy="135"
                r="64"
                fill="none"
                stroke={activeTheme.arch}
                strokeWidth="2"
                strokeOpacity="0.26"
              />

              {/* Estrellas decorativas en el cielo del estadio */}
              <polygon
                points="182,18 184.2,23 189.5,23 185.2,26.2 186.8,31.5 182,28.4 177.2,31.5 178.8,26.2 174.5,23 179.8,23"
                fill={activeTheme.star}
                opacity="0.85"
              />
              <polygon
                points="238,44 239.6,47.8 243.8,47.8 240.4,50.2 241.6,54.2 238,51.8 234.4,54.2 235.6,50.2 232.2,47.8 236.4,47.8"
                fill={activeTheme.star}
                opacity="0.65"
              />
            </svg>

            {/* Cabecera temática con copa y estrellas del torneo activo + selector */}
            <div className="relative z-10 px-4 pt-4 pb-3.5 sm:px-5 sm:pt-4 sm:pb-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                {/* Título + barra dorada del torneo */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-1.5 h-6 rounded-full inline-block shrink-0 shadow-xs"
                    style={{ backgroundColor: activeTheme.cupMain }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-[10px] uppercase tracking-[0.25em] font-extrabold leading-none"
                        style={{ color: activeTheme.sideBeam }}
                      >
                        Torneos
                      </p>
                      <span
                        className="text-[10px] leading-none"
                        style={{ color: activeTheme.star }}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold uppercase leading-none mt-1 text-white drop-shadow-xs">
                      Próxima Fecha
                    </h3>
                  </div>
                </div>

                {/* Distintivo visual: Copa y estrellas del torneo seleccionado + Etiqueta de fecha */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="h-11 px-1.5 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(0, 0, 0, 0.24)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                    title={selectedTournament ? formatTournamentLabel(selectedTournament) : "Torneo"}
                  >
                    <svg
                      viewBox="0 0 116 68"
                      width="68"
                      height="40"
                      aria-hidden="true"
                    >
                      {/* Estrella izquierda */}
                      <polygon
                        points="16,22 18.2,27 23.5,27 19.2,30.2 20.8,35.5 16,32.4 11.2,35.5 12.8,30.2 8.5,27 13.8,27"
                        fill={activeTheme.star}
                      />
                      {/* Estrella derecha */}
                      <polygon
                        points="100,22 102.2,27 107.5,27 103.2,30.2 104.8,35.5 100,32.4 95.2,35.5 96.8,30.2 92.5,27 97.8,27"
                        fill={activeTheme.star}
                      />
                      {/* Copa específica del torneo */}
                      <TrophyIllustration
                        variant={activeVariant}
                        theme={activeTheme}
                        x={58}
                        y={36}
                        scale={0.85}
                      />
                    </svg>
                  </div>

                  {closestRound && (
                    <span
                      className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shrink-0 shadow-xs"
                      style={{
                        backgroundColor: "rgba(10, 12, 16, 0.55)",
                        color: activeTheme.cupMain,
                        border: `1px solid ${activeTheme.cupMain}55`,
                      }}
                    >
                      {closestRound.name}
                      {roundDateStr ? ` · ${formatRoundDate(roundDateStr).slice(0, 5)}` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Selector de torneo integrado sobre el fondo del estadio */}
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-2.5 rounded-full shadow-xs"
                  style={{
                    backgroundColor: activeTheme.bg,
                    border: `2px solid ${activeTheme.cupMain}`,
                  }}
                />
                <select
                  aria-label="Seleccionar torneo"
                  value={selectedTournamentId ?? ""}
                  onChange={(e) => setSelectedTournamentId(Number(e.target.value))}
                  className="w-full appearance-none bg-white/95 hover:bg-white text-[#18181b] font-bold text-xs rounded-xl border border-white/40 shadow-sm focus:outline-none pl-7 pr-9 py-2.5 transition-colors cursor-pointer"
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
                <ChevronDown className="size-4 text-[#18181b] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Contenedor de filas aislado y opaco en formato ZEBRA (sin mezclar el fondo con la info de equipos) */}
            <div className="relative z-10 mx-2.5 mb-1 rounded-xl overflow-hidden bg-white shadow-sm border border-black/10">
              {loadingRounds ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-white">
                  Cargando fecha…
                </div>
              ) : roundMatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-white">
                  No hay partidos cargados en esta fecha.
                </div>
              ) : (
                <div className="divide-y divide-[#e4e7ec]">
                  {roundMatches.map((m: any, idx: number) => {
                    const localName = m.local_team_name || "A confirmar";
                    const visitorName = m.visitor_team_name || "A confirmar";
                    const isPlayed = Boolean(m.played);
                    const hasScore =
                      isPlayed && m.local_score !== null && m.visitor_score !== null;
                    const canchaLabel = formatCanchaLabel(m.cancha);
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={m.id || idx}
                        className={`px-3.5 py-2.5 grid grid-cols-[1fr_92px_1fr] items-center gap-2 transition-colors ${
                          isEven
                            ? "bg-white hover:bg-[#eaedf3]"
                            : "bg-[#f1f3f8] hover:bg-[#e5e9f1]"
                        }`}
                      >
                        {/* Local (sin escudo) */}
                        <div className="text-[12.5px] font-semibold text-[#1c1d21] text-right leading-snug break-words pr-1">
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
                                <span className="text-[10px] font-bold text-[#141413] leading-tight">
                                  {canchaLabel}
                                </span>
                              )}
                            </>
                          ) : m.date || m.time || canchaLabel ? (
                            <>
                              {m.date && (
                                <span className="text-[11px] font-bold text-[#141413] leading-tight">
                                  {m.date.split("-").reverse().slice(0, 2).join("/")}
                                </span>
                              )}
                              {m.time && (
                                <span className="text-[10.5px] font-bold text-[#141413] leading-tight">
                                  {m.time.slice(0, 5)} Hs
                                </span>
                              )}
                              {canchaLabel && (
                                <span className="text-[10px] font-bold text-[#141413] leading-tight">
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
                        <div className="text-[12.5px] font-semibold text-[#1c1d21] text-left leading-snug break-words pl-1">
                          {visitorName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie de la sección sobre el fondo del torneo activo */}
            {selectedTournament && (
              <div className="relative z-10 px-4 py-3 text-center flex items-center justify-center gap-2">
                <span
                  className="text-[10px] leading-none opacity-80"
                  style={{ color: activeTheme.star }}
                  aria-hidden="true"
                >
                  ★
                </span>
                <Link
                  to="/categorias/$id"
                  params={{ id: String(selectedTournament.id || selectedTournament.category) }}
                  className="text-[11px] font-extrabold uppercase tracking-[0.15em] transition-opacity hover:opacity-85"
                  style={{ color: activeTheme.cupMain }}
                >
                  Ver tabla y fixture completo →
                </Link>
                <span
                  className="text-[10px] leading-none opacity-80"
                  style={{ color: activeTheme.star }}
                  aria-hidden="true"
                >
                  ★
                </span>
              </div>
            )}
          </div>

          {/* 2. WIDGET INTERACTIVO ESTILO GOOGLE WEATHER — CLIMA EN EL COMPLEJO */}
          <div className="rounded-2xl border border-black/15 shadow-md overflow-hidden bg-white">
            {/* Panel superior atmosférico dinámico según el clima del día seleccionado */}
            <div
              className="relative px-4 pt-4 pb-3.5 sm:px-5 sm:pt-4 sm:pb-4 text-white overflow-hidden transition-all duration-500"
              style={{ background: activeWeatherMeta.skyGradient }}
            >
              {/* Decoración atmosférica de fondo */}
              <svg
                viewBox="0 0 400 180"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                className="pointer-events-none absolute inset-0 opacity-25"
                aria-hidden="true"
              >
                <circle cx="340" cy="28" r="78" fill="#ffffff" opacity="0.18" />
                <circle cx="340" cy="28" r="46" fill="#fde047" opacity="0.22" />
                <path
                  d="M-20,165 Q95,120 210,150 T420,135 L420,190 L-20,190 Z"
                  fill="#ffffff"
                  opacity="0.14"
                />
              </svg>

              {/* Fila superior: Título */}
              <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-1.5 h-5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: activeWeatherMeta.accentColor }}
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/80 font-extrabold leading-none">
                      Pronóstico · La Plata
                    </p>
                    <h3 className="font-display text-xl font-bold uppercase leading-none mt-1 text-white drop-shadow-xs">
                      Clima en el Complejo
                    </h3>
                  </div>
                </div>
              </div>

              {/* Bloque principal estilo Google Weather: Temperatura grande + Condición + Ilustración */}
              <div className="relative z-10 flex items-center justify-between gap-3 my-1">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl sm:text-[42px] font-extrabold leading-none tracking-tight text-white drop-shadow-xs">
                      {activeDisplayTemp}°C
                    </span>
                    {activeWeatherDay && (
                      <span className="text-xs font-bold text-white/85">
                        Máx {activeWeatherDay.maxTemp}° · Mín {activeWeatherDay.minTemp}°
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white mt-1">
                    {activeWeatherMeta.label}
                  </p>
                </div>

                <div className="shrink-0 drop-shadow-md">
                  <WeatherGraphic kind={activeWeatherMeta.kind} size={62} />
                </div>
              </div>

              {/* Tira de métricas (Precipitación, Viento, Humedad) */}
              <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 grid grid-cols-3 gap-2">
                <div className="bg-black/20 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/10 flex flex-col">
                  <span className="text-[9.5px] uppercase tracking-wider text-white/70 font-semibold">
                    Lluvia
                  </span>
                  <span className="text-xs font-extrabold text-white mt-0.5">
                    💧 {activeRainProb}%
                  </span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/10 flex flex-col">
                  <span className="text-[9.5px] uppercase tracking-wider text-white/70 font-semibold">
                    Viento
                  </span>
                  <span className="text-xs font-extrabold text-white mt-0.5">
                    💨 {activeWindSpeed} km/h
                  </span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/10 flex flex-col">
                  <span className="text-[9.5px] uppercase tracking-wider text-white/70 font-semibold">
                    Humedad
                  </span>
                  <span className="text-xs font-extrabold text-white mt-0.5">
                    🌡️ {currentWeather.humidity}%
                  </span>
                </div>
              </div>
            </div>

            {/* Tira interactiva de 5 días (clickeable para ver el pronóstico de cada jornada) */}
            <div className="grid grid-cols-5 divide-x divide-[#e6e8ee] bg-white">
              {forecastDays.map((day, i) => {
                const meta = getWeatherMeta(day.code);
                const isSelected = selectedWeatherIdx === i;
                const highRain = day.rainProb >= 35;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedWeatherIdx(i)}
                    className={`relative py-3 px-1 flex flex-col items-center text-center transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#eef6ff]"
                        : i % 2 === 1
                          ? "bg-[#f8fafc] hover:bg-[#f1f5f9]"
                          : "bg-white hover:bg-[#f1f5f9]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-0 left-0 right-0 h-1 bg-[#0284c7]" />
                    )}

                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wide ${
                        isSelected ? "text-[#0369a1]" : "text-[#18181b]"
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                    <span className="text-[10px] font-medium text-[#64748b] mt-0.5">
                      {day.dayNum}
                    </span>

                    <div className="my-1.5 grid place-items-center" title={meta.label}>
                      <WeatherGraphic kind={meta.kind} size={34} />
                    </div>

                    <div className="text-xs font-extrabold text-[#0f172a]">
                      {day.maxTemp}°{" "}
                      <span className="text-[#64748b] font-semibold text-[11px]">
                        {day.minTemp}°
                      </span>
                    </div>

                    <span
                      className={`mt-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold leading-none ${
                        highRain
                          ? "bg-[#dbeafe] text-[#1d4ed8]"
                          : "bg-[#f1f5f9] text-[#475569]"
                      }`}
                    >
                      💧 {day.rainProb}%
                    </span>
                  </button>
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
            className="bg-white border border-[#e6e4dd] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
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
                className="absolute top-3 right-3 size-9 sm:size-10 rounded-full bg-[#141413]/80 text-white hover:bg-[#141413] grid place-items-center transition-colors cursor-pointer border border-white/15 backdrop-blur-md"
              >
                <X className="size-5" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-[#141413]/85 text-white text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full border border-white/15 backdrop-blur-md shadow-md">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>{selectedNews.category}</span>
                </span>
                {selectedNews.is_pinned && (
                  <span
                    title="Noticia destacada"
                    className="inline-flex items-center gap-1 bg-[#141413]/85 text-white text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-white/15 backdrop-blur-md shadow-md"
                  >
                    <Pin className="size-3 text-primary fill-current" />
                    <span>Destacada</span>
                  </span>
                )}
              </div>
            </div>

            {/* Contenido desplazable */}
            <div className="p-5 sm:p-6 md:p-7 overflow-y-auto overscroll-contain flex-1 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#787772]">
                <Calendar className="size-3.5 text-[#8c8b85] shrink-0" />
                <span>{formatDate(selectedNews.date)}</span>
              </div>

              <h2 className="sl-news-card-title text-xl sm:text-2xl md:text-[26px] font-extrabold leading-tight text-[#141413]">
                {selectedNews.title}
              </h2>

              <div className="pt-3 border-t border-[#f0efe9]">
                <p className="text-sm sm:text-[15px] text-[#3f3e3b] leading-relaxed whitespace-pre-line">
                  {selectedNews.excerpt}
                </p>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#f0efe9] bg-[#faf9f6] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-5 py-2 rounded-xl bg-[#18181b] text-white font-bold uppercase tracking-[0.14em] text-xs hover:bg-[#27272a] transition-all cursor-pointer"
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
