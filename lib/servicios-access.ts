import type { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";

export function canDeleteServicio(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

export function getServicioDeleteErrorMessage(err: ApiError): string {
  if (err.status === 403) {
    return "Solo usuarios con rol ADMIN pueden eliminar servicios del catálogo.";
  }
  if (err.status === 404) {
    return err.message?.trim() || "El servicio ya no existe.";
  }
  if (err.status === 409) {
    const msg = err.message?.trim() || "";
    if (/asignado a uno o más pacientes/i.test(msg)) {
      return "No se puede eliminar porque tiene asignaciones a pacientes. Quitá cada asignación desde la ficha del paciente antes de borrar el servicio.";
    }
    return msg || "No se puede eliminar el servicio en su estado actual.";
  }
  return getApiErrorMessages(err).join(" ");
}
