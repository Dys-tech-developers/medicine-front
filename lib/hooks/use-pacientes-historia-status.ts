"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getHistoriaClinicaByPacienteIdWithApi } from "@/lib/api/historias-clinicas";

export type PacienteHistoriaStatus = "yes" | "no" | "error";

type HistoriaStatusResult = {
  key: string;
  data: Record<number, PacienteHistoriaStatus>;
};

/**
 * Indica qué pacientes de la página actual tienen historia clínica (GET por pacienteId).
 */
export function usePacientesHistoriaStatus(
  accessToken: string | null,
  pacienteIds: number[],
  refreshNonce = 0
) {
  const idsKey = useMemo(() => pacienteIds.join(","), [pacienteIds]);
  // El resultado guarda la clave de la consulta: si la página cambió,
  // los datos viejos se descartan por derivación (sin resetear en un efecto).
  const [result, setResult] = useState<HistoriaStatusResult>({ key: "", data: {} });

  const active = Boolean(accessToken) && idsKey.length > 0;
  const resultKey = `${idsKey}#${refreshNonce}`;
  const statusByPacienteId: Record<number, PacienteHistoriaStatus> =
    active && result.key === resultKey ? result.data : {};
  const loading = active && result.key !== resultKey;

  useEffect(() => {
    if (!accessToken || idsKey.length === 0) return;
    const ids = idsKey.split(",").map(Number);
    const key = `${idsKey}#${refreshNonce}`;

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
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
        setResult({ key, data: Object.fromEntries(entries) });
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
