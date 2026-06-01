import { getApiBaseUrl, isNgrokBackend } from "@/lib/api/config";
import type { ApiFailure, ApiResponse } from "@/lib/api/types";

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
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: buildRequestHeaders(token, headers),
    });
  } catch (error) {
    const frontOnNgrok =
      typeof window !== "undefined" && window.location.hostname.includes("ngrok");
    const apiIsLocal =
      getApiBaseUrl().includes("localhost") || getApiBaseUrl().includes("127.0.0.1");

    let hint = isNgrokBackend()
      ? " Revisá que el túnel ngrok del backend (medicine-back) esté activo y NEXT_PUBLIC_API_URL en .env.local."
      : " Revisá que medicine-back esté corriendo en el puerto 3001.";

    if (frontOnNgrok && apiIsLocal) {
      hint =
        " Abrís el front por ngrok pero el API apunta a localhost: desde el celular eso no funciona. Poné en .env.local la URL ngrok del BACK (puerto 3001), no localhost.";
    } else if (!isNgrokBackend()) {
      hint += " NEXT_PUBLIC_API_URL debe ser http://localhost:3001 (sin barra final).";
    }

    const message =
      error instanceof Error && error.message === "Failed to fetch"
        ? `No se pudo conectar con el API (CORS o red).${hint}`
        : error instanceof Error
          ? error.message
          : "Error de red";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
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
