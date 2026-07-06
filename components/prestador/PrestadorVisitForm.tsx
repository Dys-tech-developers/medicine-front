"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Loader2, UserCheck, XCircle } from "lucide-react";
import type { PacienteServicioAsignadoQrDto } from "@/lib/api/types";
import {
  formatPacienteServicioUsoEnPeriodo,
  formatServicioAsignadoSelectLabel,
} from "@/lib/paciente-servicio-display";
import {
  VISITA_OBSERVACIONES_MAX,
  VISITA_TIEMPO_MAX,
  calcularDuracionVisitaMinutos,
  formatDuracionVisitaEnCurso,
} from "@/lib/prestador-visitas";
import { formatVisitaDateTime, formatVisitaDuracion } from "@/lib/visitas-display";
import {
  formatCoberturaDiariaDisplay,
  getReglasAsignacionFromServicio,
} from "@/lib/reglas-asignacion";

type Props = {
  serviciosActivos: PacienteServicioAsignadoQrDto[];
  pacienteServicioId: number | "";
  onPacienteServicioIdChange: (id: number | "") => void;
  /** Modo registro único: inicio al escanear QR. */
  visitaInicioMs: number | null;
  /** Modo control horario: visita iniciada en el backend. */
  controlHorario: boolean;
  /** Modo relevo: cobertura continua con relevo por QR. */
  modoRelevo: boolean;
  yaTieneTramoActivo: boolean;
  visitaEnCursoInicioMs: number | null;
  observaciones: string;
  onObservacionesChange: (value: string) => void;
  formError: string;
  isSubmitting: boolean;
  isIniciando?: boolean;
  canSubmit: boolean;
  canIniciar?: boolean;
  canRelevar?: boolean;
  cupoAgotado?: boolean;
  loadingDisponibilidad?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onIniciar?: () => void;
  onRelevar?: () => void;
};

