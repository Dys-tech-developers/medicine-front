import type { InsumoListItemDto } from "@/lib/api/types";
import { medicalDangerBadge, medicalWarningBadge } from "@/lib/medical-ui-classes";

/** Días hacia adelante para considerar un insumo «próximo a vencer». */
export const INSUMO_VENCIMIENTO_PROXIMO_DIAS = 30;

export type InsumoVencimientoStatus = "none" | "ok" | "proximo" | "vencido";

function parseInsumoVencimientoDate(iso: string): Date | null {
  const trimmed = iso.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]) - 1;
    const d = Number(dateOnly[3]);
    const local = new Date(y, m, d);
    if (local.getFullYear() !== y || local.getMonth() !== m || local.getDate() !== d) {
      return null;
    }
    return local;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfLocalDay(parsed);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getInsumoDiasParaVencer(
  insumo: InsumoListItemDto,
  ref = new Date()
): number | null {
  if (!insumo.requiereVencimiento || !insumo.fechaVencimiento) return null;
  const venc = parseInsumoVencimientoDate(insumo.fechaVencimiento);
  if (!venc) return null;
  const diffMs = startOfLocalDay(venc).getTime() - startOfLocalDay(ref).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getInsumoVencimientoStatus(
  insumo: InsumoListItemDto,
  proximoDias = INSUMO_VENCIMIENTO_PROXIMO_DIAS,
  ref = new Date()
): InsumoVencimientoStatus {
  if (!insumo.requiereVencimiento || !insumo.fechaVencimiento) return "none";
  const dias = getInsumoDiasParaVencer(insumo, ref);
  if (dias == null) return "none";
  if (dias < 0) return "vencido";
  if (dias <= proximoDias) return "proximo";
  return "ok";
}

export function isInsumoConAlertaVencimiento(
  insumo: InsumoListItemDto,
  proximoDias = INSUMO_VENCIMIENTO_PROXIMO_DIAS
): boolean {
  const status = getInsumoVencimientoStatus(insumo, proximoDias);
  return status === "vencido" || status === "proximo";
}

export function formatInsumoFechaVencimiento(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseInsumoVencimientoDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function insumoVencimientoStatusLabel(
  status: InsumoVencimientoStatus,
  dias: number | null
): string {
  switch (status) {
    case "none":
      return "Sin vencimiento";
    case "ok":
      return dias === 0 ? "Vence hoy" : dias != null && dias > 0 ? `En ${dias} días` : "Vigente";
    case "proximo":
      if (dias === 0) return "Vence hoy";
      if (dias === 1) return "Vence mañana";
      return dias != null ? `En ${dias} días` : "Próximo a vencer";
    case "vencido":
      return dias != null && dias < 0
        ? `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`
        : "Vencido";
    default:
      return "—";
  }
}

export function insumoVencimientoBadgeClass(status: InsumoVencimientoStatus): string {
  switch (status) {
    case "vencido":
      return medicalDangerBadge;
    case "proximo":
      return medicalWarningBadge;
    case "ok":
      return "border-medical-primary/25 bg-medical-secondary text-medical-primaryDark";
    default:
      return "border-medical-border/80 bg-medical-surface text-medical-mutedText";
  }
}

export function insumoVencimientoDotClass(status: InsumoVencimientoStatus): string {
  switch (status) {
    case "vencido":
      return "bg-medical-danger";
    case "proximo":
      return "bg-medical-warning";
    case "ok":
      return "bg-medical-primary";
    default:
      return "bg-medical-mutedText/40";
  }
}

export type InsumosVencimientoResumen = {
  total: number;
  vencidos: number;
  proximos: number;
  /** Menor cantidad de días hasta vencer entre los insumos «próximos» (no vencidos). */
  minDiasProximo: number | null;
};

export function countInsumosConAlertaVencimiento(
  items: InsumoListItemDto[],
  proximoDias = INSUMO_VENCIMIENTO_PROXIMO_DIAS
): InsumosVencimientoResumen {
  let vencidos = 0;
  let proximos = 0;
  let minDiasProximo: number | null = null;

  for (const item of items) {
    const status = getInsumoVencimientoStatus(item, proximoDias);
    if (status === "vencido") {
      vencidos += 1;
      continue;
    }
    if (status !== "proximo") continue;

    proximos += 1;
    const dias = getInsumoDiasParaVencer(item);
    if (dias != null && (minDiasProximo == null || dias < minDiasProximo)) {
      minDiasProximo = dias;
    }
  }

  return { total: vencidos + proximos, vencidos, proximos, minDiasProximo };
}

function formatDiasHastaVencimiento(dias: number): string {
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  return `vence en ${dias} días`;
}

/** Texto secundario del KPI del dashboard según el resumen de alertas. */
export function formatInsumosVencimientoKpiSub(resumen: InsumosVencimientoResumen): string {
  const { total, vencidos, proximos, minDiasProximo } = resumen;
  if (total === 0) return "sin alertas";

  const proximoText =
    minDiasProximo != null ? formatDiasHastaVencimiento(minDiasProximo) : null;

  if (vencidos > 0 && proximos > 0 && proximoText) {
    const minText =
      minDiasProximo === 0
        ? "hoy"
        : minDiasProximo === 1
          ? "mañana"
          : `en ${minDiasProximo} días`;
    return `${vencidos} vencido${vencidos === 1 ? "" : "s"} · próximo ${minText}`;
  }

  if (vencidos > 0) {
    return vencidos === 1 ? "1 vencido" : `${vencidos} vencidos`;
  }

  if (proximos === 1 && proximoText) {
    return proximoText;
  }

  if (proximoText && minDiasProximo != null) {
    const minText =
      minDiasProximo === 0
        ? "hoy"
        : minDiasProximo === 1
          ? "mañana"
          : `mín. ${minDiasProximo} días`;
    return `${proximos} insumos · ${minText}`;
  }

  return `${proximos} próximo${proximos === 1 ? "" : "s"}`;
}
