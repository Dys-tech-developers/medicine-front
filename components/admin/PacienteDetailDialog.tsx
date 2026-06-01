"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  ClipboardList,
  FilePlus,
  Eye,
  Pencil,
  Phone,
  QrCode,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPacienteByIdWithApi } from "@/lib/api/pacientes";
import type { PacienteDetailDto, PacienteListItemDto } from "@/lib/api/types";
import {
  formatPacienteFechaNacimiento,
  formatPacienteObraSocial,
  formatPacienteSexo,
  getPacienteEdad,
  getPacienteNombre,
} from "@/lib/pacientes-display";
import {
  ASIGNACION_ESTADO_LABELS,
  FRECUENCIA_TIPO_LABELS,
  MODALIDAD_COBRO_LABELS,
} from "@/lib/paciente-servicios-labels";
import { useCachedList } from "@/lib/hooks/use-cached-list";
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
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs text-medical-mutedText">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-medium break-words text-medical-text",
          mono && "font-mono text-[13px]"
        )}
      >
        {children}
      </span>
    </div>
  );
}

type PacienteDetailDialogProps = {
  open: boolean;
  paciente: PacienteListItemDto | null;
  accessToken?: string | null;
  onClose: () => void;
  hasHistoria: boolean;
  historiaLoading?: boolean;
  onViewQr: () => void;
  onViewHistoria: () => void;
  onCreateHistoria: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
};

