import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { useState, useEffect, useRef } from "react";
import { 
  Trophy, Users, UserCheck, ShieldAlert, CreditCard, MessageSquare, 
  Shield, Camera, UserPlus, Trash2, Check, X, Search, FileSpreadsheet, 
  Plus, RefreshCw, Upload, AlertCircle, Calendar, Clock, MapPin, 
  DollarSign, CheckCircle2, Clock3, Send, MessageCircle, FileText, 
  Lock, AlertTriangle, ArrowRight, ArrowLeft, LogOut, User
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
  return `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`;
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
      // 1. Fetch Delegate Dashboard Data
      const dashRes = await fetch(`http://127.0.0.1:8000/api/teams/${teamId}/delegate-dashboard/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
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
        ? `http://127.0.0.1:8000/api/good-faith-lists/?team=${teamId}&tournament=${currentTournId}`
        : `http://127.0.0.1:8000/api/good-faith-lists/?team=${teamId}`;
      const lbfRes = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
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
      fetch("http://127.0.0.1:8000/api/user-info/", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.team_id) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            fetchAllData(storedToken, data.team_id, data.current_tournament_id);
          }
        })
        .catch(() => {
          fetchAllData(storedToken, parsedUser.team_id, parsedUser.current_tournament_id);
        })
        .finally(() => setLoading(false));
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
      const res = await fetch(`http://127.0.0.1:8000/api/teams/${team.id}/`, {
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
      const res = await fetch(`http://127.0.0.1:8000/api/teams/${team.id}/`, {
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
      const res = await fetch(`http://127.0.0.1:8000/api/players/?search=${encodeURIComponent(cleanDni)}`, {
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

        const playerRes = await fetch("http://127.0.0.1:8000/api/players/", {
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

      const gflRes = await fetch("http://127.0.0.1:8000/api/good-faith-lists/", {
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
      const res = await fetch(`http://127.0.0.1:8000/api/good-faith-lists/${playerToRemove.id}/`, {
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

      const res = await fetch("http://127.0.0.1:8000/api/reclamos/", {
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
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 md:pb-0">
      
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

      {/* HEADER DEDICADO DE LA NUEVA PANTALLA DE MI EQUIPO */}
      <header className="bg-surface border-b border-border/60 shadow-xs relative z-40">
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Botón de retroceso: "Volver a la web" */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-surface-elevated hover:bg-muted border border-border/80 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer group"
            >
              <ArrowLeft className="size-4 text-primary group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver a la web</span>
            </Link>
          </div>

          {/* Logo del torneo (un poco más grande, sin texto ni redes sociales) */}
          <div className="flex items-center justify-center">
            <Link to="/" className="cursor-pointer" title="La Superliga">
              <img
                src={logo}
                alt="La Superliga"
                className="h-14 md:h-16 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {/* Auspiciantes mini carousel reacomodado a la derecha */}
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold hidden md:inline">
              Auspicia:
            </span>
            <div className="w-[85px] h-[54px] relative overflow-hidden border border-border/40 rounded-xl bg-surface/30 flex items-center justify-center p-0 shadow-xs">
              <img
                src={ads[currentAdIndex].image}
                alt={ads[currentAdIndex].name}
                className="w-full h-full object-cover animate-in fade-in duration-500 rounded-xl"
                key={ads[currentAdIndex].id}
              />
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
        <div className="flex items-center justify-between gap-3 p-3.5 bg-surface rounded-2xl border border-border/70 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="size-12 rounded-xl bg-surface-elevated border border-border/80 flex items-center justify-center p-1.5 overflow-hidden shrink-0 cursor-pointer relative shadow-xs"
              title="Toca para cambiar escudo"
            >
              {logoPreview ? (
                <img src={getMediaUrl(logoPreview)} alt="Escudo" className="w-full h-full object-contain" />
              ) : (
                <Shield className="size-6 text-muted-foreground/40" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-foreground truncate leading-tight">
                {team?.name || user?.team_name || "Mi Equipo"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Delegado: <strong className="text-foreground">{user?.first_name} {user?.last_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Cerrar Sesión"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* SUB MENU HORIZONTAL (Desktop): Con Cerrar Sesión a la derecha */}
      <div className="bg-surface border-b border-[#d8cfc0] shadow-xs">
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
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex-1">
        
        {/* ============================================================ */}
        {/* 1. TAB: PRINCIPAL (Dashboard General) */}
        {/* ============================================================ */}
        {activeTab === 'principal' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Top Grid: Torneo & Posición (Col 2) + Saldo Actual del Equipo (Col 1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Posición & Tabla */}
              <div className="lg:col-span-2 bg-surface rounded-2xl border border-border/70 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Trophy className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                            {dashboardData?.tournament?.name || user?.current_tournament_name || "Torneo Oficial"}
                          </h3>
                          <span className={`size-2 rounded-full ${
                            dashboardData?.tournament?.is_active ?? user?.current_tournament_is_active 
                              ? 'bg-emerald-500 animate-pulse' 
                              : 'bg-amber-500'
                          }`} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData?.tournament?.zone_name || "Zona Principal"}
                        </p>
                      </div>
                    </div>

                    {standings?.position && (
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-display font-black text-primary">
                          {standings.position}°
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          de {standings.total_teams} equipos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tabla de Estadísticas Resumidas */}
                  {standings ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                      <div className="bg-surface-elevated/70 border border-border/60 rounded-xl p-3 text-center">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Puntos</span>
                        <p className="text-2xl font-black text-primary mt-0.5">{standings.points}</p>
                      </div>
                      <div className="bg-surface-elevated/70 border border-border/60 rounded-xl p-3 text-center">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Jugados</span>
                        <p className="text-2xl font-black text-foreground mt-0.5">{standings.played}</p>
                      </div>
                      <div className="bg-surface-elevated/70 border border-border/60 rounded-xl p-3 text-center">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">G / E / P</span>
                        <p className="text-lg font-bold text-foreground mt-1">
                          <span className="text-emerald-500">{standings.won}</span> / {standings.drawn} / <span className="text-red-500">{standings.lost}</span>
                        </p>
                      </div>
                      <div className="bg-surface-elevated/70 border border-border/60 rounded-xl p-3 text-center">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Dif. Gol</span>
                        <p className={`text-2xl font-black mt-0.5 ${standings.goal_difference > 0 ? 'text-emerald-500' : standings.goal_difference < 0 ? 'text-red-500' : 'text-foreground'}`}>
                          {standings.goal_difference > 0 ? `+${standings.goal_difference}` : standings.goal_difference}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      Aún no hay estadísticas disponibles para la zona del equipo.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fair Play acumulado: <strong className="text-foreground">{standings?.fair_play ?? 0} pts</strong></span>
                  <Link 
                    to="/categorias"
                    className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                  >
                    Ver tabla completa <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Saldo Actual del equipo (Ubicado en el lugar anterior de Próximo Partido) */}
              <div className="bg-surface rounded-2xl border border-border/70 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" /> Saldo Actual del equipo
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      financial?.saldo < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {financial?.saldo < 0 ? 'Saldo Deudor' : 'Al Día'}
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-xs text-muted-foreground">Balance consolidado</span>
                    <p className={`font-display text-4xl font-black mt-1 ${
                      financial?.saldo < 0 ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      ${Number(financial?.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    {financial?.observaciones && (
                      <p className="text-xs text-muted-foreground mt-3 italic bg-surface-elevated/70 p-2.5 rounded-xl border border-border/50">
                        "{financial.observaciones}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('pagos')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Historial de Pagos <ArrowRight className="size-3.5" />
                </button>
              </div>

            </div>

            {/* Bottom Grid: Próximo Partido + Plantel Inscripto + Sanciones Activas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 3: Próximo Partido */}
              <div className="bg-surface rounded-2xl border border-border/70 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="size-4 text-primary" /> Próximo Partido
                    </span>
                    {nextMatch && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {nextMatch.round_name}
                      </span>
                    )}
                  </div>

                  {nextMatch ? (
                    <div className="flex flex-col items-center text-center my-2">
                      {/* Rival Logo */}
                      <div className="size-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center p-2 mb-2 shadow-xs">
                        {nextMatch.rival_logo ? (
                          <img src={getMediaUrl(nextMatch.rival_logo)} alt={nextMatch.rival_name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield className="size-7 text-muted-foreground/40" />
                        )}
                      </div>

                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {nextMatch.is_local ? "Local vs" : "Visitante vs"}
                      </span>
                      <h4 className="font-display text-lg font-bold uppercase text-foreground mt-0.5">
                        {nextMatch.rival_name}
                      </h4>

                      {/* Info Date, Time, Cancha */}
                      <div className="w-full bg-surface-elevated/70 border border-border/50 rounded-xl p-2.5 mt-3 space-y-1.5 text-xs text-left">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Calendar className="size-3.5 text-primary shrink-0" />
                          <span>{nextMatch.date || "Fecha a confirmar"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Clock className="size-3.5 text-primary shrink-0" />
                          <span>{nextMatch.time ? `${nextMatch.time} hs` : "Horario a confirmar"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{nextMatch.cancha}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs flex flex-col items-center">
                      <Calendar className="size-6 text-muted-foreground/40 mb-2" />
                      No hay partidos programados para la próxima fecha.
                    </div>
                  )}
                </div>

                {lastMatch && (
                  <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Último:</span>
                    <span className="font-bold text-foreground">
                      {lastMatch.my_score} - {lastMatch.rival_score} vs {lastMatch.rival_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Card 4: Plantel Inscripto (Buena Fe Status) */}
              <div className="bg-surface rounded-2xl border border-border/70 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="size-4 text-primary" /> Plantel Inscripto
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {players.length} Jugadores
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-xs text-muted-foreground">Cupo de Lista de Buena Fe</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display text-3xl font-black text-foreground">{players.length}</span>
                      <span className="text-muted-foreground font-semibold">/ {dashboardData?.buena_fe?.limit_players || 25} permitidos</span>
                    </div>
                    <div className="w-full bg-border/40 rounded-full h-2 mt-3 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all" 
                        style={{ width: `${Math.min(100, (players.length / (dashboardData?.buena_fe?.limit_players || 25)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('buena_fe')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Gestionar Jugadores <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* Card 5: Sanciones Status */}
              <div className="bg-surface rounded-2xl border border-border/70 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ShieldAlert className="size-4 text-primary" /> Sanciones Activas
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      sanciones.length > 0 ? 'bg-amber-500/10 text-amber-500 font-bold' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {sanciones.length > 0 ? `${sanciones.length} Sancionados` : 'Sin Sanciones'}
                    </span>
                  </div>

                  <div className="my-3">
                    {sanciones.length > 0 ? (
                      <div className="space-y-2">
                        {sanciones.slice(0, 2).map((s: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-surface-elevated/70 border border-border/50 text-xs flex items-center justify-between">
                            <span className="font-bold text-foreground truncate">{s.player_name || "Sanción colectiva"}</span>
                            <span className="text-[11px] font-bold text-red-500 shrink-0 ml-2">{s.fechas_suspension || "1 fecha"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No hay jugadores sancionados en el equipo actualmente.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('sanciones')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl border border-border text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Detalle Sanciones <ArrowRight className="size-3.5" />
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

      {/* SUB MENU INFERIOR FIJO PARA CELULAR (< 768px): Mismo diseño que app de gestión */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#eae4d8] border-t border-[#d8cfc0] z-50 flex items-center justify-around shadow-[0_-4px_15px_rgba(25,20,15,0.08)]"
        style={{
          background: '#eae4d8',
          borderTop: '1px solid #d8cfc0',
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
                borderTop: isActive ? '3px solid #cc7a5c' : '3px solid transparent',
                color: isActive ? '#cc7a5c' : '#191919',
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
              <span>{tab.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
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

      <Footer />
    </div>
  );
}
