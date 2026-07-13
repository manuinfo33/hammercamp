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

        if (!t) { if (!cancelled) setLoading(false); return; }

        /* 3. Fixtures per zone */
        const zones = t.zones || [];
        const fixMap: Record<number, any[]> = {};
        await Promise.all(
          zones.map(async (z: any) => {
            const fRes = await fetch(`${API}/match-rounds/?tournament_zone=${z.id}`);
            fixMap[z.id] = await fRes.json();
          })
        );
        if (!cancelled) setFixtures(fixMap);

        /* 4. Goleadores / Vallas / Sancionados */
        const [gRes, vRes, sRes] = await Promise.all([
          fetch(`${API}/goleadores/?tournament=${t.id}`),
          fetch(`${API}/valla-menos-vencida/?tournament=${t.id}`),
          fetch(`${API}/sancionados/?tournament=${t.id}`),
        ]);
        if (!cancelled) {
          setGoleadores(await gRes.json());
          setVallas(await vRes.json());
          setSancionados(await sRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  /* --- Derived data helpers --- */
  const zones = tournament?.zones || [];

  /** For a zone, compute sorted standings */
  function standings(zone: any) {
    const teams = [...(zone.zone_teams || [])];
    teams.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goals_for - a.goals_against;
      const diffB = b.goals_for - b.goals_against;
      if (diffB !== diffA) return diffB - diffA;
      return a.team_name.localeCompare(b.team_name);
    });
    return teams;
  }

  /** For a zone, find last played round and next upcoming round */
  function lastAndNext(zoneId: number) {
    const rounds = fixtures[zoneId] || [];
    // played rounds: those with at least one match played
    const played = rounds.filter((r: any) => r.matches?.some((m: any) => m.played));
    const upcoming = rounds.filter((r: any) => r.matches?.length > 0 && r.matches.every((m: any) => !m.played));

    const lastRound = played.length > 0 ? played[played.length - 1] : null;
    const nextRound = upcoming.length > 0 ? upcoming[0] : null;
    return { lastRound, nextRound };
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HERO HEADER */}
      <section 
        className="relative border-b border-border/60 text-white bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${grassBg})` }}
      >
        <div className="absolute inset-0 bg-black/45 z-0" />
        <div className="relative z-10 container mx-auto px-6 py-16 md:py-20 flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Información de Categoría</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mt-4 mb-2 text-white">
            {loading ? "Cargando..." : category?.name || "Categoría no encontrada"}
          </h1>
          {tournament && (
            <p className="text-neutral-200 mt-2 text-sm font-medium">
              {tournament.name}
            </p>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-12 flex-1 space-y-16">

        {loading && (
          <div className="text-center text-muted-foreground py-20">Cargando información del torneo…</div>
        )}

        {!loading && !tournament && (
          <div className="text-center text-muted-foreground py-20">
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold uppercase border-l-4 border-primary pl-4">
                      {zones.length > 1 ? `Tabla de Posiciones — ${zone.name}` : "Tabla de Posiciones"}
                    </h2>
                  </div>

                  <div className="bg-surface border border-border/60 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-surface-elevated text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-2 md:px-6 py-4 font-semibold w-12 text-center">#</th>
                          <th className="px-3 md:px-6 py-4 font-semibold min-w-[160px] md:min-w-[200px]">Equipo</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">PS</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">PJ</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">G</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">E</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">P</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">GF</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">GC</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">DG</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center" title="Tarjetas Rojas">
                            <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-sm"></span>
                          </th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center" title="Tarjetas Amarillas">
                            <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-sm"></span>
                          </th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">IND</th>
                          <th className="px-2 md:px-6 py-4 font-semibold text-center">FP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {teams.length === 0 && (
                          <tr><td colSpan={14} className="px-6 py-8 text-center text-muted-foreground">Sin equipos en esta zona</td></tr>
                        )}
                        {teams.map((zt: any, idx: number) => {
                          const diff = zt.goals_for - zt.goals_against;
                          return (
                            <tr key={zt.id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-2 md:px-6 py-4 font-bold text-center">
                                <span className={idx === 0 ? "text-primary" : ""}>{idx + 1}</span>
                              </td>
                              <td className="px-3 md:px-6 py-4 font-bold">
                                <div className="flex items-center gap-3">
                                  {zt.team_logo ? (
                                    <img 
                                      src={zt.team_logo} 
                                      alt="" 
                                      className="w-8 h-8 object-contain" 
                                    />
                                  ) : (
                                    <img 
                                      src={superligaLogo} 
                                      alt="" 
                                      className="w-8 h-8 object-contain grayscale opacity-40" 
                                    />
                                  )}
                                  <span>{zt.team_name}</span>
                                </div>
                              </td>
                              <td className="px-2 md:px-6 py-4 font-bold text-primary text-center">{zt.points}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.played}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.won}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.drawn}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.lost}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.goals_for}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.goals_against}</td>
                              <td className={`px-2 md:px-6 py-4 text-center ${diff > 0 ? "text-green-500" : diff < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.red_cards || 0}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.yellow_cards || 0}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.indumentaria || 0}</td>
                              <td className="px-2 md:px-6 py-4 text-muted-foreground text-center">{zt.fair_play || 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}

            {/* ===== ÚLTIMA FECHA / SIGUIENTE FECHA ===== */}
            {zones.map((zone: any) => {
              const { lastRound, nextRound } = lastAndNext(zone.id);
              if (!lastRound && !nextRound) return null;
              return (
                <section key={`fixture-${zone.id}`}>
                  {zones.length > 1 && (
                    <h2 className="font-display text-xl font-bold uppercase border-l-4 border-primary pl-4 mb-6">
                      Fixture — {zone.name}
                    </h2>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* ÚLTIMA FECHA */}
                    <div className="bg-surface border border-border/60">
                      <div className="border-b border-border/60 px-6 py-5">
                        <h3 className="font-display text-xl font-bold uppercase">Última Fecha</h3>
                      </div>
                      {lastRound ? (
                        <>
                          <div className="text-center py-3 border-b border-border/60">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {lastRound.name}
                            </span>
                          </div>
                          <div className="divide-y divide-border/60">
                            {lastRound.matches?.map((m: any) => (
                              <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-3">
                                <span className="font-semibold text-sm flex-1 text-left truncate">{m.local_team_name}</span>
                                <div className="flex flex-col items-center flex-shrink-0 min-w-[100px]">
                                  <span className="font-display text-lg font-bold text-primary">
                                    {m.played ? `${m.local_score} - ${m.visitor_score}` : "VS"}
                                  </span>
                                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {(m.date || lastRound.date) && <span>{fmtDate(m.date || lastRound.date)}</span>}
                                    {(m.time || lastRound.time) && <span>{fmtTime(m.time || lastRound.time)}</span>}
                                  </div>
                                  {m.cancha && <span className="text-[10px] text-muted-foreground mt-0.5">{m.cancha}</span>}
                                </div>
                                <span className="font-semibold text-sm flex-1 text-right truncate">{m.visitor_team_name}</span>
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
                    <div className="bg-surface border border-border/60">
                      <div className="border-b border-border/60 px-6 py-5">
                        <h3 className="font-display text-xl font-bold uppercase">Siguiente Fecha</h3>
                      </div>
                      {nextRound ? (
                        <>
                          <div className="text-center py-3 border-b border-border/60">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {nextRound.name}
                            </span>
                          </div>
                          <div className="divide-y divide-border/60">
                            {nextRound.matches?.map((m: any) => (
                              <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-3">
                                <span className="font-semibold text-sm flex-1 text-left truncate">{m.local_team_name}</span>
                                <div className="flex flex-col items-center flex-shrink-0 min-w-[100px]">
                                  <div className="flex gap-2 text-[11px] text-muted-foreground">
                                    {(m.date || nextRound.date) && <span>{fmtDate(m.date || nextRound.date)}</span>}
                                    {(m.time || nextRound.time) && <span>{fmtTime(m.time || nextRound.time)}</span>}
                                  </div>
                                  {m.cancha && <span className="text-[10px] text-muted-foreground mt-0.5">{m.cancha}</span>}
                                </div>
                                <span className="font-semibold text-sm flex-1 text-right truncate">{m.visitor_team_name}</span>
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
            <section className="grid md:grid-cols-2 gap-6">
              {/* GOLEADORES */}
              <div className="bg-surface border border-border/60">
                <div className="border-b border-border/60 px-6 py-5">
                  <h3 className="font-display text-xl font-bold uppercase">Goleadores</h3>
                </div>
                {goleadores.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin datos de goleadores cargados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-elevated text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-center w-12">POS</th>
                          <th className="px-6 py-3 font-semibold text-left">Jugador</th>
                          <th className="px-6 py-3 font-semibold text-left">Equipo</th>
                          <th className="px-6 py-3 font-semibold text-center">Goles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {goleadores.map((g: any, i: number) => (
                          <tr key={g.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-3 text-center font-bold">{i + 1}</td>
                            <td className="px-6 py-3 font-semibold">{g.player_name}</td>
                            <td className="px-6 py-3 text-muted-foreground">{g.team_name}</td>
                            <td className="px-6 py-3 text-center font-bold text-primary">{g.goals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* VALLA MENOS VENCIDA */}
              <div className="bg-surface border border-border/60">
                <div className="border-b border-border/60 px-6 py-5">
                  <h3 className="font-display text-xl font-bold uppercase">Valla Menos Vencida</h3>
                </div>
                {vallas.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin datos de valla menos vencida cargados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-elevated text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-left">Equipo</th>
                          <th className="px-6 py-3 font-semibold text-center">Goles en Contra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {vallas.map((v: any) => (
                          <tr key={v.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-3 font-semibold">{v.team_name}</td>
                            <td className="px-6 py-3 text-center font-bold text-red-400">{v.goals_against}</td>
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
              <div className="bg-surface border border-border/60 max-w-2xl">
                <div className="border-b border-border/60 px-6 py-5">
                  <h3 className="font-display text-xl font-bold uppercase">Sancionados</h3>
                </div>
                {sancionados.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    Sin jugadores sancionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-elevated text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-left">Jugador</th>
                          <th className="px-6 py-3 font-semibold text-left">Equipo</th>
                          <th className="px-6 py-3 font-semibold text-right">Razón</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {sancionados.map((s: any) => (
                          <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-3 font-semibold">{s.player_name}</td>
                            <td className="px-6 py-3 text-muted-foreground">{s.team_name}</td>
                            <td className="px-6 py-3 text-right">
                              <span className="inline-block bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-2.5 py-1 rounded-sm">
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
