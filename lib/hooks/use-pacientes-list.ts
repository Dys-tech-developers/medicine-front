"use client";

import { listPacientesWithApi } from "@/lib/api/pacientes";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UsePacientesListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  minLoadingMs?: number;
};

export function usePacientesList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 20,
  minLoadingMs,
}: UsePacientesListOptions) {
  return useCachedList({
    resource: "pacientes",
    accessToken,
    enabled,
    queryParams: { page, pageSize },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar los pacientes.",
    fetcher: () =>
      listPacientesWithApi(accessToken!, page, pageSize).then((data) => ({
        items: data.items,
        total: data.total,
      })),
  });
}
