"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Eye,
  FilePlus,
  Loader2,
  MapPin,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import { AssignPacienteServicioDialog } from "@/components/admin/AssignPacienteServicioDialog";
import { CreateHistoriaClinicaDialog } from "@/components/admin/CreateHistoriaClinicaDialog";
import { HistoriaClinicaViewDialog } from "@/components/admin/HistoriaClinicaViewDialog";
import { PacienteDeleteConfirmDialog } from "@/components/admin/PacienteDeleteConfirmDialog";
import { PacienteDetailDialog } from "@/components/admin/PacienteDetailDialog";
import { PacienteEditDialog } from "@/components/admin/PacienteEditDialog";
import { PacienteQrDialog } from "@/components/admin/PacienteQrDialog";
import { ApiError } from "@/lib/api/client";
import {
  getPacienteServicioDisponibilidadWithApi,
  listPacienteServiciosWithApi,
} from "@/lib/api/paciente-servicios";
import {
  deletePacienteWithApi,
  getPacienteByCodigoQrWithApi,
} from "@/lib/api/pacientes";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { PacienteDto, PacienteListItemDto, PacienteServicioDto } from "@/lib/api/types";
import { PacientesDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPacienteFechaNacimiento,
  formatPacienteObraSocial,
  formatPacienteSexo,
  getPacienteEdad,
  getPacienteInitials,
  getPacienteNombre,
} from "@/lib/pacientes-display";
import { usePacientesHistoriaStatus } from "@/lib/hooks/use-pacientes-historia-status";
import { cn } from "@/lib/utils";

