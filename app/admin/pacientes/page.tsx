"use client";

import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Search, Upload, User, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignPacienteServicioDialog } from "@/components/admin/AssignPacienteServicioDialog";
import { CreateHistoriaClinicaDialog } from "@/components/admin/CreateHistoriaClinicaDialog";
import { CreatePacienteForm } from "@/components/admin/CreatePacienteForm";
import { PacienteCargaMasivaDialog } from "@/components/admin/PacienteCargaMasivaDialog";
import { PacienteHistoriaClinicaPromptDialog } from "@/components/admin/PacienteHistoriaClinicaPromptDialog";
import { PacienteQrLookupPanel } from "@/components/admin/PacienteQrLookupPanel";
import { PacientesDirectoryFilters } from "@/components/admin/PacientesDirectoryFilters";
import { PacientesDirectoryTable } from "@/components/admin/PacientesDirectoryTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import type { HistoriaClinicaDto, PacienteDto, PacienteServicioDto } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import {
  downloadPacientesCargaMasivaPlantillaWithApi,
  triggerBrowserFileDownload,
  type CargaMasivaPacientesResultDto,
} from "@/lib/api/carga-masiva-pacientes";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { usePacientesDirectoryFilterOptions } from "@/lib/hooks/use-pacientes-directory-filter-options";
import { usePacientesList } from "@/lib/hooks/use-pacientes-list";
import {
  DEFAULT_PACIENTES_DIRECTORY_FILTERS,
  hasActivePacientesDirectoryFilters,
  matchesPacienteDirectoryFilters,
  type PacientesDirectoryFiltersState,
} from "@/lib/pacientes-directory-filters";
import {
  exportPacientesWithFilters,
  pacientesExportHasActiveFilters,
} from "@/lib/pacientes-export";
import { getPacienteNombre, matchesPacienteSearch } from "@/lib/pacientes-display";

type PageView = "lista" | "formulario";

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

const headerOutlineButtonClass =
  "cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white";

