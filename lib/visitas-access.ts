import type { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { VisitaEstado, VisitaFinanzasDto } from "@/lib/api/types";

type VisitaConEstadoFinanzas = {
  estado: VisitaEstado;
  finanzas?: VisitaFinanzasDto | null;
};

export function isVisitaAdmin(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

export function puedeEliminarVisita(visita: VisitaConEstadoFinanzas, esAdmin: boolean): boolean {
  if (!esAdmin) return false;
  if (visita.estado === "iniciada") return false;
  if (visita.finanzas?.facturado || visita.finanzas?.pagado) return false;
  return true;
}

export function puedeCancelarVisita(
  visita: Pick<VisitaConEstadoFinanzas, "estado">,
  esAdmin: boolean
): boolean {
  if (!esAdmin) return false;
  return visita.estado === "iniciada";
}

export function getVisitaDeleteErrorMessage(err: ApiError): string {
  if (err.status === 403) {
    return err.message?.trim() || "Solo un administrador puede eliminar visitas";
  }
  if (err.status === 404) {
    return err.message?.trim() || "La visita ya no existe.";
  }
  if (err.status === 409) {
    const msg = err.message?.trim() || "";
    if (/iniciada/i.test(msg)) {
      return (
        msg ||
        "No se puede eliminar una visita iniciada; finalizala o cancelala primero"
      );
    }
    if (/facturada|pagada|cobro/i.test(msg)) {
      return (
        msg ||
        "No se puede eliminar una visita facturada o pagada; desmarcá el estado de cobro antes de eliminarla"
      );
    }
    return msg || "No se puede eliminar la visita en su estado actual.";
  }
  return getApiErrorMessages(err).join(" ");
}

export function getVisitaCancelErrorMessage(err: ApiError): string {
  if (err.status === 403) {
    return err.message?.trim() || "Solo un administrador puede cancelar visitas.";
  }
  if (err.status === 404) {
    return err.message?.trim() || "La visita ya no existe.";
  }
  if (err.status === 409) {
    return err.message?.trim() || "No se puede cancelar la visita en su estado actual.";
  }
  return getApiErrorMessages(err).join(" ");
}
