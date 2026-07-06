"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { listPacientesWithApi } from "@/lib/api/pacientes";
import { listPrestadoresAllWithApi } from "@/lib/api/prestadores";
import type { PacienteListItemDto, PrestadorListItemDto } from "@/lib/api/types";

export function useVisitasDirectoryFilterOptions(accessToken: string | null | undefined) {
  const [prestadores, setPrestadores] = useState<PrestadorListItemDto[]>([]);
  const [pacientes, setPacientes] = useState<PacienteListItemDto[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoadingOptions(true);
    setOptionsError("");

    void (async () => {
      try {
        const [p, pac] = await Promise.all([
          listPrestadoresAllWithApi(accessToken),
          fetchAllPaginatedItems((page, pageSize) =>
            listPacientesWithApi(accessToken, page, pageSize).then((data) => ({
              items: data.items,
              total: data.total,
            }))
          ),
        ]);
        if (!cancelled) {
          setPrestadores(p);
          setPacientes(pac);
        }
      } catch (err) {
        if (!cancelled) {
          setPrestadores([]);
          setPacientes([]);
          const message =
            err instanceof ApiError
              ? getApiErrorMessages(err).join(" ")
              : "No se pudieron cargar opciones para los filtros.";
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

  return { prestadores, pacientes, loadingOptions, optionsError };
}
