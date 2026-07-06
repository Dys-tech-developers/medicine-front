"use client";

import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Search, Stethoscope, Upload, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreatePrestadorForm } from "@/components/admin/CreatePrestadorForm";
import { PrestadorCargaMasivaDialog } from "@/components/admin/PrestadorCargaMasivaDialog";
import { PrestadoresDirectoryTable } from "@/components/admin/PrestadoresDirectoryTable";
import { PrestadoresPeriodFilters } from "@/components/admin/PrestadoresPeriodFilters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { ApiError } from "@/lib/api/client";
import {
  downloadPrestadoresCargaMasivaPlantillaWithApi,
  triggerBrowserFileDownload,
  type CargaMasivaPrestadoresResultDto,
} from "@/lib/api/carga-masiva-prestadores";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { PrestadorListItemDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { usePrestadoresList } from "@/lib/hooks/use-prestadores-list";
import {
  DEFAULT_PRESTADORES_PERIOD_FILTERS,
  type PrestadoresPeriodFiltersState,
} from "@/lib/prestadores-period-filters";
import {
  exportPrestadoresWithFilters,
  prestadoresExportHasActiveFilters,
} from "@/lib/prestadores-export";
import { prestadorSearchHaystack } from "@/lib/prestadores-display";
import { formatMetaRango } from "@/lib/reportes-display";

function matchesSearch(row: PrestadorListItemDto, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return prestadorSearchHaystack(row).includes(q);
}

type PageView = "lista" | "formulario";

const primaryButtonClass =
  "bg-white cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

const headerOutlineButtonClass =
  "cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white";

export default function AdminPrestadoresPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<PageView>("lista");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilters, setPeriodFilters] = useState<PrestadoresPeriodFiltersState>(
    DEFAULT_PRESTADORES_PERIOD_FILTERS
  );
  const [appliedPeriodFilters, setAppliedPeriodFilters] =
    useState<PrestadoresPeriodFiltersState>(DEFAULT_PRESTADORES_PERIOD_FILTERS);
  const [cargaMasivaOpen, setCargaMasivaOpen] = useState(false);
  const [downloadingPlantilla, setDownloadingPlantilla] = useState(false);
  const [exportingList, setExportingList] = useState(false);
  const { toasts, showToast, dismiss } = useToast(4000);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
    setReady(true);
  }, []);

  const isListView = view === "lista";

  const {
    items,
    total,
    meta,
    loading: listLoading,
    error: listError,
    refresh: bumpList,
  } = usePrestadoresList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session) && isListView,
    page,
    pageSize,
    periodFilters: appliedPeriodFilters,
  });

  const handleApplyPeriod = useCallback((next?: PrestadoresPeriodFiltersState) => {
    const applied = next ?? periodFilters;
    setAppliedPeriodFilters(applied);
    if (next) setPeriodFilters(next);
    setPage(1);
  }, [periodFilters]);

  const handleCreated = useCallback(() => {
    setPage(1);
    setSearchQuery("");
    bumpList();
    setView("lista");
  }, [bumpList]);

  const periodoLabel = formatMetaRango(meta);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const filteredItems = useMemo(
    () => items.filter((row) => matchesSearch(row, searchQuery)),
    [items, searchQuery]
  );

  const isSearchFiltering = searchQuery.trim().length > 0;
  const hasExportFilters = prestadoresExportHasActiveFilters({
    searchQuery,
    periodFilters: appliedPeriodFilters,
  });

  const paginationHint = useMemo(() => {
    if (listLoading) return "Cargando…";
    if (isSearchFiltering) {
      return filteredItems.length === 0
        ? "Sin coincidencias en esta página."
        : `${filteredItems.length} coincidencia${filteredItems.length === 1 ? "" : "s"} en esta página`;
    }
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [listLoading, isSearchFiltering, filteredItems.length, total, rangeStart, rangeEnd]);

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
      const { blob, filename } = await downloadPrestadoresCargaMasivaPlantillaWithApi(token);
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
    (result: CargaMasivaPrestadoresResultDto) => {
      const errores = result.errores.length;
      if (result.creados > 0 && errores === 0) {
        showToast(
          "Carga masiva completada",
          "success",
          `${result.creados} prestador${result.creados === 1 ? "" : "es"} de ${result.totalFilas} fila${result.totalFilas === 1 ? "" : "s"}`
        );
      } else if (result.creados > 0 && errores > 0) {
        showToast(
          "Carga parcial",
          "error",
          `${result.creados} creado${result.creados === 1 ? "" : "s"} · ${errores} fila${errores === 1 ? "" : "s"} con error`
        );
      } else {
        showToast(
          errores > 0 ? "Ningún prestador creado" : "Planilla sin datos",
          "error",
          errores > 0
            ? `Revisá ${errores} error${errores === 1 ? "" : "es"} en el modal`
            : "No había filas con datos para importar"
        );
      }
      if (result.creados > 0) {
        setPage(1);
        bumpList();
      }
    },
    [showToast, bumpList]
  );

  const handleExportPrestadoresList = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    const filters = {
      searchQuery,
      periodFilters: appliedPeriodFilters,
    };

    setExportingList(true);
    try {
      const count = await exportPrestadoresWithFilters(token, filters);
      if (count === 0) {
        showToast(
          "Sin prestadores para exportar",
          "error",
          prestadoresExportHasActiveFilters(filters)
            ? "Ningún prestador coincide con los filtros activos."
            : "No hay prestadores registrados."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} prestador${count === 1 ? "" : "es"}${prestadoresExportHasActiveFilters(filters) ? " (filtros aplicados)" : ""}`
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
  }, [session?.accessToken, searchQuery, appliedPeriodFilters, showToast]);

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <PrestadorCargaMasivaDialog
        open={cargaMasivaOpen}
        accessToken={session?.accessToken ?? null}
        onClose={() => setCargaMasivaOpen(false)}
        onSuccess={handleCargaMasivaSuccess}
      />
        <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {isListView ? (
            <section className="min-w-0" aria-labelledby="prestadores-directory-heading">
              <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
                <CardHeader className="gap-3 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex w-full flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                        <Stethoscope className="size-5 text-white" />
                      </span>
                      <CardTitle
                        id="prestadores-directory-heading"
                        className="text-lg font-semibold text-white sm:text-xl"
                      >
                        Prestadores
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
                        <span className="hidden sm:inline">Nuevo prestador</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="w-full text-sm leading-relaxed text-white/85">
                    Profesionales con acceso al sistema. Estado de cuenta:{" "}
                    <span className="font-medium text-white">{periodoLabel}</span>. Visitas y montos
                    pagados o pendientes por prestador. Para gestionar facturado y pagado de cada
                    visita, usá <span className="font-medium text-white">Liquidación</span>. Buscá por
                    nombre, email, documento o matrícula.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4 border-b border-medical-border/80 bg-medical-surface/50 px-4 py-4 sm:px-7 sm:py-5">
                  <PrestadoresPeriodFilters
                    filters={periodFilters}
                    onChange={setPeriodFilters}
                    loading={listLoading}
                    onApply={handleApplyPeriod}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="relative min-w-0 flex-1 lg:max-w-lg">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medical-mutedText" />
                      <Input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar en esta página…"
                        disabled={listLoading}
                        className="h-10 border-medical-border/80 bg-background pl-9 shadow-sm"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 cursor-pointer border-medical-border/80 bg-background px-3 text-sm shadow-sm"
                      disabled={listLoading || exportingList}
                      onClick={() => void handleExportPrestadoresList()}
                      title={
                        hasExportFilters
                          ? "Exportar prestadores con los filtros activos"
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

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor="page-size"
                          className="shrink-0 text-sm font-medium text-medical-text"
                        >
                          Por página
                        </Label>
                        <Select
                          value={String(pageSize)}
                          onValueChange={handlePageSizeChange}
                          disabled={listLoading}
                        >
                          <SelectTrigger
                            id="page-size"
                            size="sm"
                            className="h-10 w-[84px] border-medical-border/80 bg-background shadow-sm"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 25, 50].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <p
                        className="text-sm text-medical-mutedText lg:min-w-40 lg:text-right"
                        aria-live="polite"
                      >
                        {paginationHint}
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="min-w-0 p-0">
                  <PrestadoresDirectoryTable
                    items={items}
                    filteredItems={filteredItems}
                    loading={listLoading}
                    error={listError}
                    meta={meta}
                    accessToken={session?.accessToken ?? null}
                    onRetry={bumpList}
                    onRefresh={bumpList}
                    onCreate={() => setView("formulario")}
                  />
                </CardContent>

                {!listLoading && !listError && items.length > 0 && !isSearchFiltering ? (
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
            <section className="min-w-0" aria-label="Alta de prestador">
              <Card className="border-medical-border p-4 sm:p-6">
                {ready && session ? (
                  <CreatePrestadorForm
                    accessToken={session.accessToken}
                    onCreated={handleCreated}
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
