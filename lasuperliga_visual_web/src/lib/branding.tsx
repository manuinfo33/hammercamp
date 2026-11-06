import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_URL, getMediaUrl } from "@/lib/api";
import defaultLogo from "@/assets/logo-superliga.png";

export const DEFAULT_PRIMARY = "#f2bb2b";
export const DEFAULT_NAME = "La Superliga";
const DEFAULT_CONTACT = {
  address: "Av. del Deporte 3600, La Plata",
  phone: "+54 221 555-1736",
  email: "info@lasuperliga.com.ar",
};
const STORAGE_KEY = "sl_visual_brand_v1";

interface SiteSettingsData {
  contact_address?: string;
  contact_phone?: string;
  contact_email?: string;
  about_description?: string;
  name?: string;
  logo?: string | null;
  logo_original?: string | null;
  logo_crop_data?: any;
  primary_color?: string;
  updated_at?: string;
}

interface BrandingContextValue {
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  aboutDescription: string;
  brandName: string;
  brandLead: string;
  brandAccent: string;
  logoSrc: string;
  primaryColor: string;
  hasCustomLogo: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_ABOUT =
  "La Superliga es un complejo deportivo dedicado al fútbol amateur desde 2008. Organizamos torneos en distintas categorías y abrimos las puertas a equipos de toda la región.\n\nContamos con canchas de césped sintético de última generación, iluminación profesional, vestuarios, buffet y estacionamiento propio.\n\nNuestra pasión es el juego: que cada jugador, sin importar la edad o el nivel, tenga la mejor experiencia dentro y fuera de la cancha.";

const BrandingContext = createContext<BrandingContextValue>({
  contactAddress: DEFAULT_CONTACT.address,
  contactPhone: DEFAULT_CONTACT.phone,
  contactEmail: DEFAULT_CONTACT.email,
  aboutDescription: DEFAULT_ABOUT,
  brandName: DEFAULT_NAME,
  brandLead: "La",
  brandAccent: "Superliga",
  logoSrc: defaultLogo,
  primaryColor: DEFAULT_PRIMARY,
  hasCustomLogo: false,
  refresh: async () => {},
});

export function splitBrandName(name: string): { lead: string; accent: string } {
  const words = (name || DEFAULT_NAME).trim().split(/\s+/);
  if (words.length <= 1) return { lead: "", accent: words[0] || "" };
  return { lead: words.slice(0, -1).join(" "), accent: words[words.length - 1] };
}

function normalizeHex(hex?: string | null): string {
  if (!hex || typeof hex !== "string") return DEFAULT_PRIMARY;
  const clean = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toLowerCase();
  return DEFAULT_PRIMARY;
}

function getForegroundForHex(hex: string): string {
  const clean = normalizeHex(hex).slice(1);
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.42 ? "#151515" : "#ffffff";
}

export function applyVisualTheme(hexColor?: string | null) {
  if (typeof document === "undefined") return;
  const primary = normalizeHex(hexColor);
  const fg = getForegroundForHex(primary);

  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--accent", primary);
  root.style.setProperty("--accent-foreground", fg);
  root.style.setProperty("--tag", primary);
  root.style.setProperty("--tag-foreground", fg);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
}

function setDocumentFavicon(url: string) {
  if (typeof document === "undefined" || !url) return;
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsData>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.primary_color) {
            applyVisualTheme(parsed.primary_color);
          }
          return parsed;
        }
      } catch {
        // ignore storage errors
      }
    }
    return { primary_color: DEFAULT_PRIMARY, logo: null };
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/site-settings/`);
      if (!res.ok) return;
      const data: SiteSettingsData = await res.json();
      setSettings(data);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
      applyVisualTheme(data.primary_color || DEFAULT_PRIMARY);
      const resolvedLogo = data.logo ? getMediaUrl(data.logo) : defaultLogo;
      setDocumentFavicon(resolvedLogo);
    } catch {
      applyVisualTheme(settings?.primary_color || DEFAULT_PRIMARY);
    }
  }, []);

  useEffect(() => {
    applyVisualTheme(settings?.primary_color || DEFAULT_PRIMARY);
    refresh();
  }, [refresh]);

  // Reemplaza "La Superliga" por el nombre configurado en el titulo de la pestaña
  const configuredName = (settings?.name || "").trim() || DEFAULT_NAME;
  useEffect(() => {
    if (typeof document === "undefined") return;
    const apply = () => {
      if (configuredName === DEFAULT_NAME) return;
      const cur = document.title;
      if (cur.includes(DEFAULT_NAME)) {
        document.title = cur.split(DEFAULT_NAME).join(configuredName);
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [configuredName]);

  const { lead: brandLead, accent: brandAccent } = splitBrandName(configuredName);
  const logoSrc = settings?.logo ? getMediaUrl(settings.logo) : defaultLogo;
  const primaryColor = normalizeHex(settings?.primary_color);
  const hasCustomLogo = Boolean(settings?.logo);
  const aboutDescription =
    (settings?.about_description || "").trim() ||
    DEFAULT_ABOUT.split(DEFAULT_NAME).join(configuredName);

  return (
    <BrandingContext.Provider
      value={{
        contactAddress: settings?.contact_address ?? DEFAULT_CONTACT.address,
        contactPhone: settings?.contact_phone ?? DEFAULT_CONTACT.phone,
        contactEmail: settings?.contact_email ?? DEFAULT_CONTACT.email,
        aboutDescription,
        logoSrc, primaryColor, hasCustomLogo, refresh, brandName: configuredName, brandLead, brandAccent }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

