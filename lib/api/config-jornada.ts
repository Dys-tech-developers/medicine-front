import { apiFetch } from "@/lib/api/client";
import type { JornadaConfigDto, UpdateJornadaConfigBody } from "@/lib/api/types";

type JornadaRaw = Partial<JornadaConfigDto> & Record<string, unknown>;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function normalizeDayList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ),
  ].sort((a, b) => a - b);
}

function normalizeHora(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return fallback;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) {
    return fallback;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Normaliza días: si falta un grupo, se infiere el complemento;
 * si hay solapes, gana diasHabiles y el resto va a no hábiles.
 */
export function normalizeDiasConfig(
  habilesRaw: unknown,
  noHabilesRaw: unknown
): { diasHabiles: number[]; diasNoHabiles: number[] } {
  let diasHabiles = normalizeDayList(habilesRaw);
  let diasNoHabiles = normalizeDayList(noHabilesRaw);

  if (diasHabiles.length === 0 && diasNoHabiles.length === 0) {
    diasHabiles = [1, 2, 3, 4, 5];
    diasNoHabiles = [0, 6];
  } else if (diasHabiles.length === 0) {
    const noSet = new Set(diasNoHabiles);
    diasHabiles = ALL_DAYS.filter((d) => !noSet.has(d));
  } else if (diasNoHabiles.length === 0) {
    const habSet = new Set(diasHabiles);
    diasNoHabiles = ALL_DAYS.filter((d) => !habSet.has(d));
  } else {
    // Sin solapes: prioridad a hábiles
    const habSet = new Set(diasHabiles);
    diasNoHabiles = diasNoHabiles.filter((d) => !habSet.has(d));
    const covered = new Set([...diasHabiles, ...diasNoHabiles]);
    const missing = ALL_DAYS.filter((d) => !covered.has(d));
    if (missing.length > 0) {
      diasNoHabiles = [...diasNoHabiles, ...missing].sort((a, b) => a - b);
    }
  }

  return { diasHabiles, diasNoHabiles };
}

export function normalizeJornadaConfig(raw: JornadaRaw): JornadaConfigDto {
  const { diasHabiles, diasNoHabiles } = normalizeDiasConfig(
    raw.diasHabiles ?? raw.dias_habiles,
    raw.diasNoHabiles ?? raw.dias_no_habiles
  );

  return {
    id: Number(raw.id ?? 1),
    horaInicioDiurno: normalizeHora(raw.horaInicioDiurno ?? raw.hora_inicio_diurno, "06:00"),
    horaFinDiurno: normalizeHora(raw.horaFinDiurno ?? raw.hora_fin_diurno, "20:00"),
    horaInicioNocturno: normalizeHora(
      raw.horaInicioNocturno ?? raw.hora_inicio_nocturno,
      "20:00"
    ),
    horaFinNocturno: normalizeHora(raw.horaFinNocturno ?? raw.hora_fin_nocturno, "06:00"),
    diasHabiles,
    diasNoHabiles,
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

export async function getJornadaConfigWithApi(token: string): Promise<JornadaConfigDto> {
  const data = await apiFetch<JornadaRaw>("/api/v1/config/jornada", {
    method: "GET",
    token,
  });
  return normalizeJornadaConfig(data);
}

export async function updateJornadaConfigWithApi(
  token: string,
  body: UpdateJornadaConfigBody
): Promise<JornadaConfigDto> {
  const data = await apiFetch<JornadaRaw>("/api/v1/config/jornada", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeJornadaConfig(data);
}
