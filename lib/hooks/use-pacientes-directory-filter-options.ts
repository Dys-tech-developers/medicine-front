"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { listObrasSocialesWithApi } from "@/lib/api/obras-sociales";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import type { ObraSocialListItemDto } from "@/lib/api/types";

export function usePacientesDirectoryFilterOptions(accessToken: string | null | undefined) {
  const [obrasSociales, setObrasSociales] = useState<ObraSocialListItemDto[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError("");

    void (async () => {
      try {
        const items = await fetchAllPaginatedItems((page, pageSize) =>
          listObrasSocialesWithApi(accessToken, { page, pageSize }).then((data) => ({
            items: data.items,
            total: data.total,
          }))
        );
        if (!cancelled) {
          setObrasSociales(items);
        }
      } catch (err) {
        if (!cancelled) {
          setObrasSociales([]);
          const message =
            err instanceof ApiError
              ? getApiErrorMessages(err).join(" ")
              : "No se pudieron cargar las obras sociales para los filtros.";
          setOptionsError(message);
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { obrasSociales, loadingOptions, optionsError };
}
