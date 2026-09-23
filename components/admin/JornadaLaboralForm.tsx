"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Loader2, Moon, Save, Sun } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  getJornadaConfigWithApi,
  updateJornadaConfigWithApi,
} from "@/lib/api/config-jornada";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { JornadaConfigDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const inputClass =
  "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

const DIAS_SEMANA: { value: number; label: string; full: string }[] = [
  { value: 0, label: "Dom", full: "Domingo" },
  { value: 1, label: "Lun", full: "Lunes" },
  { value: 2, label: "Mar", full: "Martes" },
  { value: 3, label: "Mié", full: "Miércoles" },
  { value: 4, label: "Jue", full: "Jueves" },
  { value: 5, label: "Vie", full: "Viernes" },
  { value: 6, label: "Sáb", full: "Sábado" },
];

const ALL_DAYS = DIAS_SEMANA.map((d) => d.value);

function toTimeInputValue(hhmm: string): string {
  const match = hhmm.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : hhmm;
}

function sortDays(days: number[]): number[] {
  return [...days].sort((a, b) => a - b);
}

function formatDaysList(days: number[]): string {
  if (days.length === 0) return "ninguno";
  return days
    .map((d) => DIAS_SEMANA.find((x) => x.value === d)?.full ?? String(d))
    .join(", ");
}

function applyConfigToForm(data: JornadaConfigDto) {
  return {
    horaInicioDiurno: toTimeInputValue(data.horaInicioDiurno),
    horaFinDiurno: toTimeInputValue(data.horaFinDiurno),
    horaInicioNocturno: toTimeInputValue(data.horaInicioNocturno),
    horaFinNocturno: toTimeInputValue(data.horaFinNocturno),
    diasHabiles: sortDays(data.diasHabiles),
    diasNoHabiles: sortDays(data.diasNoHabiles),
    updatedAt: data.updatedAt || null,
  };
}

type DayGroup = "habil" | "no_habil";

type JornadaLaboralFormProps = {
  accessToken: string;
  canManage: boolean;
  onNotify: (message: string, kind: "success" | "error", detail?: string) => void;
};

export function JornadaLaboralForm({
  accessToken,
  canManage,
  onNotify,
}: JornadaLaboralFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horaInicioDiurno, setHoraInicioDiurno] = useState("06:00");
  const [horaFinDiurno, setHoraFinDiurno] = useState("20:00");
  const [horaInicioNocturno, setHoraInicioNocturno] = useState("20:00");
  const [horaFinNocturno, setHoraFinNocturno] = useState("06:00");
  const [diasHabiles, setDiasHabiles] = useState<number[]>([1, 2, 3, 4, 5]);
  const [diasNoHabiles, setDiasNoHabiles] = useState<number[]>([0, 6]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getJornadaConfigWithApi(accessToken);
      const form = applyConfigToForm(data);
      setHoraInicioDiurno(form.horaInicioDiurno);
      setHoraFinDiurno(form.horaFinDiurno);
      setHoraInicioNocturno(form.horaInicioNocturno);
      setHoraFinNocturno(form.horaFinNocturno);
      setDiasHabiles(form.diasHabiles);
      setDiasNoHabiles(form.diasNoHabiles);
      setUpdatedAt(form.updatedAt);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo cargar la jornada laboral.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayGroupOf = useCallback(
    (day: number): DayGroup | null => {
      if (diasHabiles.includes(day)) return "habil";
      if (diasNoHabiles.includes(day)) return "no_habil";
      return null;
    },
    [diasHabiles, diasNoHabiles]
  );

  /** Mueve el día al grupo elegido; lo saca del otro para evitar solapes. */
  const setDayGroup = (day: number, group: DayGroup) => {
    if (!canManage || saving) return;
    if (group === "habil") {
      setDiasHabiles((prev) => sortDays(prev.includes(day) ? prev : [...prev, day]));
      setDiasNoHabiles((prev) => prev.filter((d) => d !== day));
    } else {
      setDiasNoHabiles((prev) => sortDays(prev.includes(day) ? prev : [...prev, day]));
      setDiasHabiles((prev) => prev.filter((d) => d !== day));
    }
  };

  const coverageIssue = useMemo(() => {
    const covered = new Set([...diasHabiles, ...diasNoHabiles]);
    const missing = ALL_DAYS.filter((d) => !covered.has(d));
    const overlap = ALL_DAYS.filter(
      (d) => diasHabiles.includes(d) && diasNoHabiles.includes(d)
    );
    return { missing, overlap };
  }, [diasHabiles, diasNoHabiles]);

  const validateLocal = (): string | null => {
    const times = [
      horaInicioDiurno,
      horaFinDiurno,
      horaInicioNocturno,
      horaFinNocturno,
    ];
    if (times.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
      return "Las horas deben estar en formato HH:mm.";
    }
    if (horaInicioDiurno === horaFinDiurno) {
      return "Inicio y fin diurno deben ser distintos.";
    }
    if (horaInicioNocturno === horaFinNocturno) {
      return "Inicio y fin nocturno deben ser distintos.";
    }
    if (diasHabiles.length === 0 && diasNoHabiles.length === 0) {
      return "Asigná los días de la semana como hábiles o no hábiles.";
    }
    if (coverageIssue.overlap.length > 0) {
      return "Un día no puede ser hábil y no hábil a la vez.";
    }
    if (coverageIssue.missing.length > 0) {
      return `Faltan días sin asignar: ${formatDaysList(coverageIssue.missing)}.`;
    }
    return null;
  };

  const handleSave = async () => {
    const localError = validateLocal();
    if (localError) {
      setError(localError);
      onNotify(localError, "error");
      return;
    }

    setSaving(true);
    setError("");
    const startedAt = Date.now();
    try {
      const updated = await updateJornadaConfigWithApi(accessToken, {
        horaInicioDiurno,
        horaFinDiurno,
        horaInicioNocturno,
        horaFinNocturno,
        diasHabiles,
        diasNoHabiles,
      });
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      const form = applyConfigToForm(updated);
      setHoraInicioDiurno(form.horaInicioDiurno);
      setHoraFinDiurno(form.horaFinDiurno);
      setHoraInicioNocturno(form.horaInicioNocturno);
      setHoraFinNocturno(form.horaFinNocturno);
      setDiasHabiles(form.diasHabiles);
      setDiasNoHabiles(form.diasNoHabiles);
      setUpdatedAt(form.updatedAt);
      onNotify("Jornada laboral guardada", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo guardar la jornada laboral.";
      setError(msg);
      onNotify(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-medical-border bg-medical-card shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-medical-primary" />
          <CardTitle className="text-base">Jornada laboral</CardTitle>
        </div>
        <CardDescription>
          Configurá franjas diurna y nocturna, y asigná cada día de la semana como hábil o no
          hábil. Los 7 días deben estar en un grupo u otro, sin repetirse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-medical-mutedText">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando configuración…
          </div>
        ) : (
          <>
            {/* Resumen de lo guardado / en edición */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-medical-border bg-medical-surface/60 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                  <Sun className="h-3.5 w-3.5" />
                  Diurno
                </p>
                <p className="text-sm font-medium text-medical-text">
                  {horaInicioDiurno} – {horaFinDiurno}
                </p>
              </div>
              <div className="rounded-2xl border border-medical-border bg-medical-surface/60 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                  <Moon className="h-3.5 w-3.5" />
                  Nocturno
                </p>
                <p className="text-sm font-medium text-medical-text">
                  {horaInicioNocturno} – {horaFinNocturno}
                </p>
              </div>
              <div className="rounded-2xl border border-medical-primary/20 bg-medical-secondary/40 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                  Días hábiles
                </p>
                <p className="text-sm font-medium text-medical-text">
                  {formatDaysList(diasHabiles)}
                </p>
              </div>
              <div className="rounded-2xl border border-medical-border bg-medical-surface/60 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-medical-mutedText">
                  Días no hábiles
                </p>
                <p className="text-sm font-medium text-medical-text">
                  {formatDaysList(diasNoHabiles)}
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-medical-text">
                <Sun className="h-4 w-4 text-medical-primary" />
                Horario diurno
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="jornada-inicio-diurno" className="mb-1.5 block text-sm font-medium">
                    Inicio diurno
                  </Label>
                  <input
                    id="jornada-inicio-diurno"
                    type="time"
                    value={horaInicioDiurno}
                    onChange={(e) => setHoraInicioDiurno(e.target.value)}
                    disabled={!canManage || saving}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="jornada-fin-diurno" className="mb-1.5 block text-sm font-medium">
                    Fin diurno
                  </Label>
                  <input
                    id="jornada-fin-diurno"
                    type="time"
                    value={horaFinDiurno}
                    onChange={(e) => setHoraFinDiurno(e.target.value)}
                    disabled={!canManage || saving}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-medical-text">
                <Moon className="h-4 w-4 text-medical-primary" />
                Horario nocturno
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="jornada-inicio-nocturno"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Inicio nocturno
                  </Label>
                  <input
                    id="jornada-inicio-nocturno"
                    type="time"
                    value={horaInicioNocturno}
                    onChange={(e) => setHoraInicioNocturno(e.target.value)}
                    disabled={!canManage || saving}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="jornada-fin-nocturno" className="mb-1.5 block text-sm font-medium">
                    Fin nocturno
                  </Label>
                  <input
                    id="jornada-fin-nocturno"
                    type="time"
                    value={horaFinNocturno}
                    onChange={(e) => setHoraFinNocturno(e.target.value)}
                    disabled={!canManage || saving}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-medical-text">Días de la semana</h3>
              <p className="text-xs text-medical-mutedText">
                Cada día debe estar en hábil o en no hábil. Al marcar uno, se saca del otro grupo.
              </p>

              <div>
                <Label className="mb-2 block text-sm font-medium">Días hábiles</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(({ value, label }) => {
                    const checked = dayGroupOf(value) === "habil";
                    return (
                      <label
                        key={`habil-${value}`}
                        className={[
                          "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
                          checked
                            ? "border-medical-primary bg-medical-secondary text-medical-primary"
                            : "border-medical-border bg-white text-medical-mutedText",
                          !canManage || saving ? "cursor-not-allowed opacity-60" : "",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          disabled={!canManage || saving}
                          onChange={() => setDayGroup(value, "habil")}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Días no hábiles</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(({ value, label }) => {
                    const checked = dayGroupOf(value) === "no_habil";
                    return (
                      <label
                        key={`no-habil-${value}`}
                        className={[
                          "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
                          checked
                            ? "border-medical-border bg-medical-text/5 text-medical-text"
                            : "border-medical-border bg-white text-medical-mutedText",
                          !canManage || saving ? "cursor-not-allowed opacity-60" : "",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          disabled={!canManage || saving}
                          onChange={() => setDayGroup(value, "no_habil")}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {coverageIssue.missing.length > 0 ? (
                <p className="text-xs text-medical-warning">
                  Sin asignar: {formatDaysList(coverageIssue.missing)}.
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                {error}
              </p>
            ) : null}

            {updatedAt ? (
              <p className="text-xs text-medical-mutedText">
                Última actualización:{" "}
                {new Date(updatedAt).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            ) : null}

            {canManage ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-medical-mutedText">
                Solo un administrador puede editar la jornada laboral.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
