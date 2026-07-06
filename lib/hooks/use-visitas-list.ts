"use client";

import { listVisitasWithApi, type ListVisitasOptions } from "@/lib/api/visitas";
import type { VisitaListItemDto } from "@/lib/api/types";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UseVisitasListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  prestadorId?: number;
  pacienteServicioId?: number;
  pacienteId?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  minLoadingMs?: number;
};

export function useVisitasList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 20,
  prestadorId,
  pacienteServicioId,
  pacienteId,
  fechaDesde,
  fechaHasta,
  minLoadingMs,
}: UseVisitasListOptions) {
  return useCachedList<VisitaListItemDto>({
    resource: "visitas",
    accessToken,
    enabled,
    queryParams: {
      page,
      pageSize,
      prestadorId,
      pacienteServicioId,
      pacienteId,
      fechaDesde: fechaDesde?.toISOString(),
      fechaHasta: fechaHasta?.toISOString(),
    },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar las visitas.",
    fetcher: () => {
      const query: ListVisitasOptions = { page, pageSize };
      if (prestadorId != null) query.prestadorId = prestadorId;
      if (pacienteServicioId != null) {
        query.pacienteServicioId = pacienteServicioId;
      } else if (pacienteId != null) {
        query.pacienteId = pacienteId;
      }
      if (fechaDesde) query.fechaDesde = fechaDesde;
      if (fechaHasta) query.fechaHasta = fechaHasta;
      return listVisitasWithApi(accessToken!, query).then((data) => ({
        items: data.items,
        total: data.total,
      }));
    },
  });
}
