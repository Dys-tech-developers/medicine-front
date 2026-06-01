import type { HistoriaClinicaEvolucionDto } from "@/lib/api/types";

export function formatHistoriaFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatHistoriaFechaHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatHistoriaField(value: string | null | undefined, empty = "Sin registrar"): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

/** Más reciente primero. */
export function sortEvolucionesDesc(
  evoluciones: HistoriaClinicaEvolucionDto[]
): HistoriaClinicaEvolucionDto[] {
  return [...evoluciones].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}
