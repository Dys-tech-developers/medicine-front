import { buildApiUrl, getApiBaseUrl, isNgrokBackend } from "@/lib/api/config";
import type { ApiFailure, ApiResponse } from "@/lib/api/types";
import { clearAuthSession } from "@/lib/auth-session";
import { invalidateAdminListCache } from "@/lib/cache/admin-list-cache";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ApiFetchOptions = RequestInit & {
  token?: string;
};

// El backend puede devolver 401 en change-password por contraseña actual
// incorrecta, y en logout con un token ya vencido: en esos casos no hay que
// desloguear a la fuerza.
const AUTO_LOGOUT_EXCLUDED_PATHS = [
  "/api/v1/auth/change-password",
  "/api/v1/auth/logout",
];

/**
 * Sesión vencida o token revocado: limpia la sesión local y la caché en
 * memoria, y redirige al login. Se dispara ante un 401 de rutas autenticadas.
 */
export function handleSessionExpired(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  invalidateAdminListCache();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

function shouldAutoLogout(path: string, token: string | undefined, status: number): boolean {
  return (
    status === 401 &&
    Boolean(token) &&
    !AUTO_LOGOUT_EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded))
  );
}

function buildRequestHeaders(
  token: string | undefined,
  extra?: HeadersInit,
): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (isNgrokBackend()) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = buildApiUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: buildRequestHeaders(token, headers),
    });
  } catch (error) {
    const apiBase = getApiBaseUrl();
    const frontOnNgrok =
      typeof window !== "undefined" && window.location.hostname.includes("ngrok");
    const apiIsLocal =
      apiBase.includes("localhost") || apiBase.includes("127.0.0.1");
    const apiIsProdHost = /dysassistance\.com|medicine-back/i.test(apiBase);

    let hint: string;
    if (frontOnNgrok && apiIsLocal) {
      hint =
        " Abrís el front por ngrok pero el API apunta a localhost: desde el celular eso no funciona. Poné en .env.local la URL ngrok del BACK (puerto 3001), no localhost.";
    } else if (apiIsLocal) {
      hint =
        " El build apunta a un API local. En producción rebuildá con `npm run build:prod` (API = https://dysassistance.com/medicine-back).";
    } else if (isNgrokBackend()) {
      hint =
        " Revisá que el túnel ngrok del backend (medicine-back) esté activo y NEXT_PUBLIC_API_URL.";
    } else if (apiIsProdHost) {
      hint = ` No se alcanzó ${apiBase}. Revisá CORS del backend, el proxy /medicine-back y que el API esté arriba.`;
    } else {
      hint = ` URL del API: ${apiBase}. Revisá NEXT_PUBLIC_API_URL del build y conectividad/CORS.`;
    }

    const message =
      error instanceof Error && error.message === "Failed to fetch"
        ? `No se pudo conectar con el API (CORS o red).${hint}`
        : error instanceof Error
          ? error.message
          : "Error de red";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (shouldAutoLogout(path, token, response.status)) {
    handleSessionExpired();
    throw new ApiError(
      "Tu sesión expiró. Volvé a iniciar sesión.",
      "SESSION_EXPIRED",
      401
    );
  }

  const text = await response.text();

  if (response.status === 204 || (response.ok && !text.trim())) {
    if (!response.ok) {
      throw new ApiError(
        `Error del servidor (${response.status}).`,
        "HTTP_ERROR",
        response.status
      );
    }
    return undefined as T;
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = JSON.parse(text) as ApiResponse<T>;
  } catch {
    const ngrokHint = isNgrokBackend()
      ? " Ngrok puede estar devolviendo HTML en lugar de JSON (revisá NEXT_PUBLIC_API_URL y el header ngrok-skip-browser-warning)."
      : "";
    throw new ApiError(
      `Respuesta inválida del servidor.${ngrokHint}`,
      "INVALID_RESPONSE",
      response.status
    );
  }

  if (!payload || !payload.success) {
    const failure = payload as ApiFailure | null;
    throw new ApiError(
      failure?.error.message ?? "Error desconocido del servidor.",
      failure?.error.code ?? "UNKNOWN_ERROR",
      response.status,
      failure?.error.details,
    );
  }

  return payload.data;
}
