"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  ClipboardList,
  Mail,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PrestadorListItemDto } from "@/lib/api/types";
import {
  formatPrestadorCbu,
  formatPrestadorDateTime,
  formatRegimenIva,
} from "@/lib/prestadores-display";
import { MEDICAL_UI, estadoActivoBadgeClass, medicalNeutralBadge } from "@/lib/medical-ui-classes";
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
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs text-medical-mutedText">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-medium text-medical-text break-words",
          mono && "font-mono text-[13px]"
        )}
      >
        {children}
      </span>
    </div>
  );
}

type PrestadorDetailDialogProps = {
  open: boolean;
  prestador: PrestadorListItemDto | null;
  onClose: () => void;
};

export function PrestadorDetailDialog({
  open,
  prestador,
  onClose,
}: PrestadorDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !prestador || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestador-detail-title"
    >
      <button
        type="button"
        className={cn("absolute inset-0", MEDICAL_UI.overlay)}
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl max-h-[92dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between bg-medical-primary px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Stethoscope className="size-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p
                id="prestador-detail-title"
                className="text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Prestador #{prestador.id}
              </p>
              <h2 className="truncate text-base font-semibold leading-tight text-white mt-0.5">
                {prestador.nombre}
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

        {/* Hero strip */}
        <div className="shrink-0 grid grid-cols-3 divide-x divide-medical-border/60 border-b border-medical-border/60 bg-white">
          <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
            <span className="font-mono text-sm font-bold text-medical-text leading-tight">
              {prestador.matricula || "—"}
            </span>
            <span className="text-xs text-medical-mutedText">Matrícula</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
            <span className="text-sm font-semibold text-medical-text leading-tight line-clamp-2">
              {formatRegimenIva(prestador.regimenIva)}
            </span>
            <span className="text-xs text-medical-mutedText">Régimen IVA</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-3">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold",
                estadoActivoBadgeClass(prestador.estado)
              )}
            >
              {prestador.estado ? "Activo" : "Inactivo"}
            </span>
            <span className="text-xs text-medical-mutedText">Perfil</span>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-5 px-5 py-5 sm:px-6">
          {/* Usuario */}
          <section>
            <SectionTitle icon={User}>Acceso al sistema</SectionTitle>
            <InfoCard>
              <InfoRow label="Usuario">
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold",
                    prestador.usuarioEstado
                      ? "border-medical-primary/20 bg-medical-secondary text-medical-primaryDark"
                      : medicalNeutralBadge
                  )}
                >
                  {prestador.usuarioEstado ? "Habilitado" : "Deshabilitado"}
                </span>
              </InfoRow>
              <InfoRow label="Email">{prestador.email}</InfoRow>
            </InfoCard>
          </section>

          {/* Contacto */}
          <section>
            <SectionTitle icon={Mail}>Contacto</SectionTitle>
            <InfoCard>
              <InfoRow label="Teléfono">{prestador.telefono || "—"}</InfoRow>
              <InfoRow label="Residencia">{prestador.lugarResidencia || "—"}</InfoRow>
            </InfoCard>
          </section>

          {/* Identidad profesional */}
          <section>
            <SectionTitle icon={Stethoscope}>Identidad profesional</SectionTitle>
            <InfoCard>
              <InfoRow label="Documento" mono>
                {prestador.documento}
              </InfoRow>
              <InfoRow label="Matrícula" mono>
                {prestador.matricula}
              </InfoRow>
            </InfoCard>
          </section>

          {/* Fiscal */}
          <section>
            <SectionTitle icon={Building2}>Datos fiscales</SectionTitle>
            <InfoCard>
              <InfoRow label="CUIT" mono>
                {prestador.cuit}
              </InfoRow>
              <InfoRow label="CBU" mono>
                {formatPrestadorCbu(prestador.cbu)}
              </InfoRow>
              <InfoRow label="Régimen IVA">{formatRegimenIva(prestador.regimenIva)}</InfoRow>
            </InfoCard>
          </section>

          {/* Registro */}
          <section>
            <SectionTitle icon={ClipboardList}>Registro</SectionTitle>
            <InfoCard>
              <InfoRow label="ID" mono>
                {String(prestador.id)}
              </InfoRow>
              <InfoRow label="Alta">{formatPrestadorDateTime(prestador.createdAt)}</InfoRow>
              <InfoRow label="Actualizado">
                {formatPrestadorDateTime(prestador.updatedAt)}
              </InfoRow>
            </InfoCard>
          </section>
        </div>

        {/* Footer */}
        <div className={cn("shrink-0 px-5 py-3 sm:px-6", MEDICAL_UI.dialogFooter)}>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer border-medical-border/80 hover:bg-medical-secondary"
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
