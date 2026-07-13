import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect } from "react";
import { User, Shield, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/mi-equipo")({
  component: Page,
  head: () => ({ meta: [{ title: "Mi Equipo — La Superliga" }] }),
});

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      setError("No has iniciado sesión como Delegado.");
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "Delegado") {
        setError("Acceso denegado. Esta sección es solo para Delegados.");
        setLoading(false);
        return;
      }
      setUser(parsedUser);

      // Fetch team players (Good Faith List)
      fetch(`http://127.0.0.1:8000/api/good-faith-lists/?team=${parsedUser.team_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error al obtener los datos del equipo.");
          }
          return res.json();
        })
        .then((data) => {
          setPlayers(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Error al cargar la lista de buena fe del equipo.");
          setLoading(false);
        });
    } catch (e) {
      console.error(e);
      setError("Error de autenticación.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.team_name) {
      document.title = `${user.team_name} — La Superliga`;
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* HERO HEADER */}
      <section className="bg-[#1c1d1f] border-b border-border/60 text-white py-16">
        <div className="container mx-auto px-6 flex flex-col items-center text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Panel de Delegados</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase mt-4 mb-2">
            {user ? (user.team_name || "Sin Equipo Asignado") : "Cargando..."}
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Gestión y lista de buena fe de tu equipo
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-12 flex-1">
        {loading && (
          <div className="text-center text-muted-foreground py-20">
            Cargando la información de tu equipo...
          </div>
        )}

        {!loading && error && (
          <div className="max-w-md mx-auto text-center py-20 bg-surface border border-border/60 p-8 rounded-sm">
            <AlertTriangle className="size-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold font-display uppercase">Acceso No Autorizado</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] text-xs px-6 py-3 hover:brightness-110 transition"
            >
              Volver al Inicio
            </Link>
          </div>
        )}

        {!loading && !error && user && (
          <div className="space-y-8">
            {/* Tarjeta de Información de Delegado */}
            <div className="bg-surface border border-border/60 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-tag text-tag-foreground px-2 py-1 rounded-sm">
                  Delegado Oficial
                </span>
                <h2 className="text-2xl font-bold uppercase font-display mt-3">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Usuario: {user.username} | Email: {user.email}</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-muted px-4 py-3 text-center border border-border/40 rounded-sm">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Equipo</div>
                  <div className="font-display font-semibold text-lg">{user.team_name}</div>
                </div>
              </div>
            </div>

            {/* Tabla de Jugadores */}
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold uppercase border-l-4 border-primary pl-4">
                Lista de Buena Fe
              </h2>
              
              <div className="bg-surface border border-border/60 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-elevated text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-16 text-center">N°</th>
                      <th className="px-6 py-4 font-semibold">Jugador</th>
                      <th className="px-6 py-4 font-semibold text-center">DNI</th>
                      <th className="px-6 py-4 font-semibold text-center">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {players.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No hay jugadores registrados en la lista de buena fe.
                        </td>
                      </tr>
                    ) : (
                      players.map((gf: any) => (
                        <tr key={gf.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-center text-primary">
                            {gf.shirt_number ? `#${gf.shirt_number}` : "-"}
                          </td>
                          <td className="px-6 py-4 font-bold">{gf.player_name}</td>
                          <td className="px-6 py-4 text-center text-muted-foreground">{gf.player_dni}</td>
                          <td className="px-6 py-4 flex justify-center">
                            {gf.player_photo ? (
                              <img
                                src={gf.player_photo}
                                alt={gf.player_name}
                                className="size-10 object-cover rounded-full border border-border"
                              />
                            ) : (
                              <div className="size-10 rounded-full border border-border/60 bg-muted/50 flex items-center justify-center">
                                <User className="size-4 text-muted-foreground/50" />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
