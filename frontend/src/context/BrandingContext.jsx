import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import {
  DEFAULT_LOGO,
  DEFAULT_NAME,
  DEFAULT_PRIMARY,
  applyPrimaryColor,
  cacheBranding,
  normalizeHex,
  readCachedBranding,
  setFavicon
} from '../lib/branding';

const BrandingContext = createContext(null);

export function BrandingProvider({ children }) {
  const cached = readCachedBranding();
  const [settings, setSettings] = useState(null); // respuesta cruda del backend
  const [primaryColor, setPrimaryColor] = useState(normalizeHex(cached?.primaryColor) || DEFAULT_PRIMARY);
  const [logoUrl, setLogoUrl] = useState(cached?.logoUrl || null);
  const [brandName, setBrandName] = useState(cached?.name || DEFAULT_NAME);

  const applySettingsData = useCallback((data) => {
    if (!data) return null;
    const color = normalizeHex(data.primary_color) || DEFAULT_PRIMARY;
    setSettings(data);
    setPrimaryColor(color);
    setLogoUrl(data.logo || null);
    const nm = (data.name || '').trim() || DEFAULT_NAME;
    setBrandName(nm);
    cacheBranding({ primaryColor: color, logoUrl: data.logo || null, name: nm });
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      // fetch directo: es un endpoint público y no debe disparar el redirect de 401
      const res = await fetch(`${api.defaults.baseURL}site-settings/`);
      if (!res.ok) return null;
      const data = await res.json();
      return applySettingsData(data);
    } catch (err) {
      console.error('No se pudo cargar la identidad de marca:', err);
      return null;
    }
  }, [applySettingsData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Aplica el color de marca a toda la app
  useEffect(() => {
    applyPrimaryColor(primaryColor);
  }, [primaryColor]);

  // El nombre de la plataforma pasa a ser el título de la pestaña
  useEffect(() => {
    document.title = `${brandName} Gestión`;
  }, [brandName]);

  // El logo de la empresa pasa a ser también el ícono de la pestaña
  useEffect(() => {
    setFavicon(logoUrl || DEFAULT_LOGO);
  }, [logoUrl]);

  const value = useMemo(
    () => ({
      settings,
      primaryColor,
      logoUrl,
      brandName,
      brandNameUpper: brandName.toUpperCase(),
      logoSrc: logoUrl || DEFAULT_LOGO,
      hasCustomLogo: !!logoUrl,
      updateLocalSettings: applySettingsData,
      refresh
    }),
    [settings, primaryColor, logoUrl, brandName, applySettingsData, refresh]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      settings: null,
      primaryColor: DEFAULT_PRIMARY,
      logoUrl: null,
      brandName: DEFAULT_NAME,
      brandNameUpper: DEFAULT_NAME.toUpperCase(),
      logoSrc: DEFAULT_LOGO,
      hasCustomLogo: false,
      updateLocalSettings: () => null,
      refresh: async () => null
    };
  }
  return ctx;
}
