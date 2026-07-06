"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  Clock,
  FileText,
  Layers,
  Pencil,
  User,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import {
  MEDICAL_UI,
  estadoActivoBadgeClass,
  medicalNeutralBadge,
} from "@/lib/medical-ui-classes";
import {
  asignacionEstadoBadgeClass,
  asignacionEstadoLabel,
  formatAsignacionFrecuencia,
  formatAsignacionModalidad,
  formatAsignacionVigencia,
  formatServicioModoVisita,
  formatServicioFecha,
  formatTarifaContexto,
  formatTarifaValor,
  getPacienteAsignadoNombre,
  getServicioPacientesCount,
} from "@/lib/servicios-display";
import { cn } from "@/lib/utils";

function SectionTitle({
  icon: Icon,
  count,
  children,
}: {
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
      <Icon className="size-3.5 shrink-0 text-medical-primary" />
      {children}
      {count != null ? (
        <span className="rounded-full bg-medical-secondary px-2 py-0.5 text-[10px] font-semibold text-medical-primaryDark">
          {count}
        </span>
      ) : null}
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs text-medical-mutedText">{label}</span>
      <span className="text-right text-sm font-medium text-medical-text break-words">{children}</span>
    </div>
  );
}

type ServicioDetailDialogProps = {
  open: boolean;
  servicio: ServicioConTarifasDto | null;
  onClose: () => void;
  onEdit?: (servicio: ServicioConTarifasDto) => void;
  onVerPacientes?: (servicio: ServicioConTarifasDto) => void;
};

export function ServicioDetailDialog({
  open,
  servicio,
  onClose,
  onEdit,
  onVerPacientes,
}: ServicioDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !servicio || typeof document === "undefined") return null;

  const tarifas = servicio.tarifas ?? [];
  const pacientes = servicio.pacientes ?? [];
  const pacientesCount = getServicioPacientesCount(servicio);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="servicio-detail-title"
    >
      <button
        type="button"
        className={cn("absolute inset-0", MEDICAL_UI.overlay)}
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[88vh]">
        <div className="flex shrink-0 items-start justify-between bg-medical-primary px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Layers className="size-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Servicio #{servicio.id}
              </p>
              <h2
                id="servicio-detail-title"
                className="mt-0.5 truncate text-base font-semibold leading-tight text-white"
              >
                {servicio.nombre}
              </h2>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white/80 hover:bg-white/15 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="shrink-0 grid grid-cols-3 divide-x divide-medical-border/60 border-b border-medical-border/60 bg-white">
          <div className="flex flex-col items-center gap-1 px-3 py-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-medical-mutedText">
              Estado
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold",
                servicio.estado ? estadoActivoBadgeClass(true) : medicalNeutralBadge
              )}
            >
              {servicio.estado ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-medical-mutedText">
              Tarifas
            </span>
            <span className="text-sm font-bold text-medical-text">{tarifas.length}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-medical-mutedText">
              Pacientes
            </span>
            <span className="text-sm font-bold text-medical-text">{pacientesCount}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <SectionTitle icon={FileText}>Información general</SectionTitle>
          <InfoCard className="mb-6">
            <InfoRow label="Descripción">
              {servicio.descripcion?.trim() ? servicio.descripcion : "Sin descripción"}
            </InfoRow>
            <InfoRow label="Modo de visita">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-medical-primary" aria-hidden />
                {formatServicioModoVisita(servicio)}
              </span>
            </InfoRow>
            <InfoRow label="Alta en catálogo">{formatServicioFecha(servicio.createdAt)}</InfoRow>
          </InfoCard>

          <SectionTitle icon={Banknote} count={tarifas.length}>
            Tarifas del catálogo
          </SectionTitle>
          {tarifas.length === 0 ? (
            <p className="mb-6 rounded-xl border border-dashed border-medical-border bg-medical-surface/40 px-4 py-6 text-center text-sm text-medical-mutedText">
              Este servicio no tiene tarifas configuradas.
            </p>
          ) : (
            <ul className="mb-6 space-y-2">
              {tarifas.map((tarifa) => (
                <li
                  key={tarifa.id}
                  className="rounded-xl border border-medical-border/80 bg-medical-surface/50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-medical-text">
                    {formatTarifaValor(tarifa.valor)}
                  </p>
                  <p className="mt-0.5 text-xs text-medical-mutedText">
                    {formatTarifaContexto(tarifa)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <SectionTitle icon={Users} count={pacientesCount}>
            Pacientes asignados
          </SectionTitle>
          {pacientes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-medical-border bg-medical-surface/40 px-4 py-6 text-center text-sm text-medical-mutedText">
              Ningún paciente tiene este servicio asignado.
            </p>
          ) : (
            <ul className="space-y-2">
              {pacientes.map((p) => (
                <li
                  key={p.pacienteServicioId}
                  className="rounded-xl border border-medical-border/80 bg-medical-surface/50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-medical-primary">
                      <User className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-medical-text">
                          {getPacienteAsignadoNombre(p)}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-xs font-semibold",
                            asignacionEstadoBadgeClass(p.estado)
                          )}
                        >
                          {asignacionEstadoLabel(p.estado)}
                        </Badge>
                      </div>
                      {p.numeroDocumento || p.codigoQr ? (
                        <p className="mt-0.5 text-xs text-medical-mutedText">
                          {p.numeroDocumento ? `DNI ${p.numeroDocumento}` : null}
                          {p.numeroDocumento && p.codigoQr ? " · " : null}
                          {p.codigoQr ?? null}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md border border-medical-primary/20 bg-medical-secondary/60 px-2 py-0.5 font-medium text-medical-primaryDark">
                          {formatAsignacionModalidad(p)}
                        </span>
                        <span className="rounded-md border border-medical-border bg-white px-2 py-0.5 text-medical-mutedText">
                          {formatAsignacionFrecuencia(p)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-medical-mutedText">
                        Vigencia: {formatAsignacionVigencia(p)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
          {onEdit ? (
            <Button
              type="button"
              className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
              onClick={() => onEdit(servicio)}
            >
              <Pencil className="size-4" />
              Editar servicio
            </Button>
          ) : null}
          {onVerPacientes && pacientesCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer border-medical-primary/25 text-medical-primary hover:bg-medical-secondary"
              onClick={() => onVerPacientes(servicio)}
            >
              <Users className="size-4" />
              Ver pacientes
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
