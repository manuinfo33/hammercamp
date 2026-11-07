import { API_URL } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import type React from "react";

export const Route = createFileRoute("/categorias/")({
  component: CategoriasIndexPage,
  head: () => ({ meta: [{ title: "Categorías — La Superliga" }] }),
});

const tagPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 9px",
  borderRadius: "6px",
  fontSize: "12px",
  lineHeight: 1.2,
  background: "#f1f0ec",
  color: "#52514e",
};

/* ============================================================================
   8 ILUSTRACIONES ESTILO "NOCHE DE REFLECTORES"
   Cada una con un color de fondo distinto y un diseño único de copa / trofeo.
   Si hay más de 8 categorías creadas, se repiten cíclicamente (index % 8).
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
}: {
  variant: number;
  theme: (typeof FLOODLIGHT_THEMES)[number];
}) {
  switch (variant) {
    /* 0: Copa Clásica con Asas Curvas y Medallón */
    case 0:
      return (
        <g transform="translate(200, 62)">
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

    /* 1: Copa "Orejona" (Ánfora de Campeones con Asas Altas) */
    case 1:
      return (
        <g transform="translate(200, 62)">
          {/* Asas altas tipo Orejona */}
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
          {/* Cuerpo de ánfora */}
          <path
            d="M -14,-28 L 14,-28 L 17,-8 C 17,6 8,12 0,12 C -8,12 -17,6 -17,-8 Z"
            fill={theme.cupMain}
          />
          <ellipse cx="0" cy="-28" rx="14" ry="3.5" fill={theme.cupShade} />
          <rect x="-6" y="11" width="12" height="9" rx="2" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
          {/* Detalle central */}
          <polygon points="0,-19 5,-11 0,-3 -5,-11" fill={theme.emblem} />
        </g>
      );

    /* 2: Cáliz Hexagonal de Supercopa sobre Pedestal Escalonado */
    case 2:
      return (
        <g transform="translate(200, 62)">
          {/* Asas geométricas angulares */}
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
          {/* Copa facetada hexagonal */}
          <polygon
            points="-19,-26 19,-26 23,-12 11,6 -11,6 -23,-12"
            fill={theme.cupMain}
          />
          <polygon
            points="-8,-26 8,-26 10,-12 4,6 -4,6 -10,-12"
            fill={theme.cupShade}
            opacity="0.55"
          />
          {/* Tallo y base doble */}
          <rect x="-4" y="6" width="8" height="11" fill={theme.cupShade} />
          <rect x="-13" y="17" width="26" height="4" rx="1.5" fill={theme.cupMain} />
          <rect x="-19" y="21" width="38" height="7" rx="2.5" fill={theme.cupBase} />
        </g>
      );

    /* 3: Trofeo Globo / Esfera Dorada sostenida por Brazos en V */
    case 3:
      return (
        <g transform="translate(200, 62)">
          {/* Brazos estilizados que sostienen el balón/globo */}
          <path
            d="M -14,18 L -6,0 L -16,-14 L -6,-14 L 0,2 L 6,-14 L 16,-14 L 6,0 L 14,18 Z"
            fill={theme.cupShade}
          />
          <path
            d="M -10,18 L 0,-4 L 10,18 Z"
            fill={theme.cupMain}
          />
          {/* Globo / Pelota dorada en la cima */}
          <circle cx="0" cy="-16" r="14" fill={theme.cupMain} />
          <polygon points="0,-22 5.5,-18 3.5,-11.5 -3.5,-11.5 -5.5,-18" fill={theme.emblem} />
          {/* Anillo dorado y base */}
          <rect x="-15" y="16" width="30" height="4" rx="2" fill={theme.cupMain} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );

    /* 4: Copa Escudo Imperial con Corona Superior */
    case 4:
      return (
        <g transform="translate(200, 62)">
          {/* Corona superior de 3 puntas */}
          <polygon
            points="-16,-22 -12,-31 -5,-24 0,-33 5,-24 12,-31 16,-22"
            fill={theme.cupShade}
          />
          {/* Cuerpo tipo escudo heráldico */}
          <path
            d="M -18,-22 L 18,-22 L 18,-4 C 18,9 0,16 0,16 C 0,16 -18,9 -18,-4 Z"
            fill={theme.cupMain}
          />
          {/* Asas laterales */}
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
          {/* Franja interior */}
          <line x1="-18" y1="-9" x2="18" y2="-9" stroke={theme.emblem} strokeWidth="2.5" />
          <circle cx="0" cy="-1" r="4.5" fill={theme.emblem} />
          <rect x="-6" y="14" width="12" height="7" fill={theme.cupShade} />
          <rect x="-17" y="21" width="34" height="7" rx="3" fill={theme.cupBase} />
        </g>
      );

    /* 5: Trofeo Victoria Alada (Copa en V con Alas Geométricas) */
    case 5:
      return (
        <g transform="translate(200, 62)">
          {/* Alas geométricas desplegadas */}
          <polygon points="-10,-8 -32,-24 -26,-12 -30,-4 -12,2" fill={theme.cupShade} />
          <polygon points="10,-8 32,-24 26,-12 30,-4 12,2" fill={theme.cupShade} />
          {/* Cáliz central en V */}
          <polygon points="-16,-28 16,-28 8,12 -8,12" fill={theme.cupMain} />
          {/* Estrella central grabada */}
          <polygon
            points="0,-20 2.5,-14 9,-14 3.8,-10 5.8,-4 0,-8 -5.8,-4 -3.8,-10 -9,-14 -2.5,-14"
            fill={theme.emblem}
          />
          <rect x="-5" y="12" width="10" height="8" fill={theme.cupShade} />
          <rect x="-16" y="20" width="32" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );

    /* 6: Copa Pedestal Alta con Esfera y Anillos (Estilo Libertadores) */
    case 6:
      return (
        <g transform="translate(200, 62)">
          {/* Asas de anillo */}
          <circle
            cx="-16"
            cy="-12"
            r="6"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.6"
          />
          <circle
            cx="16"
            cy="-12"
            r="6"
            fill="none"
            stroke={theme.cupMain}
            strokeWidth="2.6"
          />
          {/* Cúpula y esfera superior */}
          <circle cx="0" cy="-29" r="4.5" fill={theme.cupBase} />
          <path
            d="M -14,-18 C -14,-26 14,-26 14,-18 L 11,2 L -11,2 Z"
            fill={theme.cupMain}
          />
          <rect x="-15" y="-19" width="30" height="3.5" rx="1.5" fill={theme.cupShade} />
          {/* Columna anillada y pedestal */}
          <rect x="-7" y="2" width="14" height="6" rx="2" fill={theme.cupShade} />
          <polygon points="-11,8 11,8 15,20 -15,20" fill={theme.cupMain} />
          <rect x="-19" y="20" width="38" height="8" rx="2.5" fill={theme.cupBase} />
          <circle cx="0" cy="-9" r="4.5" fill={theme.emblem} />
        </g>
      );

    /* 7: Trofeo Diamante / Obelisco Coronado por Estrella */
    default:
      return (
        <g transform="translate(200, 62)">
          {/* Estrella superior */}
          <polygon
            points="0,-34 2.5,-28 9,-28 4,-24 6,-18 0,-22 -6,-18 -4,-24 -9,-28 -2.5,-28"
            fill={theme.cupBase}
          />
          {/* Diamante / Obelisco central */}
          <polygon points="0,-18 18,-6 10,16 -10,16 -18,-6" fill={theme.cupMain} />
          <polygon points="0,-18 18,-6 0,16" fill={theme.cupShade} opacity="0.5" />
          {/* Aletas laterales */}
          <polygon points="-18,-6 -26,-14 -20,4 -12,8" fill={theme.cupShade} />
          <polygon points="18,-6 26,-14 20,4 12,8" fill={theme.cupShade} />
          {/* Centro oscuro y pedestal */}
          <polygon points="0,-9 6,-2 0,5 -6,-2" fill={theme.emblem} />
          <rect x="-13" y="16" width="26" height="4" rx="1.5" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
        </g>
      );
  }
}

