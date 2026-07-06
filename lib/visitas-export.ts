import { listVisitasAllWithApi } from "@/lib/api/visitas";
import type { VisitaListItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
  exportDateIso,
} from "@/lib/excel-export";
import {
  hasActiveVisitasDirectoryFilters,
  visitasDirectoryFiltersToApi,
  type VisitasDirectoryFiltersState,
} from "@/lib/visitas-directory-filters";
import {
  getPacienteNombre,
  getVisitaPacienteDocumento,
  matchesVisitaSearch,
} from "@/lib/visitas-display";

export type VisitasExportFilters = {
  searchQuery: string;
  directoryFilters: VisitasDirectoryFiltersState;
};

const EXPORT_HEADERS = [
  "id",
  "fecha",
  "estado",
  "paciente",
  "documento",
  "servicio",
  "prestador",
  "prestador_email",
  "duracion_minutos",
  "observaciones",
  "insumos",
  "modalidad_cobro",
  "valor_aplicado",
  "facturado",
  "pagado",
] as const;

export function visitasExportHasActiveFilters(filters: VisitasExportFilters): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    hasActiveVisitasDirectoryFilters(filters.directoryFilters)
  );
}

export function applyVisitasExportFilters(
  items: VisitaListItemDto[],
  filters: VisitasExportFilters
): VisitaListItemDto[] {
  const apiFilters = visitasDirectoryFiltersToApi(filters.directoryFilters);

  let rows = items;
  if (apiFilters.pacienteServicioId != null) {
    rows = rows.filter((row) => row.pacienteServicioId === apiFilters.pacienteServicioId);
  } else if (apiFilters.pacienteId != null) {
    rows = rows.filter(
      (row) => row.pacienteServicio?.paciente?.id === apiFilters.pacienteId
    );
  }

  return rows.filter((row) => matchesVisitaSearch(row, filters.searchQuery));
}

function formatInsumosExport(visita: VisitaListItemDto): string {
  return (visita.insumos ?? [])
    .map((item) => `${item.insumoNombre} x${item.cantidad}`)
    .join("; ");
}

function visitaToExportRow(visita: VisitaListItemDto): (string | number)[] {
  const finanzas = visita.finanzas;

  return [
    visita.id,
    exportDateIso(visita.fecha),
    visita.estado,
    getPacienteNombre(visita),
    getVisitaPacienteDocumento(visita),
    visita.pacienteServicio?.servicio?.nombre?.trim() ?? "",
    visita.prestador?.nombre?.trim() ?? "",
    visita.prestador?.email?.trim() ?? "",
    visita.tiempoMinutos ?? "",
    visita.observaciones?.trim() ?? "",
    formatInsumosExport(visita),
    finanzas?.modalidadCobro ?? "",
    finanzas?.valorAplicado ?? "",
    finanzas ? exportBoolSiNo(finanzas.facturado) : "",
    finanzas ? exportBoolSiNo(finanzas.pagado) : "",
  ];
}

export function downloadVisitasExcel(
  items: VisitaListItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(visitaToExportRow),
    sheetName: "Visitas",
    filename: buildExportFilename("visitas", { filtered: options?.filtered }),
  });
}

export async function exportVisitasWithFilters(
  token: string,
  filters: VisitasExportFilters
): Promise<number> {
  const all = await listVisitasAllWithApi(token, visitasDirectoryFiltersToApi(filters.directoryFilters));
  const filtered = applyVisitasExportFilters(all, filters);
  if (filtered.length === 0) return 0;

  downloadVisitasExcel(filtered, {
    filtered: visitasExportHasActiveFilters(filters),
  });
  return filtered.length;
}
