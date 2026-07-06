"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePlus,
  FileText,
  IdCard,
  Layers,
  MapPin,
  MapPinned,
  MoreHorizontal,
  Pencil,
  Phone,
  QrCode,
  Stethoscope,
  Trash2,
  User,
} from "lucide-react";
import { AssignPacienteServicioDialog } from "@/components/admin/AssignPacienteServicioDialog";
import { CreateHistoriaClinicaDialog } from "@/components/admin/CreateHistoriaClinicaDialog";
import { HistoriaClinicaViewDialog } from "@/components/admin/HistoriaClinicaViewDialog";
import { PacienteDeleteConfirmDialog } from "@/components/admin/PacienteDeleteConfirmDialog";
import { PacienteEditDialog } from "@/components/admin/PacienteEditDialog";
import { PacienteQrDialog } from "@/components/admin/PacienteQrDialog";
import {
  PacienteServicioAccionConfirmDialog,
  type PacienteServicioAccionTarget,
} from "@/components/admin/PacienteServicioAccionConfirmDialog";
import {
  asignacionToQrDto,
  PacienteServicioCard,
} from "@/components/admin/PacienteServicioCard";
import { PacienteServicioEditDialog } from "@/components/admin/PacienteServicioEditDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  deletePacienteServicioWithApi,
  updatePacienteServicioWithApi,
} from "@/lib/api/paciente-servicios";
import {
  deletePacienteWithApi,
  getPacienteByCodigoQrWithApi,
  getPacienteByIdWithApi,
} from "@/lib/api/pacientes";
import type {
  GestionarTramoAdminAccion,
  PacienteDetailDto,
  PacienteDto,
  PacienteServicioAsignadoQrDto,
  PacienteServicioDto,
  PacienteServicioPrestadorResumenDto,
} from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useCachedList } from "@/lib/hooks/use-cached-list";
import { usePacienteServiciosList } from "@/lib/hooks/use-paciente-servicios-list";
import { usePacientesHistoriaStatus } from "@/lib/hooks/use-pacientes-historia-status";
import {
  asignacionPermiteAccion,
  buildFinalizarPacienteServicioBody,
  buildReactivarPacienteServicioBody,
  buildSuspenderPacienteServicioBody,
  canDeletePacienteServicio,
  canPatchPacienteServicio,
  type PacienteServicioAccion,
} from "@/lib/paciente-servicios-access";
import { getPacienteServicioApiErrorMessage } from "@/lib/paciente-servicios-errors";
import {
  formatPacienteFechaNacimiento,
  formatPacienteLocalidad,
  formatPacienteObraSocial,
  formatPacienteSexo,
  getPacienteEdad,
  getPacienteInitials,
  getPacienteNombre,
} from "@/lib/pacientes-display";
import { cn } from "@/lib/utils";

type FichaTab = "resumen" | "servicios" | "historia";

function Field({
  icon: Icon,
  label,
  children,
  mono,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-medical-mutedText">
        {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium wrap-break-word text-medical-text",
          mono && "font-mono"
        )}
      >
        {children}
      </p>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-medical-border/50 overflow-hidden rounded-xl border border-medical-border/70 bg-white sm:grid-cols-2 sm:divide-x sm:*:border-medical-border/50">
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
      <Icon className="size-3.5 shrink-0 text-medical-primary" aria-hidden />
      {children}
    </h3>
  );
}

