import type { PacienteServicioEstado, UpdatePacienteServicioBody } from "@/lib/api/types";

export function canPatchPacienteServicio(roles: string[]): boolean {
  return roles.includes("ADMIN") || roles.includes("OPERADOR");
}

export function canDeletePacienteServicio(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

/** GET /prestadores es solo ADMIN; OPERADOR no puede poblar el selector hoy. */
export function canListPrestadoresForAsignacion(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

function todayIsoMidday(): string {
  return new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`).toISOString();
}

export function buildFinalizarPacienteServicioBody(
  fechaFin = todayIsoMidday()
): UpdatePacienteServicioBody {
  return {
    estado: "finalizada",
    fechaFin,
  };
}

export function buildSuspenderPacienteServicioBody(): UpdatePacienteServicioBody {
  return { estado: "suspendida" };
}

export function buildReactivarPacienteServicioBody(): UpdatePacienteServicioBody {
  return { estado: "activa", fechaFin: null };
}

export type PacienteServicioAccion = "finalizar" | "suspender" | "reactivar" | "eliminar";

export function asignacionPermiteAccion(
  estado: PacienteServicioEstado,
  accion: PacienteServicioAccion
): boolean {
  switch (accion) {
    case "finalizar":
      return estado === "activa" || estado === "suspendida";
    case "suspender":
      return estado === "activa";
    case "reactivar":
      return estado === "suspendida";
    case "eliminar":
      return estado !== "finalizada";
    default:
      return false;
  }
}
