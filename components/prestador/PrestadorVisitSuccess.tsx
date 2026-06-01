"use client";

import { CheckCircle2, Plus } from "lucide-react";
import type { VisitaDetailDto } from "@/lib/api/types";
import { formatVisitaDuracion, formatVisitaFecha } from "@/lib/visitas-display";

type Props = {
  visita: VisitaDetailDto;
  onNuevaVisita: () => void;
};

export function PrestadorVisitSuccess({ visita, onNuevaVisita }: Props) {
  const paciente = visita.pacienteServicio?.paciente;
  const servicio = visita.pacienteServicio?.servicio;
  const pacienteNombre = paciente
    ? `${paciente.nombre} ${paciente.apellido}`.trim()
    : "Paciente";
  const servicioNombre = servicio?.nombre ?? "Servicio";
  const fechaIso = visita.fechaInicio ?? visita.fecha;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-medical-primary/35 bg-medical-card shadow-md shadow-medical-primary/10">
      <div className="flex items-center gap-2 border-b border-medical-primary/20 bg-medical-primary/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-medical-primary" />
        <div>
          <h2 className="text-base font-semibold text-medical-primaryDark">Visita registrada</h2>
          <p className="text-xs text-medical-mutedText">La visita se guardó correctamente.</p>
        </div>
      </div>

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
        <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Inicio</dt>
          <dd className="mt-0.5 font-semibold text-medical-text">{formatVisitaFecha(fechaIso)}</dd>
        </div>
        <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Duración</dt>
          <dd className="mt-0.5 font-semibold text-medical-text">
            {formatVisitaDuracion(visita.tiempoMinutos)}
          </dd>
        </div>
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
