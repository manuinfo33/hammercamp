import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect } from "react";
import { 
  User, Shield, LogOut, ArrowRight, Mail, AtSign, 
  Calendar, CheckCircle, ShieldCheck, Trophy
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mi-cuenta")({
  component: Page,
  head: () => ({ meta: [{ title: "Mi Cuenta — La Superliga" }] }),
});

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      // Refresh from backend user-info endpoint
      fetch("http://127.0.0.1:8000/api/user-info/", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.username) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    toast.success("Has cerrado sesión correctamente.");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-semibold">
            <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando información de tu cuenta...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-2xl bg-surface-elevated border border-border/80 flex items-center justify-center mb-6 shadow-sm">
            <User className="size-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            Debes iniciar sesión con tu cuenta de delegado para acceder a los datos de tu perfil y equipo.
          </p>
          <Link
            to="/"
            className="bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-widest text-xs px-8 py-3.5 rounded-xl shadow-sm transition-all"
          >
            Volver al Inicio
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-10 max-w-4xl">
        {/* Banner Card */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 mb-8 border border-neutral-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-primary shadow-inner">
                <User className="size-10" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {user.role || "Delegado"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle className="size-3" /> Cuenta Verificada
                  </span>
                </div>
                <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
                  {fullName}
                </h1>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">@{user.username}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all cursor-pointer"
            >
              <LogOut className="size-4" /> Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card: Equipo Asignado */}
          <div className="bg-surface rounded-2xl border border-border/70 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> Equipo Representado
                </span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {user.team_name ? (
                <div className="flex items-center gap-4 my-2">
                  <div className="size-14 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
                    <Shield className="size-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold uppercase text-foreground">
                      {user.team_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user.current_tournament_name 
                        ? `Torneo: ${user.current_tournament_name}` 
                        : "Equipo registrado en el sistema"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground my-4">
                  No tienes un equipo asignado a tu perfil actualmente.
                </p>
              )}
            </div>

            {user.role === "Delegado" && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <Link
                  to="/mi-equipo"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                >
                  <Trophy className="size-4" /> Ir al Panel de Mi Equipo <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Card: Datos Personales */}
          <div className="bg-surface rounded-2xl border border-border/70 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="size-4 text-primary" /> Datos del Delegado
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground text-xs flex items-center gap-2">
                    <AtSign className="size-3.5" /> Usuario
                  </span>
                  <span className="font-semibold font-mono text-xs">{user.username}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground text-xs flex items-center gap-2">
                    <Mail className="size-3.5" /> Correo Electrónico
                  </span>
                  <span className="font-semibold text-xs">{user.email || "No registrado"}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground text-xs flex items-center gap-2">
                    <Shield className="size-3.5" /> Rol de Acceso
                  </span>
                  <span className="font-bold text-xs text-primary uppercase">{user.role || "Delegado"}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/70 mt-6 pt-4 border-t border-border/50">
              * Para solicitar modificaciones en tus datos de delegado o equipo, contacta a la administración de La Superliga.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
