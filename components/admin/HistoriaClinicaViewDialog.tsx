"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertCircle,
  ClipboardPlus,
  FileText,
  Loader2,
  Pill,
  Stethoscope,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { getHistoriaClinicaByPacienteIdWithApi } from "@/lib/api/historias-clinicas";
import type { HistoriaClinicaDto, PacienteListItemDto } from "@/lib/api/types";
import {
  formatHistoriaFecha,
  formatHistoriaFechaHora,
  formatHistoriaField,
  sortEvolucionesDesc,
} from "@/lib/historias-display";
import { getPacienteNombre } from "@/lib/pacientes-display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateEvolucionClinicaDialog } from "@/components/admin/CreateEvolucionClinicaDialog";
import { Badge } from "@/components/ui/badge";

type HistoriaClinicaViewDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken: string | null;
  onClose: () => void;
};

function SectionTitle({
  icon: Icon,
  children,
  trailing,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
        <Icon className="size-3.5 shrink-0 text-medical-primary" />
        {children}
      </h3>
      {trailing}
    </div>
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
  multiline,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs text-medical-mutedText">{label}</span>
      <span
        className={cn(
          "text-sm font-medium text-medical-text sm:text-right",
          multiline && "whitespace-pre-wrap leading-relaxed"
        )}
      >
        {children}
      </span>
    </div>
  );
}

