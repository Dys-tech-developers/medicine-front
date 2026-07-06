import type { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";

export function getPacienteServicioApiErrorMessage(err: ApiError): string {
  if (err.status === 401) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (err.status === 403) {
    return err.message?.trim() || "No tenés permisos para gestionar esta asignación.";
  }
  if (err.status === 404) {
    const msg = err.message?.trim() || "";
    if (/prestador/i.test(msg)) {
      return "Prestador no encontrado. Elegí otro prestador del listado.";
    }
    return msg || "La asignación ya no existe.";
  }
  if (err.status === 409) {
    const msg = err.message?.trim() || "";
    if (/visitas registradas/i.test(msg)) {
      return "No se puede eliminar porque tiene visitas registradas. Finalizá la asignación en su lugar.";
    }
    if (/inactivo/i.test(msg)) {
      return "El prestador está inactivo. Elegí un prestador activo.";
    }
    if (/no tiene asociado el servicio|no tiene el servicio/i.test(msg)) {
      return "El prestador no tiene asociado el servicio indicado. Cambiá el prestador o el servicio.";
    }
    if (/cupo|agotado/i.test(msg)) {
      return msg;
    }
    return msg || "Conflicto al guardar la asignación.";
  }
  return getApiErrorMessages(err).join(" ");
}
