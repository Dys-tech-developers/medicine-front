"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  ClipboardList,
  MessageSquare,
  Package,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisitaListItemDto } from "@/lib/api/types";
import {
  formatPacienteServicioEstado,
  formatVisitaDateTime,
  formatVisitaDuracion,
  formatVisitaFecha,
  getPacienteNombre,
} from "@/lib/visitas-display";
import { MEDICAL_UI, visitaEstadoBadgeClass } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

/* ─── componentes internos ─────────────────────────────────────── */
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

function InfoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-medical-border/70 bg-medical-surface/40 divide-y divide-medical-border/50",
        className
      )}
    >
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

/* ─── tipos ────────────────────────────────────────────────────── */
type VisitaDetailDialogProps = {
  open: boolean;
  visita: VisitaListItemDto | null;
  onClose: () => void;
};

/* ─── componente principal ─────────────────────────────────────── */
export function VisitaDetailDialog({ open, visita, onClose }: VisitaDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open || !visita || typeof document === "undefined") return null;

  const paciente = visita.pacienteServicio?.paciente;
  const servicio = visita.pacienteServicio?.servicio;
  const estado = visita.pacienteServicio?.estado;
  const insumos = visita.insumos ?? [];
  const totalInsumos = insumos.reduce((sum, i) => sum + i.cantidad, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visita-detail-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className={cn("absolute inset-0 cursor-pointer", MEDICAL_UI.overlay)}
        aria-label="Cerrar"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-medical-border bg-white shadow-2xl",
          "max-h-[min(88dvh,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))]",
          "sm:max-h-[min(88vh,calc(100vh-2.5rem))] sm:max-w-lg"
        )}
      >

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-2 bg-medical-primary px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <ClipboardList className="size-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p id="visita-detail-title" className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Visita #{visita.id}
              </p>
              <h2 className="truncate text-base font-semibold text-white leading-tight mt-0.5">
                {getPacienteNombre(visita)}
              </h2>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/80 cursor-pointer hover:bg-white/15 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Hero strip — métricas rápidas */}
        <div className="shrink-0 grid grid-cols-3 divide-x divide-medical-border/60 border-b border-medical-border/60 bg-white">
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 sm:px-3 sm:py-3">
            <span className="flex items-center gap-1 text-base font-bold text-medical-primary sm:text-lg">
              <Clock className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">{formatVisitaDuracion(visita.tiempoMinutos)}</span>
            </span>
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Duración</span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 text-center sm:px-3 sm:py-3">
            <span className="w-full text-xs font-semibold leading-tight text-medical-text line-clamp-2 sm:text-sm">
              {servicio?.nombre ?? "—"}
            </span>
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Servicio</span>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 sm:px-3 sm:py-3">
            {estado ? (
              <span
                className={cn(
                  "max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs",
                  visitaEstadoBadgeClass(estado)
                )}
              >
                {formatPacienteServicioEstado(estado)}
              </span>
            ) : (
              <span className="text-sm font-semibold text-medical-mutedText">—</span>
            )}
            <span className="text-[11px] text-medical-mutedText sm:text-xs">Estado</span>
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">

          {/* Fecha y hora */}
          <section>
            <SectionTitle icon={Calendar}>Fecha y hora</SectionTitle>
            <InfoCard>
              <InfoRow label="Fecha">{formatVisitaFecha(visita.fecha)}</InfoRow>
            </InfoCard>
          </section>

          {/* Observaciones — solo si tiene contenido, con tratamiento especial */}
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

          {/* Paciente */}
          <section>
            <SectionTitle icon={User}>Paciente</SectionTitle>
            <InfoCard>
              <InfoRow label="Nombre">{getPacienteNombre(visita)}</InfoRow>
              {paciente?.numeroDocumento ? (
                <InfoRow label="Documento" mono>
                  {paciente.numeroDocumento}
                </InfoRow>
              ) : null}
            </InfoCard>
          </section>

          {/* Prestador */}
          <section>
            <SectionTitle icon={Stethoscope}>Prestador</SectionTitle>
            <InfoCard>
              <InfoRow label="Nombre">{visita.prestador?.nombre ?? "—"}</InfoRow>
              {visita.prestador?.email ? (
                <InfoRow label="Email">{visita.prestador.email}</InfoRow>
              ) : null}
            </InfoCard>
          </section>

          {/* Insumos */}
          <section>
            <SectionTitle icon={Package}>
              Insumos
              {insumos.length > 0 && (
                <span className="ml-1 rounded-full bg-medical-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-medical-primary">
                  {insumos.length}
                </span>
              )}
            </SectionTitle>
            {insumos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-medical-border px-3.5 py-3 text-sm text-medical-mutedText sm:px-4">
                Sin insumos registrados
              </p>
            ) : (
              <div className="space-y-2">
                {/* Totalizador */}
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

         
        </div>

        {/* Footer */}
        <div className={cn("shrink-0 px-4 py-3 sm:px-6", MEDICAL_UI.dialogFooter)}>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full cursor-pointer border-medical-border/80 hover:bg-medical-secondary sm:h-10"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
