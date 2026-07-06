import type { PacienteListItemDto } from "@/lib/api/types";

export type PacientesDirectoryFiltersState = {
  obraSocialId: "all" | "none" | string;
  sexo: "all" | PacienteListItemDto["sexo"];
};

export const DEFAULT_PACIENTES_DIRECTORY_FILTERS: PacientesDirectoryFiltersState = {
  obraSocialId: "all",
  sexo: "all",
};

export function hasActivePacientesDirectoryFilters(
  filters: PacientesDirectoryFiltersState
): boolean {
  return filters.obraSocialId !== "all" || filters.sexo !== "all";
}

function resolveObraSocialId(paciente: PacienteListItemDto): number | null {
  const id = paciente.obraSocialId ?? paciente.obraSocial?.id;
  if (id == null || !Number.isFinite(Number(id)) || Number(id) <= 0) return null;
  return Number(id);
}

export function matchesPacienteDirectoryFilters(
  paciente: PacienteListItemDto,
  filters: PacientesDirectoryFiltersState
): boolean {
  if (filters.sexo !== "all" && paciente.sexo !== filters.sexo) {
    return false;
  }

  if (filters.obraSocialId === "all") return true;

  const obraId = resolveObraSocialId(paciente);

  if (filters.obraSocialId === "none") {
    return obraId == null;
  }

  return obraId != null && String(obraId) === filters.obraSocialId;
}
