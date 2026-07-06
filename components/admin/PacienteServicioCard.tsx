"use client";

import {
  Activity,
  Ban,
  CalendarDays,
  PauseCircle,
  Pencil,
  RotateCcw,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  GestionarTramoAdminAccion,
  PacienteServicioAsignadoQrDto,
  PacienteServicioDto,
  PacienteServicioEstado,
  PacienteServicioPrestadorResumenDto,
} from "@/lib/api/types";
import {
  asignacionPermiteAccion,
  type PacienteServicioAccion,
} from "@/lib/paciente-servicios-access";
import {
  formatPacienteServicioPrestadorLabel,
  formatPacienteServicioPrestadorSubtitulo,
} from "@/lib/paciente-servicios-display";
import {
  formatPacienteServicioFrecuencia,
  formatPacienteServicioUsoEnPeriodo,
} from "@/lib/paciente-servicio-display";
import {
  formatCoberturaDiariaDisplay,
  getReglasAsignacionFromServicio,
  modoEsRelevo,
} from "@/lib/reglas-asignacion";
import { PacienteServicioRelevoTramoPanel } from "@/components/admin/PacienteServicioRelevoTramoPanel";
import {
  ASIGNACION_ESTADO_LABELS,
  MODALIDAD_COBRO_LABELS,
  PERIODO_CONTROL_LABELS,
} from "@/lib/paciente-servicios-labels";
import { formatPacienteFechaNacimiento } from "@/lib/pacientes-display";
import { medicalRelevoBadge } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

const ESTADO_STYLES: Record<PacienteServicioEstado, string> = {
  activa: "border-medical-success/30 bg-medical-success/10 text-medical-success",
  suspendida: "border-medical-warning/40 bg-medical-warning/10 text-[#B45309]",
  finalizada: "border-medical-border bg-medical-surface text-medical-mutedText",
};

export function PacienteServicioEstadoBadge({
  estado,
}: {
  estado: PacienteServicioEstado;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        ESTADO_STYLES[estado] ?? ESTADO_STYLES.finalizada
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          estado === "activa"
            ? "bg-medical-success"
            : estado === "suspendida"
              ? "bg-medical-warning"
              : "bg-medical-mutedText"
        )}
        aria-hidden
      />
      {ASIGNACION_ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}

function DisponibilidadBar({ servicio }: { servicio: PacienteServicioAsignadoQrDto }) {
  if (modoEsRelevo(getReglasAsignacionFromServicio(servicio).modo)) return null;
  if (servicio.modalidadCobro === "por_hora") return null;
  const d = servicio.disponibilidad;
  const uso = formatPacienteServicioUsoEnPeriodo(servicio);
  if (!d || !uso) return null;

  const permitida = d.cantidadPermitida > 0 ? d.cantidadPermitida : 0;
  const utilizada = Math.max(0, d.cantidadUtilizada ?? 0);
  const disponible =
    d.cantidadDisponible != null
      ? d.cantidadDisponible
      : Math.max(0, permitida - utilizada);
  const pct = permitida > 0 ? Math.min(100, Math.round((utilizada / permitida) * 100)) : 0;

  const tone =
    disponible <= 0
      ? { bar: "bg-medical-danger", text: "text-medical-danger" }
      : disponible <= Math.max(1, Math.ceil(permitida * 0.25))
        ? { bar: "bg-medical-warning", text: "text-[#B45309]" }
        : { bar: "bg-medical-primary", text: "text-medical-primaryDark" };

  return (
    <div className="px-3.5 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-medical-mutedText">Uso del período</span>
        <span className="font-mono font-semibold text-medical-text">{uso}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-medical-border/50">
        <div
          className={cn("h-full rounded-full transition-all", tone.bar)}
          style={{ width: `${Math.max(pct, permitida > 0 && utilizada > 0 ? 6 : 0)}%` }}
        />
      </div>
      <p className={cn("mt-1.5 text-xs font-semibold", tone.text)}>
        {disponible <= 0
          ? "Cupo agotado en este período"
          : `Restan ${disponible} de ${permitida}`}
      </p>
    </div>
  );
}

