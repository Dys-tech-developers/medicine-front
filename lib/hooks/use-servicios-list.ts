"use client";

import { useCallback } from "react";
import { listServiciosWithApi } from "@/lib/api/servicios";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import { useCachedList } from "@/lib/hooks/use-cached-list";

type UseServiciosListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  minLoadingMs?: number;
};

export function useServiciosList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 100,
  search,
  minLoadingMs,
}: UseServiciosListOptions) {
  const searchKey = search?.trim() ?? "";

  const { items, total, loading, error, refresh, setListData } =
    useCachedList<ServicioConTarifasDto>({
    resource: "servicios",
    accessToken,
    enabled,
    queryParams: { page, pageSize, search: searchKey },
    minLoadingMs,
    defaultErrorMessage: "No se pudieron cargar los servicios.",
    fetcher: () =>
      listServiciosWithApi(accessToken!, {
        page,
        pageSize,
        ...(searchKey ? { search: searchKey } : {}),
      }).then((data) => ({
        items: data.items,
        total: data.total,
      })),
  });

  const upsertServicio = useCallback(
    (servicio: ServicioConTarifasDto) => {
      const next = [...items];
      const idx = next.findIndex((s) => s.id === servicio.id);
      const previous = idx >= 0 ? next[idx] : null;
      const merged: ServicioConTarifasDto = {
        ...(previous ?? ({} as ServicioConTarifasDto)),
        ...servicio,
        tarifas: servicio.tarifas?.length
          ? servicio.tarifas
          : (previous?.tarifas ?? []),
        pacientes: servicio.pacientes?.length
          ? servicio.pacientes
          : (previous?.pacientes ?? []),
      };
      if (idx === -1) {
        next.push(merged);
      } else {
        next[idx] = merged;
      }
      next.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      setListData({
        items: next,
        total: idx === -1 ? total + 1 : total,
      });
    },
    [items, total, setListData]
  );

  const removeServicio = useCallback(
    (id: number) => {
      if (!items.some((s) => s.id === id)) return;
      setListData({
        items: items.filter((s) => s.id !== id),
        total: Math.max(0, total - 1),
      });
    },
    [items, total, setListData]
  );

  return { items, total, loading, error, refresh, upsertServicio, removeServicio };
}
