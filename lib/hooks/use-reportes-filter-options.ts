"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { listPrestadoresAllWithApi } from "@/lib/api/prestadores";
import { listServiciosAllWithApi } from "@/lib/api/servicios";
import type { PrestadorListItemDto, ServicioConTarifasDto } from "@/lib/api/types";

export function useReportesFilterOptions(accessToken: string | null | undefined) {
  const [prestadores, setPrestadores] = useState<PrestadorListItemDto[]>([]);
  const [servicios, setServicios] = useState<ServicioConTarifasDto[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError("");

    void (async () => {
      try {
        const [p, s] = await Promise.all([
          listPrestadoresAllWithApi(accessToken),
          listServiciosAllWithApi(accessToken),
        ]);
        if (!cancelled) {
          setPrestadores(p);
          setServicios(s);
        }
      } catch (err) {
        if (!cancelled) {
          setPrestadores([]);
          setServicios([]);
          const message =
            err instanceof ApiError
              ? getApiErrorMessages(err).join(" ")
              : "No se pudieron cargar prestadores y servicios para los filtros.";
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

  return { prestadores, servicios, loadingOptions, optionsError };
}
