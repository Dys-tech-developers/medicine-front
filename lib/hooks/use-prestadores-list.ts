"use client";

import { useCallback, useMemo, useState } from "react";
import { listPrestadoresWithApi } from "@/lib/api/prestadores";
import type { PrestadorListItemDto, ReportesMetaDto } from "@/lib/api/types";
import { useCachedList } from "@/lib/hooks/use-cached-list";
import {
  DEFAULT_PRESTADORES_PERIOD_FILTERS,
  prestadoresPeriodFiltersToApi,
  type PrestadoresPeriodFiltersState,
} from "@/lib/prestadores-period-filters";

type UsePrestadoresListOptions = {
  accessToken: string | null;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  periodFilters?: PrestadoresPeriodFiltersState;
  minLoadingMs?: number;
};

export function usePrestadoresList({
  accessToken,
  enabled = true,
  page = 1,
  pageSize = 10,
  periodFilters,
  minLoadingMs,
}: UsePrestadoresListOptions) {
  const [meta, setMeta] = useState<ReportesMetaDto | null>(null);

  const periodApi = useMemo(
    () => prestadoresPeriodFiltersToApi(periodFilters ?? DEFAULT_PRESTADORES_PERIOD_FILTERS),
    [periodFilters]
  );

  const fetcher = useCallback(async () => {
    const data = await listPrestadoresWithApi(accessToken!, {
      page,
      pageSize,
      ...periodApi,
    });
    setMeta(data.meta ?? null);
    return { items: data.items, total: data.total };
  }, [accessToken, page, pageSize, periodApi]);

  const list = useCachedList<PrestadorListItemDto>({
    resource: "prestadores",
    accessToken,
    enabled,
    queryParams: { page, pageSize, period: periodApi },
    minLoadingMs,
    defaultErrorMessage: "No se pudo cargar el directorio de prestadores.",
    fetcher,
  });

  return { ...list, meta };
}
