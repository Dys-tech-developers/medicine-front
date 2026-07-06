import type { InsumoListItemDto } from "@/lib/api/types";

export function getInsumoInitials(nombre: string): string {
  return nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function matchesInsumoSearch(insumo: InsumoListItemDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    insumo.nombre,
    insumo.descripcion,
    insumo.codigo,
    insumo.unidad,
    insumo.unidadMedida,
    insumo.fechaVencimiento,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
