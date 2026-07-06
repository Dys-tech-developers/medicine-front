import type { PacienteServicioDto } from "@/lib/api/types";

export function countPacienteServiciosUsingServicio(
  servicioId: number,
  asignaciones: PacienteServicioDto[]
): number {
  return asignaciones.filter((ps) => ps.servicioId === servicioId).length;
}

export function formatPacienteServicioPrestadorLabel(
  asignacion: Pick<PacienteServicioDto, "prestador" | "prestadorId" | "prestadoresAsignados">
): string {
  const asignados = asignacion.prestadoresAsignados;
  if (asignados && asignados.length > 0) {
    return asignados.map((p) => p.nombre).join(", ");
  }
  if (asignacion.prestadorId == null || asignacion.prestadorId <= 0) {
    return "Cualquier prestador habilitado";
  }
  const nombre = asignacion.prestador?.nombre?.trim();
  if (nombre) return nombre;
  const email = asignacion.prestador?.email?.trim();
  if (email) return email;
  return "—";
}

export function formatPacienteServicioPrestadorSubtitulo(
  asignacion: Pick<PacienteServicioDto, "prestador">
): string | null {
  const nombre = asignacion.prestador?.nombre?.trim();
  const email = asignacion.prestador?.email?.trim();
  if (nombre && email) return email;
  return null;
}

export function formatPacienteServicioAsignacionLabel(ps: PacienteServicioDto): string {
  const prestador = formatPacienteServicioPrestadorLabel(ps);
  if (ps.prestadorId == null || ps.prestadorId <= 0) {
    return ps.servicio.nombre;
  }
  return `${ps.servicio.nombre} · ${prestador}`;
}
