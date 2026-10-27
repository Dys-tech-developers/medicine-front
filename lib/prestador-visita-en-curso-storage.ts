/**
 * Borrador de visita en curso del prestador.
 * Sobreve a remounts / pestañas matadas por Chrome mobile (sessionStorage).
 */

export const PRESTADOR_VISITA_EN_CURSO_KEY = "medicine.prestador.visitaEnCurso";

export type PrestadorVisitaEnCursoDraft = {
  codigoQr: string;
  pacienteId: number;
  pacienteServicioId: number;
  /** Control horario: visita iniciada en backend. */
  visitaEnCursoId: number | null;
  visitaEnCursoInicioMs: number | null;
  /** Registro único: timer local desde el escaneo. */
  visitaInicioMs: number | null;
  observaciones: string;
  savedAt: string;
};

function isValidDraft(value: unknown): value is PrestadorVisitaEnCursoDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.codigoQr === "string" &&
    d.codigoQr.trim().length > 0 &&
    typeof d.pacienteId === "number" &&
    Number.isFinite(d.pacienteId) &&
    typeof d.pacienteServicioId === "number" &&
    Number.isFinite(d.pacienteServicioId) &&
    (d.visitaEnCursoId === null || typeof d.visitaEnCursoId === "number") &&
    (d.visitaEnCursoInicioMs === null || typeof d.visitaEnCursoInicioMs === "number") &&
    (d.visitaInicioMs === null || typeof d.visitaInicioMs === "number") &&
    typeof d.observaciones === "string"
  );
}

export function loadPrestadorVisitaEnCursoDraft(): PrestadorVisitaEnCursoDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PRESTADOR_VISITA_EN_CURSO_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePrestadorVisitaEnCursoDraft(
  draft: Omit<PrestadorVisitaEnCursoDraft, "savedAt"> & { savedAt?: string }
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PrestadorVisitaEnCursoDraft = {
      ...draft,
      savedAt: draft.savedAt ?? new Date().toISOString(),
    };
    sessionStorage.setItem(PRESTADOR_VISITA_EN_CURSO_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage puede fallar en modo privado; la visita en memoria sigue.
  }
}

export function clearPrestadorVisitaEnCursoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PRESTADOR_VISITA_EN_CURSO_KEY);
  } catch {
    /* */
  }
}

/** True si el borrador representa una visita/timer activo que conviene restaurar. */
export function draftTieneVisitaActiva(draft: PrestadorVisitaEnCursoDraft): boolean {
  return draft.visitaEnCursoId != null || draft.visitaInicioMs != null;
}