export default function PacienteFichaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteId = Number(params.id);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tab, setTab] = useState<FichaTab>("resumen");
  const { toasts, showToast, dismiss } = useToast(4000);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrPaciente, setQrPaciente] = useState<PacienteDto | null>(null);
  const [historiaViewOpen, setHistoriaViewOpen] = useState(false);
  const [historiaCreateOpen, setHistoriaCreateOpen] = useState(false);
  const [historiaNonce, setHistoriaNonce] = useState(0);

  const [editingAsignacion, setEditingAsignacion] = useState<PacienteServicioDto | null>(null);
  const [accionTarget, setAccionTarget] = useState<PacienteServicioAccionTarget | null>(null);
  const [accionType, setAccionType] = useState<PacienteServicioAccion | null>(null);
  const [accionLoading, setAccionLoading] = useState(false);
  const [accionError, setAccionError] = useState("");

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const accessToken = session?.accessToken ?? null;
  const userRoles = session?.roles ?? [];
  const canDeletePaciente = userRoles.includes("ADMIN");
  const canManageRelevoTramo = userRoles.includes("ADMIN");
  const canEditAsignacion = userRoles.includes("ADMIN") || userRoles.includes("OPERADOR");
  const canPatchAsignacion = canPatchPacienteServicio(userRoles);
  const canDeleteAsignacion = canDeletePacienteServicio(userRoles);

  const detailQuery = useCachedList<PacienteDetailDto>({
    resource: "paciente-detail",
    accessToken,
    enabled: Boolean(accessToken) && Number.isFinite(pacienteId),
    queryParams: { pacienteId },
    defaultErrorMessage: "No se pudo cargar la ficha del paciente.",
    fetcher: async () => {
      const dto = await getPacienteByIdWithApi(accessToken!, pacienteId);
      return { items: [dto], total: 1 };
    },
  });
  const paciente = detailQuery.items[0] ?? null;

  const [qrServicios, setQrServicios] = useState<PacienteServicioAsignadoQrDto[]>([]);

  const loadQrServicios = useCallback(async () => {
    if (!accessToken || !paciente?.codigoQr) {
      setQrServicios([]);
      return;
    }
    try {
      const dto = await getPacienteByCodigoQrWithApi(accessToken, paciente.codigoQr);
      setQrServicios(dto.servicios ?? []);
    } catch {
      setQrServicios([]);
    }
  }, [accessToken, paciente?.codigoQr]);

  useEffect(() => {
    void loadQrServicios();
  }, [loadQrServicios]);

  const asignacionesQuery = usePacienteServiciosList({
    accessToken,
    enabled: Boolean(accessToken) && Number.isFinite(pacienteId),
    pacienteId: Number.isFinite(pacienteId) ? pacienteId : undefined,
    pageSize: 100,
  });

  const pacienteIds = useMemo(
    () => (Number.isFinite(pacienteId) ? [pacienteId] : []),
    [pacienteId]
  );
  const { hasHistoria, loading: historiaLoading } = usePacientesHistoriaStatus(
    accessToken,
    pacienteIds,
    historiaNonce
  );
  const conHistoria = hasHistoria(pacienteId);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param === "historia" || param === "servicios" || param === "resumen") {
      setTab(param);
    }
  }, [searchParams]);

  const prestadorPorAsignacion = useMemo(() => {
    const map = new Map<number, PacienteServicioPrestadorResumenDto>();
    for (const a of asignacionesQuery.items) {
      if (a.prestador?.id) map.set(a.id, a.prestador);
    }
    return map;
  }, [asignacionesQuery.items]);

  const asignacionPorId = useMemo(() => {
    const map = new Map<number, PacienteServicioDto>();
    for (const a of asignacionesQuery.items) map.set(a.id, a);
    return map;
  }, [asignacionesQuery.items]);

  const serviciosCards = useMemo(() => {
    const qrSource =
      qrServicios.length > 0 ? qrServicios : (paciente?.servicios ?? []);
    const qrById = new Map(qrSource.map((s) => [s.pacienteServicioId, s] as const));
    if (asignacionesQuery.items.length > 0) {
      return asignacionesQuery.items.map((asignacion) => ({
        asignacion,
        servicio: asignacionToQrDto(asignacion, qrById.get(asignacion.id)),
      }));
    }
    return (paciente?.servicios ?? []).map((servicio) => ({
      asignacion: asignacionPorId.get(servicio.pacienteServicioId) ?? null,
      servicio,
    }));
  }, [asignacionesQuery.items, paciente?.servicios, asignacionPorId, qrServicios]);

  const serviciosActivos = serviciosCards.filter(
    ({ servicio }) => servicio.estado === "activa"
  ).length;

  const refreshAsignaciones = useCallback(() => {
    detailQuery.refresh();
    asignacionesQuery.refresh();
    void loadQrServicios();
  }, [detailQuery, asignacionesQuery, loadQrServicios]);

  const handleRelevoTramoChange = useCallback(
    (accion: GestionarTramoAdminAccion) => {
      refreshAsignaciones();
      const msg =
        accion === "iniciar"
          ? "Cobertura iniciada"
          : accion === "finalizar"
            ? "Tramo finalizado con finanzas"
            : "Tramo cancelado sin finanzas";
      showToast(msg, "success");
    },
    [refreshAsignaciones, showToast]
  );

  const viewQr = useCallback(async () => {
    if (!accessToken || !paciente) return;
    setQrOpen(true);
    setQrLoading(true);
    setQrError("");
    setQrPaciente(null);
    try {
      const dto = await getPacienteByCodigoQrWithApi(accessToken, paciente.codigoQr);
      setQrPaciente(dto);
    } catch (err) {
      setQrError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo cargar la credencial QR."
      );
    } finally {
      setQrLoading(false);
    }
  }, [accessToken, paciente]);

  const confirmDelete = useCallback(async () => {
    if (!accessToken || !paciente) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deletePacienteWithApi(accessToken, paciente.id);
      router.push("/admin/pacientes");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar el paciente."
      );
      setDeleteLoading(false);
    }
  }, [accessToken, paciente, router]);

  const openAccion = (
    target: PacienteServicioAccionTarget,
    accion: PacienteServicioAccion
  ) => {
    setAccionError("");
    setAccionTarget(target);
    setAccionType(accion);
  };

  const closeAccion = () => {
    setAccionTarget(null);
    setAccionType(null);
    setAccionError("");
  };

  const confirmAccion = async () => {
    if (!accessToken || !accionTarget || !accionType) return;
    setAccionLoading(true);
    setAccionError("");
    try {
      if (accionType === "eliminar") {
        await deletePacienteServicioWithApi(accessToken, accionTarget.id);
      } else {
        const body =
          accionType === "finalizar"
            ? buildFinalizarPacienteServicioBody()
            : accionType === "suspender"
              ? buildSuspenderPacienteServicioBody()
              : buildReactivarPacienteServicioBody();
        await updatePacienteServicioWithApi(accessToken, accionTarget.id, body);
      }
      closeAccion();
      refreshAsignaciones();
    } catch (err) {
      setAccionError(
        err instanceof ApiError
          ? getPacienteServicioApiErrorMessage(err)
          : "No se pudo completar la acción."
      );
    } finally {
      setAccionLoading(false);
    }
  };

  const tabs: { id: FichaTab; label: string; count?: number; hint?: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "servicios", label: "Servicios", count: serviciosCards.length },
    {
      id: "historia",
      label: "Historia clínica",
      hint: !historiaLoading && !conHistoria ? "Pendiente" : undefined,
    },
  ];

  if (!session) {
    return (
      <div className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <div className="h-40 animate-pulse rounded-2xl border border-medical-border bg-white" />
      </div>
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-4xl">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 cursor-pointer gap-1.5 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
            onClick={() => router.push("/admin/pacientes")}
          >
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>

          {detailQuery.error ? (
            <div className="rounded-2xl border border-medical-border bg-white px-5 py-8">
              <EmptyState
                variant="error"
                icon={User}
                title="No se pudo cargar la ficha"
                description={detailQuery.error}
                action={
                  <Button
                    type="button"
                    onClick={detailQuery.refresh}
                    className="bg-medical-primary hover:bg-medical-primaryDark"
                  >
                    Reintentar
                  </Button>
                }
              />
            </div>
          ) : detailQuery.loading || !paciente ? (
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-2xl border border-medical-border bg-white" />
              <div className="h-64 animate-pulse rounded-2xl border border-medical-border bg-white" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-medical-border bg-white shadow-md ring-medical-border/50">
              {/* Encabezado */}
              <div className="border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-bold text-white ring-1 ring-white/25">
                      {getPacienteInitials(paciente)}
                    </span>
                    <div className="min-w-0">
                      <h1 className="truncate text-lg font-bold leading-tight text-white sm:text-xl">
                        {getPacienteNombre(paciente)}
                      </h1>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                        <span>DNI {paciente.numeroDocumento}</span>
                        <span>
                          {getPacienteEdad(paciente.fechaNacimiento)} años ·{" "}
                          {formatPacienteSexo(paciente.sexo)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs">
                          <QrCode className="size-3.5 shrink-0" aria-hidden />
                          {paciente.codigoQr}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {!historiaLoading ? (
                      conHistoria ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          onClick={() => setHistoriaViewOpen(true)}
                        >
                          <ClipboardList className="size-4" />
                          <span className="hidden sm:inline">Historia clínica</span>
                          <span className="sm:hidden">HC</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="cursor-pointer bg-white text-medical-primary shadow-sm hover:bg-white/90"
                          onClick={() => {
                            setTab("historia");
                            setHistoriaCreateOpen(true);
                          }}
                        >
                          <FilePlus className="size-4" />
                          <span className="hidden sm:inline">Crear historia</span>
                          <span className="sm:hidden">HC</span>
                        </Button>
                      )
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer bg-white text-medical-primary hover:bg-white/90"
                      onClick={() => setAssignOpen(true)}
                    >
                      <Layers className="size-4" />
                      Asignar servicio
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="size-4" />
                      <span className="hidden sm:inline">Editar datos</span>
                      <span className="sm:hidden">Editar</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="cursor-pointer border-white/35 bg-white/10 px-2 text-white hover:bg-white/20 hover:text-white"
                          aria-label="Más acciones"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="z-120 w-56 border-medical-border bg-white p-1 shadow-lg"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
                          onSelect={() => void viewQr()}
                        >
                          <QrCode className="size-4 text-medical-primary" />
                          Ver credencial QR
                        </DropdownMenuItem>
                        {historiaLoading ? null : conHistoria ? (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
                            onSelect={() => setHistoriaViewOpen(true)}
                          >
                            <ClipboardList className="size-4 text-medical-primary" />
                            Ver historia clínica
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
                            onSelect={() => setHistoriaCreateOpen(true)}
                          >
                            <FilePlus className="size-4 text-medical-primary" />
                            Crear historia clínica
                          </DropdownMenuItem>
                        )}
                        {canDeletePaciente ? (
                          <>
                            <DropdownMenuSeparator className="bg-medical-border" />
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 rounded-lg text-medical-danger focus:bg-medical-danger/10 focus:text-medical-danger"
                              onSelect={() => {
                                setDeleteError("");
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                              Eliminar paciente
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div
                className="flex items-center gap-1 border-b border-medical-border bg-medical-surface/40 px-3 sm:px-4"
                role="tablist"
                aria-label="Secciones de la ficha"
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative -mb-px inline-flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                      tab === t.id
                        ? "border-medical-primary text-medical-primaryDark"
                        : "border-transparent text-medical-mutedText hover:text-medical-text"
                    )}
                  >
                    {t.label}
                    {t.hint ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {t.hint}
                      </span>
                    ) : null}
                    {t.count != null && t.count > 0 ? (
                      <span
                        className={cn(
                          "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
                          tab === t.id
                            ? "bg-medical-primary/10 text-medical-primary"
                            : "bg-medical-border/60 text-medical-mutedText"
                        )}
                      >
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Contenido */}
              <div className="bg-medical-surface/30 px-4 py-5 sm:px-6">
                {tab === "resumen" ? (
                  <div className="space-y-5">
                    <section>
                      <SectionTitle icon={IdCard}>Datos personales</SectionTitle>
                      <InfoCard>
                        <Field icon={IdCard} label="Documento" mono>
                          {paciente.numeroDocumento}
                        </Field>
                        <Field icon={CalendarDays} label="Nacimiento">
                          {formatPacienteFechaNacimiento(paciente.fechaNacimiento)} ·{" "}
                          {getPacienteEdad(paciente.fechaNacimiento)} años
                        </Field>
                        <Field icon={Phone} label="Teléfono">
                          {paciente.telefono || "—"}
                        </Field>
                        <Field icon={MapPinned} label="Localidad">
                          {formatPacienteLocalidad(paciente.localidad)}
                        </Field>
                        <div className="sm:col-span-2">
                          <Field icon={MapPin} label="Dirección">
                            {paciente.direccion || "—"}
                          </Field>
                        </div>
                      </InfoCard>
                    </section>

                    <section>
                      <SectionTitle icon={Building2}>Afiliación</SectionTitle>
                      <InfoCard>
                        <Field icon={Building2} label="Obra social">
                          {formatPacienteObraSocial(paciente.obraSocial)}
                        </Field>
                        <Field icon={IdCard} label="Nº afiliado" mono>
                          {paciente.numeroAfiliado || "—"}
                        </Field>
                      </InfoCard>
                    </section>

                    <section>
                      <SectionTitle icon={FileText}>Historia clínica</SectionTitle>
                      {historiaLoading ? (
                        <p className="rounded-xl border border-medical-border/70 bg-white px-4 py-3 text-sm text-medical-mutedText">
                          Verificando si tiene historia clínica…
                        </p>
                      ) : conHistoria ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-medical-success/30 bg-medical-success/10 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2
                              className="size-5 shrink-0 text-medical-success"
                              aria-hidden
                            />
                            <div>
                              <p className="text-sm font-semibold text-medical-success">
                                Historia clínica registrada
                              </p>
                              <p className="text-xs text-medical-success/80">
                                El paciente tiene ficha médica en el sistema.
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="cursor-pointer border-medical-success/40 text-medical-success hover:bg-medical-success/10"
                            onClick={() => setHistoriaViewOpen(true)}
                          >
                            <ClipboardList className="size-4" />
                            Ver historia
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-2.5">
                            <FileText
                              className="mt-0.5 size-5 shrink-0 text-amber-600"
                              aria-hidden
                            />
                            <div>
                              <p className="text-sm font-semibold text-medical-text">
                                Sin historia clínica
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-medical-mutedText">
                                Este paciente no tiene ficha médica. Creala para registrar
                                antecedentes, diagnóstico y evoluciones.
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0 cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                            onClick={() => setHistoriaCreateOpen(true)}
                          >
                            <FilePlus className="size-4" />
                            Crear historia
                          </Button>
                        </div>
                      )}
                    </section>
                  </div>
                ) : null}

                {tab === "servicios" ? (
                  <div className="space-y-3">
                    {serviciosCards.length > 0 ? (
                      <p className="text-sm text-medical-mutedText">
                        {serviciosActivos} activa{serviciosActivos === 1 ? "" : "s"} ·{" "}
                        {serviciosCards.length} en total
                      </p>
                    ) : null}

                    {detailQuery.loading || asignacionesQuery.loading ? (
                      <div className="space-y-3">
                        {[0, 1].map((i) => (
                          <div
                            key={i}
                            className="h-24 animate-pulse rounded-xl border border-medical-border/60 bg-white"
                          />
                        ))}
                      </div>
                    ) : serviciosCards.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-medical-border bg-white px-4 py-8 text-center">
                        <Stethoscope className="size-6 text-medical-mutedText/60" aria-hidden />
                        <p className="text-sm font-medium text-medical-text">
                          Sin servicios asignados
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-1 cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
                          onClick={() => setAssignOpen(true)}
                        >
                          <Layers className="size-4" />
                          Asignar servicio
                        </Button>
                      </div>
                    ) : (
                      serviciosCards.map(({ asignacion, servicio }) => {
                        const prestadorId =
                          asignacion?.prestadorId ?? servicio.prestadorId ?? null;
                        const prestador =
                          asignacion?.prestador ??
                          servicio.prestador ??
                          prestadorPorAsignacion.get(servicio.pacienteServicioId) ??
                          null;
                        const puedeGestionar = canPatchAsignacion || canDeleteAsignacion;
                        return (
                          <PacienteServicioCard
                            key={String(servicio.pacienteServicioId)}
                            servicio={servicio}
                            prestadorId={prestadorId}
                            prestador={prestador}
                            accessToken={accessToken}
                            canManageRelevoTramo={canManageRelevoTramo}
                            onRelevoTramoChange={handleRelevoTramoChange}
                            canPatch={canPatchAsignacion}
                            canDelete={canDeleteAsignacion}
                            onEdit={
                              canEditAsignacion && asignacion
                                ? () => setEditingAsignacion(asignacion)
                                : undefined
                            }
                            onAccion={
                              puedeGestionar
                                ? (accion) => {
                                    if (
                                      !asignacionPermiteAccion(servicio.estado, accion)
                                    )
                                      return;
                                    openAccion(
                                      {
                                        id: servicio.pacienteServicioId,
                                        servicioNombre: servicio.servicioNombre,
                                        estado: servicio.estado,
                                      },
                                      accion
                                    );
                                  }
                                : undefined
                            }
                          />
                        );
                      })
                    )}
                  </div>
                ) : null}

                {tab === "historia" ? (
                  <div className="space-y-3">
                    {historiaLoading ? (
                      <p className="rounded-xl border border-dashed border-medical-border bg-white px-4 py-3 text-sm text-medical-mutedText">
                        Verificando estado…
                      </p>
                    ) : conHistoria ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-medical-success/30 bg-medical-success/10 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2
                            className="size-5 shrink-0 text-medical-success"
                            aria-hidden
                          />
                          <p className="text-sm font-semibold text-medical-success">
                            Historia clínica registrada
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="cursor-pointer border-medical-success/40 text-medical-success hover:bg-medical-success/10"
                          onClick={() => setHistoriaViewOpen(true)}
                        >
                          <ClipboardList className="size-4" />
                          Ver historia clínica
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-medical-border bg-white px-4 py-8 text-center">
                        <FilePlus className="size-6 text-medical-mutedText/60" aria-hidden />
                        <p className="text-sm font-medium text-medical-text">
                          Sin historia clínica
                        </p>
                        <p className="text-xs text-medical-mutedText">
                          Todavía no se registró la historia de este paciente.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-1 cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                          onClick={() => setHistoriaCreateOpen(true)}
                        >
                          <FilePlus className="size-4" />
                          Crear historia clínica
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogos */}
      <PacienteEditDialog
        open={editOpen}
        paciente={paciente}
        accessToken={accessToken}
        onClose={() => setEditOpen(false)}
        onUpdated={(updated) => {
          setEditOpen(false);
          showToast("Paciente actualizado", "success", getPacienteNombre(updated));
          detailQuery.refresh();
        }}
      />

      <PacienteDeleteConfirmDialog
        open={deleteOpen}
        paciente={paciente}
        loading={deleteLoading}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setDeleteError("");
          }
        }}
      />

      <PacienteQrDialog
        open={qrOpen}
        onClose={() => {
          setQrOpen(false);
          setQrPaciente(null);
          setQrError("");
        }}
        paciente={qrPaciente}
        loading={qrLoading}
        error={qrError}
      />

      <HistoriaClinicaViewDialog
        open={historiaViewOpen}
        paciente={paciente}
        accessToken={accessToken}
        onClose={() => setHistoriaViewOpen(false)}
      />

      <CreateHistoriaClinicaDialog
        open={historiaCreateOpen}
        paciente={paciente}
        accessToken={accessToken}
        onClose={() => setHistoriaCreateOpen(false)}
        onSuccess={() => {
          setHistoriaCreateOpen(false);
          setHistoriaNonce((n) => n + 1);
          showToast("Historia clínica registrada", "success");
        }}
      />

      <AssignPacienteServicioDialog
        open={assignOpen}
        paciente={paciente}
        accessToken={accessToken}
        userRoles={userRoles}
        dismissLabel="Cerrar"
        onFinish={() => setAssignOpen(false)}
        onAssigned={(asignacion) => {
          showToast(
            "Servicio asignado",
            "success",
            asignacion.servicio?.nombre ?? "Servicio"
          );
          refreshAsignaciones();
        }}
      />

      <PacienteServicioEditDialog
        open={editingAsignacion != null}
        asignacion={editingAsignacion}
        accessToken={accessToken}
        userRoles={userRoles}
        onClose={() => setEditingAsignacion(null)}
        onUpdated={() => {
          setEditingAsignacion(null);
          refreshAsignaciones();
        }}
      />

      <PacienteServicioAccionConfirmDialog
        open={accionTarget != null && accionType != null}
        target={accionTarget}
        accion={accionType}
        loading={accionLoading}
        error={accionError}
        onConfirm={() => void confirmAccion()}
        onCancel={closeAccion}
      />
    </>
  );
}
