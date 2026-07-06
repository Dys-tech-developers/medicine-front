import { listReporteVisitasAllWithApi } from "@/lib/api/reportes";
import type { ReporteVisitaItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
  exportDateIso,
} from "@/lib/excel-export";
import {
  filtersToReportesQuery,
  reportesFinanzasExportHasActiveFilters,
  type ReportesFinanzasFilters,
} from "@/lib/reportes/url-filters";

const EXPORT_HEADERS = [
  "visita_id",
  "fecha_inicio",
  "duracion_minutos",
  "paciente",
  "documento",
  "prestador",
  "servicio",
  "modalidad_cobro",
  "valor_aplicado",
  "facturado",
  "pagado",
] as const;

function reporteVisitaToExportRow(item: ReporteVisitaItemDto): (string | number)[] {
  const paciente = `${item.pacienteNombre} ${item.pacienteApellido}`.trim();

  return [
    item.visitaId,
    exportDateIso(item.fechaInicio),
    item.tiempoMinutos,
    paciente,
    item.numeroDocumento,
    item.prestadorNombre,
    item.servicioNombre,
    item.modalidadCobro,
    item.valorAplicado,
    exportBoolSiNo(item.facturado),
    exportBoolSiNo(item.pagado),
  ];
}

export function downloadReportesFinanzasExcel(
  items: ReporteVisitaItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(reporteVisitaToExportRow),
    sheetName: "Liquidación",
    filename: buildExportFilename("liquidacion_finanzas", { filtered: options?.filtered }),
  });
}

export async function exportReportesFinanzasWithFilters(
  token: string,
  filters: Omit<ReportesFinanzasFilters, "page" | "pageSize">
): Promise<number> {
  const items = await listReporteVisitasAllWithApi(token, filtersToReportesQuery(filters));
  if (items.length === 0) return 0;

  downloadReportesFinanzasExcel(items, {
    filtered: reportesFinanzasExportHasActiveFilters(filters),
  });
  return items.length;
}
