"use client";

import { listInsumosWithApi } from "@/lib/api/insumos";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UseInsumosListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  bajoStock?: boolean;
  estado?: boolean;
  minLoadingMs?: number;
};

export function useInsumosList({
  accessToken,
  enabled = true,
  page,
  pageSize,
  bajoStock,
  estado,
  minLoadingMs,
}: UseInsumosListOptions) {
  return useCachedList({
    resource: "insumos",
    accessToken,
    enabled,
    queryParams: { page, pageSize, bajoStock, estado },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar los insumos.",
    fetcher: () =>
      listInsumosWithApi(accessToken!, {
        ...(page != null && pageSize != null ? { page, pageSize } : {}),
        ...(bajoStock ? { bajoStock: true } : {}),
        ...(estado != null ? { estado } : {}),
      }).then((data) => ({
        items: data.items,
        total: data.total,
      })),
  });
}
