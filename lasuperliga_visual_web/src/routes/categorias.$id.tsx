import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect } from "react";
import grassBg from "@/assets/football-grass.png";
import superligaLogo from "@/assets/logo-superliga.png";

export const Route = createFileRoute("/categorias/$id")({
  component: CategoryDetailPage,
  head: () => ({ meta: [{ title: "Categoría — La Superliga" }] }),
});

const API = "http://127.0.0.1:8000/api";

/* ---------- tiny helpers ---------- */
function fmtDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function fmtTime(t: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

/* ---------- component ---------- */
function CategoryDetailPage() {
  const { id } = Route.useParams();

  const [category, setCategory] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [fixtures, setFixtures] = useState<Record<number, any[]>>({});
  const [goleadores, setGoleadores] = useState<any[]>([]);
  const [vallas, setVallas] = useState<any[]>([]);
  const [sancionados, setSancionados] = useState<any[]>([]);
  const [fairPlay, setFairPlay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* --- Fetch everything --- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        /* 1. Categories → find this one */
        const catRes = await fetch(`${API}/categories/`);
        const cats = await catRes.json();
        const cat = cats.find((c: any) => c.id.toString() === id);
        if (!cancelled) setCategory(cat);

        /* 2. Tournaments → find the one for this category */
        const tRes = await fetch(`${API}/tournaments/`);
        const tournaments = await tRes.json();
        const t = tournaments.find((t: any) => t.category?.toString() === id);
        if (!cancelled) setTournament(t || null);

        if (!t) {
          if (!cancelled) setLoading(false);
          return;
        }

        /* 3. Fixtures per zone */
        const zones = t.zones || [];
        const fixMap: Record<number, any[]> = {};
        await Promise.all(
          zones.map(async (z: any) => {
            const fRes = await fetch(`${API}/match-rounds/?tournament_zone=${z.id}`);
            fixMap[z.id] = await fRes.json();
          }),
        );
        if (!cancelled) setFixtures(fixMap);

        /* 4. Goleadores / Vallas / Sancionados / Fair Play */
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

  /* --- Derived data helpers --- */
  const zones = tournament?.zones || [];

  function standings(zone: any) {
    return zone.zone_teams || [];
  }

  function lastAndNext(zoneId: number) {
    const rounds = fixtures[zoneId] || [];
    const played = rounds.filter((r: any) => r.matches?.some((m: any) => m.played));
    const upcoming = rounds.filter(
      (r: any) => r.matches?.length > 0 && r.matches.every((m: any) => !m.played),
    );

    const lastRound = played.length > 0 ? played[played.length - 1] : null;
    const nextRound = upcoming.length > 0 ? upcoming[0] : null;
    return { lastRound, nextRound };
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HERO HEADER */}
      <section
        className="relative border-b border-border/60 text-white bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${grassBg})` }}
      >
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 container mx-auto px-4 py-10 sm:py-14 md:px-6 md:py-20 flex flex-col items-center text-center">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
            Información de Categoría
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-2.5 md:mt-4 mb-1 text-white leading-tight">
            {loading ? "Cargando..." : category?.name || "Categoría no encontrada"}
          </h1>
          {tournament && (
            <p className="text-neutral-200 mt-1.5 text-xs sm:text-sm font-medium">
              {tournament.name}
            </p>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 flex-1 space-y-10 md:space-y-16">
        {loading && (
          <div className="text-center text-muted-foreground py-16">
            Cargando información del torneo…
          </div>
        )}

        {!loading && !tournament && (
          <div className="text-center text-muted-foreground py-16">
            No hay torneos activos para esta categoría.
          </div>
        )}

        {!loading && tournament && (
          <>
            {/* ===== STANDINGS — one table per zone ===== */}
            {zones.map((zone: any) => {
              const teams = standings(zone);
              return (
                <section key={zone.id}>
                  <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                    <span className="w-1.5 h-6 bg-primary rounded-full inline-block shrink-0"></span>
                    <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                      {zones.length > 1
                        ? `Tabla de Posiciones — ${zone.name}`
                        : "Tabla de Posiciones"}
                    </h2>
                  </div>

                  <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                        <thead className="bg-surface-elevated/70 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                          <tr>
                            <th className="px-2 sm:px-4 md:px-6 py-3 md:py-4 font-semibold w-8 sm:w-12 text-center">
                              #
                            </th>
                            <th className="px-2 sm:px-4 md:px-6 py-3 md:py-4 font-semibold min-w-[130px] sm:min-w-[170px] md:min-w-[200px]">
                              Equipo
                            </th>
                            <th className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-bold text-center">
                              PS
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              PJ
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              G
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              E
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              P
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              GF
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              GC
                            </th>
                            <th className="px-1.5 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              DG
                            </th>
                            <th className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                              FP
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {teams.length === 0 && (
                            <tr>
                              <td
                                colSpan={11}
                                className="px-6 py-10 text-center text-muted-foreground"
                              >
                                Sin equipos en esta zona
                              </td>
                            </tr>
                          )}
                          {teams.map((zt: any, idx: number) => {
                            const diff = zt.goals_for - zt.goals_against;
                            return (
                              <tr
                                key={zt.id}
                                className="hover:bg-primary/5 transition-colors duration-150"
                              >
                                <td className="px-2 sm:px-4 md:px-6 py-2.5 md:py-3.5 font-bold text-center">
                                  <span
                                    className={`inline-flex items-center justify-center size-5 sm:size-6 rounded-full text-[11px] sm:text-xs ${
                                      idx === 0
                                        ? "bg-primary/20 text-primary font-extrabold"
                                        : "text-foreground font-semibold"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 md:px-6 py-2.5 md:py-3.5 font-bold">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="size-6 sm:size-8 rounded-lg bg-surface-elevated/80 border border-border/40 p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs">
                                      {zt.team_logo ? (
                                        <img
                                          src={zt.team_logo}
                                          alt=""
                                          className="size-full object-contain"
                                        />
                                      ) : (
                                        <img
                                          src={superligaLogo}
                                          alt=""
                                          className="size-full object-contain grayscale opacity-35"
                                        />
                                      )}
                                    </div>
                                    <span className="tracking-tight truncate max-w-[115px] sm:max-w-none">
                                      {zt.team_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 font-extrabold text-primary text-center text-sm sm:text-base">
                                  {zt.points}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center font-medium">
                                  {zt.played}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                  {zt.won}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                  {zt.drawn}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                  {zt.lost}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                  {zt.goals_for}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                  {zt.goals_against}
                                </td>
                                <td className="px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-center">
                                  {diff > 0 ? (
                                    <span className="inline-flex items-center justify-center min-w-[24px] sm:min-w-[28px] px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600">
                                      +{diff}
                                    </span>
                                  ) : diff < 0 ? (
                                    <span className="inline-flex items-center justify-center min-w-[24px] sm:min-w-[28px] px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500/10 text-rose-500">
                                      {diff}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs font-medium">
                                      0
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center font-medium">
                                  {zt.fair_play || 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              );
            })}

            {/* ===== TABLA DE FAIR PLAY ===== */}
            {fairPlay && fairPlay.rows && fairPlay.rows.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-6 bg-primary rounded-full inline-block shrink-0"></span>
                    <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide">
                      Tabla de Fair Play
                    </h2>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                      <thead className="bg-surface-elevated/70 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                        <tr>
                          <th className="px-2 sm:px-4 md:px-6 py-3 md:py-4 font-semibold w-8 sm:w-12 text-center">
                            #
                          </th>
                          <th className="px-2 sm:px-4 md:px-6 py-3 md:py-4 font-semibold min-w-[130px] sm:min-w-[170px] md:min-w-[200px]">
                            Equipo
                          </th>
                          <th className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center">
                            J
                          </th>
                          <th
                            className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center"
                            title="Tarjetas Amarillas"
                          >
                            <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-[3px] shadow-xs align-middle"></span>
                          </th>
                          <th
                            className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center"
                            title="Tarjetas Rojas"
                          >
                            <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-[3px] shadow-xs align-middle"></span>
                          </th>
                          {fairPlay.blue_card_enabled && (
                            <th
                              className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center"
                              title="Tarjetas Azules"
                            >
                              <span className="inline-block w-2.5 h-3.5 bg-blue-500 rounded-[3px] shadow-xs align-middle"></span>
                            </th>
                          )}
                          {fairPlay.wo_enabled && (
                            <th
                              className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-semibold text-center"
                              title="Walkovers (No se presentó)"
                            >
                              WO
                            </th>
                          )}
                          <th className="px-2 sm:px-3 md:px-5 py-3 md:py-4 font-bold text-center">
                            PTS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {fairPlay.rows.map((row: any, idx: number) => (
                          <tr
                            key={row.team}
                            className="hover:bg-primary/5 transition-colors duration-150"
                          >
                            <td className="px-2 sm:px-4 md:px-6 py-2.5 md:py-3.5 font-bold text-center">
                              <span
                                className={`inline-flex items-center justify-center size-5 sm:size-6 rounded-full text-[11px] sm:text-xs ${
                                  idx === 0
                                    ? "bg-primary/20 text-primary font-extrabold"
                                    : "text-foreground font-semibold"
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 md:px-6 py-2.5 md:py-3.5 font-normal">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="size-6 sm:size-8 rounded-lg bg-surface-elevated/80 border border-border/40 p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs">
                                  {row.team_logo ? (
                                    <img
                                      src={row.team_logo}
                                      alt=""
                                      className="size-full object-contain"
                                    />
                                  ) : (
                                    <img
                                      src={superligaLogo}
                                      alt=""
                                      className="size-full object-contain grayscale opacity-35"
                                    />
                                  )}
                                </div>
                                <span className="tracking-tight truncate max-w-[120px] sm:max-w-none">
                                  {row.team_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center font-medium">
                              {row.played}
                            </td>
                            <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                              {row.yellow_cards || 0}
                            </td>
                            <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                              {row.red_cards || 0}
                            </td>
                            {fairPlay.blue_card_enabled && (
                              <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                {row.blue_cards || 0}
                              </td>
                            )}
                            {fairPlay.wo_enabled && (
                              <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 text-muted-foreground text-center">
                                {row.wo_count || 0}
                              </td>
                            )}
                            <td className="px-2 sm:px-3 md:px-5 py-2.5 md:py-3.5 font-extrabold text-primary text-center text-sm sm:text-base">
                              {row.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ===== ÚLTIMA FECHA / SIGUIENTE FECHA ===== */}
            {zones.map((zone: any) => {
              const { lastRound, nextRound } = lastAndNext(zone.id);
              if (!lastRound && !nextRound) return null;
              return (
                <section key={`fixture-${zone.id}`}>
                  {zones.length > 1 && (
                    <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                      <span className="w-1.5 h-6 bg-primary rounded-full inline-block shrink-0"></span>
                      <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                        Fixture — {zone.name}
                      </h2>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                    {/* ÚLTIMA FECHA */}
                    <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md">
                      <div className="border-b border-border/60 bg-surface-elevated/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
                        <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                          Última Fecha
                        </h3>
                      </div>
                      {lastRound ? (
                        <>
                          <div className="text-center py-2 bg-muted/20 border-b border-border/50">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-0.5 rounded-full bg-surface-elevated/80 border border-border/40 inline-block">
                              {lastRound.name}
                            </span>
                          </div>
                          <div className="divide-y divide-border/50">
                            {lastRound.matches?.map((m: any) => (
                              <div
                                key={m.id}
                                className="px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col gap-1.5 hover:bg-muted/15 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 sm:gap-4">
                                  <span className="font-semibold text-xs sm:text-sm flex-1 text-left leading-snug line-clamp-2 break-words">
                                    {m.local_team_name}
                                  </span>
                                  <div className="flex flex-col items-center shrink-0 min-w-[68px] sm:min-w-[90px]">
                                    <span className="font-display text-base sm:text-lg font-bold text-primary tracking-wide px-2.5 py-0.5 rounded-lg bg-primary/10">
                                      {m.played
                                        ? `${m.local_score} - ${m.visitor_score}`
                                        : "VS"}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-xs sm:text-sm flex-1 text-right leading-snug line-clamp-2 break-words">
                                    {m.visitor_team_name}
                                  </span>
                                </div>
                                {(m.date ||
                                  lastRound.date ||
                                  m.time ||
                                  lastRound.time ||
                                  m.cancha) && (
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                                    {(m.date || lastRound.date) && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {fmtDate(m.date || lastRound.date)}
                                      </span>
                                    )}
                                    {(m.time || lastRound.time) && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {fmtTime(m.time || lastRound.time)}
                                      </span>
                                    )}
                                    {m.cancha && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {m.cancha}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                          Aún no se jugó ninguna fecha
                        </div>
                      )}
                    </div>

                    {/* SIGUIENTE FECHA */}
                    <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md">
                      <div className="border-b border-border/60 bg-surface-elevated/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
                        <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          Siguiente Fecha
                        </h3>
                      </div>
                      {nextRound ? (
                        <>
                          <div className="text-center py-2 bg-muted/20 border-b border-border/50">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-0.5 rounded-full bg-surface-elevated/80 border border-border/40 inline-block">
                              {nextRound.name}
                            </span>
                          </div>
                          <div className="divide-y divide-border/50">
                            {nextRound.matches?.map((m: any) => (
                              <div
                                key={m.id}
                                className="px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col gap-1.5 hover:bg-muted/15 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 sm:gap-4">
                                  <span className="font-semibold text-xs sm:text-sm flex-1 text-left leading-snug line-clamp-2 break-words">
                                    {m.local_team_name}
                                  </span>
                                  <div className="flex flex-col items-center shrink-0 min-w-[56px] sm:min-w-[80px]">
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary/12 text-primary font-bold text-xs">
                                      VS
                                    </span>
                                  </div>
                                  <span className="font-semibold text-xs sm:text-sm flex-1 text-right leading-snug line-clamp-2 break-words">
                                    {m.visitor_team_name}
                                  </span>
                                </div>
                                {(m.date ||
                                  nextRound.date ||
                                  m.time ||
                                  nextRound.time ||
                                  m.cancha) && (
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                                    {(m.date || nextRound.date) && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {fmtDate(m.date || nextRound.date)}
                                      </span>
                                    )}
                                    {(m.time || nextRound.time) && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {fmtTime(m.time || nextRound.time)}
                                      </span>
                                    )}
                                    {m.cancha && (
                                      <span className="px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                                        {m.cancha}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                          No hay próxima fecha programada
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}

            {/* ===== GOLEADORES / VALLA MENOS VENCIDA ===== */}
            <section className="grid md:grid-cols-2 gap-5 md:gap-6">
              {/* GOLEADORES */}
              <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="border-b border-border/60 bg-surface-elevated/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                    Goleadores
                  </h3>
                </div>
                {goleadores.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin datos de goleadores cargados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-surface-elevated/70 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                        <tr>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-center w-10 sm:w-12">
                            POS
                          </th>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-left">
                            Jugador
                          </th>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-left">
                            Equipo
                          </th>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-center">
                            Goles
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {goleadores.map((g: any, i: number) => (
                          <tr
                            key={g.id}
                            className="hover:bg-primary/5 transition-colors duration-150"
                          >
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-center font-bold">
                              {i === 0 ? (
                                <span className="inline-flex items-center justify-center size-5 sm:size-6 rounded-full bg-amber-400/20 text-amber-600 font-extrabold text-[11px] sm:text-xs">
                                  1
                                </span>
                              ) : i === 1 ? (
                                <span className="inline-flex items-center justify-center size-5 sm:size-6 rounded-full bg-neutral-200 text-neutral-600 font-bold text-[11px] sm:text-xs">
                                  2
                                </span>
                              ) : i === 2 ? (
                                <span className="inline-flex items-center justify-center size-5 sm:size-6 rounded-full bg-amber-700/15 text-amber-700 font-bold text-[11px] sm:text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  {i + 1}
                                </span>
                              )}
                            </td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 font-semibold">
                              {g.player_name}
                            </td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-muted-foreground">
                              {g.team_name}
                            </td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-center font-extrabold text-primary text-sm sm:text-base">
                              {g.goals}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* VALLA MENOS VENCIDA */}
              <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="border-b border-border/60 bg-surface-elevated/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                    Valla Menos Vencida
                  </h3>
                </div>
                {vallas.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin datos de valla menos vencida cargados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-surface-elevated/70 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                        <tr>
                          <th className="px-4 sm:px-5 py-3 font-semibold text-left">
                            Equipo
                          </th>
                          <th className="px-4 sm:px-5 py-3 font-semibold text-center">
                            Goles en Contra
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {vallas.map((v: any) => (
                          <tr
                            key={v.id}
                            className="hover:bg-primary/5 transition-colors duration-150"
                          >
                            <td className="px-4 sm:px-5 py-2.5 sm:py-3 font-semibold">
                              {v.team_name}
                            </td>
                            <td className="px-4 sm:px-5 py-2.5 sm:py-3 text-center font-bold text-rose-500 text-sm sm:text-base">
                              {v.goals_against}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ===== SANCIONADOS ===== */}
            <section>
              <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden max-w-2xl transition-all duration-200 hover:shadow-md">
                <div className="border-b border-border/60 bg-surface-elevated/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
                  <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    Sancionados
                  </h3>
                </div>
                {sancionados.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin jugadores sancionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-surface-elevated/70 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                        <tr>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-left">
                            Jugador
                          </th>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-left">
                            Equipo
                          </th>
                          <th className="px-3 sm:px-5 py-3 font-semibold text-right">
                            Razón
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sancionados.map((s: any) => (
                          <tr
                            key={s.id}
                            className="hover:bg-primary/5 transition-colors duration-150"
                          >
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 font-semibold">
                              {s.player_name}
                            </td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-muted-foreground">
                              {s.team_name}
                            </td>
                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-right">
                              <span className="inline-block bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {s.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
