"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Layers, RefreshCw, Stethoscope } from "lucide-react";
import {
  ReportesFilters,
  type ReportesFiltersState,
} from "@/components/admin/ReportesFilters";
import { ReportesMetaSummary } from "@/components/admin/ReportesMetaSummary";
import { ReportesPrestadoresTable } from "@/components/admin/ReportesPrestadoresTable";
import { ReportesServiciosTable } from "@/components/admin/ReportesServiciosTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import {
  getReportePrestadoresWithApi,
  getReporteServiciosWithApi,
  type ReportesQueryOptions,
} from "@/lib/api/reportes";
import { useMinimumLoadingDisplay } from "@/lib/hooks/use-minimum-loading-display";
import { useReportesFilterOptions } from "@/lib/hooks/use-reportes-filter-options";
import type {
  PrestadorListItemDto,
  ReportePrestadorItemDto,
  ReporteServicioItemDto,
  ReportesMetaDto,
  ServicioConTarifasDto,
} from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import {
  filtersFromSearchParams,
  filtersToApiQuery,
  filtersToSearchParams,
  type ReportesFinanzasFilters,
} from "@/lib/reportes/url-filters";
import { ReportesSectionTabs } from "@/components/reportes/ReportesSectionTabs";
import { cn } from "@/lib/utils";

type ReportTab = "prestadores" | "servicios";

function buildQueryFromUrl(filters: ReportesFinanzasFilters): ReportesQueryOptions {
  const { page: _page, pageSize: _pageSize, ...query } = filtersToApiQuery(filters);
  return query;
}

export default function ReportesResumenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tab, setTab] = useState<ReportTab>("prestadores");

  const urlFilters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const filterState: ReportesFiltersState = {
    periodo: urlFilters.periodo,
    fechaDesde: urlFilters.fechaDesde,
    fechaHasta: urlFilters.fechaHasta,
    prestadorId: urlFilters.prestadorId,
    servicioId: urlFilters.servicioId,
    facturado: urlFilters.facturado,
    pagado: urlFilters.pagado,
  };

  const queryOptions = useMemo(() => buildQueryFromUrl(urlFilters), [urlFilters]);

  const { prestadores, servicios, loadingOptions, optionsError } = useReportesFilterOptions(
    session?.accessToken
  );

  const [prestadorItems, setPrestadorItems] = useState<ReportePrestadorItemDto[]>([]);
  const [servicioItems, setServicioItems] = useState<ReporteServicioItemDto[]>([]);
  const [meta, setMeta] = useState<ReportesMetaDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const displayLoading = useMinimumLoadingDisplay(loading);

  useEffect(() => {
    setSession(loadAuthSession());
  }, []);

  const pushFilters = useCallback(
    (next: ReportesFiltersState) => {
      const merged: ReportesFinanzasFilters = {
        ...urlFilters,
        ...next,
        page: 1,
      };
      const qs = filtersToSearchParams(merged).toString();
      router.push(
        qs ? `/admin/reportes/finanzas/resumen?${qs}` : "/admin/reportes/finanzas/resumen"
      );
    },
    [router, urlFilters]
  );

  const fetchReport = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      if (tab === "prestadores") {
        const data = await getReportePrestadoresWithApi(token, queryOptions);
        setPrestadorItems(data.items);
        setMeta(data.meta);
      } else {
        const data = await getReporteServiciosWithApi(token, queryOptions);
        setServicioItems(data.items);
        setMeta(data.meta);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo generar el reporte.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, tab, queryOptions]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const prestadoresById = useMemo(() => {
    const map = new Map<number, PrestadorListItemDto>();
    for (const p of prestadores) map.set(p.id, p);
    return map;
  }, [prestadores]);

  const summary = useMemo(() => {
    if (tab === "prestadores") {
      return prestadorItems.reduce(
        (acc, row) => ({
          visitas: acc.visitas + row.cantidadVisitas,
          horas: acc.horas + row.horasTrabajadas,
          generado: acc.generado + Number.parseFloat(row.totalGenerado || "0"),
        }),
        { visitas: 0, horas: 0, generado: 0 }
      );
    }
    return servicioItems.reduce(
      (acc, row) => ({
        visitas: acc.visitas + row.cantidadVisitas,
        horas: acc.horas + row.horasTotales,
        generado: acc.generado + Number.parseFloat(row.totalGenerado || "0"),
      }),
      { visitas: 0, horas: 0, generado: 0 }
    );
  }, [tab, prestadorItems, servicioItems]);

  return (
    <div className="relative z-0 w-full flex-1 py-1">
      <Card className="flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden border-medical-border py-0 shadow-md">
        <CardHeader className="shrink-0 gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                <BarChart3 className="size-[1.125rem] text-white" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold text-white">
                  Resumen agregado
                </CardTitle>
                <CardDescription className="text-xs text-white/85 sm:text-sm">
                  Por prestador o servicio · solo lectura
                </CardDescription>
              </div>
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
                <RefreshCw className={cn("size-4", displayLoading && "animate-spin")} />
              </button>
            </div>
          </div>
        </CardHeader>

        <ReportesFilters
          filters={filterState}
          onChange={(next) => pushFilters(next)}
          prestadores={prestadores}
          servicios={servicios}
          loadingOptions={loadingOptions}
          loadingReport={displayLoading}
          onApply={(next) => pushFilters(next ?? filterState)}
        />

        <div className="flex items-center gap-1 border-b border-medical-border/60 bg-medical-surface/20 px-4 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setTab("prestadores")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "prestadores"
                ? "bg-medical-primary text-white shadow-sm"
                : "text-medical-text hover:bg-medical-secondary/60"
            )}
          >
            <Stethoscope className="size-3.5" />
            Por prestador
          </button>
          <button
            type="button"
            onClick={() => setTab("servicios")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "servicios"
                ? "bg-medical-primary text-white shadow-sm"
                : "text-medical-text hover:bg-medical-secondary/60"
            )}
          >
            <Layers className="size-3.5" />
            Por servicio
          </button>
        </div>

        {optionsError ? (
          <p className="border-b border-medical-warning/35 bg-medical-warning/10 px-3 py-1.5 text-xs text-medical-text sm:px-4">
            {optionsError}
          </p>
        ) : null}

        {!error && (tab === "prestadores" ? prestadorItems : servicioItems).length > 0 ? (
          <ReportesMetaSummary
            meta={meta}
            totalVisitasItems={summary.visitas}
            totalHoras={summary.horas}
            totalGenerado={summary.generado}
          />
        ) : null}

        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          {tab === "prestadores" ? (
            <ReportesPrestadoresTable
              items={prestadorItems}
              prestadoresById={prestadoresById}
              loading={displayLoading}
              error={error}
              onRetry={() => void fetchReport()}
            />
          ) : (
            <ReportesServiciosTable
              items={servicioItems}
              loading={displayLoading}
              error={error}
              onRetry={() => void fetchReport()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
