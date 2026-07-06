"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  ClipboardList,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { updateVisitaWithApi } from "@/lib/api/visitas";
import type { VisitaDetailDto } from "@/lib/api/types";
import {
  buildUpdateVisitaBody,
  getPrestadorVisitaErrorMessage,
  isoToDatetimeLocalValue,
  validatePrestadorVisitaEditForm,
  VISITA_OBSERVACIONES_MAX,
  VISITA_TIEMPO_MAX,
  VISITA_TIEMPO_MIN,
} from "@/lib/prestador-visitas";
import {
  formatVisitaDateOnly,
  formatVisitaDuracion,
  formatVisitaFecha,
  formatVisitaTimeOnly,
  getPacienteNombre,
  getVisitaPacienteDocumento,
} from "@/lib/visitas-display";
import { formatVisitaEstado, visitaEstadoBadgeClass } from "@/lib/visita-estado-labels";
import { MEDICAL_UI } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
      <Icon className="size-3.5 shrink-0 text-medical-primary" />
      {children}
    </h3>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-medical-border/50 rounded-xl border border-medical-border/70 bg-medical-surface/40">
      {children}
    </div>
  );
}

function InfoRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-4 sm:py-2.5">
      <span className="shrink-0 text-xs font-medium text-medical-mutedText">{label}</span>
      <span
        className={cn(
          "text-sm font-medium text-medical-text break-words sm:max-w-[62%] sm:text-right",
          mono && "font-mono text-[13px]"
        )}
      >
        {children}
      </span>
    </div>
  );
}

type Props = {
  open: boolean;
  visita: VisitaDetailDto | null;
  accessToken: string | null;
  onClose: () => void;
  onUpdated?: (visita: VisitaDetailDto) => void;
};

