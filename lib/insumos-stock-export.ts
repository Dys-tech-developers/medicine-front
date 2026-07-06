import { listInsumosAllWithApi } from "@/lib/api/insumos";
import type { InsumoListItemDto } from "@/lib/api/types";
import {
  buildExportFilename,
  downloadExcelSheet,
  exportBoolSiNo,
  exportDateIso,
} from "@/lib/excel-export";
import { matchesInsumoSearch } from "@/lib/insumos-display";
import { getStockLevel, stockLevelLabel } from "@/lib/insumos-stock";
import {
  getInsumoDiasParaVencer,
  getInsumoVencimientoStatus,
  insumoVencimientoStatusLabel,
  isInsumoConAlertaVencimiento,
} from "@/lib/insumos-vencimiento";

export type StockExportFilters = {
  searchQuery: string;
  soloBajoStock: boolean;
  soloProximosVencer: boolean;
};

const EXPORT_HEADERS = [
  "nombre",
  "descripcion",
  "codigo",
  "stock_actual",
  "stock_minimo",
  "unidad_medida",
  "requiere_vencimiento",
  "fecha_vencimiento",
  "estado",
  "nivel_stock",
  "alerta_vencimiento",
] as const;

export function stockExportHasActiveFilters(filters: StockExportFilters): boolean {
  return (
    filters.soloBajoStock ||
    filters.soloProximosVencer ||
    filters.searchQuery.trim().length > 0
  );
}

export function applyStockExportFilters(
  items: InsumoListItemDto[],
  filters: StockExportFilters
): InsumoListItemDto[] {
  return items.filter((row) => {
    if (!matchesInsumoSearch(row, filters.searchQuery)) return false;
    if (filters.soloProximosVencer && !isInsumoConAlertaVencimiento(row)) return false;
    return true;
  });
}

function insumoToExportRow(insumo: InsumoListItemDto): string[] {
  const stockLevel = getStockLevel(insumo);
  const vencStatus = getInsumoVencimientoStatus(insumo);
  const diasVenc = getInsumoDiasParaVencer(insumo);
  const activo = insumo.estado ?? insumo.activo ?? true;

  return [
    insumo.nombre,
    insumo.descripcion?.trim() ?? "",
    insumo.codigo,
    String(insumo.stockActual ?? insumo.cantidad ?? 0),
    String(insumo.stockMinimo ?? 0),
    insumo.unidadMedida || insumo.unidad || "",
    exportBoolSiNo(Boolean(insumo.requiereVencimiento)),
    insumo.requiereVencimiento ? exportDateIso(insumo.fechaVencimiento) : "",
    exportBoolSiNo(activo),
    stockLevelLabel(stockLevel),
    insumoVencimientoStatusLabel(vencStatus, diasVenc),
  ];
}

export function downloadStockListExcel(
  items: InsumoListItemDto[],
  options?: { filtered?: boolean }
): void {
  downloadExcelSheet({
    headers: EXPORT_HEADERS,
    rows: items.map(insumoToExportRow),
    sheetName: "Stock",
    filename: buildExportFilename("stock_inventario", { filtered: options?.filtered }),
  });
}

export async function exportStockListWithFilters(
  token: string,
  filters: StockExportFilters
): Promise<number> {
  const all = await listInsumosAllWithApi(token, {
    bajoStock: filters.soloBajoStock || undefined,
  });
  const filtered = applyStockExportFilters(all, filters);
  if (filtered.length === 0) return 0;

  downloadStockListExcel(filtered, {
    filtered: stockExportHasActiveFilters(filters),
  });
  return filtered.length;
}
