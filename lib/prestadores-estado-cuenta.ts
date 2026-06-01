import type { PrestadorEstadoCuentaDto, PrestadorListItemDto } from "@/lib/api/types";

export const EMPTY_PRESTADOR_ESTADO_CUENTA: PrestadorEstadoCuentaDto = {
  cantidadVisitas: 0,
  horasTrabajadas: 0,
  finanzas: {
    totalGenerado: "0",
    pagado: "0",
    pendienteFacturacion: "0",
    facturadoPendientePago: "0",
    cantidadPagado: 0,
  },
  montoPagado: "0",
  montoPendiente: "0",
};

export function getPrestadorEstadoCuenta(
  row: PrestadorListItemDto
): PrestadorEstadoCuentaDto {
  return row.estadoCuenta ?? EMPTY_PRESTADOR_ESTADO_CUENTA;
}

export function parsePrestadorMonto(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

export function prestadorMontoTieneSaldo(value: string | number | null | undefined): boolean {
  return parsePrestadorMonto(value) > 0.005;
}
