import type { PrestadorListItemDto, RegimenIva } from "@/lib/api/types";
import { REGIMEN_IVA_LABELS } from "@/lib/prestadores-labels";

export function formatRegimenIva(regimen?: RegimenIva | null): string {
  if (!regimen) return "—";
  return REGIMEN_IVA_LABELS[regimen] ?? regimen;
}

export function formatPrestadorCbu(cbu?: string | null): string {
  if (!cbu) return "—";
  const digits = cbu.replace(/\D/g, "");
  if (digits.length !== 22) return cbu;
  return `${digits.slice(0, 8)} ${digits.slice(8, 14)} ${digits.slice(14)}`;
}

export function formatPrestadorDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function getPrestadorInitials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatPrestadorDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function prestadorSearchHaystack(row: PrestadorListItemDto): string {
  return [
    row.nombre,
    row.email,
    row.documento,
    row.matricula,
    row.telefono,
    row.lugarResidencia,
    row.cuit,
    row.cbu,
    formatRegimenIva(row.regimenIva),
  ]
    .join(" ")
    .toLowerCase();
}
