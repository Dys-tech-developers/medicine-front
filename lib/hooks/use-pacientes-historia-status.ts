"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getHistoriaClinicaByPacienteIdWithApi } from "@/lib/api/historias-clinicas";

export type PacienteHistoriaStatus = "yes" | "no" | "error";

/**
 * Indica qué pacientes de la página actual tienen historia clínica (GET por pacienteId).
 */
export function usePacientesHistoriaStatus(
  accessToken: string | null,
  pacienteIds: number[],
  refreshNonce = 0
) {
  const idsKey = useMemo(() => pacienteIds.join(","), [pacienteIds]);
  const [statusByPacienteId, setStatusByPacienteId] = useState<
    Record<number, PacienteHistoriaStatus>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || pacienteIds.length === 0) {
      setStatusByPacienteId({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      const entries = await Promise.all(
        pacienteIds.map(async (id) => {
          try {
            await getHistoriaClinicaByPacienteIdWithApi(accessToken, id);
            return [id, "yes"] as const;
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
              return [id, "no"] as const;
            }
            return [id, "error"] as const;
          }
        })
      );
      if (!cancelled) {
        setStatusByPacienteId(Object.fromEntries(entries));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, idsKey, refreshNonce]);

  const getHistoriaStatus = (pacienteId: number): PacienteHistoriaStatus | undefined =>
    statusByPacienteId[pacienteId];

  const hasHistoria = (pacienteId: number) => statusByPacienteId[pacienteId] === "yes";

  return { hasHistoria, getHistoriaStatus, loading };
}