/** Normaliza una asignación al shape de servicio asignado, priorizando datos frescos. */
export function asignacionToQrDto(
  asignacion: PacienteServicioDto,
  qr?: PacienteServicioAsignadoQrDto
): PacienteServicioAsignadoQrDto {
  const reglas = getReglasAsignacionFromServicio({
    modoRelevo: asignacion.servicio.modoRelevo,
    controlHorario: asignacion.servicio.controlHorario,
    reglasAsignacion: asignacion.servicio.reglasAsignacion ?? qr?.reglasAsignacion,
  });
  if (qr) {
    return {
      ...qr,
      estado: asignacion.estado,
      modoRelevo: qr.modoRelevo ?? asignacion.servicio.modoRelevo === true,
      reglasAsignacion: qr.reglasAsignacion ?? reglas,
      prestadoresAsignados:
        qr.prestadoresAsignados ?? asignacion.prestadoresAsignados,
      coberturaActiva: qr.coberturaActiva,
      coberturaDiariaInicio:
        qr.coberturaDiariaInicio ?? asignacion.coberturaDiariaInicio ?? null,
      coberturaDiariaFin: qr.coberturaDiariaFin ?? asignacion.coberturaDiariaFin ?? null,
      prestadorId: asignacion.prestadorId ?? undefined,
      prestador: asignacion.prestador ?? undefined,
    };
  }
  return {
    pacienteServicioId: asignacion.id,
    servicioId: asignacion.servicioId,
    servicioNombre: asignacion.servicio.nombre,
    modoRelevo: asignacion.servicio.modoRelevo === true,
    reglasAsignacion: reglas,
    coberturaDiariaInicio: asignacion.coberturaDiariaInicio ?? null,
    coberturaDiariaFin: asignacion.coberturaDiariaFin ?? null,
    ...(asignacion.prestadoresAsignados
      ? { prestadoresAsignados: asignacion.prestadoresAsignados }
      : {}),
    prestadorId: asignacion.prestadorId ?? undefined,
    prestador: asignacion.prestador ?? undefined,
    modalidadCobro: asignacion.modalidadCobro,
    periodoControl: asignacion.periodoControl,
    cantidadPermitida: asignacion.cantidadPermitida,
    cantidadHoras: asignacion.cantidadHoras,
    estado: asignacion.estado,
    fechaInicio: asignacion.fechaInicio,
    fechaFin: asignacion.fechaFin,
  };
}