export function PrestadorVisitaDetailDialog({
  open,
  visita,
  accessToken,
  onClose,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [fechaInicioLocal, setFechaInicioLocal] = useState("");
  const [tiempoMinutos, setTiempoMinutos] = useState<number | "">(45);
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !visita) {
      setEditing(false);
      return;
    }
    setFechaInicioLocal(isoToDatetimeLocalValue(visita.fechaInicio ?? visita.fecha));
    setTiempoMinutos(visita.tiempoMinutos ?? "");
    setObservaciones(visita.observaciones ?? "");
    setFormError("");
  }, [open, visita]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        if (editing) setEditing(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, editing, saving, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleSave = async () => {
    if (!visita || !accessToken) return;

    const validationError = validatePrestadorVisitaEditForm({
      fechaInicioLocal,
      tiempoMinutos,
      observaciones,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const body = buildUpdateVisitaBody({
      fechaInicioLocal,
      tiempoMinutos: tiempoMinutos as number,
      observaciones,
    });
    if (!body) {
      setFormError("Revisá la fecha y hora de inicio.");
      return;
    }

    setFormError("");
    setSaving(true);
    try {
      const updated = await updateVisitaWithApi(accessToken, visita.id, body);
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getPrestadorVisitaErrorMessage(err)
          : "No se pudo actualizar la visita.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !visita || typeof document === "undefined") return null;

  const servicio = visita.pacienteServicio?.servicio;
  const insumos = visita.insumos ?? [];
  const totalInsumos = insumos.reduce((sum, i) => sum + i.cantidad, 0);
  const documento = getVisitaPacienteDocumento(visita);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestador-visita-detail-title"
    >
      <button
        type="button"
        className={cn("absolute inset-0 cursor-pointer", MEDICAL_UI.overlay)}
        aria-label="Cerrar"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-2xl",
          "max-h-[min(88dvh,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))]",
          "sm:max-h-[min(88vh,calc(100vh-2.5rem))] sm:max-w-lg"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 bg-medical-primary px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <ClipboardList className="size-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p
                id="prestador-visita-detail-title"
                className="text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Visita #{visita.id}
              </p>
              <h2 className="mt-0.5 truncate text-base font-semibold leading-tight text-white">
                {getPacienteNombre(visita)}
              </h2>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 cursor-pointer text-white/80 hover:bg-white/15 hover:text-white"
            onClick={onClose}
            disabled={saving}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid shrink-0 grid-cols-3 divide-x divide-medical-border/60 border-b border-medical-border/60 bg-white">
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 sm:px-3 sm:py-3">
            <span className="flex items-center gap-1 text-base font-bold text-medical-primary sm:text-lg">
              <Clock className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">{formatVisitaDuracion(visita.tiempoMinutos)}</span>
            </span>
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Duración</span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 text-center sm:px-3 sm:py-3">
            <span className="line-clamp-2 w-full text-xs font-semibold leading-tight text-medical-text sm:text-sm">
              {servicio?.nombre ?? "—"}
            </span>
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Servicio</span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 text-center sm:px-3 sm:py-3">
            <span
              className={cn(
                "max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs",
                visitaEstadoBadgeClass(visita.estado)
              )}
            >
              {formatVisitaEstado(visita.estado)}
            </span>
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Estado</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {editing ? (
            <section className="space-y-3">
              <SectionTitle icon={Pencil}>Editar visita</SectionTitle>
              <label className="block text-xs font-medium text-medical-mutedText">
                Fecha y hora de inicio
                <input
                  type="datetime-local"
                  value={fechaInicioLocal}
                  onChange={(e) => setFechaInicioLocal(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15"
                />
              </label>
              <label className="block text-xs font-medium text-medical-mutedText">
                Duración (minutos)
                <input
                  type="number"
                  min={VISITA_TIEMPO_MIN}
                  max={VISITA_TIEMPO_MAX}
                  value={tiempoMinutos}
                  onChange={(e) =>
                    setTiempoMinutos(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-medical-border bg-white px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15"
                />
              </label>
              <label className="block text-xs font-medium text-medical-mutedText">
                Observaciones
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  maxLength={VISITA_OBSERVACIONES_MAX}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-xl border border-medical-border bg-white px-3 py-2 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/15"
                />
              </label>
              {formError ? (
                <p className="rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                  {formError}
                </p>
              ) : null}
            </section>
          ) : (
            <>
              <section>
                <SectionTitle icon={Calendar}>Fecha y hora</SectionTitle>
                <InfoCard>
                  <InfoRow label="Día">{formatVisitaDateOnly(visita.fecha)}</InfoRow>
                  <InfoRow label="Hora">{formatVisitaTimeOnly(visita.fecha)}</InfoRow>
                  <InfoRow label="Registro completo">{formatVisitaFecha(visita.fecha)}</InfoRow>
                </InfoCard>
              </section>

              {visita.observaciones?.trim() ? (
                <section>
                  <SectionTitle icon={MessageSquare}>Observaciones</SectionTitle>
                  <div className="rounded-xl border border-medical-primary/20 bg-medical-secondary/40 px-3.5 py-3 sm:px-4">
                    <p className="text-sm leading-relaxed text-medical-text break-words">
                      {visita.observaciones}
                    </p>
                  </div>
                </section>
              ) : null}

              <section>
                <SectionTitle icon={User}>Paciente</SectionTitle>
                <InfoCard>
                  <InfoRow label="Nombre">{getPacienteNombre(visita)}</InfoRow>
                  {documento ? (
                    <InfoRow label="Documento" mono>
                      {documento}
                    </InfoRow>
                  ) : null}
                </InfoCard>
              </section>

              <section>
                <SectionTitle icon={Package}>
                  Insumos
                  {insumos.length > 0 ? (
                    <span className="ml-1 rounded-full bg-medical-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-medical-primary">
                      {insumos.length}
                    </span>
                  ) : null}
                </SectionTitle>
                {insumos.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-medical-border px-3.5 py-3 text-sm text-medical-mutedText sm:px-4">
                    Sin insumos registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-medical-surface/60 px-3 py-2">
                      <span className="text-xs text-medical-mutedText">Total unidades</span>
                      <span className="text-sm font-bold text-medical-text">{totalInsumos}</span>
                    </div>
                    <InfoCard>
                      {insumos.map((insumo) => (
                        <div
                          key={insumo.id}
                          className="flex items-start justify-between gap-3 px-3.5 py-3 sm:px-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug text-medical-text break-words">
                              {insumo.insumoNombre}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-medical-mutedText break-all">
                              {insumo.insumoCodigo}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-lg border border-medical-primary/20 bg-medical-secondary px-2.5 py-0.5 text-xs font-bold text-medical-primaryDark">
                            × {insumo.cantidad}
                          </span>
                        </div>
                      ))}
                    </InfoCard>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <div className={cn("shrink-0 space-y-2 px-4 py-3 sm:px-6", MEDICAL_UI.dialogFooter)}>
          {editing ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 cursor-pointer border-medical-border/80 hover:bg-medical-secondary sm:h-10"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark sm:h-10"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full cursor-pointer border-medical-primary/30 text-medical-primary hover:bg-medical-secondary sm:h-10"
                onClick={() => setEditing(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar visita
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full cursor-pointer border-medical-border/80 hover:bg-medical-secondary sm:h-10"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
