"use client";

import { listPacienteServiciosWithApi } from "@/lib/api/paciente-servicios";
import type { PacienteServicioDto, PacienteServicioEstado } from "@/lib/api/types";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UsePacienteServiciosListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  pacienteId?: number;
  servicioId?: number;
  estado?: PacienteServicioEstado;
  minLoadingMs?: number;
};

export function usePacienteServiciosList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 100,
  pacienteId,
  servicioId,
  estado,
  minLoadingMs,
}: UsePacienteServiciosListOptions) {
  return useCachedList<PacienteServicioDto>({
    resource: "paciente-servicios",
    accessToken,
    enabled,
    queryParams: { page, pageSize, pacienteId, servicioId, estado },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar las asignaciones de servicios.",
    fetcher: () =>
      listPacienteServiciosWithApi(accessToken!, {
        page,
        pageSize,
        pacienteId,
        servicioId,
        estado,
      }).then((data) => ({
        items: data.items,
        total: data.total,
      })),
  });
}
