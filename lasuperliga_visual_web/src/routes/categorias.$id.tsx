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
        const catRes = await fetch(`${API}/categories/`);
        const cats = await catRes.json();
        const cat = (cats || []).find((c: any) => c.id.toString() === id);
        if (!cancelled) setCategory(cat);

        const tRes = await fetch(`${API}/tournaments/`);
        const tournaments = await tRes.json();
        const t = (tournaments || []).find((t: any) => t.category?.toString() === id);
        if (!cancelled) setTournament(t || null);

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
      <Header
        mobileContext={
          category
            ? {
                title: tournament ? tournament.name : category.name,
                subtitle: `Categoría: ${category.name}`,
                backTo: "/categorias",
              }
            : undefined
        }
      />

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
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 14px;
          padding: 18px 20px;
          box-shadow: 0 1px 2px rgba(20, 20, 19, 0.03);
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
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
            {/* Header en PC idéntico a TournamentDetailView (en celular va integrado en la barra superior) */}
            <div className="sl-page-header sl-hide-mobile">
              <Link
                to="/categorias"
                title="Volver a Categorías"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px solid #d4d4d8",
                  color: "#1c1d21",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} />
              </Link>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: "color-mix(in srgb, var(--primary) 16%, transparent)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trophy size={22} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#1c1d21",
                    lineHeight: 1.25,
                  }}
                >
                  {tournament ? tournament.name : category.name}
                </h1>
                <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#71717a" }}>
                  Categoría: {category.name}
                </p>
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
                                                fontWeight: 600,
                                                color: "#6f737b",
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
                                                color: "#1c1d21",
                                              }}
                                            >
                                              {m.date.split("-").reverse().slice(0, 2).join("/")}
                                            </span>
                                          )}
                                          {m.time && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: "#6f737b",
                                              }}
                                            >
                                              {m.time.slice(0, 5)} Hs
                                            </span>
                                          )}
                                          {canchaLabel && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: "#6f737b",
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
