"use client";

import { Download, FileSpreadsheet, Layers, Plus, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateServicioForm } from "@/components/admin/CreateServicioForm";
import { ServicioCargaMasivaDialog } from "@/components/admin/ServicioCargaMasivaDialog";
import { ServiciosDirectoryTable } from "@/components/admin/ServiciosDirectoryTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import {
  downloadServiciosCargaMasivaPlantillaWithApi,
  triggerBrowserFileDownload,
  type CargaMasivaServiciosResultDto,
} from "@/lib/api/carga-masiva-servicios";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useServiciosList } from "@/lib/hooks/use-servicios-list";
import {
  exportServiciosWithFilters,
  serviciosExportHasActiveFilters,
} from "@/lib/servicios-export";

type PageView = "lista" | "formulario";

const REDIRECT_AFTER_SUCCESS_MS = 2400;

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

const headerOutlineButtonClass =
  "cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminServiciosPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [view, setView] = useState<PageView>("lista");
  const [searchQuery, setSearchQuery] = useState("");
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false);
  const [downloadingPlantilla, setDownloadingPlantilla] = useState(false);
  const [exportingList, setExportingList] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const { toasts, showToast, dismiss } = useToast(4000);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const token = session?.accessToken ?? null;

  const {
    items: servicios,
    loading,
    error,
    refresh,
    upsertServicio,
    removeServicio,
  } = useServiciosList({
    accessToken: token,
    enabled: Boolean(session),
    pageSize: 100,
    search: debouncedSearch.trim() || undefined,
  });

  const handleServicioCreated = useCallback(
    (servicio: ServicioConTarifasDto) => {
      showToast("Servicio creado con éxito", "success", servicio.nombre);
      window.setTimeout(() => {
        upsertServicio(servicio);
        setSearchQuery("");
        setView("lista");
      }, REDIRECT_AFTER_SUCCESS_MS);
    },
    [upsertServicio, showToast]
  );

  const handleDownloadPlantilla = useCallback(async () => {
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }
    setDownloadingPlantilla(true);
    try {
      const { blob, filename } = await downloadServiciosCargaMasivaPlantillaWithApi(token);
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
  }, [token, showToast]);

  const handleCargaMasivaSuccess = useCallback(
    (result: CargaMasivaServiciosResultDto) => {
      const errores = result.errores.length;
      if (result.creados > 0 && errores === 0) {
        showToast(
          "Carga masiva completada",
          "success",
          `${result.creados} servicio${result.creados === 1 ? "" : "s"} de ${result.totalFilas} fila${result.totalFilas === 1 ? "" : "s"}`
        );
      } else if (result.creados > 0 && errores > 0) {
        showToast(
          "Carga parcial",
          "error",
          `${result.creados} creado${result.creados === 1 ? "" : "s"} · ${errores} fila${errores === 1 ? "" : "s"} con error`
        );
      } else {
        showToast(
          errores > 0 ? "Ningún servicio creado" : "Planilla sin datos",
          "error",
          errores > 0
            ? `Revisá ${errores} error${errores === 1 ? "" : "es"} en el modal`
            : "No había filas con datos para importar"
        );
      }
      if (result.creados > 0) {
        setSearchQuery("");
        refresh();
      }
    },
    [showToast, refresh]
  );

  const exportFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
    }),
    [debouncedSearch]
  );

  const hasExportFilters = useMemo(
    () => serviciosExportHasActiveFilters(exportFilters),
    [exportFilters]
  );

  const handleExportServicios = useCallback(async () => {
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    setExportingList(true);
    try {
      const count = await exportServiciosWithFilters(token, exportFilters);
      if (count === 0) {
        showToast(
          "Sin servicios para exportar",
          "error",
          hasExportFilters
            ? "Ningún servicio coincide con la búsqueda activa."
            : "No hay servicios registrados."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} servicio${count === 1 ? "" : "s"}${hasExportFilters ? " (filtros aplicados)" : ""}`
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
  }, [token, exportFilters, hasExportFilters, showToast]);

  if (!session) {
    return null;
  }

  const isListView = view === "lista";

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <ServicioCargaMasivaDialog
        open={cargaMasivaOpen}
        accessToken={token}
        onClose={() => setCargaMasivaOpen(false)}
        onSuccess={handleCargaMasivaSuccess}
      />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {isListView ? (
          <section className="min-w-0" aria-labelledby="servicios-heading">
            <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                      <Layers className="size-4 text-white" aria-hidden />
                    </span>
                    <CardTitle
                      id="servicios-heading"
                      className="truncate text-base font-semibold text-white sm:text-lg"
                    >
                      Servicios
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
                      <Plus className="size-4" />
                      <span className="sm:hidden">Nuevo</span>
                      <span className="hidden sm:inline">Nuevo servicio</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <div className="border-b border-medical-border/80 bg-medical-surface/30 px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1 basis-[12rem] sm:max-w-xs">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-medical-mutedText"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar servicio por nombre…"
                      disabled={loading}
                      aria-label="Buscar servicios"
                      className="h-10 border-medical-border/80 bg-background pl-9 text-sm shadow-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 cursor-pointer border-medical-border/80 bg-background px-3 text-sm shadow-sm"
                    disabled={loading || exportingList}
                    onClick={() => void handleExportServicios()}
                    title={
                      hasExportFilters
                        ? "Exportar servicios con la búsqueda activa"
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
                </div>
              </div>

              <CardContent className="p-0">
                <ServiciosDirectoryTable
                  items={servicios}
                  filteredItems={servicios}
                  loading={loading}
                  error={error}
                  accessToken={session.accessToken}
                  userRoles={session.roles}
                  onRetry={refresh}
                  onServicioUpdated={upsertServicio}
                  onServicioRemoved={removeServicio}
                  onNotify={(title, type, detail) => showToast(title, type, detail)}
                  onCreate={() => setView("formulario")}
                />
              </CardContent>
            </Card>
          </section>
        ) : (
          <section aria-label="Alta de servicio">
            <Card className="border-medical-border p-4 sm:p-6">
              <CreateServicioForm
                accessToken={session.accessToken}
                onCancel={() => setView("lista")}
                onSuccess={handleServicioCreated}
              />
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
