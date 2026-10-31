import { API_URL, BACKEND_URL, getMediaUrl } from "@/lib/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  Trophy, Users, UserCheck, ShieldAlert, CreditCard, MessageSquare, 
  Shield, Camera, UserPlus, Trash2, Check, X, Search, FileSpreadsheet, 
  Plus, RefreshCw, Upload, AlertCircle, Calendar, Clock, MapPin, 
  DollarSign, CheckCircle2, Clock3, Send, MessageCircle, FileText, 
  Lock, AlertTriangle, ArrowRight, ArrowLeft, LogOut, User, Bell
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-superliga.png";
import adNike from "@/assets/ad-nike.png";
import adAdidas from "@/assets/ad-adidas.png";
import adCocacola from "@/assets/ad-cocacola.png";

export const Route = createFileRoute("/mi-equipo")({
  component: Page,
  head: () => ({ meta: [{ title: "Mi Equipo — La Superliga" }] }),
});

const getMediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return getMediaUrl(url);
};

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [team, setTeam] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMedia, setSavingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'principal' | 'buena_fe' | 'sanciones' | 'pagos' | 'reclamos'>('principal');

  // Search filter for good faith list
  const [searchPlayerQuery, setSearchPlayerQuery] = useState("");

  // Files & Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Mini Ads Carousel
  const ads = [
    { id: 1, image: adNike, name: "Nike" },
    { id: 2, image: adAdidas, name: "Adidas" },
    { id: 3, image: adCocacola, name: "Coca Cola" }
  ];
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Add Player Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [dniInput, setDniInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [shirtNumberInput, setShirtNumberInput] = useState("");
  const [birthDateInput, setBirthDateInput] = useState("");
  const [photoFileInput, setPhotoFileInput] = useState<File | null>(null);
  const [photoFilePreview, setPhotoFilePreview] = useState<string | null>(null);
  const [searchingDni, setSearchingDni] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<any>(null);
  const [promptExistingPlayer, setPromptExistingPlayer] = useState(false);
  const [submittingPlayer, setSubmittingPlayer] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Remove confirmation modal
  const [playerToRemove, setPlayerToRemove] = useState<any>(null);
  const [removingPlayer, setRemovingPlayer] = useState(false);

  // New Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTipo, setClaimTipo] = useState("arbitraje");
  const [claimAsunto, setClaimAsunto] = useState("");
  const [claimDescripcion, setClaimDescripcion] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Notifications Popover State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // User Profile Popover State
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    toast.success("Has cerrado sesión correctamente.");
    window.location.href = "/";
  };

  // Fetch Team & Dashboard Data
  const fetchAllData = async (authToken: string, teamId: number, currentTournId?: number | null) => {
    try {
      let activeToken = authToken;

      // 1. Fetch Delegate Dashboard Data
      let dashRes = await fetch(`${API_URL}/teams/${teamId}/delegate-dashboard/`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (dashRes.status === 401) {
        // Try refreshing token
        const storedRefresh = localStorage.getItem("refresh");
        if (storedRefresh) {
          const rRes = await fetch(`${API_URL}/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: storedRefresh }),
          });
          if (rRes.ok) {
            const rData = await rRes.json();
            localStorage.setItem("token", rData.access);
            setToken(rData.access);
            activeToken = rData.access;
            dashRes = await fetch(`${API_URL}/teams/${teamId}/delegate-dashboard/`, {
              headers: { Authorization: `Bearer ${activeToken}` },
            });
          }
        }
      }

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setDashboardData(dData);
        if (dData.team) {
          setTeam(dData.team);
          setLogoPreview(dData.team.logo || null);
          setPhotoPreview(dData.team.team_photo || null);
        }
      }

      // 2. Fetch Good Faith List (LBF)
      const url = currentTournId
        ? `${API_URL}/good-faith-lists/?team=${teamId}&tournament=${currentTournId}`
        : `${API_URL}/good-faith-lists/?team=${teamId}`;
      const lbfRes = await fetch(url, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (lbfRes.ok) {
        const lbfData = await lbfRes.json();
        setPlayers(lbfData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
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

      if (!parsedUser.team_id) {
        setError("No tienes un equipo asignado a tu cuenta de delegado. Contacta a la administración de La Superliga.");
        setLoading(false);
        return;
      }

      setUser(parsedUser);
      setToken(storedToken);

      // Refresh user info from backend
      const refreshAccessToken = async () => {
        const storedRefresh = localStorage.getItem("refresh");
        if (!storedRefresh) return null;
        try {
          const rRes = await fetch(`${API_URL}/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: storedRefresh }),
          });
          if (rRes.ok) {
            const rData = await rRes.json();
            localStorage.setItem("token", rData.access);
            setToken(rData.access);
            return rData.access;
          }
        } catch (err) {
          console.error("Token refresh failed:", err);
        }
        return null;
      };

      const loadData = async () => {
        let currentToken = storedToken;
        try {
          let userRes = await fetch(`${API_URL}/user-info/", {
            headers: { Authorization: `Bearer ${currentToken}` },
          });

          if (userRes.status === 401) {
            // Token expired, try refreshing
            const newToken = await refreshAccessToken();
            if (newToken) {
              currentToken = newToken;
              userRes = await fetch(`${API_URL}/user-info/", {
                headers: { Authorization: `Bearer ${newToken}` },
              });
            } else {
              toast.error("Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.");
              handleLogout();
              return;
            }
          }

          if (userRes.ok) {
            const data = await userRes.json();
            if (data && data.team_id) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
              await fetchAllData(currentToken, data.team_id, data.current_tournament_id);
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching user-info:", e);
        }

        // Fallback to parsedUser in localStorage
        await fetchAllData(currentToken, parsedUser.team_id, parsedUser.current_tournament_id);
      };

      loadData().finally(() => setLoading(false));
    } catch (e) {
      console.error(e);
      setError("Error de autenticación.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.team_name) {
      document.title = `${user.team_name} — Mi Equipo — La Superliga`;
    }
  }, [user]);

  // Handle Logo & Photo file selection
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    try {
      setSavingMedia(true);
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`${API_URL}/teams/${team.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const updated = await res.json();
        setTeam((prev: any) => ({ ...prev, logo: updated.logo }));
        setLogoPreview(updated.logo);
        toast.success("Escudo del equipo actualizado correctamente.");
      } else {
        toast.error("No se pudo subir el escudo.");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setSavingMedia(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    try {
      setSavingMedia(true);
      const fd = new FormData();
      fd.append("team_photo", file);
      const res = await fetch(`${API_URL}/teams/${team.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const updated = await res.json();
        setTeam((prev: any) => ({ ...prev, team_photo: updated.team_photo }));
        setPhotoPreview(updated.team_photo);
        toast.success("Foto del equipo actualizada correctamente.");
      } else {
        toast.error("No se pudo subir la foto del equipo.");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setSavingMedia(false);
    }
  };

  // Search DNI in Player global database
  const handleSearchDni = async (dni: string) => {
    const cleanDni = dni.trim();
    if (!cleanDni || cleanDni.length < 5) return;

    try {
      setSearchingDni(true);
      setModalError(null);
      const res = await fetch(`${API_URL}/players/?search=${encodeURIComponent(cleanDni)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const results = await res.json();
        const exactMatch = results.find((p: any) => String(p.dni).trim() === cleanDni);
        if (exactMatch) {
          setFoundPlayer(exactMatch);
          setPromptExistingPlayer(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingDni(false);
    }
  };

  const handleUseExistingPlayer = () => {
    if (foundPlayer) {
      setFirstNameInput(foundPlayer.first_name);
      setLastNameInput(foundPlayer.last_name);
      if (foundPlayer.birth_date) setBirthDateInput(foundPlayer.birth_date);
      if (foundPlayer.photo) setPhotoFilePreview(getMediaUrl(foundPlayer.photo));
    }
    setPromptExistingPlayer(false);
  };

  const handleDeclineExistingPlayer = () => {
    setFoundPlayer(null);
    setDniInput("");
    setPromptExistingPlayer(false);
  };

  // Submit player addition
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanDni = dniInput.trim();
    const cleanFirst = firstNameInput.trim();
    const cleanLast = lastNameInput.trim();

    if (!cleanDni || !cleanFirst || !cleanLast) {
      setModalError("Apellido, Nombre y DNI son campos obligatorios.");
      return;
    }

    try {
      setSubmittingPlayer(true);
      let playerId = foundPlayer ? foundPlayer.id : null;

      // 1. If not an existing player, create in Player database
      if (!playerId) {
        const playerFd = new FormData();
        playerFd.append("first_name", cleanFirst);
        playerFd.append("last_name", cleanLast);
        playerFd.append("dni", cleanDni);
        if (birthDateInput) playerFd.append("birth_date", birthDateInput);
        if (photoFileInput) playerFd.append("photo", photoFileInput);

        const playerRes = await fetch(`${API_URL}/players/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: playerFd,
        });

        if (!playerRes.ok) {
          const errData = await playerRes.json();
          const msg = errData?.dni?.[0] || errData?.detail || "No se pudo crear el jugador en la base de datos.";
          setModalError(msg);
          setSubmittingPlayer(false);
          return;
        }

        const newPlayer = await playerRes.json();
        playerId = newPlayer.id;
      }

      // 2. Link player to Good Faith List
      const tournamentId = user.current_tournament_id || dashboardData?.tournament?.id || null;
      const gflPayload: any = {
        tournament: tournamentId,
        team: user.team_id,
        player: playerId,
      };
      if (shirtNumberInput.trim()) {
        gflPayload.shirt_number = parseInt(shirtNumberInput.trim(), 10);
      }

      const gflRes = await fetch(`${API_URL}/good-faith-lists/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gflPayload),
      });

      if (!gflRes.ok) {
        const gflErr = await gflRes.json();
        const msg = gflErr?.player?.[0] || gflErr?.non_field_errors?.[0] || gflErr?.detail || "No se pudo inscribir al jugador en la lista de buena fe.";
        setModalError(msg);
        setSubmittingPlayer(false);
        return;
      }

      toast.success(`${cleanLast}, ${cleanFirst} incorporado con éxito a tu equipo.`);
      setShowAddModal(false);
      resetAddModal();
      fetchAllData(token, user.team_id, user.current_tournament_id);
    } catch (err) {
      console.error(err);
      setModalError("Error al conectar con el servidor.");
    } finally {
      setSubmittingPlayer(false);
    }
  };

  const resetAddModal = () => {
    setDniInput("");
    setFirstNameInput("");
    setLastNameInput("");
    setShirtNumberInput("");
    setBirthDateInput("");
    setPhotoFileInput(null);
    setPhotoFilePreview(null);
    setFoundPlayer(null);
    setPromptExistingPlayer(false);
    setModalError(null);
  };

  // Remove player from LBF
  const handleConfirmRemove = async () => {
    if (!playerToRemove) return;
    try {
      setRemovingPlayer(true);
      const res = await fetch(`${API_URL}/good-faith-lists/${playerToRemove.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success(`${playerToRemove.player_name} ha sido quitado de tu equipo.`);
        setPlayerToRemove(null);
        fetchAllData(token, user.team_id, user.current_tournament_id);
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.detail || "No se pudo remover al jugador.");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setRemovingPlayer(false);
    }
  };

  // Submit New Claim
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAsunto.trim() || !claimDescripcion.trim()) {
      toast.error("Por favor completa el asunto y la descripción del reclamo.");
      return;
    }

    try {
      setSubmittingClaim(true);
      const payload = {
        team: user.team_id,
        tournament: user.current_tournament_id || dashboardData?.tournament?.id || null,
        tipo: claimTipo,
        asunto: claimAsunto.trim(),
        descripcion: claimDescripcion.trim(),
      };

      const res = await fetch(`${API_URL}/reclamos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Tu reclamo ha sido enviado correctamente a la administración.");
        setShowClaimModal(false);
        setClaimAsunto("");
        setClaimDescripcion("");
        fetchAllData(token, user.team_id, user.current_tournament_id);
      } else {
        toast.error("No se pudo registrar el reclamo. Inténtalo nuevamente.");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-12">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-semibold">
          <span className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Cargando datos de tu equipo...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-red-500" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase mb-2">Acceso no disponible</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-6">{error}</p>
        <Link
          to="/"
          className="bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const filteredPlayers = players.filter((p) => {
    if (!searchPlayerQuery.trim()) return true;
    const q = searchPlayerQuery.toLowerCase();
    return (
      (p.player_name && p.player_name.toLowerCase().includes(q)) ||
      (p.player_dni && String(p.player_dni).includes(q)) ||
      (p.shirt_number && String(p.shirt_number).includes(q))
    );
  });

  const TABS = [
    { id: 'principal', label: 'Principal', shortLabel: 'Principal', icon: <Trophy size={18} /> },
    { id: 'buena_fe', label: 'Lista de buena fe', shortLabel: 'Buena Fe', icon: <Users size={18} /> },
    { id: 'sanciones', label: 'Sanciones', shortLabel: 'Sanciones', icon: <ShieldAlert size={18} /> },
    { id: 'pagos', label: 'Pagos', shortLabel: 'Pagos', icon: <CreditCard size={18} /> },
    { id: 'reclamos', label: 'Reclamos', shortLabel: 'Reclamos', icon: <MessageSquare size={18} /> },
  ] as const;

  const standings = dashboardData?.standings;
  const nextMatch = dashboardData?.next_match;
  const lastMatch = dashboardData?.last_match;
  const financial = dashboardData?.financial;
  const sanciones = dashboardData?.sanciones || [];
  const reclamos = dashboardData?.reclamos || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-[64px] md:pb-0">
      
      {/* Hidden file inputs for Logo & Team photo */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* HEADER DEDICADO DE LA NUEVA PANTALLA DE MI EQUIPO (Sticky Fijo) */}
      <header className="sticky top-0 z-40 bg-[#18181b] text-white border-b border-neutral-800 shadow-md">
        <div className="container mx-auto px-4 md:px-6 py-2.5 md:py-3.5 flex items-center justify-between gap-3">
          
          {/* Izquierda: Logo de la Superliga + Hola, <Nombre del delegado> */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/" className="cursor-pointer inline-flex items-center justify-center shrink-0" title="La Superliga">
              <img
                src={logo}
                alt="La Superliga"
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
            <span className="text-sm md:text-base font-normal text-white truncate">
              Hola, <span className="font-bold text-white uppercase">{user?.first_name || "DELEGADO"}</span>
            </span>
          </div>

          {/* Derecha: Auspiciantes + Notificaciones + Perfil de Usuario */}
          <div className="flex items-center justify-end gap-2.5 md:gap-3 shrink-0">
            {/* Auspiciantes: visible solo en pantallas medianas y grandes */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                Auspicia:
              </span>
              <div className="w-[85px] h-[50px] relative overflow-hidden border border-neutral-700/80 rounded-xl bg-neutral-900/60 flex items-center justify-center p-0 shadow-xs">
                <img
                  src={ads[currentAdIndex].image}
                  alt={ads[currentAdIndex].name}
                  className="w-full h-full object-cover animate-in fade-in duration-500 rounded-xl"
                  key={ads[currentAdIndex].id}
                />
              </div>
            </div>

            {/* Campanita de Notificaciones con popover */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className={`relative p-2 md:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  notificationsOpen 
                    ? "bg-white/10 border-white/40 text-white shadow-xs" 
                    : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                }`}
                aria-label="Notificaciones"
                title="Notificaciones de delegado"
              >
                <Bell className="size-4 md:size-5 text-white" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full animate-pulse shadow-[0_0_6px_#facc15]" />
              </button>

              {/* Popover desplegable de notificaciones */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-surface-elevated border border-border/80 shadow-2xl rounded-2xl p-4 z-50 text-foreground animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">Notificaciones</span>
                    </div>
                    <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Nuevo
                    </span>
                  </div>

                  <div className="py-2 divide-y divide-border/40">
                    <div className="py-2.5 flex items-start gap-3">
                      <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Plantel habilitado para la fecha
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Tu lista de buena fe se encuentra activa y validada.
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">Hace 15 min</span>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-3">
                      <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Recordatorio de fixture
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Próximo partido publicado en la sección principal.
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">Ayer</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-center">
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] text-primary hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ícono de Usuario con Popover (Mi Cuenta / Cerrar Sesión) a la derecha */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className={`relative p-2 md:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  userMenuOpen 
                    ? "bg-white/10 border-white/40 text-white shadow-xs" 
                    : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                }`}
                aria-label="Perfil de usuario"
                title="Menú de delegado"
              >
                <User className="size-4 md:size-5 text-white" />
              </button>

              {/* Popover desplegable de Usuario */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl p-2 z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 border-b border-neutral-800 mb-1">
                    <p className="text-xs font-bold uppercase text-white truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {user?.team_name || "Delegado"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/mi-cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-neutral-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <User className="size-4 text-primary" />
                      <span>Mi Cuenta</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="size-4 text-red-400" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* RECTÁNGULO SUPERIOR DEL EQUIPO (DESKTOP: Sin Panel Oficial, sin usuario y sin torneo activo aquí) */}
      <section className="hidden md:block bg-neutral-900 text-white border-b border-neutral-800 shadow-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left: Escudo + Nombre + Delegado */}
            <div className="flex items-center gap-5">
              {/* Escudo with upload trigger */}
              <div
                onClick={() => logoInputRef.current?.click()}
                className="size-24 rounded-2xl bg-white/10 border-2 border-white/20 p-2 relative flex items-center justify-center overflow-hidden cursor-pointer group shadow-lg shrink-0"
                title="Hacé clic para cambiar el escudo"
              >
                {logoPreview ? (
                  <img src={getMediaUrl(logoPreview)} alt="Escudo" className="w-full h-full object-contain" />
                ) : (
                  <Shield className="size-12 text-white/50" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] uppercase font-bold tracking-wider">
                  <Camera className="size-5 mb-1 text-white" />
                  Cambiar
                </div>
              </div>

              {/* Info text */}
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
                    {team?.name || user?.team_name || "Mi Equipo"}
                  </h1>
                  <span 
                    title="El nombre del equipo solo puede ser modificado por la administración del torneo."
                    className="p-1 rounded-md bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-help"
                  >
                    <Lock className="size-3.5" />
                  </span>
                </div>

                <div className="mt-2 text-sm text-neutral-400">
                  <span>
                    Delegado: <strong className="text-white font-semibold">{user?.first_name} {user?.last_name}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Team Photo Card */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Foto Oficial del Equipo</span>
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-52 h-24 rounded-xl bg-white/5 border border-white/15 relative flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner"
                title="Hacé clic para cambiar la foto del equipo"
              >
                {photoPreview ? (
                  <img src={getMediaUrl(photoPreview)} alt="Foto Equipo" className="w-full h-full object-cover" />
                ) : (
                  <FileSpreadsheet className="size-8 text-white/40" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] uppercase font-bold tracking-wider text-white">
                  <Camera className="size-4 mb-1" />
                  Subir Foto Grupal
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN SUPERIOR SUTIL PARA CELULAR (En lugar del rectángulo grande) */}
      <div className="md:hidden container mx-auto px-4 pt-4">
        <div className="flex items-center gap-3.5 p-3.5 bg-neutral-900 text-white rounded-2xl border border-neutral-800 shadow-md">
          {/* Escudo del equipo (no editable aquí) */}
          <div 
            className="size-13 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner"
          >
            {logoPreview ? (
              <img src={getMediaUrl(logoPreview)} alt="Escudo" className="w-full h-full object-contain" />
            ) : (
              <Shield className="size-6 text-neutral-400" />
            )}
          </div>

          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-neutral-400 font-normal leading-tight">
              Delegado del equipo
            </span>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white truncate leading-snug">
              {(team?.name || user?.team_name || "Mi Equipo").toUpperCase()}
            </h2>
          </div>
        </div>
      </div>

      {/* SUB MENU HORIZONTAL (Desktop): Con Cerrar Sesión a la derecha */}
      <div className="hidden md:block bg-surface border-b border-[#d8cfc0] shadow-xs">
        <div className="container mx-auto px-6">
          <div className="hidden md:flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    type="button"
                    style={{
                      background: 'transparent',
                      color: isActive ? '#cc7a5c' : '#191919',
                      border: 'none',
                      borderBottom: isActive ? '4px solid #cc7a5c' : '4px solid transparent',
                      borderRadius: 0,
                      padding: '14px 4px 14px 4px',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '14.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      outline: 'none',
                      boxShadow: 'none',
                      height: 'auto',
                      marginBottom: '-1px',
                    }}
                    className="flex items-center gap-2 group cursor-pointer"
                  >
                    <span className={`${isActive ? 'text-[#cc7a5c]' : 'text-[#7f776f] group-hover:text-[#cc7a5c]'} transition-colors`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cerrar Sesión a la derecha del submenú horizontal */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20"
              title="Cerrar Sesión de Delegado"
            >
              <LogOut className="size-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DE CADA PESTAÑA */}
      <main className="container mx-auto px-4 md:px-6 pt-4 pb-2 md:py-8 flex-1">
        
        {/* ============================================================ */}
        {/* 1. TAB: PRINCIPAL (Dashboard General) */}
        {/* ============================================================ */}
        {activeTab === 'principal' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* 1. Card: Saldo Actual del Equipo (Primero) - Fondo Negro */}
            <div className="bg-neutral-900 text-white rounded-2xl border border-neutral-800 p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" /> Saldo Actual del equipo
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                    financial?.saldo < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {financial?.saldo < 0 ? 'Saldo Deudor' : 'Al Día'}
                  </span>
                </div>

                <div className="my-4">
                  <span className="text-xs text-neutral-400">Balance consolidado</span>
                  <p className={`font-display text-4xl font-black mt-1 ${
                    financial?.saldo < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    ${Number(financial?.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  {financial?.observaciones && (
                    <p className="text-xs text-neutral-300 mt-3 italic bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700/60">
                      "{financial.observaciones}"
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pagos')}
                className="mt-4 w-full py-2.5 px-4 rounded-xl border border-neutral-800 bg-neutral-800/60 text-neutral-200 hover:bg-neutral-800 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                Ver Historial de Pagos <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* 2. Card: Estadísticas del Torneo Actual (Segundo) */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <Trophy className="size-6 text-primary shrink-0" />
                    <div>
                      <h3 className="font-display text-lg font-bold uppercase tracking-tight text-neutral-900">
                        {dashboardData?.tournament?.name || user?.current_tournament_name || "Torneo Oficial"}
                      </h3>
                      <p className="text-xs font-medium text-neutral-500">
                        {dashboardData?.tournament?.zone_name || "Zona Principal"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla de Estadísticas Resumidas: Posición, Puntos, Jugados, Fair Play */}
                {standings ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                    {/* Posición */}
                    <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-3.5 text-center transition-all hover:bg-neutral-100/80 hover:border-neutral-300">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">Posición</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">{standings.position ? `${standings.position}°` : "-"}</p>
                    </div>
                    {/* Puntos */}
                    <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-3.5 text-center transition-all hover:bg-neutral-100/80 hover:border-neutral-300">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">Puntos</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">{standings.points}</p>
                    </div>
                    {/* Jugados */}
                    <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-3.5 text-center transition-all hover:bg-neutral-100/80 hover:border-neutral-300">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">Jugados</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">{standings.played}</p>
                    </div>
                    {/* Fair Play */}
                    <div className="bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-3.5 text-center transition-all hover:bg-neutral-100/80 hover:border-neutral-300">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500 block">Fair Play</span>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">{standings.fair_play ?? 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-neutral-400 text-sm">
                    Aún no hay estadísticas disponibles para la zona del equipo.
                  </div>
                )}

                {/* Barra de Progreso del Torneo (Fechas jugadas / Fechas totales) */}
                {(() => {
                  const played = dashboardData?.tournament?.played_rounds ?? (standings?.played || 0);
                  const total = dashboardData?.tournament?.total_rounds || Math.max(played, (standings?.total_teams ? (standings.total_teams - 1) : 0), 10);
                  const pct = total > 0 ? Math.min(100, Math.round((played / total) * 100)) : 0;
                  return (
                    <div className="mt-5 mb-2 bg-neutral-50/80 border border-neutral-200/70 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700">Progreso del Torneo</span>
                        <span className="font-bold text-neutral-900">
                          {played} de {total} fechas <span className="text-neutral-500 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200/70 rounded-full h-2 mt-2.5 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full shadow-xs" 
                          style={{ width: `${pct}%`, backgroundColor: '#00d592' }} 
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end text-xs">
                <Link 
                  to="/categorias"
                  className="text-neutral-900 font-bold hover:text-primary inline-flex items-center gap-1.5 transition-colors group"
                >
                  <span>Ver tabla completa</span>
                  <ArrowRight className="size-3.5 text-neutral-900 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* 3. Grid: Próximo Partido (Tercero) + Plantel Inscripto + Sanciones Activas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 3: Próximo Partido */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                      <Calendar className="size-4 text-primary" /> Próximo Partido
                    </span>
                    {nextMatch && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-300 shadow-2xs">
                        {nextMatch.round_name || "Próxima Fecha"}
                      </span>
                    )}
                  </div>

                  {nextMatch ? (
                    <div className="flex flex-col items-center text-center my-2">
                      {/* Rival Logo */}
                      <div className="size-16 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center p-2 mb-2 shadow-xs group-hover:scale-105 transition-transform">
                        {nextMatch.rival_logo ? (
                          <img src={getMediaUrl(nextMatch.rival_logo)} alt={nextMatch.rival_name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield className="size-8 text-neutral-400" />
                        )}
                      </div>

                      <h4 className="font-display text-xl font-bold uppercase text-neutral-900 mt-1 tracking-tight">
                        {nextMatch.rival_name}
                      </h4>

                      {/* Info Date, Time, Cancha en una sola línea bien distribuida */}
                      <div className="w-full bg-neutral-50/90 border border-neutral-200/80 rounded-xl px-3 py-2.5 mt-3.5 flex items-center justify-around gap-2 text-xs">
                        {/* Fecha */}
                        <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                          <Calendar className="size-3.5 text-neutral-900 shrink-0" />
                          <span className="whitespace-nowrap">{nextMatch.date || "A confirmar"}</span>
                        </div>
                        <span className="text-neutral-300">|</span>
                        {/* Hora */}
                        <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                          <Clock className="size-3.5 text-neutral-900 shrink-0" />
                          <span className="whitespace-nowrap">{nextMatch.time ? `${nextMatch.time} hs` : "A confirmar"}</span>
                        </div>
                        <span className="text-neutral-300">|</span>
                        {/* Cancha: texto directo Cancha: <numero> */}
                        <div className="flex items-center gap-1 text-neutral-800 font-semibold truncate">
                          <span className="truncate">Cancha: {nextMatch.cancha || "A confirmar"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-neutral-400 text-xs flex flex-col items-center">
                      <Calendar className="size-6 text-neutral-300 mb-2" />
                      No hay partidos programados para la próxima fecha.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end text-xs">
                  <Link 
                    to="/categorias"
                    className="text-neutral-900 font-bold hover:text-primary inline-flex items-center gap-1.5 transition-colors group"
                  >
                    <span>Ver Fixture Completo</span>
                    <ArrowRight className="size-3.5 text-neutral-900 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Card 4: Plantel Inscripto (Buena Fe Status) */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                      <Users className="size-4 text-primary" /> Plantel Inscripto
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-xs font-medium text-neutral-500">Cupo de Lista de Buena Fe</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display text-4xl font-black text-neutral-900">{players.length}</span>
                      <span className="text-neutral-500 font-semibold text-xs">/ {dashboardData?.buena_fe?.limit_players || 25} permitidos</span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-neutral-100 rounded-full h-2 mt-3.5 overflow-hidden border border-neutral-200/60">
                      <div 
                        className="h-full transition-all duration-500 rounded-full shadow-xs" 
                        style={{ width: `${Math.min(100, (players.length / (dashboardData?.buena_fe?.limit_players || 25)) * 100)}%`, backgroundColor: '#00d592' }} 
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('buena_fe')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <span>Gestionar Jugadores</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Card 5: Sanciones Status */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                      <ShieldAlert className="size-4 text-primary" /> Sanciones Activas
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-xs font-medium text-neutral-500 block mb-2">Jugadores Sancionados</span>

                    {sanciones.length > 0 ? (
                      <div className="space-y-2">
                        {sanciones.slice(0, 2).map((s: any, idx: number) => {
                          const rawFechas = s.fechas_suspension || s.fechas || "1";
                          const numFechas = typeof rawFechas === "string" ? rawFechas.replace(/[^0-9]/g, "") || rawFechas : rawFechas;
                          return (
                            <div key={idx} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-3.5 bg-red-600 rounded-[2px] shadow-2xs inline-block shrink-0 border border-red-700" title="Tarjeta roja / Suspensión" />
                                <span className="font-bold text-neutral-900 truncate">{s.player_name || "Sanción colectiva"}</span>
                              </div>
                              <span className="shrink-0 text-neutral-900 text-xs">
                                <strong className="font-bold text-neutral-900">{numFechas}</strong>{" "}
                                <span className="font-normal text-neutral-600">{Number(numFechas) === 1 ? "fecha" : "fechas"}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-neutral-400">
                        No hay jugadores sancionados en el equipo actualmente.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('sanciones')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
                >
                  <span>Ver Detalle Sanciones</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* 2. TAB: LISTA DE BUENA FE (Jugadores + Botón Agregar Aquí) */}
        {/* ============================================================ */}
        {activeTab === 'buena_fe' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header de la sección con el botón de agregar jugador trasladado aquí */}
            <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Users className="size-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                    Lista de Buena Fe
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Jugadores registrados para disputar los torneos con tu equipo.
                  </p>
                </div>
              </div>

              {/* Botón de Agregar Jugador */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAddModal();
                    setShowAddModal(true);
                  }}
                  className="bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="size-4" /> Agregar Jugador
                </button>
              </div>
            </div>

            {/* Buscador de Jugadores */}
            <div className="flex items-center gap-3 bg-surface rounded-xl border border-border/70 px-4 py-2.5">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Buscar jugador por nombre, apellido o DNI..."
                value={searchPlayerQuery}
                onChange={(e) => setSearchPlayerQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60"
              />
              {searchPlayerQuery && (
                <button 
                  onClick={() => setSearchPlayerQuery("")} 
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Tabla de Jugadores */}
            <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-elevated/70 border-b border-border/70 text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-16 text-center">N°</th>
                      <th className="px-6 py-4 font-semibold text-center w-16">Foto</th>
                      <th className="px-6 py-4 font-semibold">Jugador</th>
                      <th className="px-6 py-4 font-semibold text-center">DNI</th>
                      <th className="px-6 py-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          {searchPlayerQuery 
                            ? "No se encontraron jugadores que coincidan con la búsqueda." 
                            : "No hay jugadores registrados en la lista de buena fe de tu equipo."}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                resetAddModal();
                                setShowAddModal(true);
                              }}
                              className="text-xs font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer"
                            >
                              + Añadir primer jugador
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((gf: any) => (
                        <tr key={gf.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-center text-primary font-mono">
                            {gf.shirt_number ? `#${gf.shirt_number}` : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {gf.player_photo ? (
                              <img
                                src={getMediaUrl(gf.player_photo)}
                                alt={gf.player_name}
                                className="size-10 object-cover rounded-full border border-border mx-auto"
                              />
                            ) : (
                              <div className="size-10 rounded-full border border-border/60 bg-muted/50 flex items-center justify-center mx-auto">
                                <User className="size-4 text-muted-foreground/50" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">
                            {gf.player_name}
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground font-mono">
                            {gf.player_dni}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setPlayerToRemove(gf)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Quitar jugador de mi equipo"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* 3. TAB: SANCIONES (Jugadores Sancionados por Roja / Azul) */}
        {/* ============================================================ */}
        {activeTab === 'sanciones' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                    Control de Sanciones y Fair Play
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Seguimiento oficial de sanciones disciplinarias de tu equipo (Tarjetas Rojas, Azules y Tribunal).
                  </p>
                </div>
              </div>
            </div>

            {sanciones.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border/70 p-12 text-center shadow-xs flex flex-col items-center">
                <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-foreground mb-1">
                  Tu equipo no tiene sanciones activas
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  ¡Excelente comportamiento deportivo! Todos los jugadores de tu lista de buena fe se encuentran habilitados para jugar la próxima fecha.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sanciones.map((sanc: any, idx: number) => (
                  <div key={idx} className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs flex items-start gap-4">
                    {sanc.player_photo ? (
                      <img src={getMediaUrl(sanc.player_photo)} alt={sanc.player_name} className="size-12 rounded-xl object-cover border border-border shrink-0" />
                    ) : (
                      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        sanc.tipo === 'roja' 
                          ? 'bg-red-500/15 border-red-500/30 text-red-500' 
                          : sanc.tipo === 'azul'
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                      }`}>
                        <ShieldAlert className="size-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-foreground truncate">
                          {sanc.player_name || "Sanción al Equipo"}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          sanc.tipo === 'roja' 
                            ? 'bg-red-500/10 text-red-500' 
                            : sanc.tipo === 'azul'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {sanc.tipo === 'roja' ? 'Tarjeta Roja' : sanc.tipo === 'azul' ? 'Tarjeta Azul' : 'Tribunal'}
                        </span>
                      </div>

                      {sanc.player_dni && (
                        <p className="text-xs text-muted-foreground font-mono">DNI: {sanc.player_dni}</p>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1 text-xs">
                        {sanc.fechas_suspension && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Fechas a cumplir:</span>
                            <span className="font-bold text-red-500">{sanc.fechas_suspension}</span>
                          </div>
                        )}
                        {sanc.motivo && (
                          <p className="text-muted-foreground">
                            <strong className="text-foreground">Motivo:</strong> {sanc.motivo}
                          </p>
                        )}
                        {sanc.partido && (
                          <p className="text-[11px] text-muted-foreground/70">
                            Partido: {sanc.partido} {sanc.fecha_partido ? `(${sanc.fecha_partido})` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. TAB: PAGOS (Estado de deuda y transacciones) */}
        {/* ============================================================ */}
        {activeTab === 'pagos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="size-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                    Estado de Cuenta y Pagos
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Control de pagos fecha a fecha, aranceles y saldo actual de tu equipo.
                  </p>
                </div>
              </div>
            </div>

            {/* Saldo Card */}
            <div className="bg-neutral-900 text-white rounded-2xl p-6 border border-neutral-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                  Saldo Actual Consolidado
                </span>
                <p className={`font-display text-4xl font-black mt-1 ${
                  financial?.saldo < 0 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  ${Number(financial?.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    financial?.saldo < 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {financial?.saldo < 0 ? 'Saldo Deudor Pendiente' : 'Al Día / Sin Deuda'}
                  </span>
                  {financial?.observaciones && (
                    <span className="text-xs text-neutral-400 italic">
                      — {financial.observaciones}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-neutral-400 max-w-sm bg-white/5 border border-white/10 rounded-xl p-3">
                * Los comprobantes de transferencias o pagos en efectivo son asentados por la administración del torneo. Si abonaste y no ves tu pago, iniciá un reclamo en la pestaña correspondiente.
              </div>
            </div>

            {/* Transacciones List */}
            <div className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                  Historial de Movimientos
                </h3>
                <span className="text-xs text-muted-foreground">
                  {financial?.transactions?.length || 0} movimientos registrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-elevated/70 border-b border-border/70 text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Fecha</th>
                      <th className="px-6 py-3 font-semibold">Concepto</th>
                      <th className="px-6 py-3 font-semibold">Tipo</th>
                      <th className="px-6 py-3 font-semibold">Método</th>
                      <th className="px-6 py-3 font-semibold text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(!financial?.transactions || financial.transactions.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No se registran movimientos de pago recientes para este equipo.
                        </td>
                      </tr>
                    ) : (
                      financial.transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{tx.fecha}</td>
                          <td className="px-6 py-3.5 font-bold text-foreground">
                            {tx.concepto}
                            {tx.descripcion && (
                              <span className="block text-xs font-normal text-muted-foreground mt-0.5">{tx.descripcion}</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              tx.tipo === 'pago' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {tx.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground">{tx.metodo_pago}</td>
                          <td className={`px-6 py-3.5 text-right font-bold font-mono ${
                            tx.tipo === 'pago' ? 'text-emerald-500' : 'text-foreground'
                          }`}>
                            {tx.tipo === 'pago' ? '+' : '-'}${Number(tx.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* 5. TAB: RECLAMOS (Iniciar reclamo y ver estado) */}
        {/* ============================================================ */}
        {activeTab === 'reclamos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="size-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                    Reclamos y Consultas
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Canal directo con la administración para reclamos de partidos, planillas o dudas reglamentarias.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="size-4" /> Iniciar Reclamo
              </button>
            </div>

            {reclamos.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border/70 p-12 text-center shadow-xs flex flex-col items-center">
                <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                  <MessageCircle className="size-8" />
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-foreground mb-1">
                  No has iniciado ningún reclamo
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mb-6">
                  Si tu equipo tuvo algún inconveniente en la fecha, errores en la planilla o consultas sobre sanciones, podés iniciar un reclamo formal aquí.
                </p>
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  + Iniciar Primer Reclamo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reclamos.map((rec: any) => (
                  <div key={rec.id} className="bg-surface rounded-2xl border border-border/70 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface-elevated border border-border text-primary">
                            {rec.tipo}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">#{rec.id} • {rec.created_at}</span>
                        </div>
                        <h4 className="font-bold text-base text-foreground">{rec.asunto}</h4>
                      </div>

                      <div>
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                          rec.estado === 'resuelto'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : rec.estado === 'rechazado'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : rec.estado === 'en_proceso'
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {rec.estado_display}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 whitespace-pre-line bg-surface-elevated/40 p-4 rounded-xl border border-border/40">
                      {rec.descripcion}
                    </p>

                    {rec.respuesta && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5" /> Respuesta de la Organización:
                        </span>
                        <p className="text-sm text-foreground whitespace-pre-line pt-1">
                          {rec.respuesta}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* SUB MENU INFERIOR FIJO PARA CELULAR (< 768px): Diseño oscuro refinado y acorde */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 h-[62px] bg-[#18181b] border-t border-neutral-800 z-50 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
        style={{
          background: '#18181b',
          borderTop: '1px solid #27272a',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                borderTop: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                color: isActive ? '#ffffff' : '#a1a1aa',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={tab.label}
            >
              <span className={isActive ? 'text-white scale-110 transition-transform' : 'text-neutral-400'}>
                {tab.icon}
              </span>
              <span 
                style={{ 
                  fontSize: '9.5px', 
                  fontWeight: isActive ? 700 : 500, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  marginTop: '3px',
                  color: isActive ? '#ffffff' : '#a1a1aa'
                }}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* MODAL: AÑADIR JUGADOR */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-surface text-foreground border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">
                    Añadir Jugador
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Incorporar a tu lista de buena fe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSavePlayer} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* DNI Search Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  DNI del Jugador *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej: 38456123"
                    value={dniInput}
                    onChange={(e) => {
                      setDniInput(e.target.value);
                      if (foundPlayer) setFoundPlayer(null);
                    }}
                    onBlur={() => handleSearchDni(dniInput)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                  {searchingDni && (
                    <div className="absolute right-3 top-3 text-primary animate-spin">
                      <RefreshCw className="size-4" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Si el jugador ya existe en la base de datos, se autocompletarán sus datos.
                </span>
              </div>

              {/* Prompt: Existing Player found in DB */}
              {promptExistingPlayer && foundPlayer && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-3">
                    {foundPlayer.photo ? (
                      <img src={getMediaUrl(foundPlayer.photo)} alt={foundPlayer.first_name} className="size-12 rounded-full object-cover border border-primary" />
                    ) : (
                      <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User className="size-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">¡Jugador existente en sistema!</span>
                      <h4 className="font-bold text-sm text-foreground">{foundPlayer.last_name}, {foundPlayer.first_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">DNI: {foundPlayer.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleUseExistingPlayer}
                      className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs uppercase transition-all hover:brightness-110 cursor-pointer"
                    >
                      Usar estos datos
                    </button>
                    <button
                      type="button"
                      onClick={handleDeclineExistingPlayer}
                      className="py-2 px-3 rounded-lg border border-border text-muted-foreground font-bold text-xs uppercase hover:text-foreground cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: González"
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Martín"
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Shirt Number & Birth Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Número de Camiseta
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="Ej: 10"
                    value={shirtNumberInput}
                    onChange={(e) => setShirtNumberInput(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={birthDateInput}
                    onChange={(e) => setBirthDateInput(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Player Photo Upload */}
              {!foundPlayer && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Foto del Jugador (Opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    {photoFilePreview ? (
                      <img src={getMediaUrl(photoFilePreview)} alt="Preview" className="size-12 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="size-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground">
                        <User className="size-5" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-surface-elevated hover:bg-muted border border-border text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                      <Upload className="size-4" />
                      <span>{photoFileInput ? "Cambiar foto" : "Subir foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotoFileInput(file);
                            setPhotoFilePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border/70 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPlayer}
                  className="bg-primary hover:brightness-110 disabled:opacity-50 text-primary-foreground font-bold uppercase text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingPlayer ? (
                    <>
                      <span className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Jugador"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR JUGADOR DE MI EQUIPO */}
      {playerToRemove && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPlayerToRemove(null)}
        >
          <div
            className="bg-surface text-foreground border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display text-xl font-bold uppercase">
                Quitar Jugador
              </h3>
              <p className="text-xs text-muted-foreground">
                ¿Estás seguro de que deseas desvincular a <strong className="text-foreground">{playerToRemove.player_name}</strong> de tu lista de buena fe?
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-2 bg-surface-elevated p-2 rounded-lg border border-border/40">
                * El jugador solo se quitará de la plantilla de tu equipo, pero sus datos se conservarán en la base general de La Superliga.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlayerToRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removingPlayer}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {removingPlayer ? (
                  <>
                    <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Quitando...
                  </>
                ) : (
                  "Confirmar y Quitar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INICIAR NUEVO RECLAMO */}
      {showClaimModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowClaimModal(false)}
        >
          <div
            className="bg-surface text-foreground border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">
                    Iniciar Reclamo
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Envía una consulta o reclamo oficial a la organización
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateClaim} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Reclamo *
                </label>
                <select
                  value={claimTipo}
                  onChange={(e) => setClaimTipo(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="arbitraje">Arbitraje / Desempeño</option>
                  <option value="planilla">Planilla / Resultado de Partido</option>
                  <option value="fair_play">Fair Play / Puntuación</option>
                  <option value="sancion">Sanción Disciplinaria</option>
                  <option value="administrativo">Administrativo / Pagos</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Asunto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Corrección de autor de gol en planilla fecha 3"
                  value={claimAsunto}
                  onChange={(e) => setClaimAsunto(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción Detallada *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detalla claramente los hechos, número de fecha, partido o situación ocurrida..."
                  value={claimDescripcion}
                  onChange={(e) => setClaimDescripcion(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border/70 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="bg-primary hover:brightness-110 disabled:opacity-50 text-primary-foreground font-bold uppercase text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {submittingClaim ? (
                    <>
                      <span className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Enviar Reclamo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER COMPACTO Y SENCILLO PARA MI EQUIPO (Solo visible en Desktop) */}
      <footer className="hidden md:block border-t border-border/50 bg-surface/80 py-4 px-6 mt-12">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="La Superliga" className="h-6 w-auto object-contain opacity-80" />
            <span className="font-semibold text-foreground/80">La Superliga Torneos</span>
            <span className="text-muted-foreground/50">·</span>
            <span>Panel de Delegados</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/" className="hover:text-primary transition-colors">Volver a la web</Link>
            <span className="text-muted-foreground/30">|</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
