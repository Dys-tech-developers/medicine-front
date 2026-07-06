import { listServiciosAllWithApi } from "@/lib/api/servicios";
import type { ServicioConTarifasDto, ServicioTarifaDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
} from "@/lib/excel-export";
import { getServicioPacientesCount } from "@/lib/servicios-display";

export type ServiciosExportFilters = {
  search?: string;
};

const EXPORT_HEADERS = [
  "nombre",
  "descripcion",
  "estado",
  "control_horario",
  "modo_relevo",
  "cantidad_tarifas",
  "tarifas",
  "pacientes_asignados",
] as const;

export function serviciosExportHasActiveFilters(filters: ServiciosExportFilters): boolean {
  return Boolean(filters.search?.trim());
}

function formatTarifaExport(tarifa: ServicioTarifaDto): string {
  return `${tarifa.modalidadCobro}|${tarifa.tipoJornada}|${tarifa.tipoDia}|${tarifa.valor}`;
}

function formatTarifasExport(tarifas: ServicioTarifaDto[]): string {
  return tarifas.map(formatTarifaExport).join("; ");
}

function servicioToExportRow(servicio: ServicioConTarifasDto): (string | number)[] {
  const tarifas = servicio.tarifas ?? [];

  return [
    servicio.nombre,
    servicio.descripcion?.trim() ?? "",
    exportBoolSiNo(servicio.estado),
    exportBoolSiNo(Boolean(servicio.controlHorario)),
    exportBoolSiNo(Boolean(servicio.modoRelevo)),
    tarifas.length,
    formatTarifasExport(tarifas),
    getServicioPacientesCount(servicio),
  ];
}

export function downloadServiciosExcel(
  items: ServicioConTarifasDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(servicioToExportRow),
    sheetName: "Servicios",
    filename: buildExportFilename("servicios", { filtered: options?.filtered }),
  });
}

export async function exportServiciosWithFilters(
  token: string,
  filters: ServiciosExportFilters
): Promise<number> {
  const search = filters.search?.trim() || undefined;
  const items = await listServiciosAllWithApi(token, { search });
  if (items.length === 0) return 0;

  downloadServiciosExcel(items, {
    filtered: serviciosExportHasActiveFilters(filters),
  });
  return items.length;
}
