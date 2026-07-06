import { listPrestadoresAllWithApi } from "@/lib/api/prestadores";
import type { PrestadorListItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
} from "@/lib/excel-export";
import { getPrestadorEstadoCuenta } from "@/lib/prestadores-estado-cuenta";
import {
  formatPrestadorServiciosList,
  matchesPrestadorSearch,
} from "@/lib/prestadores-display";
import {
  hasActivePrestadoresPeriodFilters,
  prestadoresPeriodFiltersToApi,
  type PrestadoresPeriodFiltersState,
} from "@/lib/prestadores-period-filters";

export type PrestadoresExportFilters = {
  searchQuery: string;
  periodFilters: PrestadoresPeriodFiltersState;
};

const EXPORT_HEADERS = [
  "nombre",
  "email",
  "telefono",
  "lugar_residencia",
  "documento",
  "matricula",
  "cuit",
  "cbu",
  "regimen_iva",
  "estado",
  "servicios",
  "visitas_periodo",
  "horas_periodo",
  "monto_pagado",
  "monto_pendiente",
] as const;

export function prestadoresExportHasActiveFilters(
  filters: PrestadoresExportFilters
): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    hasActivePrestadoresPeriodFilters(filters.periodFilters)
  );
}

export function applyPrestadoresExportFilters(
  items: PrestadorListItemDto[],
  filters: PrestadoresExportFilters
): PrestadorListItemDto[] {
  return items.filter((row) => matchesPrestadorSearch(row, filters.searchQuery));
}

function prestadorToExportRow(prestador: PrestadorListItemDto): (string | number)[] {
  const cuenta = getPrestadorEstadoCuenta(prestador);

  return [
    prestador.nombre,
    prestador.email,
    prestador.telefono?.trim() ?? "",
    prestador.lugarResidencia?.trim() ?? "",
    prestador.documento,
    prestador.matricula,
    prestador.cuit,
    prestador.cbu?.trim() ?? "",
    prestador.regimenIva ?? "",
    exportBoolSiNo(prestador.estado),
    formatPrestadorServiciosList(prestador.servicios),
    cuenta.cantidadVisitas,
    cuenta.horasTrabajadas,
    cuenta.montoPagado,
    cuenta.montoPendiente,
  ];
}

export function downloadPrestadoresExcel(
  items: PrestadorListItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(prestadorToExportRow),
    sheetName: "Prestadores",
    filename: buildExportFilename("prestadores", { filtered: options?.filtered }),
  });
}

export async function exportPrestadoresWithFilters(
  token: string,
  filters: PrestadoresExportFilters
): Promise<number> {
  const all = await listPrestadoresAllWithApi(
    token,
    prestadoresPeriodFiltersToApi(filters.periodFilters)
  );
  const filtered = applyPrestadoresExportFilters(all, filters);
  if (filtered.length === 0) return 0;

  downloadPrestadoresExcel(filtered, {
    filtered: prestadoresExportHasActiveFilters(filters),
  });
  return filtered.length;
}
