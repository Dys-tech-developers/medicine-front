"use client";

import { useCallback } from "react";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UseObrasSocialesListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: boolean;
  minLoadingMs?: number;
};

export function useObrasSocialesList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 100,
  search,
  estado,
  minLoadingMs,
}: UseObrasSocialesListOptions) {
  const searchKey = search?.trim() ?? "";
  const estadoKey = estado === undefined ? "all" : estado ? "true" : "false";

  const { items, total, loading, error, refresh, setListData } =
    useCachedList<ObraSocialListItemDto>({
      resource: "obras-sociales",
      accessToken,
      enabled,
      queryParams: { page, pageSize, search: searchKey, estado: estadoKey },
      minLoadingMs,
      defaultErrorMessage: "No se pudieron cargar las obras sociales.",
      fetcher: () =>
        listObrasSocialesWithApi(accessToken!, {
          page,
          pageSize,
          ...(searchKey ? { search: searchKey } : {}),
          ...(estado !== undefined ? { estado } : {}),
        }).then((data) => ({
          items: data.items,
          total: data.total,
        })),
    });

  const upsertObraSocial = useCallback(
    (obra: ObraSocialListItemDto) => {
      const next = [...items];
      const idx = next.findIndex((o) => o.id === obra.id);
      if (idx === -1) {
        next.push(obra);
      } else {
        next[idx] = obra;
      }
      next.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      setListData({
        items: next,
        total: idx === -1 ? total + 1 : total,
      });
    },
    [items, total, setListData]
  );

  const removeObraSocial = useCallback(
    (id: number) => {
      if (!items.some((o) => o.id === id)) return;
      setListData({
        items: items.filter((o) => o.id !== id),
        total: Math.max(0, total - 1),
      });
    },
    [items, total, setListData]
  );

  return { items, total, loading, error, refresh, upsertObraSocial, removeObraSocial };
}
