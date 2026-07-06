"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, DollarSign, RefreshCw } from "lucide-react";
import {
  ReportesFilters,
  type ReportesFiltersState,
} from "@/components/admin/ReportesFilters";
import { ReportesFinanzasBulkBar } from "@/components/reportes/ReportesFinanzasBulkBar";
import { ReportesSectionTabs } from "@/components/reportes/ReportesSectionTabs";
import { ReportesFinanzasTable } from "@/components/reportes/ReportesFinanzasTable";
import { ResumenFinancieroCards } from "@/components/reportes/ResumenFinancieroCards";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  bulkUpdateReporteVisitasFinanzasWithApi,
  getReporteVisitasWithApi,
} from "@/lib/api/reportes";
import type { ReporteVisitaItemDto, ResumenFinancieroDto } from "@/lib/api/types";
import { useMinimumLoadingDisplay } from "@/lib/hooks/use-minimum-loading-display";
import { useReportesFilterOptions } from "@/lib/hooks/use-reportes-filter-options";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { canEditFinanzasReportes } from "@/lib/reportes/access";
import { exportReportesFinanzasWithFilters } from "@/lib/reportes-finanzas-export";
import {
  filtersFromSearchParams,
  filtersToApiQuery,
  filtersToSearchParams,
  reportesFinanzasExportHasActiveFilters,
  type ReportesFinanzasFilters,
} from "@/lib/reportes/url-filters";

const MAX_BULK = 200;
const EMPTY_RESUMEN: ResumenFinancieroDto = {
  cantidadVisitas: 0,
  totalGenerado: "0",
  totalFacturado: "0",
  totalPagado: "0",
  pendienteFacturar: "0",
  pendientePago: "0",
};

function toFiltersState(f: ReportesFinanzasFilters): ReportesFiltersState {
  return {
    periodo: f.periodo,
    fechaDesde: f.fechaDesde,
    fechaHasta: f.fechaHasta,
    prestadorId: f.prestadorId,
    servicioId: f.servicioId,
    facturado: f.facturado,
    pagado: f.pagado,
  };
}

function fromFiltersState(s: ReportesFiltersState, page: number, pageSize: number): ReportesFinanzasFilters {
  return { ...s, page, pageSize };
}

