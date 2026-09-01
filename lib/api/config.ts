/** Fallback si no hay NEXT_PUBLIC_API_URL en .env.local */
const DEFAULT_API_URL = "https://dysassistance.com/medicine-back";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (raw || DEFAULT_API_URL).replace(/\/$/, "");
}

/** true si el API apunta a un túnel ngrok (requiere header ngrok-skip-browser-warning). */
export function isNgrokBackend(): boolean {
  return getApiBaseUrl().includes("ngrok");
}

/**
 * Arma la URL final del API. En producción, el proxy (/medicine-back) ya
 * resuelve el prefijo /api/v1 del backend, así que hay que quitarlo del path.
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const finalPath = base.endsWith("/medicine-back")
    ? normalized.replace(/^\/api\/v1(?=\/|$)/, "")
    : normalized;
  return `${base}${finalPath}`;
}
