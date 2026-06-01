"use client";

import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import type { PacienteServicioAsignadoQrDto } from "@/lib/api/types";
import {
  VISITA_OBSERVACIONES_MAX,
  VISITA_TIEMPO_MAX,
  VISITA_TIEMPO_MIN,
  formatServicioAsignadoLabel,
} from "@/lib/prestador-visitas";

type Props = {
  serviciosActivos: PacienteServicioAsignadoQrDto[];
  pacienteServicioId: number | "";
  onPacienteServicioIdChange: (id: number | "") => void;
  fechaInicioLocal: string;
  onFechaInicioLocalChange: (value: string) => void;
  tiempoMinutos: number | "";
  onTiempoMinutosChange: (value: number | "") => void;
  observaciones: string;
  onObservacionesChange: (value: string) => void;
  formError: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function PrestadorVisitForm({
  serviciosActivos,
  pacienteServicioId,
  onPacienteServicioIdChange,
  fechaInicioLocal,
  onFechaInicioLocalChange,
  tiempoMinutos,
  onTiempoMinutosChange,
  observaciones,
  onObservacionesChange,
  formError,
  isSubmitting,
  canSubmit,
  onSubmit,
}: Props) {
  const sinServiciosActivos = serviciosActivos.length === 0;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-medical-text">Registrar visita</h2>
        <p className="text-xs text-medical-mutedText">
          Elegí el servicio realizado, la hora de inicio y la duración en minutos.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="prestador-servicio" className="mb-1 block text-sm font-medium text-medical-text">
            Servicio realizado <span className="text-medical-danger">*</span>
          </label>
          <select
            id="prestador-servicio"
            value={pacienteServicioId === "" ? "" : String(pacienteServicioId)}
            onChange={(e) => {
              const v = e.target.value;
              onPacienteServicioIdChange(v === "" ? "" : Number(v));
            }}
            disabled={sinServiciosActivos || isSubmitting}
            className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
          >
            <option value="">
              {sinServiciosActivos ? "Sin servicios activos" : "Seleccioná un servicio"}
            </option>
            {serviciosActivos.map((s) => (
              <option key={s.pacienteServicioId} value={s.pacienteServicioId}>
                {formatServicioAsignadoLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {sinServiciosActivos ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-medical-warning/35 bg-medical-warning/10 px-3 py-2 text-sm text-medical-text"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              El paciente no tiene servicios activos. Pedile al administrador que active o asigne un
              servicio antes de registrar la visita.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="prestador-fecha" className="mb-1 block text-sm font-medium text-medical-text">
              Fecha y hora de inicio <span className="text-medical-danger">*</span>
            </label>
            <input
              id="prestador-fecha"
              type="datetime-local"
              value={fechaInicioLocal}
              onChange={(e) => onFechaInicioLocalChange(e.target.value)}
              disabled={sinServiciosActivos || isSubmitting}
              className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
            />
          </div>
          <div>
            <label htmlFor="prestador-minutos" className="mb-1 block text-sm font-medium text-medical-text">
              Duración (minutos) <span className="text-medical-danger">*</span>
            </label>
            <input
              id="prestador-minutos"
              type="number"
              min={VISITA_TIEMPO_MIN}
              max={VISITA_TIEMPO_MAX}
              step={1}
              inputMode="numeric"
              value={tiempoMinutos}
              onChange={(e) => {
                const raw = e.target.value;
                onTiempoMinutosChange(raw === "" ? "" : Number.parseInt(raw, 10));
              }}
              disabled={sinServiciosActivos || isSubmitting}
              placeholder={`${VISITA_TIEMPO_MIN}–${VISITA_TIEMPO_MAX}`}
              className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
            />
            <p className="mt-1 text-[11px] text-medical-mutedText">
              Entre {VISITA_TIEMPO_MIN} y {VISITA_TIEMPO_MAX} minutos.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="prestador-obs" className="mb-1 block text-sm font-medium text-medical-text">
            Observaciones
          </label>
          <textarea
            id="prestador-obs"
            value={observaciones}
            onChange={(e) => onObservacionesChange(e.target.value)}
            maxLength={VISITA_OBSERVACIONES_MAX}
            disabled={sinServiciosActivos || isSubmitting}
            placeholder="Detalle clínico u observaciones de la visita (opcional)…"
            className="h-24 w-full rounded-xl border border-medical-border bg-white px-3 py-2 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
          />
          <p className="mt-1 text-right text-[11px] text-medical-mutedText">
            {observaciones.length}/{VISITA_OBSERVACIONES_MAX}
          </p>
        </div>

        {formError ? (
          <div className="flex items-start gap-2 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting || sinServiciosActivos}
          className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando visita…
            </>
          ) : (
            "Guardar visita"
          )}
        </button>
      </div>
    </form>
  );
}