export default function ReportesFinanzasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<AuthSession | null>(null);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams]
  );

  const [items, setItems] = useState<ReporteVisitaItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [resumen, setResumen] = useState<ResumenFinancieroDto>(EMPTY_RESUMEN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [exportingList, setExportingList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { toasts, showToast, dismiss } = useToast(4000);

  const { prestadores, servicios, loadingOptions, optionsError } = useReportesFilterOptions(
    session?.accessToken
  );

  const canEdit = session ? canEditFinanzasReportes(session.roles) : false;
  const displayLoading = useMinimumLoadingDisplay(loading);

  useEffect(() => {
    setSession(loadAuthSession());
  }, []);

  const pushFilters = useCallback(
    (next: ReportesFinanzasFilters) => {
      const qs = filtersToSearchParams(next).toString();
      router.push(qs ? `/admin/reportes/finanzas?${qs}` : "/admin/reportes/finanzas");
    },
    [router]
  );

  const fetchReport = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const data = await getReporteVisitasWithApi(token, filtersToApiQuery(filters));
      setItems(data.items);
      setTotal(data.total);
      setResumen(data.resumen);
      setSelectedIds(new Set());
    } catch (err) {
      setItems([]);
      setTotal(0);
      setResumen(EMPTY_RESUMEN);
      const message =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo cargar el reporte de finanzas.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filters]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleFiltersChange = (state: ReportesFiltersState) => {
    pushFilters(fromFiltersState(state, 1, filters.pageSize));
  };

  const handleApply = (state?: ReportesFiltersState) => {
    const base = state ?? toFiltersState(filters);
    pushFilters(fromFiltersState(base, filters.page, filters.pageSize));
  };

  const handlePageChange = (page: number) => {
    pushFilters({ ...filters, page });
  };

  const handlePageSizeChange = (pageSize: string) => {
    pushFilters({ ...filters, page: 1, pageSize: Number(pageSize) });
  };

  const toggleSelect = (visitaId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(visitaId)) next.delete(visitaId);
      else next.add(visitaId);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const allSelected = items.length > 0 && items.every((v) => selectedIds.has(v.visitaId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const v of items) next.delete(v.visitaId);
      } else {
        for (const v of items) next.add(v.visitaId);
      }
      return next;
    });
  };

  const runBulk = async (body: { facturado?: boolean; pagado?: boolean }) => {
    const token = session?.accessToken;
    if (!token || !canEdit) return;

    const visitaIds = Array.from(selectedIds).slice(0, MAX_BULK);
    if (visitaIds.length === 0) return;

    setBulkSaving(true);
    try {
      const result = await bulkUpdateReporteVisitasFinanzasWithApi(token, {
        visitaIds,
        ...body,
      });
      const byId = new Map(result.items.map((v) => [v.visitaId, v]));
      setItems((prev) =>
        prev.map((row) => (byId.has(row.visitaId) ? { ...row, ...byId.get(row.visitaId)! } : row))
      );
      setSelectedIds(new Set());
      void fetchReport();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar las visitas seleccionadas.";
      setError(message);
    } finally {
      setBulkSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const rangeEnd = Math.min(filters.page * filters.pageSize, total);

  const paginationHint = useMemo(() => {
    if (displayLoading) return "Cargando…";
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [displayLoading, total, rangeStart, rangeEnd]);

  const exportFilters = useMemo(
    () => ({
      periodo: filters.periodo,
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      prestadorId: filters.prestadorId,
      servicioId: filters.servicioId,
      facturado: filters.facturado,
      pagado: filters.pagado,
    }),
    [filters]
  );

  const hasExportFilters = useMemo(
    () => reportesFinanzasExportHasActiveFilters(exportFilters),
    [exportFilters]
  );

  const handleExportFinanzas = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    setExportingList(true);
    try {
      const count = await exportReportesFinanzasWithFilters(token, exportFilters);
      if (count === 0) {
        showToast(
          "Sin visitas para exportar",
          "error",
          hasExportFilters
            ? "Ninguna visita coincide con los filtros activos."
            : "No hay visitas en el período seleccionado."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} visita${count === 1 ? "" : "s"}${hasExportFilters ? " (filtros aplicados)" : ""}`
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
  }, [session?.accessToken, exportFilters, hasExportFilters, showToast]);

  return (
    <div className="relative z-0 w-full flex-1 py-1 pb-20">
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <Card className="flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden border-medical-border py-0 shadow-md">
        <CardHeader className="shrink-0 gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                <DollarSign className="size-4 text-white" aria-hidden />
              </span>
              <CardTitle className="truncate text-base font-semibold text-white sm:text-lg">
                Liquidación
              </CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ReportesSectionTabs variant="header" />
              <button
                type="button"
                onClick={() => void fetchReport()}
                disabled={displayLoading}
                title="Actualizar datos"
                aria-label="Actualizar datos"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-white/25 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw className={`size-4 ${displayLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </CardHeader>

        <ReportesFilters
          filters={toFiltersState(filters)}
          onChange={handleFiltersChange}
          prestadores={prestadores}
          servicios={servicios}
          loadingOptions={loadingOptions}
          loadingReport={displayLoading}
          onApply={handleApply}
          pageSize={filters.pageSize}
          onPageSizeChange={handlePageSizeChange}
          exportingList={exportingList}
          onExport={() => void handleExportFinanzas()}
          exportTitle={
            hasExportFilters
              ? "Exportar liquidación con los filtros activos"
              : "Exportar liquidación completa del período"
          }
        />

        {optionsError ? (
          <p className="border-b border-medical-warning/35 bg-medical-warning/10 px-3 py-1.5 text-xs text-medical-text sm:px-4">
            {optionsError}
          </p>
        ) : null}

        {!error && items.length > 0 ? <ResumenFinancieroCards resumen={resumen} /> : null}

        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          <ReportesFinanzasTable
            items={items}
            loading={displayLoading}
            error={error}
            accessToken={session?.accessToken ?? null}
            canEdit={canEdit}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAllPage={toggleSelectAllPage}
            onItemsChange={setItems}
            onRetry={() => void fetchReport()}
          />
        </CardContent>

        {!displayLoading && !error && items.length > 0 ? (
          <CardFooter className="flex-col gap-4 border-t border-medical-border/80 bg-medical-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
            <p className="text-sm text-medical-mutedText">{paginationHint}</p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="border-medical-border/80 cursor-pointer"
                disabled={filters.page <= 1}
                onClick={() => handlePageChange(filters.page - 1)}
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>
              <span className="min-w-24 px-1 text-center text-sm font-medium text-medical-text">
                Página {filters.page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="default"
                className="border-medical-border/80 cursor-pointer"
                disabled={filters.page >= totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardFooter>
        ) : null}
      </Card>

      <ReportesFinanzasBulkBar
        selectedCount={selectedIds.size}
        canEdit={canEdit}
        saving={bulkSaving}
        onClear={() => setSelectedIds(new Set())}
        onMarcarFacturado={() => void runBulk({ facturado: true })}
        onMarcarPagado={() => void runBulk({ pagado: true })}
        onMarcarAmbos={() => void runBulk({ facturado: true, pagado: true })}
      />
    </div>
  );
}