export function PacienteServicioCard({
  servicio,
  prestadorId,
  prestador,
  onEdit,
  canPatch,
  canDelete,
  onAccion,
  accessToken,
  canManageRelevoTramo,
  onRelevoTramoChange,
}: {
  servicio: PacienteServicioAsignadoQrDto;
  prestadorId?: number | null;
  prestador?: PacienteServicioPrestadorResumenDto | null;
  onEdit?: () => void;
  canPatch?: boolean;
  canDelete?: boolean;
  onAccion?: (accion: PacienteServicioAccion) => void;
  accessToken?: string | null;
  canManageRelevoTramo?: boolean;
  onRelevoTramoChange?: (accion: GestionarTramoAdminAccion) => void;
}) {
  const modalidad =
    MODALIDAD_COBRO_LABELS[servicio.modalidadCobro] ?? servicio.modalidadCobro;
  const frecuencia = formatPacienteServicioFrecuencia(servicio);
  const esRelevo = modoEsRelevo(getReglasAsignacionFromServicio(servicio).modo);
  const horarioDiario = formatCoberturaDiariaDisplay(
    servicio.coberturaDiariaInicio,
    servicio.coberturaDiariaFin
  );

  return (
    <div className="overflow-hidden rounded-xl border border-medical-border/70 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-medical-border/50 bg-medical-surface/40 px-3.5 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-medical-primary/10 text-medical-primary">
            <Stethoscope className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-medical-text wrap-break-word">
              {servicio.servicioNombre}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {esRelevo ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
                    medicalRelevoBadge
                  )}
                >
                  Relevamiento · {horarioDiario}
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center rounded-md bg-medical-secondary px-1.5 py-0.5 text-xs font-medium text-medical-primaryDark">
                    {modalidad}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-medical-border/60 px-1.5 py-0.5 text-xs font-medium text-medical-mutedText">
                    {PERIODO_CONTROL_LABELS[servicio.periodoControl] ?? servicio.periodoControl}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-medical-mutedText">
                    <Activity className="size-3 shrink-0" aria-hidden />
                    {frecuencia}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <PacienteServicioEstadoBadge estado={servicio.estado} />
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs text-medical-primary hover:bg-medical-secondary"
              onClick={onEdit}
            >
              <Pencil className="size-3" />
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-medical-border/50 bg-medical-surface/30 px-3.5 py-2">
        <User className="size-3.5 shrink-0 text-medical-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium text-medical-mutedText">
            {(servicio.prestadoresAsignados?.length ?? 0) > 1 ? "Prestadores" : "Prestador"}
          </p>
          <p className="truncate text-sm font-semibold text-medical-text">
            {formatPacienteServicioPrestadorLabel({
              prestador: prestador ?? null,
              prestadorId: prestadorId ?? servicio.prestadorId ?? null,
              prestadoresAsignados: servicio.prestadoresAsignados,
            })}
          </p>
          {prestador && formatPacienteServicioPrestadorSubtitulo({ prestador }) ? (
            <p className="truncate text-xs text-medical-mutedText">
              {formatPacienteServicioPrestadorSubtitulo({ prestador })}
            </p>
          ) : null}
        </div>
      </div>

      <DisponibilidadBar servicio={servicio} />

      {onRelevoTramoChange ? (
        <PacienteServicioRelevoTramoPanel
          servicio={servicio}
          accessToken={accessToken ?? null}
          canManage={canManageRelevoTramo === true}
          onSuccess={onRelevoTramoChange}
        />
      ) : null}

      {servicio.fechaInicio || servicio.fechaFin ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-medical-border/50 px-3.5 py-2.5 text-xs text-medical-mutedText">
          {servicio.fechaInicio ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3 shrink-0" aria-hidden />
              Inicio: {formatPacienteFechaNacimiento(servicio.fechaInicio)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3 shrink-0" aria-hidden />
            Fin: {servicio.fechaFin ? formatPacienteFechaNacimiento(servicio.fechaFin) : "Sin definir"}
          </span>
        </div>
      ) : null}

      {onAccion && (canPatch || canDelete) ? (
        <div className="flex flex-wrap gap-1.5 border-t border-medical-border/50 bg-medical-surface/20 px-3 py-2">
          {canPatch && asignacionPermiteAccion(servicio.estado, "finalizar") ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs"
              onClick={() => onAccion("finalizar")}
            >
              <Ban className="size-3" />
              Finalizar
            </Button>
          ) : null}
          {canPatch && asignacionPermiteAccion(servicio.estado, "suspender") ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs"
              onClick={() => onAccion("suspender")}
            >
              <PauseCircle className="size-3" />
              Suspender
            </Button>
          ) : null}
          {canPatch && asignacionPermiteAccion(servicio.estado, "reactivar") ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-xs"
              onClick={() => onAccion("reactivar")}
            >
              <RotateCcw className="size-3" />
              Reactivar
            </Button>
          ) : null}
          {canDelete && asignacionPermiteAccion(servicio.estado, "eliminar") ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer border-medical-danger/30 px-2 text-xs text-medical-danger hover:bg-medical-danger/10"
              onClick={() => onAccion("eliminar")}
            >
              <Trash2 className="size-3" />
              Eliminar
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
