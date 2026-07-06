"use client";

import { AlertTriangle, CheckCircle2, Package, Plus } from "lucide-react";
import type { VisitaDetailDto } from "@/lib/api/types";
import { formatReporteMonto } from "@/lib/reportes-display";
import { labelTipoDia, MODALIDAD_COBRO_LABELS, TIPO_JORNADA_LABELS } from "@/lib/servicios-tarifas-labels";
import { formatVisitaDuracion, formatVisitaFecha } from "@/lib/visitas-display";

type Props = {
  visita: VisitaDetailDto;
  insumoWarning?: string;
  variant?: "visita" | "relevo";
  onNuevaVisita: () => void;
};

export function PrestadorVisitSuccess({
  visita,
  insumoWarning,
  variant = "visita",
  onNuevaVisita,
}: Props) {
  const esRelevo = variant === "relevo";
  const paciente = visita.pacienteServicio?.paciente;
  const servicio = visita.pacienteServicio?.servicio;
  const pacienteNombre = paciente
    ? `${paciente.nombre} ${paciente.apellido}`.trim()
    : "Paciente";
  const servicioNombre = servicio?.nombre ?? "Servicio";
  const fechaIso = visita.fechaInicio ?? visita.fecha;
  const insumos = visita.insumos ?? [];

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-medical-primary/35 bg-medical-card shadow-md shadow-medical-primary/10">
      <div className="flex items-center gap-2 border-b border-medical-primary/20 bg-medical-primary/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-medical-primary" />
        <div>
          <h2 className="text-base font-semibold text-medical-primaryDark">
            {esRelevo ? "Relevamiento registrado" : "Visita registrada"}
          </h2>
          <p className="text-xs text-medical-mutedText">
            {esRelevo
              ? "Tomaste el relevamiento correctamente. Quedás a cargo de la cobertura."
              : "La visita se guardó correctamente."}
          </p>
        </div>
      </div>

      {insumoWarning ? (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-medical-warning/35 bg-medical-warning/10 px-3 py-2 text-sm text-medical-text"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{insumoWarning}</p>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-2 p-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Paciente</dt>
          <dd className="mt-0.5 font-semibold text-medical-text">{pacienteNombre}</dd>
          {paciente?.numeroDocumento ? (
            <dd className="text-xs text-medical-mutedText">DNI {paciente.numeroDocumento}</dd>
          ) : null}
        </div>
        <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Servicio</dt>
          <dd className="mt-0.5 font-semibold text-medical-text">{servicioNombre}</dd>
        </div>
        {esRelevo ? (
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
              Inicio del tramo
            </dt>
            <dd className="mt-0.5 font-semibold text-medical-text">{formatVisitaFecha(fechaIso)}</dd>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Inicio</dt>
              <dd className="mt-0.5 font-semibold text-medical-text">{formatVisitaFecha(fechaIso)}</dd>
            </div>
            <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                Duración
              </dt>
              <dd className="mt-0.5 font-semibold text-medical-text">
                {formatVisitaDuracion(visita.tiempoMinutos)}
              </dd>
            </div>
          </>
        )}
        {visita.finanzas ? (
          <>
            <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                Jornada
              </dt>
              <dd className="mt-0.5 font-semibold text-medical-text">
                {TIPO_JORNADA_LABELS[visita.finanzas.tipoJornada] ?? visita.finanzas.tipoJornada}
              </dd>
            </div>
            <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                Tipo de día
              </dt>
              <dd className="mt-0.5 font-semibold text-medical-text">
                {labelTipoDia(visita.finanzas.tipoDia)}
              </dd>
            </div>
            <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                Valor aplicado
              </dt>
              <dd className="mt-0.5 font-semibold text-medical-text">
                {formatReporteMonto(visita.finanzas.valorAplicado)}
                <span className="ml-1 text-xs font-normal text-medical-mutedText">
                  ({MODALIDAD_COBRO_LABELS[visita.finanzas.modalidadCobro] ??
                    visita.finanzas.modalidadCobro})
                </span>
              </dd>
            </div>
          </>
        ) : null}
        {visita.observaciones?.trim() ? (
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
              Observaciones
            </dt>
            <dd className="mt-0.5 text-medical-text">{visita.observaciones}</dd>
          </div>
        ) : null}
        <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Nº visita</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-medical-text">#{visita.id}</dd>
        </div>
        {insumos.length > 0 ? (
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
            <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
              <Package className="h-3 w-3" />
              Insumos
            </dt>
            <dd className="mt-1.5 space-y-1">
              {insumos.map((insumo) => (
                <p key={insumo.id} className="text-sm text-medical-text">
                  <span className="font-medium">{insumo.insumoNombre}</span>
                  <span className="text-medical-mutedText"> · ×{insumo.cantidad}</span>
                </p>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="border-t border-medical-border px-4 py-3">
        <button
          type="button"
          onClick={onNuevaVisita}
          className="inline-flex h-11 w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-medical-primary text-sm font-semibold text-white transition hover:bg-medical-primaryDark"
        >
          <Plus className="h-4 w-4" />
          Registrar otra visita
        </button>
      </div>
    </section>
  );
}