function TableScrollArea({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export type PacientesDirectoryTableProps = {
  items: PacienteListItemDto[];
  filteredItems: PacienteListItemDto[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onCreate: () => void;
  accessToken: string | null;
  historiaStatusRefreshKey?: number;
  onHistoriaChange?: () => void;
  canDeletePaciente?: boolean;
  onPacienteUpdated?: (paciente: PacienteListItemDto) => void;
  onPacienteDeleted?: (paciente: PacienteListItemDto) => void;
  onServicioAssigned?: (asignacion: PacienteServicioDto) => void;
};

const thClass =
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5 sm:px-5";
const tdClass =
  "px-4 py-4 align-middle first:pl-6 last:pr-5 sm:px-5";

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={thClass}>Paciente</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Documento</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Contacto</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Afiliación</TableHead>
        <TableHead className={cn(thClass, "w-[148px] text-right")}>
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function PacientesDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  onRetry,
  onCreate,
  accessToken,
  historiaStatusRefreshKey = 0,
  onHistoriaChange,
  canDeletePaciente = false,
  onPacienteUpdated,
  onPacienteDeleted,
  onServicioAssigned,
}: PacientesDirectoryTableProps) {
  const [detailTarget, setDetailTarget] = useState<PacienteListItemDto | null>(null);
  const [editTarget, setEditTarget] = useState<PacienteListItemDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PacienteListItemDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrPaciente, setQrPaciente] = useState<PacienteDto | null>(null);
  const [viewHistoriaPaciente, setViewHistoriaPaciente] = useState<PacienteListItemDto | null>(
    null
  );
  const [createHistoriaPaciente, setCreateHistoriaPaciente] =
    useState<PacienteListItemDto | null>(null);
  const [assignServicioPaciente, setAssignServicioPaciente] =
    useState<PacienteListItemDto | null>(null);

  const [serviciosSummary, setServiciosSummary] = useState<
    Record<number, { loading: boolean; lines: string[]; total: number }>
  >({});

  const pacienteIds = useMemo(() => items.map((p) => p.id), [items]);
  const { hasHistoria, loading: historiaStatusLoading } = usePacientesHistoriaStatus(
    accessToken,
    pacienteIds,
    historiaStatusRefreshKey
  );

  useEffect(() => {
    if (!accessToken || items.length === 0) return;
    let cancelled = false;

    const ensure = (id: number) => {
      if (serviciosSummary[id]) return false;
      return true;
    };

    const run = async () => {
      const idsToFetch = items.map((p) => p.id).filter((id) => ensure(id));
      if (idsToFetch.length === 0) return;

      setServiciosSummary((prev) => {
        const next = { ...prev };
        for (const id of idsToFetch) {
          next[id] = { loading: true, lines: [], total: 0 };
        }
        return next;
      });

      for (const id of idsToFetch) {
        try {
          const data = await listPacienteServiciosWithApi(accessToken, {
            page: 1,
            pageSize: 20,
            pacienteId: id,
            estado: "activa",
          });
          const lines = await Promise.all(
            (data.items ?? []).map(async (a) => {
              const nombre = a.servicio?.nombre ?? `Servicio #${a.servicioId}`;
              const isDisponibilidadAplicable =
                a.modalidadCobro === "por_servicio" || a.modalidadCobro === "por_dia";
              if (!isDisponibilidadAplicable) {
                return `${nombre} · sin tope`;
              }
              try {
                const dispRes = await getPacienteServicioDisponibilidadWithApi(accessToken, a.id);
                const disp = dispRes.disponibilidad;
                const usado = Number(disp.cantidadUtilizada ?? 0);
                const permitido = Number(disp.cantidadPermitida ?? 0);
                const texto =
                  disp.utilizadoYPermitido?.trim() ||
                  `${Number.isFinite(usado) ? usado : 0}/${Number.isFinite(permitido) ? permitido : 0}`;
                return `${nombre} · ${texto}`;
              } catch {
                return `${nombre} · disp. n/d`;
              }
            })
          );
          if (cancelled) return;
          setServiciosSummary((prev) => ({
            ...prev,
            [id]: { loading: false, lines, total: data.total ?? lines.length },
          }));
        } catch {
          if (cancelled) return;
          setServiciosSummary((prev) => ({
            ...prev,
            [id]: { loading: false, lines: [], total: 0 },
          }));
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, items]);

  const confirmDeletePaciente = useCallback(async () => {
    if (!deleteTarget || !accessToken) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deletePacienteWithApi(accessToken, deleteTarget.id);
      const removed = deleteTarget;
      setDeleteTarget(null);
      if (detailTarget?.id === removed.id) setDetailTarget(null);
      onPacienteDeleted?.(removed);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar el paciente.";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  }, [accessToken, deleteTarget, detailTarget?.id, onPacienteDeleted]);

  const closeQrDialog = useCallback(() => {
    setQrOpen(false);
    setQrPaciente(null);
    setQrError("");
  }, []);

  const viewPacienteQr = useCallback(
    async (codigoQr: string) => {
      if (!accessToken) {
        setQrError("Sesión no válida.");
        setQrOpen(true);
        return;
      }

      setQrOpen(true);
      setQrLoading(true);
      setQrError("");
      setQrPaciente(null);

      try {
        const paciente = await getPacienteByCodigoQrWithApi(accessToken, codigoQr);
        setQrPaciente(paciente);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? getApiErrorMessages(err).join(" ")
            : "No se pudo cargar la credencial QR.";
        setQrError(msg);
      } finally {
        setQrLoading(false);
      }
    },
    [accessToken]
  );

  if (loading) {
    return (
      <TableScrollArea>
        <Table className="min-w-[760px]">
          <TableHeaderRow />
          <PacientesDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
        </Table>
      </TableScrollArea>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={User}
          title="No se pudieron cargar los pacientes"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="bg-medical-primary hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          icon={User}
          title="No hay pacientes registrados"
          description="Todavía no hay registros. Podés dar de alta el primero desde el formulario."
          action={
            <Button type="button" onClick={onCreate} className="bg-medical-primary hover:bg-medical-primaryDark">
              <UserPlus className="size-4" />
              Dar de alta
            </Button>
          }
        />
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          description="Probá con otro término o navegá a otra página del listado."
        />
      </div>
    );
  }

  return (
    <>
      <PacienteDetailDialog
        open={detailTarget != null}
        paciente={detailTarget}
        accessToken={accessToken}
        onClose={() => setDetailTarget(null)}
        hasHistoria={detailTarget ? hasHistoria(detailTarget.id) : false}
        historiaLoading={historiaStatusLoading}
        onViewQr={() => {
          if (detailTarget) void viewPacienteQr(detailTarget.codigoQr);
        }}
        onViewHistoria={() => {
          if (detailTarget) setViewHistoriaPaciente(detailTarget);
        }}
        onCreateHistoria={() => {
          if (detailTarget) setCreateHistoriaPaciente(detailTarget);
        }}
        onEdit={() => {
          if (detailTarget) setEditTarget(detailTarget);
        }}
        onDelete={() => {
          if (detailTarget) {
            setDeleteError("");
            setDeleteTarget(detailTarget);
          }
        }}
        canDelete={canDeletePaciente}
      />

      <PacienteEditDialog
        open={editTarget != null}
        paciente={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={(paciente) => {
          setEditTarget(null);
          if (detailTarget?.id === paciente.id) setDetailTarget(paciente);
          onPacienteUpdated?.(paciente);
        }}
      />

      <PacienteDeleteConfirmDialog
        open={deleteTarget != null}
        paciente={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={() => void confirmDeletePaciente()}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      />

      <TableScrollArea>
        <Table className="min-w-[760px]">
          <TableHeaderRow />
          <TableBody>
            {filteredItems.map((paciente, index) => {
              const nombre = getPacienteNombre(paciente);
              const edad = getPacienteEdad(paciente.fechaNacimiento);
              const obraSocialLabel = formatPacienteObraSocial(paciente.obraSocial);
              const obraSocialNombre =
                obraSocialLabel !== "—" ? obraSocialLabel : null;
              const conHistoria = hasHistoria(paciente.id);

              return (
                <TableRow
                  key={paciente.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-medical-secondary/50",
                    index % 2 === 1 && "bg-medical-secondary/20"
                  )}
                  onClick={() => setDetailTarget(paciente)}
                >
                  {/* Paciente */}
                  <TableCell className={tdClass}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-xs font-bold text-medical-primary ring-1 ring-medical-primary/12">
                        {getPacienteInitials(paciente)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-medical-text">{nombre}</p>
                        <p className="text-xs text-medical-mutedText">
                          {edad} años · {formatPacienteSexo(paciente.sexo)}
                        </p>
                        {(() => {
                          const summary = serviciosSummary[paciente.id];
                          if (!accessToken) return null;
                          if (!summary || summary.loading) {
                            return (
                              <p className="mt-1 text-xs text-medical-mutedText">
                                Servicios: cargando…
                              </p>
                            );
                          }
                          if (summary.total <= 0) {
                            return (
                              <p className="mt-1 text-xs text-medical-mutedText">
                                Servicios: —
                              </p>
                            );
                          }
                          const shown = summary.lines.slice(0, 2);
                          const rest = Math.max(0, summary.total - shown.length);
                          const label =
                            shown.join(" · ") + (rest > 0 ? ` · +${rest}` : "");
                          return (
                            <p className="mt-1 text-xs text-medical-mutedText line-clamp-1">
                              Disponibilidad: {label}
                            </p>
                          );
                        })()}
                        {obraSocialNombre ? (
                          <span className="mt-1.5 inline-flex max-w-full items-center rounded-md border border-medical-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-medical-text lg:hidden">
                            <span className="truncate">{obraSocialNombre}</span>
                          </span>
                        ) : null}
                        <p className="mt-1 text-xs text-medical-mutedText md:hidden">
                          DNI {paciente.numeroDocumento}
                        </p>
                        {paciente.telefono ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-medical-mutedText lg:hidden">
                            <Phone className="size-3 shrink-0" />
                            {paciente.telefono}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* Documento */}
                  <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                    <p className="font-medium text-medical-text">{paciente.numeroDocumento}</p>
                    <p className="mt-0.5 text-xs text-medical-mutedText">
                      Nac. {formatPacienteFechaNacimiento(paciente.fechaNacimiento)}
                    </p>
                  </TableCell>

                  {/* Contacto */}
                  <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                    {paciente.telefono ? (
                      <p className="flex items-center gap-1 font-medium text-medical-text">
                        <Phone className="size-3 shrink-0 text-medical-mutedText" />
                        {paciente.telefono}
                      </p>
                    ) : (
                      <span className="text-sm text-medical-mutedText">—</span>
                    )}
                    {paciente.direccion ? (
                      <p className="mt-1 flex items-start gap-1 text-xs text-medical-mutedText">
                        <MapPin className="mt-0.5 size-3 shrink-0" />
                        <span className="line-clamp-2">{paciente.direccion}</span>
                      </p>
                    ) : null}
                  </TableCell>

                  {/* Afiliación */}
                  <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                    <p className="text-sm font-medium text-medical-text">
                      {obraSocialNombre ?? "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-medical-mutedText">
                      {paciente.numeroAfiliado || "Sin nº afiliado"}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void viewPacienteQr(paciente.codigoQr);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-medical-primary/20 bg-medical-secondary px-2 py-0.5 text-xs font-semibold text-medical-primaryDark transition-colors hover:border-medical-primary/40 md:hidden"
                    >
                      <QrCode className="size-3 shrink-0" />
                      {paciente.codigoQr}
                    </button>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className={cn(tdClass, "text-right")}>
                    <div
                      className="flex items-center justify-end gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label="Asignar servicio al paciente"
                        title="Asignar servicio"
                        className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                        onClick={() => setAssignServicioPaciente(paciente)}
                      >
                        <Plus className="size-4" />
                      </button>

                      <button
                        type="button"
                        aria-label="Ver credencial QR"
                        title="Ver QR"
                        className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                        onClick={() => void viewPacienteQr(paciente.codigoQr)}
                      >
                        <QrCode className="size-4" />
                      </button>

                      {historiaStatusLoading ? (
                        <span className="rounded-lg p-1.5 text-medical-mutedText">
                          <Loader2 className="size-4 animate-spin" />
                        </span>
                      ) : conHistoria ? (
                        <button
                          type="button"
                          aria-label="Ver historia clínica"
                          title="Ver historia clínica"
                          className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                          onClick={() => setViewHistoriaPaciente(paciente)}
                        >
                          <ClipboardList className="size-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="Crear historia clínica"
                          title="Crear historia"
                          className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                          onClick={() => setCreateHistoriaPaciente(paciente)}
                        >
                          <FilePlus className="size-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        aria-label="Ver detalles del paciente"
                        title="Ver detalles"
                        className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                        onClick={() => setDetailTarget(paciente)}
                      >
                        <Eye className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableScrollArea>

      <PacienteQrDialog
        open={qrOpen}
        onClose={closeQrDialog}
        paciente={qrPaciente}
        loading={qrLoading}
        error={qrError}
      />

      <HistoriaClinicaViewDialog
        open={viewHistoriaPaciente != null}
        paciente={viewHistoriaPaciente}
        accessToken={accessToken}
        onClose={() => setViewHistoriaPaciente(null)}
      />

      <CreateHistoriaClinicaDialog
        open={createHistoriaPaciente != null}
        paciente={createHistoriaPaciente}
        accessToken={accessToken}
        onClose={() => setCreateHistoriaPaciente(null)}
        onSuccess={() => {
          setCreateHistoriaPaciente(null);
          onHistoriaChange?.();
        }}
      />

      <AssignPacienteServicioDialog
        open={assignServicioPaciente != null}
        paciente={assignServicioPaciente}
        accessToken={accessToken}
        dismissLabel="Cerrar"
        onFinish={() => setAssignServicioPaciente(null)}
        onAssigned={(asignacion) => {
          setServiciosSummary((prev) => {
            const id = asignacion.pacienteId;
            const current = prev[id] ?? { loading: false, lines: [], total: 0 };
            const name = asignacion.servicio?.nombre ?? `Servicio #${asignacion.servicioId}`;
            const nextLines = current.lines.includes(name)
              ? current.lines
              : [`${name} · disp. n/d`, ...current.lines].slice(0, 6);
            return {
              ...prev,
              [id]: {
                loading: false,
                lines: nextLines,
                total: Math.max(current.total + 1, nextLines.length),
              },
            };
          });
          onServicioAssigned?.(asignacion);
        }}
      />
    </>
  );
}
