import type { PacienteDto, PacienteListItemDto } from "@/lib/api/types";
import { calculateAgeFromBirthDate } from "@/lib/patient-qr";

type PacienteLike = PacienteListItemDto | PacienteDto;
type PacienteNombreLike = Pick<PacienteLike, "nombre" | "apellido">;

export function getPacienteNombre(paciente: PacienteNombreLike): string {
  return `${paciente.nombre} ${paciente.apellido}`.trim();
}

export function getPacienteInitials(paciente: PacienteNombreLike): string {
  return [paciente.nombre, paciente.apellido]
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatPacienteSexo(sexo: PacienteListItemDto["sexo"]): string {
  if (sexo === "M") return "Masculino";
  if (sexo === "F") return "Femenino";
  return "Otro";
}

export function formatPacienteFechaNacimiento(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getPacienteEdad(iso: string): number {
  return calculateAgeFromBirthDate(iso);
}

export function formatPacienteObraSocial(
  obraSocial?: PacienteListItemDto["obraSocial"] | null
): string {
  if (!obraSocial?.nombre) return "—";
  const base = obraSocial.codigo
    ? `${obraSocial.nombre} (${obraSocial.codigo})`
    : obraSocial.nombre;
  if (obraSocial.estado === false) return `${base} · inactiva`;
  return base;
}

export function formatPacienteLocalidad(localidad?: string | null): string {
  const nombre = localidad?.trim();
  return nombre || "—";
}

export function matchesPacienteSearch(paciente: PacienteListItemDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    paciente.nombre,
    paciente.apellido,
    paciente.numeroDocumento,
    paciente.codigoQr,
    paciente.telefono,
    paciente.direccion,
    formatPacienteLocalidad(paciente.localidad),
    paciente.localidad,
    paciente.numeroAfiliado,
    formatPacienteSexo(paciente.sexo),
    formatPacienteObraSocial(paciente.obraSocial),
    paciente.obraSocial?.codigo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
