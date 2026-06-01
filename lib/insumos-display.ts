import type { InsumoListItemDto } from "@/lib/api/types";

export function matchesInsumoSearch(insumo: InsumoListItemDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    insumo.nombre,
    insumo.descripcion,
    insumo.codigo,
    insumo.unidad,
    insumo.unidadMedida,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
