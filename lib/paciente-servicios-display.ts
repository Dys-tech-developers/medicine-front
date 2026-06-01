import type { PacienteServicioDto } from "@/lib/api/types";

export function countPacienteServiciosUsingServicio(
  servicioId: number,
  asignaciones: PacienteServicioDto[]
): number {
  return asignaciones.filter((ps) => ps.servicioId === servicioId).length;
}
