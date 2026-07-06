"use client";

import { Boxes, ChevronLeft, ChevronRight, Download, FileSpreadsheet, PackagePlus, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateInsumoForm } from "@/components/admin/CreateInsumoForm";
import { InsumoCargaMasivaDialog } from "@/components/admin/InsumoCargaMasivaDialog";
import { InsumosStockTable } from "@/components/admin/InsumosStockTable";
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
import { Switch } from "@/components/ui/switch";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import {
  downloadStockCargaMasivaPlantillaWithApi,
  triggerBrowserFileDownload,
  type CargaMasivaStockResultDto,
} from "@/lib/api/carga-masiva-stock";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { InsumoDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useInsumosList } from "@/lib/hooks/use-insumos-list";
import { matchesInsumoSearch } from "@/lib/insumos-display";
import {
  exportStockListWithFilters,
  stockExportHasActiveFilters,
} from "@/lib/insumos-stock-export";
import { getStockLevel } from "@/lib/insumos-stock";
import { isInsumoConAlertaVencimiento } from "@/lib/insumos-vencimiento";

type PageView = "lista" | "formulario";

const REDIRECT_AFTER_SUCCESS_MS = 2400;

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

const headerOutlineButtonClass =
  "cursor-pointer border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white";

export default function AdminStockPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<PageView>("lista");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [soloProximosVencer, setSoloProximosVencer] = useState(false);
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

  const { items, total, loading, error, refresh } = useInsumosList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page,
    pageSize,
    bajoStock: soloBajoStock || undefined,
  });

  const handleInsumoCreated = useCallback(
    (insumo: InsumoDto) => {
      showToast(
        "Insumo creado con éxito",
        "success",
        `${insumo.nombre} · ${insumo.codigo} · stock ${insumo.cantidad}`
      );
      window.setTimeout(() => {
        setPage(1);
        setSearchQuery("");
        refresh();
        setView("lista");
      }, REDIRECT_AFTER_SUCCESS_MS);
    },
    [refresh, showToast]
  );

  const handleInsumoUpdated = useCallback(() => {
    showToast("Insumo actualizado", "success");
    refresh();
  }, [refresh, showToast]);

  const handleInsumoDeleted = useCallback(
    (count: number, detail?: string) => {
      showToast(
        count === 1 ? "Insumo eliminado" : `${count} insumos eliminados`,
        "success",
        detail
      );
      refresh();
    },
    [refresh, showToast]
  );

  const handleDownloadPlantilla = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }
    setDownloadingPlantilla(true);
    try {
      const { blob, filename } = await downloadStockCargaMasivaPlantillaWithApi(token);
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
    (result: CargaMasivaStockResultDto) => {
      const errores = result.errores.length;
      if (result.creados > 0 && errores === 0) {
        showToast(
          "Carga masiva completada",
          "success",
          `${result.creados} insumo${result.creados === 1 ? "" : "s"} de ${result.totalFilas} fila${result.totalFilas === 1 ? "" : "s"}`
        );
      } else if (result.creados > 0 && errores > 0) {
        showToast(
          "Carga parcial",
          "error",
          `${result.creados} creado${result.creados === 1 ? "" : "s"} · ${errores} fila${errores === 1 ? "" : "s"} con error`
        );
      } else {
        showToast(
          errores > 0 ? "Ningún insumo creado" : "Planilla sin datos",
          "error",
          errores > 0
            ? `Revisá ${errores} error${errores === 1 ? "" : "es"} en el modal`
            : "No había filas con datos para importar"
        );
      }
      if (result.creados > 0) {
        setPage(1);
        setSearchQuery("");
        refresh();
      }
    },
    [showToast, refresh]
  );

  const isListView = view === "lista";

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const filteredItems = useMemo(
    () =>
      items.filter((row) => {
        if (!matchesInsumoSearch(row, searchQuery)) return false;
        if (soloProximosVencer && !isInsumoConAlertaVencimiento(row)) return false;
        return true;
      }),
    [items, searchQuery, soloProximosVencer]
  );

  const isFiltering = searchQuery.trim().length > 0 || soloProximosVencer;

  const pageAlerts = useMemo(() => {
    const stockBajo = items.filter((i) => getStockLevel(i) !== "ok").length;
    const vencimiento = items.filter((i) => isInsumoConAlertaVencimiento(i)).length;
    return { stockBajo, vencimiento };
  }, [items]);

  const paginationHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (soloBajoStock) return "Filtro: solo stock bajo o sin stock.";
    if (soloProximosVencer) return "Filtro: próximos a vencer o vencidos en esta página.";
    if (isFiltering) {
      return filteredItems.length === 0
        ? "Sin coincidencias en esta página."
        : `${filteredItems.length} coincidencia${filteredItems.length === 1 ? "" : "s"} en esta página`;
    }
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [loading, soloBajoStock, soloProximosVencer, isFiltering, filteredItems.length, total, rangeStart, rangeEnd]);

  const handlePageSizeChange = (next: string) => {
    setPageSize(Number(next));
    setPage(1);
  };

  const handleBajoStockChange = (checked: boolean) => {
    setSoloBajoStock(checked);
    setPage(1);
  };

  const handleProximosVencerChange = (checked: boolean) => {
    setSoloProximosVencer(checked);
    setPage(1);
  };

  const handleExportStockList = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    const filters = {
      searchQuery,
      soloBajoStock,
      soloProximosVencer,
    };

    setExportingList(true);
    try {
      const count = await exportStockListWithFilters(token, filters);
      if (count === 0) {
        showToast(
          "Sin insumos para exportar",
          "error",
          stockExportHasActiveFilters(filters)
            ? "Ningún insumo coincide con los filtros activos."
            : "No hay insumos registrados en el inventario."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} insumo${count === 1 ? "" : "s"}${stockExportHasActiveFilters(filters) ? " (filtros aplicados)" : ""}`
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo exportar el listado de stock.";
      showToast(msg, "error");
    } finally {
      setExportingList(false);
    }
  }, [session?.accessToken, searchQuery, soloBajoStock, soloProximosVencer, showToast]);

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <InsumoCargaMasivaDialog
        open={cargaMasivaOpen}
        accessToken={session?.accessToken ?? null}
        onClose={() => setCargaMasivaOpen(false)}
        onSuccess={handleCargaMasivaSuccess}
      />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {isListView ? (
          <section className="min-w-0" aria-labelledby="insumos-stock-heading">
            <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                      <Boxes className="size-4 text-white" aria-hidden />
                    </span>
                    <CardTitle
                      id="insumos-stock-heading"
                      className="truncate text-base font-semibold text-white sm:text-lg"
                    >
                      Stock de insumos
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
                      <PackagePlus className="size-4" />
                      <span className="sm:hidden">Nuevo</span>
                      <span className="hidden sm:inline">Nuevo insumo</span>
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
                        aria-label="Buscar insumos en esta página"
                        className="h-10 border-medical-border/80 bg-background pl-9 text-sm shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-medical-border/80 bg-background px-3 py-2 shadow-sm">
                      <Switch
                        id="stock-solo-bajo"
                        checked={soloBajoStock}
                        onCheckedChange={handleBajoStockChange}
                        disabled={loading}
                        className={soloBajoStock ? "bg-medical-warning" : undefined}
                        aria-labelledby="stock-solo-bajo-label"
                      />
                      <Label
                        id="stock-solo-bajo-label"
                        htmlFor="stock-solo-bajo"
                        className="cursor-pointer text-sm font-medium text-medical-text"
                      >
                        Stock bajo
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-medical-border/80 bg-background px-3 py-2 shadow-sm">
                      <Switch
                        id="stock-solo-vencer"
                        checked={soloProximosVencer}
                        onCheckedChange={handleProximosVencerChange}
                        disabled={loading}
                        className={soloProximosVencer ? "bg-medical-warning" : undefined}
                        aria-labelledby="stock-solo-vencer-label"
                      />
                      <Label
                        id="stock-solo-vencer-label"
                        htmlFor="stock-solo-vencer"
                        className="cursor-pointer text-sm font-medium text-medical-text"
                      >
                        Próx. a vencer
                      </Label>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 cursor-pointer border-medical-border/80 bg-background px-3 text-sm shadow-sm"
                      disabled={loading || exportingList}
                      onClick={() => void handleExportStockList()}
                      title={
                        stockExportHasActiveFilters({
                          searchQuery,
                          soloBajoStock,
                          soloProximosVencer,
                        })
                          ? "Exportar inventario con los filtros activos"
                          : "Exportar inventario completo"
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
                        htmlFor="stock-page-size"
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
                          id="stock-page-size"
                          size="sm"
                          className="h-10 min-w-[4.5rem] w-auto border-medical-border/80 bg-background px-3 text-sm shadow-sm [&_[data-slot=select-value]]:line-clamp-none"
                          aria-label="Cantidad por página"
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {[10, 25, 50].map((n) => (
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

                  {!loading && items.length > 0 && (pageAlerts.stockBajo > 0 || pageAlerts.vencimiento > 0) ? (
                    <p className="rounded-md border border-medical-warning/35 bg-medical-warning/10 px-2.5 py-1.5 text-xs text-medical-text">
                      En esta página:{" "}
                      {pageAlerts.stockBajo > 0 ? (
                        <>
                          <span className="font-semibold">{pageAlerts.stockBajo}</span> con stock bajo
                        </>
                      ) : null}
                      {pageAlerts.stockBajo > 0 && pageAlerts.vencimiento > 0 ? " · " : null}
                      {pageAlerts.vencimiento > 0 ? (
                        <>
                          <span className="font-semibold">{pageAlerts.vencimiento}</span> con alerta de
                          vencimiento
                        </>
                      ) : null}
                    </p>
                  ) : null}

                  <p className="text-xs text-medical-mutedText md:hidden" aria-live="polite">
                    {paginationHint}
                  </p>
                </div>
              </div>

              <CardContent className="p-0">
                <InsumosStockTable
                  items={items}
                  filteredItems={filteredItems}
                  loading={loading}
                  error={error}
                  onRetry={refresh}
                  onCreate={() => setView("formulario")}
                  accessToken={session?.accessToken ?? null}
                  onUpdated={handleInsumoUpdated}
                  onDeleted={handleInsumoDeleted}
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
          <section className="min-w-0" aria-label="Alta de insumo">
            <Card className="border-medical-border p-4 sm:p-6">
              {ready && session ? (
                <CreateInsumoForm
                  accessToken={session.accessToken}
                  onSuccess={handleInsumoCreated}
                  onCancel={() => setView("lista")}
                />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Cargando formulario…
                </p>
              )}
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
