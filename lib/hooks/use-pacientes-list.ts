"use client";

import { listPacientesAllWithApi, listPacientesWithApi } from "@/lib/api/pacientes";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UsePacientesListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  /**
   * Carga el catálogo completo (para filtrar/buscar en todos los pacientes).
   * Cuando es true, ignora page/pageSize del request al API.
   */
  fetchAll?: boolean;
  minLoadingMs?: number;
};

export function usePacientesList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 20,
  fetchAll = false,
  minLoadingMs,
}: UsePacientesListOptions) {
  return useCachedList({
    resource: "pacientes",
    accessToken,
    enabled,
    queryParams: fetchAll ? { all: true } : { page, pageSize },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar los pacientes.",
    fetcher: () =>
      fetchAll
        ? listPacientesAllWithApi(accessToken!).then((items) => ({
            items,
            total: items.length,
          }))
        : listPacientesWithApi(accessToken!, page, pageSize).then((data) => ({
            items: data.items,
            total: data.total,
          })),
  });
}
