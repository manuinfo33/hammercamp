/**
 * Identidad de marca (white-label) de la app de gestión.
 * A partir de UN color principal deriva todos los tonos que usa la UI
 * (hover, fondo suave, texto "tinta", color de texto sobre el botón, etc.).
 */

export const DEFAULT_PRIMARY = '#f2bb2b';
export const DEFAULT_LOGO = '/logo-superliga.png';
export const DEFAULT_NAME = 'La Superliga';

export const BRAND_PRESETS = [
  { name: 'Amarillo', value: '#f2bb2b' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Rojo', value: '#e11d48' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Violeta', value: '#7c3aed' },
  { name: 'Azul', value: '#2563eb' },
  { name: 'Celeste', value: '#0ea5e9' },
  { name: 'Verde', value: '#16a34a' },
  { name: 'Turquesa', value: '#0d9488' },
  { name: 'Grafito', value: '#334155' }
];

const STORAGE_KEY = 'brand_theme_v1';
const STYLE_ID = 'brand-theme';

export function normalizeHex(value) {
  let v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const to = (x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255
  };
}

function relativeLuminance({ r, g, b }) {
  const ch = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Deriva toda la paleta a partir del color principal. */
export function deriveTheme(inputHex) {
  const primary = normalizeHex(inputHex) || DEFAULT_PRIMARY;
  const rgb = hexToRgb(primary);
  const hsl = rgbToHsl(rgb);

  const hover = rgbToHex(hslToRgb({ ...hsl, l: Math.min(0.92, hsl.l + 0.07) }));
  // "Tinta": versión más oscura para texto/íconos sobre fondos claros
  const inkL = hsl.l > 0.4 ? Math.max(0.24, hsl.l - 0.15) : hsl.l;
  const ink = rgbToHex(hslToRgb({ ...hsl, l: inkL }));
  // Texto sobre el color principal: oscuro o blanco según contraste
  const onPrimary = relativeLuminance(rgb) > 0.4 ? '#151515' : '#ffffff';

  return {
    primary,
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hover,
    ink,
    soft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`,
    onPrimary
  };
}

/** Variables CSS que consume la app de gestión. */
export function themeVars(hex) {
  const t = deriveTheme(hex);
  return {
    '--gx-primary': t.primary,
    '--gx-primary-rgb': t.rgb,
    '--gx-primary-hover': t.hover,
    '--gx-primary-soft': t.soft,
    '--gx-primary-ink': t.ink,
    '--gx-on-primary': t.onPrimary,
    '--primary': t.primary,
    '--primary-hover': t.hover
  };
}

function varsToCss(vars) {
  return `:root:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
}

/** Inyecta (o actualiza) el <style> con el tema de marca. */
export function applyThemeVars(vars) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = varsToCss(vars);
}

export function applyPrimaryColor(hex) {
  applyThemeVars(themeVars(hex));
}

export function setFavicon(url) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (url) {
    link.type = 'image/png';
    link.href = url;
  }
}

export function readCachedBranding() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function cacheBranding({ primaryColor, logoUrl, name }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ primaryColor, logoUrl, name, vars: themeVars(primaryColor) })
    );
  } catch {
    /* almacenamiento no disponible */
  }
}