function EvolucionCard({
  evolucion,
  isLatest,
}: {
  evolucion: ReturnType<typeof sortEvolucionesDesc>[number];
  isLatest: boolean;
}) {
  const obs = formatHistoriaField(evolucion.observaciones, "Sin observaciones");
  const med = evolucion.medicacion?.trim();

  return (
    <article
      className={cn(
        "relative rounded-xl border bg-white px-4 py-3.5 shadow-sm",
        isLatest
          ? "border-medical-primary/35 ring-1 ring-medical-primary/15"
          : "border-medical-border/80"
      )}
    >
      {isLatest ? (
        <Badge
          variant="outline"
          className="absolute -top-2.5 right-3 border-medical-primary/30 bg-medical-primary/10 text-[10px] font-semibold uppercase tracking-wide text-medical-primary"
        >
          Más reciente
        </Badge>
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <time className="text-sm font-semibold text-medical-text" dateTime={evolucion.fecha}>
          {formatHistoriaFechaHora(evolucion.fecha)}
        </time>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-medical-text">{obs}</p>
      {med ? (
        <div className="mt-3 flex gap-2 rounded-lg border border-medical-border/60 bg-medical-surface/50 px-3 py-2">
          <Pill className="mt-0.5 size-4 shrink-0 text-medical-primary" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-medical-text">{med}</p>
        </div>
      ) : null}
    </article>
  );
}

export function HistoriaClinicaViewDialog({
  open,
  paciente,
  accessToken,
  onClose,
}: HistoriaClinicaViewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historia, setHistoria] = useState<HistoriaClinicaDto | null>(null);
  const [evolucionOpen, setEvolucionOpen] = useState(false);

  const load = useCallback(async () => {
    if (!paciente || !accessToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await getHistoriaClinicaByPacienteIdWithApi(accessToken, paciente.id);
      setHistoria(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo cargar la historia clínica.";
      setError(msg);
      setHistoria(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, paciente]);

  useEffect(() => {
    if (open && paciente) void load();
    if (!open) {
      setHistoria(null);
      setError("");
      setEvolucionOpen(false);
    }
  }, [open, paciente, load]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading && !evolucionOpen) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, evolucionOpen, onClose]);

  const evoluciones = useMemo(
    () => (historia ? sortEvolucionesDesc(historia.evoluciones) : []),
    [historia]
  );

  if (!open || !paciente || typeof document === "undefined") return null;

  const nombre = getPacienteNombre(paciente);
  const countEvoluciones = evoluciones.length;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="historia-view-title"
      >
        <button
          type="button"
          className="absolute inset-0 cursor-pointer bg-medical-text/60 backdrop-blur-[2px]"
          aria-label="Cerrar"
          onClick={() => !loading && !evolucionOpen && onClose()}
        />
        <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
          <div className="shrink-0 border-b border-medical-border bg-gradient-to-r from-medical-primary to-medical-primary/90 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 id="historia-view-title" className="text-base font-semibold leading-tight">
                    Historia clínica
                  </h2>
                  <p className="truncate text-sm text-white/90">{nombre}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/75">
                    {paciente.codigoQr} · DNI {paciente.numeroDocumento}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 cursor-pointer text-white hover:bg-white/15 hover:text-white"
                onClick={onClose}
                disabled={loading}
              >
                <X className="size-5" />
              </Button>
            </div>

            {historia && !loading && !error ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                  <Stethoscope className="size-3.5" />
                  Alta {formatHistoriaFecha(historia.fechaCreacion)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                  <Activity className="size-3.5" />
                  {countEvoluciones === 0
                    ? "Sin evoluciones"
                    : `${countEvoluciones} evolución${countEvoluciones === 1 ? "" : "es"}`}
                </span>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="size-10 animate-spin text-medical-primary" />
                <p className="text-sm text-medical-mutedText">Cargando historia clínica…</p>
              </div>
            ) : error ? (
              <div className="space-y-4 py-4">
                <p className="flex gap-2 rounded-lg border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
                <Button type="button" variant="outline" className="cursor-pointer" onClick={() => void load()}>
                  Reintentar
                </Button>
              </div>
            ) : historia ? (
              <div className="space-y-6">
                <section>
                  <SectionTitle icon={Stethoscope}>Datos iniciales</SectionTitle>
                  <InfoCard>
                    <InfoRow label="Antecedentes" multiline>
                      {formatHistoriaField(historia.antecedentes)}
                    </InfoRow>
                    <InfoRow label="Diagnóstico inicial" multiline>
                      {formatHistoriaField(historia.diagnosticoInicial)}
                    </InfoRow>
                    <InfoRow label="Medicación" multiline>
                      {formatHistoriaField(historia.medicacion)}
                    </InfoRow>
                    <InfoRow label="Alergias" multiline>
                      {formatHistoriaField(historia.alergias)}
                    </InfoRow>
                    <InfoRow label="Observaciones generales" multiline>
                      {formatHistoriaField(historia.observaciones)}
                    </InfoRow>
                  </InfoCard>
                </section>

                <section>
                  <SectionTitle
                    icon={Activity}
                    trailing={
                      countEvoluciones > 0 ? (
                        <span className="text-[11px] font-medium text-medical-mutedText">
                          {countEvoluciones} registro{countEvoluciones === 1 ? "" : "s"}
                        </span>
                      ) : null
                    }
                  >
                    Evoluciones clínicas
                  </SectionTitle>

                  {countEvoluciones === 0 ? (
                    <div className="rounded-xl border border-dashed border-medical-border bg-medical-surface/30 px-4 py-8 text-center">
                      <Activity className="mx-auto size-8 text-medical-mutedText/50" />
                      <p className="mt-2 text-sm font-medium text-medical-text">
                        Sin evoluciones registradas
                      </p>
                      <p className="mt-1 text-xs text-medical-mutedText">
                        Registrá la primera visita o control desde el botón de abajo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evoluciones.map((ev, index) => (
                        <EvolucionCard key={ev.id} evolucion={ev} isLatest={index === 0} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : null}
          </div>

          {!loading && historia && !error ? (
            <div className="shrink-0 space-y-2 border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
              <Button
                type="button"
                className="w-full cursor-pointer gap-2"
                onClick={() => setEvolucionOpen(true)}
              >
                <ClipboardPlus className="size-4" />
                Agregar evolución clínica
              </Button>
              <Button type="button" variant="outline" className="w-full cursor-pointer" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : !loading ? (
            <div className="border-t border-medical-border bg-medical-surface/80 px-5 py-4 sm:px-6">
              <Button type="button" variant="outline" className="w-full cursor-pointer" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <CreateEvolucionClinicaDialog
        open={evolucionOpen}
        historiaClinicaId={historia?.id ?? null}
        pacienteLabel={nombre}
        accessToken={accessToken}
        onClose={() => setEvolucionOpen(false)}
        onSuccess={() => void load()}
      />
    </>,
    document.body
  );
}
