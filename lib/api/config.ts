/** Fallback si no hay NEXT_PUBLIC_API_URL en .env.local */
const DEFAULT_API_URL = "http://localhost:3001";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (raw || DEFAULT_API_URL).replace(/\/$/, "");
}

/** true si el API apunta a un túnel ngrok (requiere header ngrok-skip-browser-warning). */
export function isNgrokBackend(): boolean {
  return getApiBaseUrl().includes("ngrok");
}
