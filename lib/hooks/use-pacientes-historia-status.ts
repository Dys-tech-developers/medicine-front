"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getHistoriaClinicaByPacienteIdWithApi } from "@/lib/api/historias-clinicas";

/**
 * Indica qué pacientes de la página actual tienen historia clínica (GET por pacienteId).
 */
export function usePacientesHistoriaStatus(
  accessToken: string | null,
  pacienteIds: number[],
  refreshNonce = 0
) {
  const idsKey = useMemo(() => pacienteIds.join(","), [pacienteIds]);
  const [hasHistoriaByPacienteId, setHasHistoriaByPacienteId] = useState<
    Record<number, boolean>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || pacienteIds.length === 0) {
      setHasHistoriaByPacienteId({});
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
            return [id, true] as const;
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
              return [id, false] as const;
            }
            return [id, false] as const;
          }
        })
      );
      if (!cancelled) {
        setHasHistoriaByPacienteId(Object.fromEntries(entries));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, idsKey, refreshNonce]);

  const hasHistoria = (pacienteId: number) => hasHistoriaByPacienteId[pacienteId] === true;

  return { hasHistoria, loading };
}
