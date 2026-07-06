import { listPacientesAllWithApi } from "@/lib/api/pacientes";
import type { PacienteListItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportDateIso,
} from "@/lib/excel-export";
import {
  hasActivePacientesDirectoryFilters,
  matchesPacienteDirectoryFilters,
  type PacientesDirectoryFiltersState,
} from "@/lib/pacientes-directory-filters";
import { matchesPacienteSearch } from "@/lib/pacientes-display";

export type PacientesExportFilters = {
  searchQuery: string;
  directoryFilters: PacientesDirectoryFiltersState;
};

const EXPORT_HEADERS = [
  "nombre",
  "apellido",
  "numero_documento",
  "codigo_qr",
  "fecha_nacimiento",
  "sexo",
  "telefono",
  "direccion",
  "localidad",
  "obra_social",
  "obra_social_codigo",
  "numero_afiliado",
] as const;

export function pacientesExportHasActiveFilters(filters: PacientesExportFilters): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    hasActivePacientesDirectoryFilters(filters.directoryFilters)
  );
}

export function applyPacientesExportFilters(
  items: PacienteListItemDto[],
  filters: PacientesExportFilters
): PacienteListItemDto[] {
  return items.filter(
    (row) =>
      matchesPacienteDirectoryFilters(row, filters.directoryFilters) &&
      matchesPacienteSearch(row, filters.searchQuery)
  );
}

function pacienteToExportRow(paciente: PacienteListItemDto): string[] {
  return [
    paciente.nombre,
    paciente.apellido,
    paciente.numeroDocumento,
    paciente.codigoQr,
    exportDateIso(paciente.fechaNacimiento),
    paciente.sexo,
    paciente.telefono?.trim() ?? "",
    paciente.direccion?.trim() ?? "",
    paciente.localidad?.trim() ?? "",
    paciente.obraSocial?.nombre?.trim() ?? "",
    paciente.obraSocial?.codigo?.trim() ?? "",
    paciente.numeroAfiliado?.trim() ?? "",
  ];
}

export function downloadPacientesExcel(
  items: PacienteListItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(pacienteToExportRow),
    sheetName: "Pacientes",
    filename: buildExportFilename("pacientes", { filtered: options?.filtered }),
  });
}

export async function exportPacientesWithFilters(
  token: string,
  filters: PacientesExportFilters
): Promise<number> {
  const all = await listPacientesAllWithApi(token);
  const filtered = applyPacientesExportFilters(all, filters);
  if (filtered.length === 0) return 0;

  downloadPacientesExcel(filtered, {
    filtered: pacientesExportHasActiveFilters(filters),
  });
  return filtered.length;
}
