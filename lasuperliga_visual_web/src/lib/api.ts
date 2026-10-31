const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // Si viene con /api al final, extraemos el origen base
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "http://127.0.0.1:8000";
};

export const BACKEND_URL = getBackendUrl();
export const API_URL = `${BACKEND_URL}/api`;

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