export default function AdminPacientesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<PageView>("lista");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryFilters, setDirectoryFilters] = useState<PacientesDirectoryFiltersState>(
    DEFAULT_PACIENTES_DIRECTORY_FILTERS
  );
  const [postCreatePaciente, setPostCreatePaciente] = useState<PacienteDto | null>(null);
  const [showHistoriaForm, setShowHistoriaForm] = useState(false);
  const [showServicioForm, setShowServicioForm] = useState(false);
  const [historiaStatusKey, setHistoriaStatusKey] = useState(0);
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false);
  const [downloadingPlantilla, setDownloadingPlantilla] = useState(false);
  const [exportingList, setExportingList] = useState(false);
  const { toasts, showToast, dismiss } = useToast(4000);

  const bumpHistoriaStatus = useCallback(() => {
    setHistoriaStatusKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
    setReady(true);
  }, []);

  const { items, total, loading, error, refresh } = usePacientesList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page,
    pageSize,
  });

  const { obrasSociales, loadingOptions, optionsError } = usePacientesDirectoryFilterOptions(
    session?.accessToken
  );

  const openServicioStep = useCallback(() => {
    setShowHistoriaForm(false);
    setShowServicioForm(true);
  }, []);

  const finishPostCreateFlow = useCallback(() => {
    setPostCreatePaciente(null);
    setShowHistoriaForm(false);
    setShowServicioForm(false);
    setPage(1);
    setSearchQuery("");
    setDirectoryFilters(DEFAULT_PACIENTES_DIRECTORY_FILTERS);
    refresh();
    bumpHistoriaStatus();
    setView("lista");
  }, [refresh, bumpHistoriaStatus]);

  const handlePacienteCreated = useCallback(
    (paciente: PacienteDto) => {
      showToast(
        "Paciente creado con éxito",
        "success",
        `${getPacienteNombre(paciente)} · ${paciente.codigoQr}`
      );
      setView("lista");
      setPage(1);
      setSearchQuery("");
      setDirectoryFilters(DEFAULT_PACIENTES_DIRECTORY_FILTERS);
      refresh();
      setPostCreatePaciente(paciente);
    },
    [showToast, refresh]
  );

  const handleHistoriaCreated = useCallback(
    (historia: HistoriaClinicaDto) => {
      showToast(
        "Historia clínica registrada",
        "success",
        `${historia.paciente.nombre} ${historia.paciente.apellido}`.trim()
      );
      bumpHistoriaStatus();
      refresh();
      openServicioStep();
    },
    [openServicioStep, showToast, bumpHistoriaStatus, refresh]
  );

  const handleServicioAssigned = useCallback(
    (asignacion: PacienteServicioDto) => {
      const servicioNombre = asignacion.servicio?.nombre ?? "Servicio";
      showToast("Servicio asignado", "success", servicioNombre);
    },
    [showToast]
  );

  const isListView = view === "lista";

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (row) =>
          matchesPacienteDirectoryFilters(row, directoryFilters) &&
          matchesPacienteSearch(row, searchQuery)
      ),
    [items, directoryFilters, searchQuery]
  );

  const hasDirectoryFilters = hasActivePacientesDirectoryFilters(directoryFilters);
  const isFiltering = hasDirectoryFilters || searchQuery.trim().length > 0;

  const paginationHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (isFiltering) {
      return filteredItems.length === 0
        ? "Sin coincidencias en esta página."
        : `${filteredItems.length} resultado${filteredItems.length === 1 ? "" : "s"} en esta página`;
    }
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [loading, isFiltering, filteredItems.length, total, rangeStart, rangeEnd]);

  const handlePageSizeChange = (next: string) => {
    setPageSize(Number(next));
    setPage(1);
  };

  const handleDownloadPlantilla = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }
    setDownloadingPlantilla(true);
    try {
      const { blob, filename } = await downloadPacientesCargaMasivaPlantillaWithApi(token);
      triggerBrowserFileDownload(blob, filename);
      showToast("Planilla descargada", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo descargar la planilla.";
      showToast(msg, "error");
    } finally {
      setDownloadingPlantilla(false);
    }
  }, [session?.accessToken, showToast]);

  const handleCargaMasivaSuccess = useCallback(
    (result: CargaMasivaPacientesResultDto) => {
      const errores = result.errores.length;
      if (result.creados > 0 && errores === 0) {
        showToast(
          "Carga masiva completada",
          "success",
          `${result.creados} paciente${result.creados === 1 ? "" : "s"} de ${result.totalFilas} fila${result.totalFilas === 1 ? "" : "s"}`
        );
      } else if (result.creados > 0 && errores > 0) {
        showToast(
          "Carga parcial",
          "error",
          `${result.creados} creado${result.creados === 1 ? "" : "s"} · ${errores} fila${errores === 1 ? "" : "s"} con error`
        );
      } else {
        showToast(
          errores > 0 ? "Ningún paciente creado" : "Planilla sin datos",
          "error",
          errores > 0
            ? `Revisá ${errores} error${errores === 1 ? "" : "es"} en el modal`
            : "No había filas con datos para importar"
        );
      }
      if (result.creados > 0) {
        setPage(1);
        refresh();
        bumpHistoriaStatus();
      }
    },
    [showToast, refresh, bumpHistoriaStatus]
  );

  const handleExportPacientesList = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    const filters = {
      searchQuery,
      directoryFilters,
    };

    setExportingList(true);
    try {
      const count = await exportPacientesWithFilters(token, filters);
      if (count === 0) {
        showToast(
          "Sin pacientes para exportar",
          "error",
          pacientesExportHasActiveFilters(filters)
            ? "Ningún paciente coincide con los filtros activos."
            : "No hay pacientes registrados."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} paciente${count === 1 ? "" : "s"}${pacientesExportHasActiveFilters(filters) ? " (filtros aplicados)" : ""}`
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo exportar el listado.";
      showToast(msg, "error");
    } finally {
      setExportingList(false);
    }
  }, [session?.accessToken, searchQuery, directoryFilters, showToast]);

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <PacienteHistoriaClinicaPromptDialog
        open={postCreatePaciente != null && !showHistoriaForm && !showServicioForm}
        paciente={postCreatePaciente}
        onConfirm={() => setShowHistoriaForm(true)}
        onContinueWithoutHistoria={openServicioStep}
        onFinish={finishPostCreateFlow}
      />
      <CreateHistoriaClinicaDialog
        open={postCreatePaciente != null && showHistoriaForm}
        paciente={postCreatePaciente}
        accessToken={session?.accessToken ?? null}
        onClose={openServicioStep}
        cancelLabel="Saltar a asignar servicio"
        closeOnBackdrop={false}
        onSuccess={handleHistoriaCreated}
      />
      <AssignPacienteServicioDialog
        open={postCreatePaciente != null && showServicioForm}
        paciente={postCreatePaciente}
        accessToken={session?.accessToken ?? null}
        userRoles={session?.roles ?? []}
        dismissLabel="Omitir por ahora"
        closeOnBackdrop={false}
        onFinish={finishPostCreateFlow}
        onAssigned={handleServicioAssigned}
      />
      <PacienteCargaMasivaDialog
        open={cargaMasivaOpen}
        accessToken={session?.accessToken ?? null}
        onClose={() => setCargaMasivaOpen(false)}
        onSuccess={handleCargaMasivaSuccess}
      />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      {isListView ? (
        <section className="min-w-0" aria-labelledby="pacientes-directory-heading">
          <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
            <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <User className="size-4 text-white" aria-hidden />
                  </span>
                  <CardTitle
                    id="pacientes-directory-heading"
                    className="truncate text-base font-semibold text-white sm:text-lg"
                  >
                    Pacientes
                  </CardTitle>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={headerOutlineButtonClass}
                    disabled={downloadingPlantilla}
                    onClick={() => void handleDownloadPlantilla()}
                  >
                    {downloadingPlantilla ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    <span className="hidden sm:inline">Descargar planilla</span>
                    <span className="sm:hidden">Planilla</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={headerOutlineButtonClass}
                    onClick={() => setCargaMasivaOpen(true)}
                  >
                    <Upload className="size-4" />
                    <span className="hidden sm:inline">Carga masiva</span>
                    <span className="sm:hidden">Cargar</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={primaryButtonClass}
                    onClick={() => setView("formulario")}
                  >
                    <UserPlus className="size-4" />
                    <span className="sm:hidden">Nuevo</span>
                    <span className="hidden sm:inline">Nuevo paciente</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div className="border-b border-medical-border/80 bg-medical-surface/30 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-0 flex-1 basis-[12rem] sm:max-w-xs">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-medical-mutedText"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar en esta página…"
                      disabled={loading}
                      aria-label="Buscar pacientes en esta página"
                      className="h-10 border-medical-border/80 bg-background pl-9 text-sm shadow-sm"
                    />
                  </div>

                  <PacientesDirectoryFilters
                    filters={directoryFilters}
                    onChange={setDirectoryFilters}
                    obrasSociales={obrasSociales}
                    loadingOptions={loadingOptions}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 cursor-pointer border-medical-border/80 bg-background px-3 text-sm shadow-sm"
                    disabled={loading || exportingList}
                    onClick={() => void handleExportPacientesList()}
                    title={
                      isFiltering
                        ? "Exportar pacientes con los filtros activos"
                        : "Exportar listado completo"
                    }
                  >
                    {exportingList ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-medical-primary/30 border-t-medical-primary" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-medical-primary" />
                    )}
                    <span className="hidden sm:inline">Exportar Excel</span>
                    <span className="sm:hidden">Exportar</span>
                  </Button>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Label
                      htmlFor="pacientes-page-size"
                      className="sr-only sm:not-sr-only sm:shrink-0 sm:text-xs sm:font-medium sm:text-medical-mutedText"
                    >
                      Por página
                    </Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={handlePageSizeChange}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="pacientes-page-size"
                        size="sm"
                        className="h-10 min-w-[4.5rem] w-auto border-medical-border/80 bg-background px-3 text-sm shadow-sm [&_[data-slot=select-value]]:line-clamp-none"
                        aria-label="Cantidad por página"
                      >
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {[5, 8, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p
                      className="hidden min-w-0 max-w-[11rem] truncate text-xs text-medical-mutedText md:block"
                      aria-live="polite"
                      title={paginationHint}
                    >
                      {paginationHint}
                    </p>
                  </div>
                </div>

                {optionsError ? (
                  <p className="rounded-md border border-medical-danger/30 bg-medical-danger/10 px-2.5 py-1.5 text-xs text-medical-danger">
                    {optionsError}
                  </p>
                ) : null}

                <p
                  className="text-xs text-medical-mutedText md:hidden"
                  aria-live="polite"
                >
                  {paginationHint}
                </p>

                <PacienteQrLookupPanel
                  accessToken={session?.accessToken ?? null}
                  compact
                />
              </div>
            </div>

            <CardContent className="p-0">
              <PacientesDirectoryTable
                items={items}
                filteredItems={filteredItems}
                loading={loading}
                error={error}
                onRetry={refresh}
                onCreate={() => setView("formulario")}
                accessToken={session?.accessToken ?? null}
                historiaStatusRefreshKey={historiaStatusKey}
                onHistoriaChange={() => {
                  showToast("Historia clínica registrada", "success");
                  refresh();
                  bumpHistoriaStatus();
                }}
                canDeletePaciente={session?.roles.includes("ADMIN") ?? false}
                userRoles={session?.roles ?? []}
                onPacienteUpdated={(paciente) => {
                  showToast(
                    "Paciente actualizado",
                    "success",
                    getPacienteNombre(paciente)
                  );
                  refresh();
                }}
                onPacienteDeleted={(paciente) => {
                  showToast(
                    "Paciente eliminado",
                    "success",
                    getPacienteNombre(paciente)
                  );
                  refresh();
                  bumpHistoriaStatus();
                }}
                onServicioAssigned={(asignacion) => {
                  const servicioNombre = asignacion.servicio?.nombre ?? "Servicio";
                  showToast("Servicio asignado", "success", servicioNombre);
                }}
              />
            </CardContent>

            {!loading && !error && items.length > 0 && !isFiltering ? (
              <CardFooter className="flex-col gap-4 border-t border-medical-border/80 bg-medical-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
                <p className="text-sm text-medical-mutedText">{paginationHint}</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="border-medical-border/80 cursor-pointer"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <span className="min-w-24 px-1 text-center text-sm font-medium text-medical-text">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="border-medical-border/80 cursor-pointer"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardFooter>
            ) : null}
          </Card>
        </section>
      ) : (
        <section className="min-w-0" aria-label="Alta de paciente">
          <Card className="border-medical-border p-4 sm:p-6">
            {ready && session ? (
              <CreatePacienteForm
                accessToken={session.accessToken}
                onSuccess={handlePacienteCreated}
                onCancel={() => setView("lista")}
              />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Cargando formulario…</p>
            )}
          </Card>
        </section>
      )}
      </div>
    </>
  );
}