export function PacienteDetailDialog({
  open,
  paciente,
  accessToken = null,
  onClose,
  hasHistoria,
  historiaLoading,
  onViewQr,
  onViewHistoria,
  onCreateHistoria,
  onEdit,
  onDelete,
  canDelete = false,
}: PacienteDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const pacienteId = paciente?.id ?? null;
  const detailQuery = useCachedList<PacienteDetailDto>({
    resource: "paciente-detail",
    accessToken,
    enabled: open && Boolean(accessToken) && pacienteId != null,
    queryParams: { pacienteId },
    defaultErrorMessage: "No se pudieron cargar los servicios del paciente.",
    fetcher: async () => {
      const dto = await getPacienteByIdWithApi(accessToken!, pacienteId!);
      return { items: [dto], total: 1 };
    },
  });

  const detail = detailQuery.items[0] ?? null;

  if (!open || !paciente || typeof document === "undefined") return null;

  const edad = getPacienteEdad(paciente.fechaNacimiento);
  const obraSocial = formatPacienteObraSocial(paciente.obraSocial);
  const servicios = detail?.servicios ?? [];
  const serviciosActivosCount = servicios.reduce(
    (acc, s) => acc + (s.estado === "activa" ? 1 : 0),
    0
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paciente-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-medical-text/60 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-medical-border bg-white shadow-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between bg-medical-primary px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <User className="size-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p
                id="paciente-detail-title"
                className="text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Paciente #{paciente.id}
              </p>
              <h2 className="mt-0.5 truncate text-base font-semibold leading-tight text-white">
                {getPacienteNombre(paciente)}
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

        <div className="grid shrink-0 grid-cols-3 divide-x divide-medical-border/60 border-b border-medical-border/60 bg-white">
          <div className="flex flex-col items-center gap-0.5 px-3 py-3">
            <span className="text-lg font-bold text-medical-primary">{edad}</span>
            <span className="text-xs text-medical-mutedText">Años</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
            <span className="text-sm font-semibold leading-tight text-medical-text">
              {formatPacienteSexo(paciente.sexo)}
            </span>
            <span className="text-xs text-medical-mutedText">Sexo</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
            <span className="line-clamp-2 text-sm font-semibold leading-tight text-medical-text">
              {obraSocial}
            </span>
            <span className="text-xs text-medical-mutedText">Obra social</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section>
            <SectionTitle icon={User}>Identidad</SectionTitle>
            <InfoCard>
              <InfoRow label="Documento" mono>
                {paciente.numeroDocumento}
              </InfoRow>
              <InfoRow label="Nacimiento">
                {formatPacienteFechaNacimiento(paciente.fechaNacimiento)}
              </InfoRow>
              <InfoRow label="Código QR" mono>
                {paciente.codigoQr}
              </InfoRow>
            </InfoCard>
          </section>

          <section>
            <SectionTitle icon={Phone}>Contacto</SectionTitle>
            <InfoCard>
              <InfoRow label="Teléfono">{paciente.telefono || "—"}</InfoRow>
              <InfoRow label="Dirección">{paciente.direccion || "—"}</InfoRow>
            </InfoCard>
          </section>

          <section>
            <SectionTitle icon={Building2}>Afiliación</SectionTitle>
            <InfoCard>
              <InfoRow label="Obra social">{obraSocial}</InfoRow>
              <InfoRow label="Nº afiliado" mono>
                {paciente.numeroAfiliado || "—"}
              </InfoRow>
            </InfoCard>
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>Historia clínica</SectionTitle>
            {historiaLoading ? (
              <p className="rounded-xl border border-dashed border-medical-border px-4 py-3 text-sm text-medical-mutedText">
                Verificando estado…
              </p>
            ) : hasHistoria ? (
              <div className="rounded-xl border border-medical-success/30 bg-medical-success/10 px-4 py-3">
                <p className="text-sm font-medium text-medical-success">Historia registrada</p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-medical-border px-4 py-3 text-sm text-medical-mutedText">
                Sin historia clínica
              </p>
            )}
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>
              Servicios
              {detail ? (
                <span className="ml-2 rounded-full bg-medical-primary/10 px-2 py-0.5 text-[10px] font-bold text-medical-primary">
                  {serviciosActivosCount} activa{serviciosActivosCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </SectionTitle>

            {!accessToken ? (
              <p className="rounded-xl border border-dashed border-medical-border px-4 py-3 text-sm text-medical-mutedText">
                Iniciá sesión para ver los servicios asignados.
              </p>
            ) : detailQuery.loading ? (
              <p className="rounded-xl border border-dashed border-medical-border px-4 py-3 text-sm text-medical-mutedText">
                Cargando servicios…
              </p>
            ) : detailQuery.error ? (
              <p className="rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-4 py-3 text-sm text-medical-danger">
                {detailQuery.error}
              </p>
            ) : servicios.length === 0 ? (
              <p className="rounded-xl border border-dashed border-medical-border px-4 py-3 text-sm text-medical-mutedText">
                Sin servicios asignados
              </p>
            ) : (
              <div className="space-y-3">
                {servicios.map((s) => {
                  const modalidad = MODALIDAD_COBRO_LABELS[s.modalidadCobro] ?? s.modalidadCobro;
                  const frecuenciaTipo =
                    FRECUENCIA_TIPO_LABELS[s.frecuenciaTipo] ?? s.frecuenciaTipo;
                  const estadoLabel = ASIGNACION_ESTADO_LABELS[s.estado] ?? s.estado;
                  const frecuencia =
                    s.frecuenciaTipo === "por_horas"
                      ? `${s.frecuenciaValor} h · ${frecuenciaTipo}`
                      : `${s.frecuenciaValor}× ${frecuenciaTipo.toLowerCase()}`;
                  const disponibilidad = s.disponibilidad;
                  const disponibilidadTexto = disponibilidad
                    ? disponibilidad.utilizadoYPermitido?.trim() ||
                      `${disponibilidad.cantidadUtilizada}/${disponibilidad.cantidadPermitida}`
                    : null;
                  const disponibleNum =
                    disponibilidad?.cantidadDisponible != null
                      ? disponibilidad.cantidadDisponible
                      : disponibilidad
                        ? Math.max(
                            0,
                            disponibilidad.cantidadPermitida - disponibilidad.cantidadUtilizada
                          )
                        : null;

                  return (
                    <div
                      key={String(s.pacienteServicioId)}
                      className="overflow-hidden rounded-xl border border-medical-border/70 bg-white"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-medical-border/50 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-medical-text break-words">
                            {s.servicioNombre}
                          </p>
                          <p className="mt-0.5 text-xs text-medical-mutedText">
                            {modalidad} · {frecuencia}
                          </p>
                          {disponibilidadTexto ? (
                            <p className="mt-0.5 text-xs font-semibold text-medical-primaryDark">
                              Disponibilidad: {disponibilidadTexto}
                              {disponibleNum != null ? ` · Restan ${disponibleNum}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-md border border-medical-border bg-medical-surface px-2 py-0.5 text-xs font-semibold text-medical-text">
                          {estadoLabel}
                        </span>
                      </div>

                      <div className="divide-y divide-medical-border/50">
                        {s.fechaInicio ? (
                          <InfoRow label="Inicio">
                            {formatPacienteFechaNacimiento(s.fechaInicio)}
                          </InfoRow>
                        ) : null}
                        <InfoRow label="Fin">
                          {s.fechaFin ? formatPacienteFechaNacimiento(s.fechaFin) : "—"}
                        </InfoRow>
                        <InfoRow label="Asignación" mono>
                          {String(s.pacienteServicioId)}
                        </InfoRow>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="shrink-0 space-y-2 border-t border-medical-border bg-medical-surface/80 px-5 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-2">
            {onEdit ? (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-medical-border/80 hover:bg-medical-secondary"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
            ) : null}
            {canDelete && onDelete ? (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-medical-danger/30 text-medical-danger hover:bg-medical-danger/10"
                onClick={() => {
                  onClose();
                  onDelete();
                }}
              >
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer border-medical-border/80 hover:bg-medical-secondary"
              onClick={() => {
                onClose();
                onViewQr();
              }}
            >
              <QrCode className="size-4" />
              Ver QR
            </Button>
            {historiaLoading ? (
              <Button type="button" variant="outline" disabled>
                Historia…
              </Button>
            ) : hasHistoria ? (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-medical-primary/30 text-medical-primaryDark hover:bg-medical-secondary"
                onClick={() => {
                  onClose();
                  onViewHistoria();
                }}
              >
                <Eye className="size-4" />
                Ver historia clínica
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-medical-border/80 hover:bg-medical-secondary"
                onClick={() => {
                  onClose();
                  onCreateHistoria();
                }}
              >
                <FilePlus className="size-4" />
                Crear historia
              </Button>
            )}
          </div>
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
