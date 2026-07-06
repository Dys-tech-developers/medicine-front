import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { InsumoListItemDto, VisitaInsumoConsumoItem } from "@/lib/api/types";

export type PrestadorVisitaInsumoLine = {
  id: string;
  insumoId: number | "";
  cantidad: number | "";
};

let lineCounter = 0;

export function createPrestadorVisitaInsumoLine(): PrestadorVisitaInsumoLine {
  lineCounter += 1;
  return { id: `insumo-line-${lineCounter}`, insumoId: "", cantidad: 1 };
}

export function validatePrestadorVisitaInsumoLines(
  lines: PrestadorVisitaInsumoLine[],
  catalog: InsumoListItemDto[]
): string | null {
  const active = lines.filter((l) => l.insumoId !== "");
  if (active.length === 0) return null;

  const byId = new Map(catalog.map((i) => [i.id, i]));
  const seen = new Set<number>();

  for (const line of active) {
    const insumoId = line.insumoId as number;
    if (line.cantidad === "" || !Number.isInteger(line.cantidad) || line.cantidad < 1) {
      return "Cada insumo debe tener una cantidad entera mayor a cero.";
    }
    const insumo = byId.get(insumoId);
    if (!insumo) {
      return "Seleccioná un insumo válido de la lista.";
    }
    if (insumo.estado === false || insumo.activo === false) {
      return `El insumo "${insumo.nombre}" no está activo.`;
    }
    const stock = insumo.cantidad ?? insumo.stockActual ?? 0;
    if (line.cantidad > stock) {
      return `Stock insuficiente para "${insumo.nombre}" (disponible: ${stock}).`;
    }
    if (seen.has(insumoId)) {
      return "No podés repetir el mismo insumo; ajustá la cantidad en una sola línea.";
    }
    seen.add(insumoId);
  }

  return null;
}

export function buildVisitaInsumoItemsFromLines(
  lines: PrestadorVisitaInsumoLine[]
): VisitaInsumoConsumoItem[] {
  return lines
    .filter((l) => l.insumoId !== "")
    .map((l) => ({
      insumoId: l.insumoId as number,
      cantidad: l.cantidad as number,
    }));
}

export function getPrestadorVisitaInsumoErrorMessage(err: ApiError): string {
  if (err.status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (err.status === 403) {
    return err.message?.trim() || "No tenés permisos para registrar insumos en esta visita.";
  }
  if (err.status === 404) {
    return err.message?.trim() || "La visita o el insumo ya no está disponible.";
  }
  if (err.status === 409) {
    return err.message?.trim() || "No se pudo registrar el consumo (stock o insumo inactivo).";
  }
  return getApiErrorMessages(err).join(" ");
}
