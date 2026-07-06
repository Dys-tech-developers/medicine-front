import type { PrestadorListItemDto } from "@/lib/api/types";

export function isPrestadorActivo(p: PrestadorListItemDto): boolean {
  return p.estado === true && p.usuarioEstado !== false;
}

/**
 * Prestadores activos candidatos para una asignación.
 * Preferir `GET /prestadores?servicioId=X&estado=true`; este helper refina en cliente si hace falta.
 */
export function filterPrestadoresPorServicio(
  prestadores: PrestadorListItemDto[],
  servicioId: number | null
): PrestadorListItemDto[] {
  const activos = prestadores.filter(isPrestadorActivo);
  if (!servicioId || !Number.isFinite(servicioId)) return [];

  const conCatalogo = activos.filter((p) => Array.isArray(p.servicios) && p.servicios.length > 0);
  if (conCatalogo.length === 0) {
    return activos;
  }

  return activos.filter((p) => prestadorTieneServicio(p, servicioId));
}

export function prestadorTieneServicio(
  prestador: PrestadorListItemDto,
  servicioId: number
): boolean {
  if (prestador.servicios === undefined) return true;
  if (prestador.servicios.length === 0) return false;
  return prestador.servicios.some((s) => s.id === servicioId && s.estado !== false);
}
