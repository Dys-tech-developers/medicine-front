import type { PrestadorListItemDto, RegimenIva } from "@/lib/api/types";
import { formatReporteHoras } from "@/lib/reportes-display";
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
    ...(row.servicios?.map((s) => s.nombre?.trim() || `Servicio #${s.id}`) ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesPrestadorSearch(row: PrestadorListItemDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return prestadorSearchHaystack(row).includes(q);
}

export function formatPrestadorVisitasCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "—";
  return String(count);
}

export function formatPrestadorHorasEnPeriodo(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  return formatReporteHoras(hours);
}

export function formatPrestadorVisitasResumen(cuenta: {
  cantidadVisitas: number;
  horasTrabajadas: number;
}): string {
  if (!Number.isFinite(cuenta.cantidadVisitas) || cuenta.cantidadVisitas <= 0) {
    return "Sin visitas en el período";
  }
  const visitas =
    cuenta.cantidadVisitas === 1 ? "1 visita" : `${cuenta.cantidadVisitas} visitas`;
  const horas = formatPrestadorHorasEnPeriodo(cuenta.horasTrabajadas);
  return horas === "—" ? visitas : `${visitas} · ${horas}`;
}

/** Etiqueta para selects: «Nombre — matrícula» (+ email si ayuda a distinguir). */
export function formatPrestadorServiciosList(
  servicios: PrestadorListItemDto["servicios"]
): string {
  if (!servicios?.length) return "Sin servicios habilitados";
  return servicios.map((s) => s.nombre?.trim() || `Servicio #${s.id}`).join(", ");
}

/** Etiqueta para selects: «Nombre — matrícula» (+ email si ayuda a distinguir). */
export function formatPrestadorSelectLabel(p: PrestadorListItemDto): string {
  const nombre = p.nombre?.trim() || `Prestador #${p.id}`;
  const matricula = p.matricula?.trim();
  const base = matricula ? `${nombre} — ${matricula}` : nombre;
  const email = p.email?.trim();
  if (email && email !== nombre) return `${base} · ${email}`;
  return base;
}
