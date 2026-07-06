import { ApiError } from "@/lib/api/client";
import { getApiBaseUrl, isNgrokBackend } from "@/lib/api/config";
import type { ApiFailure, ApiResponse } from "@/lib/api/types";

function buildAuthHeaders(token: string, extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (isNgrokBackend()) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const basic = /filename="?([^";]+)"?/i.exec(header);
  return basic?.[1]?.trim() ?? null;
}

async function throwApiErrorFromResponse(response: Response): Promise<never> {
  try {
    const payload = (await response.json()) as ApiFailure | ApiResponse<unknown>;
    if (payload && "success" in payload && !payload.success) {
      throw new ApiError(
        payload.error.message ?? "Error del servidor.",
        payload.error.code ?? "UNKNOWN_ERROR",
        response.status,
        payload.error.details
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
  }
  throw new ApiError(
    response.statusText || "Error del servidor.",
    "HTTP_ERROR",
    response.status
  );
}

export { triggerBrowserFileDownload } from "@/lib/excel-export";

export async function downloadPrestadoresCargaMasivaPlantillaWithApi(
  token: string
): Promise<{ blob: Blob; filename: string }> {
  const url = `${getApiBaseUrl()}/api/v1/carga-masiva/prestadores/plantilla`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: buildAuthHeaders(token),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor para descargar la planilla."
        : error instanceof Error
          ? error.message
          : "Error de red";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  if (!response.ok) {
    await throwApiErrorFromResponse(response);
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(response.headers.get("content-disposition")) ??
    "prestadores_carga_masiva.xlsx";

  return { blob, filename };
}

export const CARGA_MASIVA_PRESTADORES_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const CARGA_MASIVA_PRESTADORES_MAX_FILAS = 1000;

export type CargaMasivaPrestadoresErrorFilaDto = {
  fila: number;
  campo?: string;
  mensaje: string;
};

export type CargaMasivaPrestadoresResultDto = {
  totalFilas: number;
  creados: number;
  errores: CargaMasivaPrestadoresErrorFilaDto[];
};

export function formatCargaMasivaPrestadorError(item: CargaMasivaPrestadoresErrorFilaDto): string {
  const campo = item.campo?.trim();
  return campo ? `${campo}: ${item.mensaje}` : item.mensaje;
}

export function validatePrestadoresCargaMasivaFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (
    !name.endsWith(".xlsx") &&
    file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "El archivo debe ser Excel (.xlsx) generado por la planilla del sistema.";
  }
  if (file.size > CARGA_MASIVA_PRESTADORES_MAX_FILE_BYTES) {
    return "El archivo supera el máximo de 5 MB.";
  }
  if (file.size <= 0) {
    return "El archivo está vacío.";
  }
  return null;
}

function normalizeCargaMasivaResult(raw: Record<string, unknown>): CargaMasivaPrestadoresResultDto {
  const erroresRaw = raw.errores ?? raw.errors;
  const errores = Array.isArray(erroresRaw)
    ? erroresRaw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const row = entry as Record<string, unknown>;
          const fila = Number(row.fila ?? row.row ?? row.linea ?? row.line);
          const mensaje = String(row.mensaje ?? row.message ?? row.error ?? "").trim();
          const campoRaw = row.campo ?? row.field;
          const campo = campoRaw != null ? String(campoRaw).trim() : undefined;
          if (!Number.isFinite(fila) || fila <= 0 || !mensaje) return null;
          return {
            fila,
            mensaje,
            ...(campo ? { campo } : {}),
          };
        })
        .filter((e): e is CargaMasivaPrestadoresErrorFilaDto => e != null)
    : [];

  return {
    totalFilas: Number(raw.totalFilas ?? raw.totalRows ?? raw.total ?? 0),
    creados: Number(raw.creados ?? raw.created ?? 0),
    errores,
  };
}

export async function uploadPrestadoresCargaMasivaWithApi(
  token: string,
  file: File
): Promise<CargaMasivaPrestadoresResultDto> {
  const url = `${getApiBaseUrl()}/api/v1/carga-masiva/prestadores`;
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: buildAuthHeaders(token),
      body: formData,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor para procesar la planilla."
        : error instanceof Error
          ? error.message
          : "Error de red";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  let payload: ApiResponse<CargaMasivaPrestadoresResultDto> | ApiFailure | null = null;
  try {
    payload = (await response.json()) as ApiResponse<CargaMasivaPrestadoresResultDto> | ApiFailure;
  } catch {
    throw new ApiError("Respuesta inválida del servidor.", "INVALID_RESPONSE", response.status);
  }

  if (!payload || !payload.success) {
    const failure = payload as ApiFailure | null;
    throw new ApiError(
      failure?.error.message ?? "No se pudo procesar la carga masiva.",
      failure?.error.code ?? "UNKNOWN_ERROR",
      response.status,
      failure?.error.details
    );
  }

  return normalizeCargaMasivaResult(payload.data as Record<string, unknown>);
}
