import { listObrasSocialesAllWithApi } from "@/lib/api/obras-sociales";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
} from "@/lib/excel-export";

export type ObrasSocialesExportFilters = {
  search?: string;
  estado?: boolean;
};

const EXPORT_HEADERS = ["nombre", "codigo", "estado"] as const;

export function obrasSocialesExportHasActiveFilters(
  filters: ObrasSocialesExportFilters
): boolean {
  return Boolean(filters.search?.trim()) || filters.estado != null;
}

function obraToExportRow(obra: ObraSocialListItemDto): string[] {
  const activo = obra.estado ?? true;
  return [obra.nombre, obra.codigo, exportBoolSiNo(activo)];
}

export function downloadObrasSocialesExcel(
  items: ObraSocialListItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(obraToExportRow),
    sheetName: "Obras sociales",
    filename: buildExportFilename("obras_sociales", { filtered: options?.filtered }),
  });
}

export async function exportObrasSocialesWithFilters(
  token: string,
  filters: ObrasSocialesExportFilters
): Promise<number> {
  const search = filters.search?.trim() || undefined;
  const items = await listObrasSocialesAllWithApi(token, {
    search,
    estado: filters.estado,
  });
  if (items.length === 0) return 0;

  downloadObrasSocialesExcel(items, {
    filtered: obrasSocialesExportHasActiveFilters(filters),
  });
  return items.length;
}