function TournamentFloodlightBanner({
  index,
  height = 132,
}: {
  index: number;
  height?: number;
}) {
  const variant = index % 8;
  const theme = FLOODLIGHT_THEMES[variant];

  return (
    <div
      style={{
        height,
        overflow: "hidden",
        position: "relative",
        background: theme.bg,
        borderBottom: "3px solid rgba(245, 221, 144, 0.35)",
      }}
    >
      <svg
        viewBox="0 0 400 120"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="0" y="0" width="400" height="120" fill={theme.bg} />

        {/* Haces de luz de reflectores ("Noche de Reflectores") */}
        <polygon
          points="30,0 90,0 220,120 110,120"
          fill={theme.sideBeam}
          opacity="0.18"
        />
        <polygon
          points="370,0 310,0 180,120 290,120"
          fill={theme.sideBeam}
          opacity="0.18"
        />
        <polygon
          points="155,0 245,0 275,120 125,120"
          fill={theme.centerBeam}
          opacity="0.14"
        />

        {/* Arcos geométricos de estadio */}
        <circle
          cx="70"
          cy="125"
          r="55"
          fill="none"
          stroke={theme.arch}
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        <circle
          cx="330"
          cy="125"
          r="55"
          fill="none"
          stroke={theme.arch}
          strokeWidth="2"
          strokeOpacity="0.3"
        />

        {/* Estrellas laterales */}
        <polygon
          points="118,34 121,41 128,41 122,45 124,52 118,48 112,52 114,45 108,41 115,41"
          fill={theme.star}
        />
        <polygon
          points="282,34 285,41 292,41 286,45 288,52 282,48 276,52 278,45 272,41 279,41"
          fill={theme.star}
        />

        {/* Copa / Trofeo único según la variante (0 a 7) */}
        <TrophyIllustration variant={variant} theme={theme} />
      </svg>
    </div>
  );
}

function CategoriasIndexPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/categories/`).then((res) => res.json()),
      fetch(`${API_URL}/tournaments/`).then((res) => res.json()),
    ])
      .then(([catsData, tournsData]) => {
        setCategories(Array.isArray(catsData) ? catsData : []);
        setTournaments(Array.isArray(tournsData) ? tournsData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        .sl-tourn-card-title {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          letter-spacing: -0.02em !important;
          text-transform: none !important;
        }
        .sl-tourn-card {
          background: #ffffff;
          border: 1px solid #e6e4dd;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(20, 20, 19, 0.04);
          text-decoration: none;
          color: inherit;
          transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.24s ease;
        }
        .sl-tourn-card:hover {
          border-color: #c9c6bc;
          transform: translateY(-4px);
          box-shadow: 0 14px 30px rgba(20, 20, 19, 0.09);
        }
        .sl-tourn-card-cta {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #f4f3ef;
          color: #18181b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .sl-tourn-card:hover .sl-tourn-card-cta {
          background: #18181b;
          color: #ffffff;
          transform: translateX(2px);
        }
      `}</style>

      <Header />

      {/* Mismo layout, fondo y posición de título que Nosotros / Galerías / Publicitar / Contacto */}
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
              Competencias
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
              Categorías
            </h1>
          </div>
        </div>

        {/* Grilla de tarjetas (solo torneos creados) */}
        <div className="mt-6 sm:mt-10">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Cargando torneos...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/70 p-10 text-center text-muted-foreground text-sm">
              No hay torneos creados actualmente.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                gap: 22,
              }}
            >
              {tournaments.map((t: any, idx: number) => {
                const matchedCat = categories.find(
                  (c: any) => String(c.id) === String(t.category),
                );
                const categoryName =
                  t.category_name || matchedCat?.name || "Categoría General";
                const theme = FLOODLIGHT_THEMES[idx % 8];

                return (
                  <Link
                    key={t.id}
                    to="/categorias/$id"
                    params={{ id: String(t.id) }}
                    className="sl-tourn-card"
                  >
                    {/* Ilustración superior a sangre completa */}
                    <TournamentFloodlightBanner index={idx} height={132} />

                    {/* Cuerpo limpio y editorial: Categoría asociada + Título del torneo */}
                    <div
                      style={{
                        padding: "18px 20px 16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 18,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {/* Etiqueta de categoría asociada */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "#f5f4f0",
                            border: "1px solid #e8e6df",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: theme.bg,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "#575652",
                              lineHeight: 1,
                            }}
                          >
                            Categoría · {categoryName}
                          </span>
                        </div>

                        {/* Nombre / Título del Torneo */}
                        <h3
                          className="sl-tourn-card-title"
                          style={{
                            margin: 0,
                            fontSize: 19,
                            fontWeight: 800,
                            color: "#141413",
                            lineHeight: 1.28,
                          }}
                        >
                          {t.name}
                        </h3>
                      </div>

                      {/* Pie de tarjeta minimalista */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 12,
                          borderTop: "1px solid #f0efe9",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#6f6e69",
                          }}
                        >
                          Ver posiciones y fixture
                        </span>
                        <span className="sl-tourn-card-cta">
                          <ArrowRight size={15} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
