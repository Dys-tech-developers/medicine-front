import type { ServicioConTarifasDto, ServicioTarifaDto } from "@/lib/api/types";

/** Fila plana de tarifa para el directorio admin. */
export type TarifaListItem = ServicioTarifaDto & {
  servicioId: number;
  servicioNombre: string;
  servicioEstado: boolean;
};

export function flattenServicioTarifas(
  servicios: ServicioConTarifasDto[]
): TarifaListItem[] {
  const rows: TarifaListItem[] = [];
  for (const servicio of servicios) {
    for (const tarifa of servicio.tarifas ?? []) {
      rows.push({
        ...tarifa,
        servicioId: tarifa.servicioId ?? servicio.id,
        servicioNombre: servicio.nombre,
        servicioEstado: servicio.estado,
      });
    }
  }
  rows.sort((a, b) => {
    const byName = a.servicioNombre.localeCompare(b.servicioNombre, "es");
    if (byName !== 0) return byName;
    return a.id - b.id;
  });
  return rows;
}

export function upsertTarifaInServicios(
  servicios: ServicioConTarifasDto[],
  servicioId: number,
  tarifa: ServicioTarifaDto
): ServicioConTarifasDto[] {
  return servicios.map((servicio) => {
    if (servicio.id !== servicioId) return servicio;
    const tarifas = [...(servicio.tarifas ?? [])];
    const idx = tarifas.findIndex((t) => t.id === tarifa.id);
    const next: ServicioTarifaDto = {
      ...tarifa,
      servicioId: tarifa.servicioId ?? servicioId,
    };
    if (idx === -1) {
      tarifas.push(next);
    } else {
      tarifas[idx] = { ...tarifas[idx], ...next };
    }
    return { ...servicio, tarifas };
  });
}

export function removeTarifaFromServicios(
  servicios: ServicioConTarifasDto[],
  servicioId: number,
  tarifaId: number
): ServicioConTarifasDto[] {
  return servicios.map((servicio) => {
    if (servicio.id !== servicioId) return servicio;
    return {
      ...servicio,
      tarifas: (servicio.tarifas ?? []).filter((t) => t.id !== tarifaId),
    };
  });
}

export function filterTarifaListItems(
  items: TarifaListItem[],
  search: string
): TarifaListItem[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.servicioNombre,
      item.modalidadCobro,
      item.tipoJornada,
      item.tipoDia,
      item.valor,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
