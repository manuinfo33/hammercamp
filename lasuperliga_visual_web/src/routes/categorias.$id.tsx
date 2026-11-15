import { API_URL } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Calendar,
  Award,
  ThumbsUp,
  AlertTriangle,
  ArrowLeft,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/categorias/$id")({
  component: CategoryDetailPage,
  head: () => ({ meta: [{ title: "Torneo — La Superliga" }] }),
});

const API = API_URL;

type TabId = "posiciones" | "fixture" | "goleadores" | "fair_play" | "sancionados";

const TABS: { id: TabId; label: string; mobileLabel: string; icon: any }[] = [
  { id: "posiciones", label: "Posiciones", mobileLabel: "Posiciones", icon: Trophy },
  { id: "fixture", label: "Fixture", mobileLabel: "Fixture", icon: Calendar },
  { id: "goleadores", label: "Goleadores", mobileLabel: "Goleadores", icon: Award },
  { id: "fair_play", label: "Fair Play", mobileLabel: "Fair Play", icon: ThumbsUp },
  { id: "sancionados", label: "Sancionados", mobileLabel: "Sanciones", icon: AlertTriangle },
];

const FLOODLIGHT_THEMES = [
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

function getTournamentVariant(tournamentOrId: any): number {
  const rawId = typeof tournamentOrId === "object" ? tournamentOrId?.id : tournamentOrId;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  if (id === 16) return 0;
  if (id === 2) return 1;
  return Math.abs(id * 3 + Math.floor(id / 2)) % FLOODLIGHT_THEMES.length;
}

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
          <path d="M -20,-28 L 20,-28 L 14,2 C 12,12 -12,12 -14,2 Z" fill={theme.cupMain} />
          <path d="M -20,-22 L -28,-22 L -25,-6 L -15,-4" fill="none" stroke={theme.cupMain} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20,-22 L 28,-22 L 25,-6 L 15,-4" fill="none" stroke={theme.cupMain} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-5" y="9" width="10" height="12" fill={theme.cupShade} />
          <rect x="-16" y="21" width="32" height="7" rx="3" fill={theme.cupBase} />
          <circle cx="0" cy="-12" r="6" fill={theme.emblem} />
        </g>
      );
    case 1:
      return (
        <g transform={transform}>
          <path d="M -13,-18 C -30,-30 -30,0 -11,4" fill="none" stroke={theme.cupMain} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 13,-18 C 30,-30 30,0 11,4" fill="none" stroke={theme.cupMain} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M -14,-28 L 14,-28 L 17,-8 C 17,6 8,12 0,12 C -8,12 -17,6 -17,-8 Z" fill={theme.cupMain} />
          <ellipse cx="0" cy="-28" rx="14" ry="3.5" fill={theme.cupShade} />
          <rect x="-6" y="11" width="12" height="9" rx="2" fill={theme.cupShade} />
          <rect x="-18" y="20" width="36" height="8" rx="3" fill={theme.cupBase} />
          <polygon points="0,-19 5,-11 0,-3 -5,-11" fill={theme.emblem} />
        </g>
      );
    case 2:
      return (
        <g transform={transform}>
          <polyline points="-17,-22 -27,-18 -23,-4 -12,-2" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17,-22 27,-18 23,-4 12,-2" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="-19,-26 19,-26 23,-12 11,6 -11,6 -23,-12" fill={theme.cupMain} />
          <polygon points="-8,-26 8,-26 10,-12 4,6 -4,6 -10,-12" fill={theme.cupShade} opacity="0.55" />
          <rect x="-4" y="6" width="8" height="11" fill={theme.cupShade} />
          <rect x="-13" y="17" width="26" height="4" rx="1.5" fill={theme.cupMain} />
          <rect x="-19" y="21" width="38" height="7" rx="2.5" fill={theme.cupBase} />
        </g>
      );
    case 3:
      return (
        <g transform={transform}>
          <path d="M -14,18 L -6,0 L -16,-14 L -6,-14 L 0,2 L 6,-14 L 16,-14 L 6,0 L 14,18 Z" fill={theme.cupShade} />
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
          <polygon points="-16,-22 -12,-31 -5,-24 0,-33 5,-24 12,-31 16,-22" fill={theme.cupShade} />
          <path d="M -18,-22 L 18,-22 L 18,-4 C 18,9 0,16 0,16 C 0,16 -18,9 -18,-4 Z" fill={theme.cupMain} />
          <path d="M -18,-16 L -26,-16 L -26,-5 L -16,-1" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M 18,-16 L 26,-16 L 26,-5 L 16,-1" fill="none" stroke={theme.cupMain} strokeWidth="2.8" strokeLinejoin="round" />
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
          <polygon points="0,-20 2.5,-14 9,-14 3.8,-10 5.8,-4 0,-8 -5.8,-4 -3.8,-10 -9,-14 -2.5,-14" fill={theme.emblem} />
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
          <path d="M -14,-18 C -14,-26 14,-26 14,-18 L 11,2 L -11,2 Z" fill={theme.cupMain} />
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
          <polygon points="0,-34 2.5,-28 9,-28 4,-24 6,-18 0,-22 -6,-18 -4,-24 -9,-28 -2.5,-28" fill={theme.cupBase} />
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

function fmtDate(d: string | null) {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  const [y, m, day] = parts;
  return `${day}/${m}/${y}`;
}

function CategoryDetailPage() {
  const { id } = Route.useParams();

  const [activeTab, setActiveTab] = useState<TabId>("posiciones");
  const [category, setCategory] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [fixtures, setFixtures] = useState<Record<number, any[]>>({});
  const [goleadores, setGoleadores] = useState<any[]>([]);
  const [vallas, setVallas] = useState<any[]>([]);
  const [sancionados, setSancionados] = useState<any[]>([]);
  const [fairPlay, setFairPlay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [catRes, tRes] = await Promise.all([
          fetch(`${API}/categories/`),
          fetch(`${API}/tournaments/`),
        ]);
        const cats = (await catRes.json()) || [];
        const tournaments = (await tRes.json()) || [];

        const t =
          tournaments.find((item: any) => item.id?.toString() === id) ||
          tournaments.find((item: any) => item.category?.toString() === id) ||
          null;
        const cat =
          cats.find(
            (c: any) => c.id?.toString() === (t?.category?.toString() || id),
          ) || null;

        if (!cancelled) {
          setCategory(cat);
          setTournament(t);
        }

        if (!t) {
          if (!cancelled) setLoading(false);
          return;
        }

        const zones = t.zones || [];
        const fixMap: Record<number, any[]> = {};
        await Promise.all(
          zones.map(async (z: any) => {
            const fRes = await fetch(`${API}/match-rounds/?tournament_zone=${z.id}`);
            fixMap[z.id] = await fRes.json();
          }),
        );
        if (!cancelled) setFixtures(fixMap);

        const [gRes, vRes, sRes, fpRes] = await Promise.all([
          fetch(`${API}/goleadores/?tournament=${t.id}`),
          fetch(`${API}/valla-menos-vencida/?tournament=${t.id}`),
          fetch(`${API}/sancionados/?tournament=${t.id}`),
          fetch(`${API}/tournaments/${t.id}/fair-play/`),
        ]);
        if (!cancelled) {
          setGoleadores(await gRes.json());
          setVallas(await vRes.json());
          setSancionados(await sRes.json());
          if (fpRes.ok) {
            setFairPlay(await fpRes.json());
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const zones = tournament?.zones || [];

  const teamLogoMap = useMemo(() => {
    const map: Record<string, string> = {};
    zones.forEach((z: any) => {
      (z.zone_teams || []).forEach((zt: any) => {
        if (zt.team_logo) {
          map[zt.team] = zt.team_logo;
          map[zt.team_name] = zt.team_logo;
        }
      });
    });
    return map;
  }, [zones]);

  /* Unificar fechas igual que en TournamentDetailView */
  const unifiedRounds = useMemo(() => {
    const allRounds: any[] = [];
    zones.forEach((z: any) => {
      const zRounds = fixtures[z.id] || [];
      zRounds.forEach((r: any) => {
        allRounds.push({
          ...r,
          matches: (r.matches || []).map((m: any) => ({
            ...m,
            date: m.date || r.date,
            time: m.time || r.time,
          })),
        });
      });
    });

    if (!allRounds.length) return [];

    const map = new Map<string, any>();
    allRounds.forEach((r) => {
      const key = r.name?.trim().toLowerCase() || `order_${r.order}`;
      if (!map.has(key)) {
        map.set(key, {
          ...r,
          matches: [...(r.matches || [])],
        });
      } else {
        const existing = map.get(key)!;
        existing.matches.push(...(r.matches || []));
        const seen = new Set();
        existing.matches = existing.matches.filter((m: any) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [fixtures, zones]);

  const fairPlayRows = useMemo(() => {
    if (fairPlay?.rows?.length) return fairPlay.rows;
    if (fairPlay?.standings?.length) return fairPlay.standings;
    const rows: any[] = [];
    zones.forEach((z: any) => {
      (z.zone_teams || []).forEach((zt: any) => {
        rows.push({
          team: zt.team,
          team_name: zt.team_name,
          team_logo: zt.team_logo,
          played: zt.matches_played ?? 0,
          yellow_cards: zt.yellow_cards ?? 0,
          red_cards: zt.red_cards ?? 0,
          blue_cards: zt.blue_cards ?? 0,
          points: zt.fair_play ?? 0,
        });
      });
    });
    return rows.sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [fairPlay, zones]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeVariant = getTournamentVariant(tournament || category?.id);
  const activeTheme = FLOODLIGHT_THEMES[activeVariant];

  return (
    <div
      className="sl-page-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#faf9f6",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#1c1d21",
      }}
    >
      <Header />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        .sl-page-root h1,
        .sl-page-root h2,
        .sl-page-root h3,
        .sl-page-root h4 {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          letter-spacing: -0.01em !important;
          text-transform: none !important;
        }
        .sl-main-container {
          flex: 1;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 24px 16px 56px;
          box-sizing: border-box;
        }
        .sl-page-header {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          padding: 18px 22px;
          box-shadow: 0 8px 26px rgba(15, 23, 42, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          transition: background-color 0.35s ease;
        }
        .sl-tn-tabs {
          display: flex;
          align-items: center;
          gap: 32px;
          border-bottom: 1px solid #d8cfc0;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .sl-tn-tabs::-webkit-scrollbar { display: none; }
        .sl-zone-card {
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(25, 20, 15, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .sl-zone-header {
          background: #18181b;
          border-bottom: 1px solid #27272a;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sl-zone-header span {
          font-weight: 800;
          letter-spacing: 1.5px;
          font-size: 14px;
          text-transform: uppercase;
          color: #ffffff;
        }
        .sl-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }
        .sl-table thead tr {
          background: #f4f4f5;
          border-bottom: 1px solid #e4e4e7;
        }
        .sl-table th {
          padding: 11px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #52525b;
          text-align: left;
        }
        .sl-table td {
          padding: 11px 10px;
          font-size: 13.5px;
          color: #1c1d21;
          border-bottom: 1px solid #f0eae1;
          background: #ffffff;
        }
        .sl-table tbody tr:last-child td {
          border-bottom: none;
        }
        .sl-team-badge {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: #f5efe6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sl-two-cols {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
          align-items: start;
        }
        .sl-mobile-bottom-nav {
          display: none;
        }
        @media (max-width: 900px) {
          .sl-two-cols {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .sl-page-root {
            padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
          }
          .sl-main-container {
            padding: 12px 10px 28px;
          }
          .sl-page-header {
            padding: 12px 14px;
            margin-bottom: 14px;
            border-radius: 12px;
            gap: 10px;
          }
          .sl-tn-tabs {
            display: none !important;
          }
          .sl-zone-card {
            border-radius: 12px;
          }
          .sl-zone-header {
            padding: 10px 12px;
          }
          .sl-zone-header span {
            font-size: 13px;
          }
          .sl-table th {
            padding: 7px 3px !important;
            font-size: 10px !important;
            letter-spacing: 0.03em;
          }
          .sl-table td {
            padding: 7px 3px !important;
            font-size: 12.5px !important;
          }
          .sl-table td.sl-team-td {
            padding-left: 4px !important;
          }
          .sl-team-badge {
            width: 24px;
            height: 24px;
            border-radius: 5px;
          }
          .sl-hide-mobile {
            display: none !important;
          }
          .sl-mobile-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: 60px;
            z-index: 9000;
            display: flex;
            align-items: stretch;
            justify-content: space-around;
            background: #ffffff;
            border-top: 2px solid #cc7a5c;
            box-shadow: 0 -6px 20px rgba(24, 24, 27, 0.1);
            padding-bottom: env(safe-area-inset-bottom, 0px);
            box-sizing: content-box;
          }
        }
      `}</style>

      <main className="sl-main-container">
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#71717a", fontSize: 14 }}>
            Cargando detalles...
          </div>
        ) : !category ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#71717a", fontSize: 14 }}>
            Categoría no encontrada.
          </div>
        ) : (
          <>
            {/* Recuadro de cabecera con la identidad visual ("Noche de Reflectores") y la copa del torneo */}
            <div
              className="sl-page-header"
              style={{
                backgroundColor: activeTheme.bg,
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderBottom: `3px solid ${activeTheme.cupMain}66`,
              }}
            >
              {/* Fondo SVG de haces de reflectores, arcos y estrellas del torneo */}
              <svg
                viewBox="0 0 800 160"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                }}
                aria-hidden="true"
              >
                <rect x="0" y="0" width="800" height="160" fill={activeTheme.bg} />
                <polygon
                  points="60,0 190,0 410,160 210,160"
                  fill={activeTheme.sideBeam}
                  opacity="0.18"
                />
                <polygon
                  points="740,0 610,0 390,160 590,160"
                  fill={activeTheme.sideBeam}
                  opacity="0.18"
                />
                <polygon
                  points="320,0 480,0 540,160 260,160"
                  fill={activeTheme.centerBeam}
                  opacity="0.14"
                />
                <circle
                  cx="120"
                  cy="165"
                  r="85"
                  fill="none"
                  stroke={activeTheme.arch}
                  strokeWidth="2"
                  strokeOpacity="0.28"
                />
                <circle
                  cx="680"
                  cy="165"
                  r="85"
                  fill="none"
                  stroke={activeTheme.arch}
                  strokeWidth="2"
                  strokeOpacity="0.28"
                />
                <polygon
                  points="280,26 283,33 290,33 284,37 286,44 280,40 274,44 276,37 270,33 277,33"
                  fill={activeTheme.star}
                  opacity="0.55"
                />
                <polygon
                  points="520,26 523,33 530,33 524,37 526,44 520,40 514,44 516,37 510,33 517,33"
                  fill={activeTheme.star}
                  opacity="0.55"
                />
              </svg>

              {/* Izquierda: Botón Volver + Barra dorada + Título del Torneo y Categoría */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Link
                  to="/categorias"
                  title="Volver a Categorías"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.24)",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    textDecoration: "none",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <ArrowLeft size={16} />
                </Link>

                <span
                  style={{
                    width: 5,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: activeTheme.cupMain,
                    flexShrink: 0,
                    boxShadow: "0 0 10px rgba(245, 221, 144, 0.35)",
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: "#ffffff",
                      lineHeight: 1.22,
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    {tournament ? tournament.name : category.name}
                  </h1>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: activeTheme.sideBeam,
                        letterSpacing: "0.02em",
                      }}
                    >
                      Categoría: {category.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        lineHeight: 1,
                        color: activeTheme.star,
                      }}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  </div>
                </div>
              </div>

              {/* Derecha: Copa y estrellas adjudicadas al torneo (idéntico al distintivo de Próxima Fecha en el Index) */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: 52,
                  padding: "0 10px",
                  borderRadius: 14,
                  background: "rgba(0, 0, 0, 0.26)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                title={tournament ? tournament.name : category.name}
              >
                <svg
                  viewBox="0 0 116 68"
                  width="80"
                  height="46"
                  aria-hidden="true"
                >
                  <polygon
                    points="16,22 18.2,27 23.5,27 19.2,30.2 20.8,35.5 16,32.4 11.2,35.5 12.8,30.2 8.5,27 13.8,27"
                    fill={activeTheme.star}
                  />
                  <polygon
                    points="100,22 102.2,27 107.5,27 103.2,30.2 104.8,35.5 100,32.4 95.2,35.5 96.8,30.2 92.5,27 97.8,27"
                    fill={activeTheme.star}
                  />
                  <TrophyIllustration
                    variant={activeVariant}
                    theme={activeTheme}
                    x={58}
                    y={36}
                    scale={0.88}
                  />
                </svg>
              </div>
            </div>

            {/* Submenú de pestañas minimalista (Desktop) */}
            {tournament && (
              <div className="sl-tn-tabs">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      style={{
                        background: "transparent",
                        color: isActive ? "#cc7a5c" : "#1c1d21",
                        border: "none",
                        borderBottom: isActive
                          ? "4px solid #cc7a5c"
                          : "4px solid transparent",
                        borderRadius: 0,
                        padding: "14px 4px",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "14.5px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                        outline: "none",
                        marginBottom: "-1px",
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {!tournament ? (
              <div
                className="sl-zone-card"
                style={{ padding: "40px 20px", textAlign: "center", color: "#71717a", fontSize: 14 }}
              >
                No hay un torneo activo para esta categoría.
              </div>
            ) : (
              <div>
                {/* ============================================================
                   1. POSICIONES (Idéntico a Principal en TournamentDetailView)
                   ============================================================ */}
                {activeTab === "posiciones" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {zones.length === 0 ? (
                      <div
                        className="sl-zone-card"
                        style={{ padding: "40px 20px", textAlign: "center", color: "#71717a", fontSize: 14 }}
                      >
                        Este torneo no tiene zonas configuradas.
                      </div>
                    ) : (
                      zones.map((zone: any) => {
                        const sortedZoneTeams = [...(zone.zone_teams || [])].sort(
                          (a: any, b: any) => {
                            if ((b.points || 0) !== (a.points || 0))
                              return (b.points || 0) - (a.points || 0);
                            const diffA = (a.goals_for || 0) - (a.goals_against || 0);
                            const diffB = (b.goals_for || 0) - (b.goals_against || 0);
                            if (diffB !== diffA) return diffB - diffA;
                            return (b.goals_for || 0) - (a.goals_for || 0);
                          },
                        );

                        return (
                          <div key={zone.id} className="sl-zone-card">
                            <div className="sl-zone-header">
                              <span>{zone.name}</span>
                            </div>

                            {sortedZoneTeams.length === 0 ? (
                              <div
                                style={{
                                  padding: "28px 16px",
                                  textAlign: "center",
                                  color: "#71717a",
                                  fontSize: 13,
                                }}
                              >
                                No hay equipos asignados a esta zona.
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <table className="sl-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: 38, textAlign: "center" }}>#</th>
                                      <th>Equipo</th>
                                      <th style={{ width: 52, textAlign: "center" }}>PS</th>
                                      <th style={{ width: 52, textAlign: "center" }}>PJ</th>
                                      <th style={{ width: 52, textAlign: "center" }}>PG</th>
                                      <th style={{ width: 52, textAlign: "center" }}>PE</th>
                                      <th style={{ width: 52, textAlign: "center" }}>PP</th>
                                      <th style={{ width: 52, textAlign: "center" }}>+/-</th>
                                      <th style={{ width: 48, textAlign: "center" }}>FP</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sortedZoneTeams.map((zt: any, idx: number) => {
                                      const diff = (zt.goals_for || 0) - (zt.goals_against || 0);
                                      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

                                      return (
                                        <tr key={zt.id || zt.team}>
                                          <td
                                            style={{
                                              textAlign: "center",
                                              fontWeight: idx === 0 ? 800 : 600,
                                              color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                            }}
                                          >
                                            {idx + 1}
                                          </td>
                                          <td className="sl-team-td">
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                              }}
                                            >
                                              <div className="sl-team-badge">
                                                {zt.team_logo ? (
                                                  <img
                                                    src={zt.team_logo}
                                                    alt=""
                                                    style={{
                                                      width: "100%",
                                                      height: "100%",
                                                      objectFit: "contain",
                                                    }}
                                                  />
                                                ) : (
                                                  <Users size={14} color="#cc7a5c" />
                                                )}
                                              </div>
                                              <span style={{ fontWeight: 500, lineHeight: 1.2 }}>
                                                {zt.team_name}
                                              </span>
                                            </div>
                                          </td>
                                          <td style={{ textAlign: "center", fontWeight: 800 }}>
                                            {zt.points ?? 0}
                                          </td>
                                          <td style={{ textAlign: "center", color: "#52525b" }}>
                                            {zt.matches_played ?? 0}
                                          </td>
                                          <td style={{ textAlign: "center", color: "#52525b" }}>
                                            {zt.matches_won ?? 0}
                                          </td>
                                          <td style={{ textAlign: "center", color: "#52525b" }}>
                                            {zt.matches_tied ?? 0}
                                          </td>
                                          <td style={{ textAlign: "center", color: "#52525b" }}>
                                            {zt.matches_lost ?? 0}
                                          </td>
                                          <td
                                            style={{
                                              textAlign: "center",
                                              fontWeight: diff !== 0 ? 600 : 400,
                                              color:
                                                diff > 0
                                                  ? "#10b981"
                                                  : diff < 0
                                                    ? "#ef4444"
                                                    : "#52525b",
                                            }}
                                          >
                                            {diffStr}
                                          </td>
                                          <td style={{ textAlign: "center", color: "#52525b" }}>
                                            {zt.fair_play ?? 0}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ============================================================
                   2. FIXTURE (Idéntico a las tarjetas de fecha en TournamentDetailView)
                   ============================================================ */}
                {activeTab === "fixture" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {unifiedRounds.length === 0 ? (
                      <div
                        className="sl-zone-card"
                        style={{ padding: "40px 20px", textAlign: "center", color: "#71717a", fontSize: 14 }}
                      >
                        No hay fechas programadas en este torneo.
                      </div>
                    ) : (
                      unifiedRounds.map((r: any) => (
                        <div key={r.name || r.id} className="sl-zone-card">
                          <div className="sl-zone-header">
                            <span>{r.name}</span>
                          </div>

                          <div>
                            {!r.matches?.length ? (
                              <div
                                style={{
                                  padding: "24px",
                                  textAlign: "center",
                                  color: "#6f737b",
                                  fontSize: 13,
                                }}
                              >
                                No hay partidos programados en esta fecha.
                              </div>
                            ) : (
                              r.matches.map((m: any, index: number) => {
                                const isLast = index === r.matches.length - 1;
                                const localName = m.home_team_name || m.local_team_name || "A confirmar";
                                const visitorName = m.away_team_name || m.visitor_team_name || "A confirmar";
                                const localScore = m.home_score ?? m.local_score ?? 0;
                                const visitorScore = m.away_score ?? m.visitor_score ?? 0;
                                const rawCancha = m.cancha ? String(m.cancha).trim() : "";
                                const canchaLabel = rawCancha
                                  ? `Cancha: ${rawCancha.replace(/^cancha\s*:?\s*/i, "") || rawCancha}`
                                  : null;

                                return (
                                  <div
                                    key={m.id || index}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "10px 16px",
                                      borderBottom: isLast ? "none" : "1px solid #f0eae1",
                                      background: index % 2 === 0 ? "#fafafb" : "#ffffff",
                                      minHeight: 56,
                                    }}
                                  >
                                    {/* Equipo Local */}
                                    <div
                                      style={{
                                        flex: "1 1 0",
                                        textAlign: "right",
                                        fontWeight: 500,
                                        fontSize: "0.85rem",
                                        color: "#1c1d21",
                                        paddingRight: 10,
                                        wordBreak: "break-word",
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      {localName}
                                    </div>

                                    {/* Columna Central (idéntica a Gestión) */}
                                    <div
                                      style={{
                                        flex: "0 0 104px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textAlign: "center",
                                        gap: 2,
                                      }}
                                    >
                                      {m.played ? (
                                        <>
                                          <span
                                            style={{
                                              fontSize: 8,
                                              fontWeight: 800,
                                              color: "#1c1d21",
                                              letterSpacing: "0.8px",
                                              textTransform: "uppercase",
                                            }}
                                          >
                                            FINALIZADO
                                          </span>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: 18,
                                              fontSize: 15,
                                              fontWeight: 800,
                                              color: "#1c1d21",
                                              marginTop: 1,
                                            }}
                                          >
                                            <span>{localScore}</span>
                                            <span>{visitorScore}</span>
                                          </div>
                                          {canchaLabel && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: "#141413",
                                              }}
                                            >
                                              {canchaLabel}
                                            </span>
                                          )}
                                        </>
                                      ) : m.date || m.time || canchaLabel ? (
                                        <>
                                          {m.date && (
                                            <span
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#141413",
                                              }}
                                            >
                                              {m.date.split("-").reverse().slice(0, 2).join("/")}
                                            </span>
                                          )}
                                          {m.time && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: "#141413",
                                              }}
                                            >
                                              {m.time.slice(0, 5)} Hs
                                            </span>
                                          )}
                                          {canchaLabel && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: "#141413",
                                              }}
                                            >
                                              {canchaLabel}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 20,
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: "#6f737b",
                                          }}
                                        >
                                          <span>-</span>
                                          <span>-</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Equipo Visitante */}
                                    <div
                                      style={{
                                        flex: "1 1 0",
                                        textAlign: "left",
                                        fontWeight: 500,
                                        fontSize: "0.85rem",
                                        color: "#1c1d21",
                                        paddingLeft: 10,
                                        wordBreak: "break-word",
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      {visitorName}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ============================================================
                   3. GOLEADORES Y VALLA MENOS VENCIDA
                   ============================================================ */}
                {activeTab === "goleadores" && (
                  <div className="sl-two-cols">
                    {/* Goleadores */}
                    <div className="sl-zone-card">
                      <div className="sl-zone-header">
                        <span>GOLEADORES</span>
                      </div>

                      {goleadores.length === 0 ? (
                        <div
                          style={{
                            padding: "28px 16px",
                            textAlign: "center",
                            color: "#71717a",
                            fontSize: 13,
                          }}
                        >
                          Sin goles registrados.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table className="sl-table">
                            <thead>
                              <tr>
                                <th style={{ width: 38, textAlign: "center" }}>#</th>
                                <th>Jugador</th>
                                <th>Equipo</th>
                                <th style={{ width: 64, textAlign: "center" }}>Goles</th>
                              </tr>
                            </thead>
                            <tbody>
                              {goleadores.map((g: any, idx: number) => (
                                <tr key={g.player_id || idx}>
                                  <td
                                    style={{
                                      textAlign: "center",
                                      fontWeight: idx === 0 ? 800 : 600,
                                      color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                    }}
                                  >
                                    {idx + 1}
                                  </td>
                                  <td style={{ fontWeight: 600 }}>
                                    {g.player__name} {g.player__last_name}
                                  </td>
                                  <td style={{ color: "#52525b" }}>{g.team_name}</td>
                                  <td
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                    }}
                                  >
                                    {g.goals}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Valla Menos Vencida */}
                    <div className="sl-zone-card">
                      <div className="sl-zone-header">
                        <span>VALLA MENOS VENCIDA</span>
                      </div>

                      {vallas.length === 0 ? (
                        <div
                          style={{
                            padding: "28px 16px",
                            textAlign: "center",
                            color: "#71717a",
                            fontSize: 13,
                          }}
                        >
                          Sin datos registrados.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table className="sl-table">
                            <thead>
                              <tr>
                                <th style={{ width: 38, textAlign: "center" }}>#</th>
                                <th>Equipo</th>
                                <th style={{ width: 64, textAlign: "center" }}>GC</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vallas.map((v: any, idx: number) => (
                                <tr key={v.id || idx}>
                                  <td
                                    style={{
                                      textAlign: "center",
                                      fontWeight: idx === 0 ? 800 : 600,
                                      color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                    }}
                                  >
                                    {idx + 1}
                                  </td>
                                  <td className="sl-team-td">
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <div className="sl-team-badge">
                                        {teamLogoMap[v.name] ? (
                                          <img
                                            src={teamLogoMap[v.name]}
                                            alt=""
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "contain",
                                            }}
                                          />
                                        ) : (
                                          <Users size={14} color="#cc7a5c" />
                                        )}
                                      </div>
                                      <span style={{ fontWeight: 500 }}>{v.name}</span>
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      textAlign: "center",
                                      fontWeight: 800,
                                      color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                    }}
                                  >
                                    {v.goals_against}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================
                   4. FAIR PLAY (Idéntico a Fair Play en TournamentDetailView)
                   ============================================================ */}
                {activeTab === "fair_play" && (
                  <div className="sl-zone-card">
                    <div className="sl-zone-header">
                      <span>TABLA GENERAL DE FAIR PLAY</span>
                    </div>

                    {fairPlayRows.length === 0 ? (
                      <div
                        style={{
                          padding: "28px 16px",
                          textAlign: "center",
                          color: "#71717a",
                          fontSize: 13,
                        }}
                      >
                        No hay datos de Fair Play para este torneo.
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table className="sl-table">
                          <thead>
                            <tr>
                              <th style={{ width: 40, textAlign: "center" }}>#</th>
                              <th>Equipo</th>
                              <th style={{ width: 56, textAlign: "center" }}>PJ</th>
                              <th
                                style={{ width: 50, textAlign: "center" }}
                                title="Tarjetas Amarillas"
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10,
                                    height: 14,
                                    background: "#facc15",
                                    borderRadius: 2,
                                    verticalAlign: "middle",
                                  }}
                                />
                              </th>
                              <th
                                style={{ width: 50, textAlign: "center" }}
                                title="Tarjetas Rojas"
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10,
                                    height: 14,
                                    background: "#ef4444",
                                    borderRadius: 2,
                                    verticalAlign: "middle",
                                  }}
                                />
                              </th>
                              {fairPlay?.blue_card_enabled !== false && (
                                <th
                                  style={{ width: 50, textAlign: "center" }}
                                  title="Tarjetas Azules"
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: 10,
                                      height: 14,
                                      background: "#0284c7",
                                      borderRadius: 2,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                </th>
                              )}
                              <th style={{ width: 60, textAlign: "center" }}>PTS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fairPlayRows.map((row: any, idx: number) => (
                              <tr key={row.team || row.team_id || idx}>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontWeight: idx === 0 ? 800 : 600,
                                    color: idx === 0 ? "#cc7a5c" : "#1c1d21",
                                  }}
                                >
                                  {idx + 1}
                                </td>
                                <td className="sl-team-td">
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <div className="sl-team-badge">
                                      {row.team_logo || teamLogoMap[row.team_name] ? (
                                        <img
                                          src={row.team_logo || teamLogoMap[row.team_name]}
                                          alt=""
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                          }}
                                        />
                                      ) : (
                                        <Users size={14} color="#cc7a5c" />
                                      )}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>{row.team_name}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center", color: "#52525b" }}>
                                  {row.played ?? 0}
                                </td>
                                <td style={{ textAlign: "center", color: "#52525b" }}>
                                  {row.yellow_cards || 0}
                                </td>
                                <td style={{ textAlign: "center", color: "#52525b" }}>
                                  {row.red_cards || 0}
                                </td>
                                {fairPlay?.blue_card_enabled !== false && (
                                  <td style={{ textAlign: "center", color: "#52525b" }}>
                                    {row.blue_cards || 0}
                                  </td>
                                )}
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontWeight: 800,
                                    color: "#cc7a5c",
                                  }}
                                >
                                  {row.points ?? row.fair_play ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================
                   5. SANCIONADOS
                   ============================================================ */}
                {activeTab === "sancionados" && (
                  <div className="sl-zone-card">
                    <div className="sl-zone-header">
                      <span>SANCIONADOS</span>
                    </div>

                    {sancionados.length === 0 ? (
                      <div
                        style={{
                          padding: "28px 16px",
                          textAlign: "center",
                          color: "#71717a",
                          fontSize: 13,
                        }}
                      >
                        No hay jugadores sancionados en este torneo.
                      </div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table className="sl-table">
                          <thead>
                            <tr>
                              <th>Jugador</th>
                              <th>Equipo</th>
                              <th style={{ textAlign: "center" }}>Sanción</th>
                              <th className="sl-hide-mobile" style={{ textAlign: "center" }}>
                                Regreso
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sancionados.map((s: any, idx: number) => (
                              <tr key={s.id || idx}>
                                <td style={{ fontWeight: 600 }}>{s.player_name}</td>
                                <td style={{ color: "#52525b" }}>{s.team_name}</td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    fontWeight: 700,
                                    color: "#dc2626",
                                  }}
                                >
                                  {s.Observation ||
                                    (s.dates_remaining
                                      ? `${s.dates_remaining} fecha(s)`
                                      : "Suspendido")}
                                </td>
                                <td
                                  className="sl-hide-mobile"
                                  style={{ textAlign: "center", color: "#52525b" }}
                                >
                                  {fmtDate(s.return_date) || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Barra inferior fija para celular (igual a .mobile-bottom-nav de Gestión) */}
      {tournament && (
        <nav className="sl-mobile-bottom-nav" aria-label="Navegación del torneo">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: isActive ? "rgba(204, 122, 92, 0.08)" : "transparent",
                  border: "none",
                  borderTop: isActive ? "3px solid #cc7a5c" : "3px solid transparent",
                  color: isActive ? "#cc7a5c" : "#8a8a93",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  {tab.mobileLabel}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="sl-hide-mobile">
        <Footer />
      </div>
    </div>
  );
}
