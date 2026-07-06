"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Eye,
  FilePlus,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { AssignPacienteServicioDialog } from "@/components/admin/AssignPacienteServicioDialog";
import { CreateHistoriaClinicaDialog } from "@/components/admin/CreateHistoriaClinicaDialog";
import { HistoriaClinicaViewDialog } from "@/components/admin/HistoriaClinicaViewDialog";
import { PacienteDeleteConfirmDialog } from "@/components/admin/PacienteDeleteConfirmDialog";
import { PacienteEditDialog } from "@/components/admin/PacienteEditDialog";
import { PacienteQrDialog } from "@/components/admin/PacienteQrDialog";
import { ApiError } from "@/lib/api/client";
import {
  deletePacienteWithApi,
  getPacienteByCodigoQrWithApi,
  getPacienteByIdWithApi,
} from "@/lib/api/pacientes";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type {
  PacienteDto,
  PacienteListItemDto,
  PacienteServicioDto,
} from "@/lib/api/types";
import { PacientesDirectoryTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPacienteLocalidad,
  formatPacienteObraSocial,
  getPacienteEdad,
  getPacienteInitials,
  getPacienteNombre,
} from "@/lib/pacientes-display";
import { usePacientesHistoriaStatus, type PacienteHistoriaStatus } from "@/lib/hooks/use-pacientes-historia-status";
import { cn } from "@/lib/utils";

function PacientesTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[760px]">{children}</Table>;
}

type ServiciosResumen = { loading: boolean; nombres: string[]; total: number };

async function fetchServiciosResumenPaciente(
  accessToken: string,
  pacienteId: number
): Promise<{ nombres: string[]; total: number }> {
  const detail = await getPacienteByIdWithApi(accessToken, pacienteId);
  const activos = (detail.servicios ?? []).filter((s) => s.estado === "activa");
  return {
    nombres: activos.map((s) => s.servicioNombre),
    total: activos.length,
  };
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
  userRoles?: string[];
};

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

type PacienteRowHandlers = {
  onAssignServicio: (paciente: PacienteListItemDto) => void;
  onViewQr: (paciente: PacienteListItemDto) => void;
  onViewHistoria: (paciente: PacienteListItemDto) => void;
  onCreateHistoria: (paciente: PacienteListItemDto) => void;
  onEdit: (paciente: PacienteListItemDto) => void;
  onDelete?: (paciente: PacienteListItemDto) => void;
  getHistoriaStatus: (id: number) => PacienteHistoriaStatus | undefined;
  historiaLoading: boolean;
};

