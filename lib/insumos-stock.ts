import type { InsumoListItemDto } from "@/lib/api/types";
import { medicalDangerBadge, medicalWarningBadge } from "@/lib/medical-ui-classes";

export type StockLevel = "ok" | "low" | "critical";

export function getStockLevel(insumo: InsumoListItemDto): StockLevel {
  const qty = insumo.cantidad ?? insumo.stockActual ?? 0;
  const min = insumo.stockMinimo ?? 0;

  if (qty <= 0) return "critical";
  if (insumo.bajoStock || qty <= min) return "low";
  return "ok";
}

export function stockLevelLabel(level: StockLevel): string {
  switch (level) {
    case "critical":
      return "Sin stock";
    case "low":
      return "Stock bajo";
    default:
      return "OK";
  }
}

export function stockLevelBadgeClass(level: StockLevel): string {
  switch (level) {
    case "critical":
      return medicalDangerBadge;
    case "low":
      return medicalWarningBadge;
    default:
      return "border-medical-primary/25 bg-medical-secondary text-medical-primaryDark";
  }
}

export function stockLevelDotClass(level: StockLevel): string {
  switch (level) {
    case "critical":
      return "bg-medical-danger";
    case "low":
      return "bg-medical-warning";
    default:
      return "bg-medical-primary";
  }
}
