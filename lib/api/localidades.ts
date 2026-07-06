import { apiFetch } from "@/lib/api/client";
import type { LocalidadDto } from "@/lib/api/types";

type LocalidadRaw = Record<string, unknown>;

function normalizeLocalidad(raw: LocalidadRaw): LocalidadDto | null {
  const id = String(raw.id ?? raw.codigo ?? "").trim();
  const nombre = String(raw.nombre ?? raw.descripcion ?? "").trim();
  if (!id || !nombre) return null;
  return { id, nombre };
}

/** GET /api/v1/localidades — catálogo completo de localidades. */
export async function listLocalidadesWithApi(token: string): Promise<LocalidadDto[]> {
  const data = await apiFetch<unknown>("/api/v1/localidades", {
    method: "GET",
    token,
  });
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown })?.items)
      ? ((data as { items: unknown[] }).items)
      : [];
  return rows
    .map((row) => normalizeLocalidad(row as LocalidadRaw))
    .filter((l): l is LocalidadDto => l != null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