function PacienteRowActionsMenu({
  paciente,
  navigateToFicha,
  onAssignServicio,
  onViewQr,
  onViewHistoria,
  onCreateHistoria,
  onEdit,
  onDelete,
  getHistoriaStatus,
  historiaLoading,
  runMenuAction,
}: {
  paciente: PacienteListItemDto;
  navigateToFicha: (paciente: PacienteListItemDto) => void;
  runMenuAction: (action: () => void) => void;
} & PacienteRowHandlers) {
  const nombre = getPacienteNombre(paciente);
  const historiaStatus = getHistoriaStatus(paciente.id);
  const conHistoria = historiaStatus === "yes";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 cursor-pointer p-0 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones de {nombre}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-120 w-56 border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          {nombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => navigateToFicha(paciente)}
        >
          <Eye className="size-4 text-medical-primary" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Ver datos del paciente</span>
            <span className="text-[11px] font-normal text-medical-mutedText">
              Perfil, servicios y contacto
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onAssignServicio(paciente))}
        >
          <Layers className="size-4 text-medical-primary" />
          Asignar servicio
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onViewQr(paciente))}
        >
          <QrCode className="size-4 text-medical-primary" />
          Ver credencial QR
        </DropdownMenuItem>
        {historiaLoading ? (
          <DropdownMenuItem disabled className="gap-2 rounded-lg">
            <Loader2 className="size-4 animate-spin" />
            Cargando historia…
          </DropdownMenuItem>
        ) : conHistoria ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
            onSelect={() => runMenuAction(() => onViewHistoria(paciente))}
          >
            <ClipboardList className="size-4 text-medical-primary" />
            Ver historia clínica
          </DropdownMenuItem>
        ) : historiaStatus === "error" ? (
          <DropdownMenuItem disabled className="gap-2 rounded-lg text-medical-mutedText">
            No se pudo verificar la historia
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
            onSelect={() => runMenuAction(() => onCreateHistoria(paciente))}
          >
            <FilePlus className="size-4 text-amber-600" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>Crear historia clínica</span>
              <span className="text-[11px] font-normal text-medical-mutedText">
                Este paciente no tiene ficha médica registrada
              </span>
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => runMenuAction(() => onEdit(paciente))}
        >
          <Pencil className="size-4 text-medical-primary" />
          Editar datos
        </DropdownMenuItem>
        {onDelete ? (
          <>
            <DropdownMenuSeparator className="bg-medical-border" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-lg text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
              onSelect={() =>
                runMenuAction(() => {
                  onDelete(paciente);
                })
              }
            >
              <Trash2 className="size-4" />
              Eliminar paciente
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ServiciosCell({ summary }: { summary?: ServiciosResumen }) {
  if (!summary || summary.loading) {
    return (
      <div className="space-y-1.5">
        <div className="h-3.5 w-16 animate-pulse rounded bg-medical-border/50" />
        <div className="h-3 w-28 animate-pulse rounded bg-medical-border/40" />
      </div>
    );
  }

  if (summary.total === 0) {
    return <span className="text-xs text-medical-mutedText">Sin servicios</span>;
  }

  const nombres = summary.nombres.join(", ");

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium leading-snug text-medical-primaryDark">
        {summary.total} activo{summary.total === 1 ? "" : "s"}
      </p>
      <p className="max-w-52 truncate text-xs text-muted-foreground" title={nombres}>
        {nombres}
      </p>
    </div>
  );
}

function HistoriaCell({
  paciente,
  loading,
  status,
  onViewHistoria,
  onCreateHistoria,
}: {
  paciente: PacienteListItemDto;
  loading: boolean;
  status?: PacienteHistoriaStatus;
  onViewHistoria: (paciente: PacienteListItemDto) => void;
  onCreateHistoria: (paciente: PacienteListItemDto) => void;
}) {
  if (loading) {
    return <div className="h-3.5 w-12 animate-pulse rounded bg-medical-border/50" />;
  }

  if (status === "error") {
    return (
      <span className="text-xs font-medium text-medical-mutedText" title="No se pudo verificar">
        —
      </span>
    );
  }

  const conHistoria = status === "yes";
  const label = conHistoria ? "HC" : "Sin HC";
  const title = conHistoria
    ? "Tiene historia clínica — clic para ver"
    : "Sin historia clínica — clic para crear";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (conHistoria) onViewHistoria(paciente);
        else onCreateHistoria(paciente);
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-medical-secondary/80",
        conHistoria ? "text-medical-success" : "text-medical-mutedText"
      )}
      title={title}
      aria-label={title}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          conHistoria ? "bg-medical-success" : "bg-medical-border"
        )}
        aria-hidden
      />
      {label}
    </button>
  );
}

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        <TableHead className={thClass}>Paciente</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>Servicios</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Contacto</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Afiliación</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Historia</TableHead>
        <TableHead className={cn(thClass, "w-14 text-right")}>
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
  userRoles = [],
}: PacientesDirectoryTableProps) {
  const router = useRouter();
  const blockNavigationRef = useRef(false);
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
    Record<number, ServiciosResumen>
  >({});

  const pacienteIds = useMemo(() => items.map((p) => p.id), [items]);
  const pacienteIdsKey = pacienteIds.join(",");
  const { getHistoriaStatus, loading: historiaStatusLoading } = usePacientesHistoriaStatus(
    accessToken,
    pacienteIds,
    historiaStatusRefreshKey
  );

  const navigateToFicha = useCallback(
    (paciente: PacienteListItemDto, options?: { tab?: "historia" }) => {
      const base = `/admin/pacientes/${paciente.id}`;
      router.push(options?.tab ? `${base}?tab=${options.tab}` : base);
    },
    [router]
  );

  const openFichaFromRow = useCallback(
    (paciente: PacienteListItemDto) => {
      if (blockNavigationRef.current) {
        blockNavigationRef.current = false;
        return;
      }
      navigateToFicha(paciente);
    },
    [navigateToFicha]
  );

  const runMenuAction = useCallback((action: () => void) => {
    blockNavigationRef.current = true;
    action();
  }, []);

  useEffect(() => {
    if (!accessToken || pacienteIds.length === 0) {
      setServiciosSummary({});
      return;
    }

    let cancelled = false;

    setServiciosSummary((prev) => {
      const next: Record<number, ServiciosResumen> = {};
      for (const id of pacienteIds) {
        const cached = prev[id];
        if (cached && !cached.loading) {
          next[id] = cached;
        } else {
          next[id] = { loading: true, nombres: [], total: 0 };
        }
      }
      return next;
    });

    void Promise.all(
      pacienteIds.map(async (id) => {
        try {
          const { nombres, total } = await fetchServiciosResumenPaciente(accessToken, id);
          if (cancelled) return;
          setServiciosSummary((prev) => ({
            ...prev,
            [id]: { loading: false, nombres, total },
          }));
        } catch {
          if (cancelled) return;
          setServiciosSummary((prev) => ({
            ...prev,
            [id]: { loading: false, nombres: [], total: 0 },
          }));
        }
      })
    );

    return () => {
      cancelled = true;
    };
  }, [accessToken, pacienteIdsKey, pacienteIds]);

  const confirmDeletePaciente = useCallback(async () => {
    if (!deleteTarget || !accessToken) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deletePacienteWithApi(accessToken, deleteTarget.id);
      const removed = deleteTarget;
      setDeleteTarget(null);
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
  }, [accessToken, deleteTarget, onPacienteDeleted]);

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
      <PacientesTable>
        <TableHeaderRow />
        <PacientesDirectoryTableSkeleton rows={5} cellClassName={tdClass} />
      </PacientesTable>
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

  const rowHandlers: PacienteRowHandlers = {
    onAssignServicio: setAssignServicioPaciente,
    onViewQr: (p) => void viewPacienteQr(p.codigoQr),
    onViewHistoria: setViewHistoriaPaciente,
    onCreateHistoria: setCreateHistoriaPaciente,
    onEdit: setEditTarget,
    onDelete: canDeletePaciente
      ? (p) => {
          setDeleteError("");
          setDeleteTarget(p);
        }
      : undefined,
    getHistoriaStatus,
    historiaLoading: historiaStatusLoading,
  };

  return (
    <>
      <PacienteEditDialog
        open={editTarget != null}
        paciente={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={(paciente) => {
          setEditTarget(null);
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

      <PacientesTable>
        <TableHeaderRow />
        <TableBody>
          {filteredItems.map((paciente) => {
            const nombre = getPacienteNombre(paciente);
            const edad = getPacienteEdad(paciente.fechaNacimiento);
            const obraSocialLabel = formatPacienteObraSocial(paciente.obraSocial);
            const obraSocialNombre = obraSocialLabel !== "—" ? obraSocialLabel : null;
            const localidadLabel = formatPacienteLocalidad(paciente.localidad);
            const localidadNombre = localidadLabel !== "—" ? localidadLabel : null;
            const contactoSecundario = [localidadNombre, paciente.direccion]
              .filter(Boolean)
              .join(" · ");

            return (
              <TableRow
                key={paciente.id}
                className="group transition-colors hover:bg-medical-secondary/30"
              >
                {/* Paciente */}
                <TableCell
                  className={cn(tdClass, "cursor-pointer")}
                  onClick={() => openFichaFromRow(paciente)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-semibold text-medical-primary ring-1 ring-medical-border transition group-hover:ring-medical-primary/40">
                      {getPacienteInitials(paciente)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-snug text-foreground">
                        {nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DNI {paciente.numeroDocumento} · {edad} años
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Servicios */}
                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer sm:table-cell")}
                  onClick={() => openFichaFromRow(paciente)}
                >
                  {accessToken ? (
                    <ServiciosCell summary={serviciosSummary[paciente.id]} />
                  ) : (
                    <span className="text-xs text-medical-mutedText">—</span>
                  )}
                </TableCell>

                {/* Contacto */}
                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer lg:table-cell")}
                  onClick={() => openFichaFromRow(paciente)}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {paciente.telefono || "—"}
                    </p>
                    {contactoSecundario ? (
                      <p
                        className="max-w-52 truncate text-xs text-muted-foreground"
                        title={contactoSecundario}
                      >
                        {contactoSecundario}
                      </p>
                    ) : null}
                  </div>
                </TableCell>

                {/* Afiliación */}
                <TableCell
                  className={cn(tdClass, "hidden cursor-pointer md:table-cell")}
                  onClick={() => openFichaFromRow(paciente)}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p
                      className="max-w-48 truncate text-sm font-medium leading-snug text-foreground"
                      title={obraSocialNombre ?? undefined}
                    >
                      {obraSocialNombre ?? "—"}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {paciente.numeroAfiliado || "Sin nº afiliado"}
                    </p>
                  </div>
                </TableCell>

                {/* Historia */}
                <TableCell
                  className={cn(tdClass, "hidden lg:table-cell")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <HistoriaCell
                    paciente={paciente}
                    loading={historiaStatusLoading}
                    status={getHistoriaStatus(paciente.id)}
                    onViewHistoria={setViewHistoriaPaciente}
                    onCreateHistoria={setCreateHistoriaPaciente}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell
                  className={cn(tdClass, "text-right")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                  onPointerDown={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <div className="flex min-h-9 items-center justify-end">
                    <PacienteRowActionsMenu
                      paciente={paciente}
                      navigateToFicha={navigateToFicha}
                      runMenuAction={runMenuAction}
                      {...rowHandlers}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </PacientesTable>

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
        onCreateHistoria={() => {
          const target = viewHistoriaPaciente;
          setViewHistoriaPaciente(null);
          if (target) setCreateHistoriaPaciente(target);
        }}
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
        userRoles={userRoles}
        dismissLabel="Cerrar"
        onFinish={() => setAssignServicioPaciente(null)}
        onAssigned={(asignacion) => {
          const id = asignacion.pacienteId;
          if (accessToken) {
            setServiciosSummary((prev) => ({
              ...prev,
              [id]: {
                loading: true,
                nombres: prev[id]?.nombres ?? [],
                total: prev[id]?.total ?? 0,
              },
            }));
            void fetchServiciosResumenPaciente(accessToken, id)
              .then((res) => {
                setServiciosSummary((prev) => ({
                  ...prev,
                  [id]: { loading: false, ...res },
                }));
              })
              .catch(() => {
                setServiciosSummary((prev) => ({
                  ...prev,
                  [id]: { loading: false, nombres: [], total: 0 },
                }));
              });
          }
          onServicioAssigned?.(asignacion);
        }}
      />
    </>
  );
}