export function PrestadorVisitForm({
  serviciosActivos,
  pacienteServicioId,
  onPacienteServicioIdChange,
  visitaInicioMs,
  controlHorario,
  modoRelevo,
  yaTieneTramoActivo,
  visitaEnCursoInicioMs,
  observaciones,
  onObservacionesChange,
  formError,
  isSubmitting,
  isIniciando = false,
  canSubmit,
  canIniciar = false,
  canRelevar = false,
  cupoAgotado = false,
  loadingDisponibilidad = false,
  onSubmit,
  onIniciar,
  onRelevar,
}: Props) {
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  const timerInicioMs = controlHorario ? visitaEnCursoInicioMs : visitaInicioMs;
  const visitaIniciada = controlHorario ? visitaEnCursoInicioMs != null : visitaInicioMs != null;

  useEffect(() => {
    if (modoRelevo || timerInicioMs == null) return;
    setAhoraMs(Date.now());
    const id = window.setInterval(() => setAhoraMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timerInicioMs, modoRelevo]);

  const sinServiciosActivos = serviciosActivos.length === 0;
  const duracionEnCurso =
    timerInicioMs != null ? formatDuracionVisitaEnCurso(timerInicioMs, ahoraMs) : null;
  const minutosAlGuardar =
    timerInicioMs != null ? calcularDuracionVisitaMinutos(timerInicioMs, ahoraMs) : null;
  const inicioIso = timerInicioMs != null ? new Date(timerInicioMs).toISOString() : null;
  const servicioSeleccionado =
    pacienteServicioId !== ""
      ? serviciosActivos.find((s) => s.pacienteServicioId === pacienteServicioId)
      : undefined;
  const usoPeriodo =
    !modoRelevo && servicioSeleccionado
      ? formatPacienteServicioUsoEnPeriodo(servicioSeleccionado)
      : null;
  const coberturaActiva = servicioSeleccionado?.coberturaActiva ?? null;
  const reglas = servicioSeleccionado
    ? getReglasAsignacionFromServicio(servicioSeleccionado)
    : null;
  const ayudaFlujo = reglas?.ayudaFlujoVisita?.trim();
  const horarioDiario =
    servicioSeleccionado != null
      ? formatCoberturaDiariaDisplay(
          servicioSeleccionado.coberturaDiariaInicio,
          servicioSeleccionado.coberturaDiariaFin
        )
      : null;
  const hayCoberturaActiva = coberturaActiva != null;
  const ctaRelevo = hayCoberturaActiva ? "Hacer relevo" : "Tomar cobertura";

  const busy = isSubmitting || isIniciando;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-medical-text">
          {modoRelevo ? "Cobertura del paciente" : "Registrar visita"}
        </h2>
        <p className="text-xs text-medical-mutedText">
          {modoRelevo
            ? ayudaFlujo ||
              "Cobertura continua. Escaneá el QR para tomar el tramo; el prestador anterior no finaliza solo."
            : controlHorario
              ? visitaIniciada
                ? "La visita está en curso. Al finalizar se calcula la duración automáticamente."
                : "Elegí el servicio y tocá «Iniciar visita». Después podrás finalizarla con observaciones e insumos."
              : "Elegí el servicio y los insumos. La duración se calcula sola desde el escaneo del QR hasta que guardes la visita."}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="prestador-servicio" className="mb-1 block text-sm font-medium text-medical-text">
            Servicio {modoRelevo ? "de cobertura" : "realizado"}{" "}
            <span className="text-medical-danger">*</span>
          </label>
          <select
            id="prestador-servicio"
            value={pacienteServicioId === "" ? "" : String(pacienteServicioId)}
            onChange={(e) => {
              const v = e.target.value;
              onPacienteServicioIdChange(v === "" ? "" : Number(v));
            }}
            disabled={sinServiciosActivos || busy || (controlHorario && visitaIniciada)}
            className="h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
          >
            <option value="">
              {sinServiciosActivos ? "Sin servicios activos" : "Seleccioná un servicio"}
            </option>
            {serviciosActivos.map((s) => (
              <option key={s.pacienteServicioId} value={s.pacienteServicioId}>
                {formatServicioAsignadoSelectLabel(s)}
                {s.modoRelevo ? " · relevamiento" : s.controlHorario ? " · control horario" : ""}
              </option>
            ))}
          </select>
          {!modoRelevo && loadingDisponibilidad ? (
            <p className="mt-1.5 text-xs text-medical-mutedText">Consultando cupo del período…</p>
          ) : !modoRelevo && usoPeriodo ? (
            <p className="mt-1.5 text-xs text-medical-mutedText">
              Visitas en este período:{" "}
              <span className="font-semibold text-medical-primaryDark">{usoPeriodo}</span>
              {servicioSeleccionado?.disponibilidad?.cantidadDisponible != null ? (
                <span> · quedan {servicioSeleccionado.disponibilidad.cantidadDisponible}</span>
              ) : null}
            </p>
          ) : null}
          {!modoRelevo && cupoAgotado ? (
            <p className="mt-1.5 text-xs font-semibold text-medical-danger">
              Cupo agotado en este período. No podés registrar otra visita hasta el próximo período.
            </p>
          ) : null}
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

        {modoRelevo ? (
          <div className="rounded-xl border border-medical-primary/25 bg-medical-secondary/40 p-3">
            <div className="flex items-start gap-2">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-medical-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-medical-text">Cobertura actual</p>
                {horarioDiario ? (
                  <p className="mt-1 text-xs text-medical-mutedText">
                    Horario autorizado:{" "}
                    <span className="font-semibold text-medical-text">{horarioDiario}</span>
                  </p>
                ) : null}
                {coberturaActiva ? (
                  <>
                    <p className="mt-1 text-sm text-medical-text">
                      <span className="font-medium">{coberturaActiva.prestadorNombre}</span>
                      <span className="text-medical-mutedText">
                        {" "}
                        desde {formatVisitaDateTime(coberturaActiva.fechaInicio)}
                      </span>
                    </p>
                    {yaTieneTramoActivo ? (
                      <p className="mt-2 text-sm font-medium text-medical-primaryDark">
                        Ya tenés el tramo activo.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-medical-mutedText">
                        Al hacer relevo, {coberturaActiva.prestadorNombre} cede la cobertura y vos
                        quedás a cargo.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-medical-mutedText">
                    Nadie está cubriendo en este momento. Podés iniciar la cobertura con «{ctaRelevo}».
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {!modoRelevo && visitaIniciada && timerInicioMs != null ? (
          <div className="rounded-xl border border-medical-primary/25 bg-medical-secondary/40 p-3">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-medical-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-medical-text">Tiempo de visita</p>
                <p className="mt-0.5 text-xs text-medical-mutedText">
                  {controlHorario
                    ? "Inicio al tocar «Iniciar visita» · fin al finalizar"
                    : "Inicio al identificar el QR · fin al tocar «Guardar visita»"}
                </p>
              </div>
              {duracionEnCurso ? (
                <span
                  className="shrink-0 rounded-lg bg-medical-primary px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-white"
                  aria-live="polite"
                >
                  {duracionEnCurso}
                </span>
              ) : null}
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-medical-border/70 bg-white/80 px-3 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                  Inicio
                </dt>
                <dd className="mt-0.5 font-medium text-medical-text">
                  {inicioIso ? formatVisitaDateTime(inicioIso) : "—"}
                </dd>
              </div>
              <div className="rounded-lg border border-medical-border/70 bg-white/80 px-3 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                  {controlHorario ? "Duración en curso" : "Al guardar (estimado)"}
                </dt>
                <dd className="mt-0.5 font-medium text-medical-text">
                  {minutosAlGuardar != null
                    ? formatVisitaDuracion(minutosAlGuardar)
                    : "En curso"}
                </dd>
              </div>
            </dl>
            {minutosAlGuardar != null && minutosAlGuardar >= VISITA_TIEMPO_MAX ? (
              <p className="mt-2 text-xs font-medium text-medical-danger">
                Llegaste al máximo de {VISITA_TIEMPO_MAX} minutos.{" "}
                {controlHorario ? "Finalizá la visita ahora." : "Guardá la visita ahora."}
              </p>
            ) : null}
          </div>
        ) : !modoRelevo && controlHorario ? (
          <div className="rounded-xl border border-dashed border-medical-border bg-medical-surface/60 px-3 py-3 text-sm text-medical-mutedText">
            Seleccioná el servicio y tocá «Iniciar visita» para comenzar el registro horario.
          </div>
        ) : null}

        {!modoRelevo && (visitaIniciada || !controlHorario) && (
          <div>
            <label htmlFor="prestador-obs" className="mb-1 block text-sm font-medium text-medical-text">
              Observaciones
            </label>
            <textarea
              id="prestador-obs"
              value={observaciones}
              onChange={(e) => onObservacionesChange(e.target.value)}
              maxLength={VISITA_OBSERVACIONES_MAX}
              disabled={sinServiciosActivos || busy || (controlHorario && !visitaIniciada)}
              placeholder="Detalle clínico u observaciones de la visita (opcional)…"
              className="h-24 w-full rounded-xl border border-medical-border bg-white px-3 py-2 text-sm text-medical-text outline-none transition focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15 disabled:cursor-not-allowed disabled:bg-medical-secondary/40"
            />
            <p className="mt-1 text-right text-[11px] text-medical-mutedText">
              {observaciones.length}/{VISITA_OBSERVACIONES_MAX}
            </p>
          </div>
        )}

        {formError ? (
          <div className="flex items-start gap-2 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        {modoRelevo ? (
          <button
            type="button"
            onClick={onRelevar}
            disabled={!canRelevar || busy || sinServiciosActivos || yaTieneTramoActivo}
            className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando relevamiento…
              </>
            ) : yaTieneTramoActivo ? (
              "Ya tenés el tramo activo"
            ) : (
              ctaRelevo
            )}
          </button>
        ) : controlHorario && !visitaIniciada ? (
          <button
            type="button"
            onClick={onIniciar}
            disabled={!canIniciar || busy || sinServiciosActivos}
            className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isIniciando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando visita…
              </>
            ) : (
              "Iniciar visita"
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit || busy || sinServiciosActivos}
            className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary text-sm font-semibold text-white transition hover:bg-medical-primaryDark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {controlHorario ? "Finalizando visita…" : "Guardando visita…"}
              </>
            ) : controlHorario ? (
              "Finalizar visita"
            ) : (
              "Guardar visita"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
