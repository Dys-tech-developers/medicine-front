"use client";

import { Banknote, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TarifasDirectoryTable } from "@/components/admin/TarifasDirectoryTable";
import { TarifaServicioPickerDialog } from "@/components/admin/TarifaServicioPickerDialog";
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
import { listServiciosAllWithApi } from "@/lib/api/servicios";
import type { ServicioConTarifasDto, ServicioTarifaDto } from "@/lib/api/types";
import { canManageTarifas } from "@/lib/admin-permissions";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useCachedList } from "@/lib/hooks/use-cached-list";
import {
  filterTarifaListItems,
  flattenServicioTarifas,
  removeTarifaFromServicios,
  upsertTarifaInServicios,
} from "@/lib/tarifas-list";

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

/** Límite por defecto y opciones del selector de filas. */
const DEFAULT_PAGE_SIZE = 6;
const PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminTarifasPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createRequest, setCreateRequest] = useState<{
    servicioId: number;
    nonce: number;
  } | null>(null);
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const { toasts, showToast, dismiss } = useToast(4000);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const token = session?.accessToken ?? null;
  const canManage = canManageTarifas(session?.roles ?? []);

  const {
    items: servicios,
    loading,
    error,
    refresh,
    setListData,
  } = useCachedList<ServicioConTarifasDto>({
    resource: "tarifas-servicios",
    accessToken: token,
    enabled: Boolean(session),
    defaultErrorMessage: "No se pudieron cargar las tarifas.",
    fetcher: async () => {
      const items = await listServiciosAllWithApi(token!);
      return { items, total: items.length };
    },
  });

  const upsertServicio = useCallback(
    (servicio: ServicioConTarifasDto) => {
      const next = [...servicios];
      const idx = next.findIndex((s) => s.id === servicio.id);
      if (idx === -1) {
        next.push(servicio);
      } else {
        next[idx] = {
          ...next[idx],
          ...servicio,
          tarifas: servicio.tarifas ?? next[idx].tarifas,
          pacientes: servicio.pacientes ?? next[idx].pacientes,
        };
      }
      next.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      setListData({ items: next, total: next.length });
    },
    [servicios, setListData]
  );

  const allTarifas = useMemo(
    () => flattenServicioTarifas(servicios),
    [servicios]
  );

  const filteredTarifas = useMemo(
    () => filterTarifaListItems(allTarifas, debouncedSearch),
    [allTarifas, debouncedSearch]
  );

  const totalFiltered = filteredTarifas.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize) || 1);
  const safePage = Math.min(page, totalPages);

  const pagedTarifas = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTarifas.slice(start, start + pageSize);
  }, [filteredTarifas, safePage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalFiltered);

  const paginationHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (totalFiltered === 0) {
      return debouncedSearch.trim()
        ? "Ninguna tarifa coincide con la búsqueda."
        : "Sin tarifas para mostrar.";
    }
    return `Mostrando ${rangeStart}–${rangeEnd} de ${totalFiltered}`;
  }, [loading, totalFiltered, debouncedSearch, rangeStart, rangeEnd]);

  const handlePageSizeChange = (next: string) => {
    setPageSize(Number(next));
  };

  const servicioOptions = useMemo(
    () =>
      [...servicios]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .map((s) => ({
          value: String(s.id),
          label: s.nombre,
          description: s.estado ? undefined : "Inactivo",
        })),
    [servicios]
  );

  const handleTarifaSaved = useCallback(
    (tarifa: ServicioTarifaDto, servicioId: number) => {
      const nextServicios = upsertTarifaInServicios(servicios, servicioId, tarifa);
      const servicio = nextServicios.find((s) => s.id === servicioId);
      if (servicio) upsertServicio(servicio);
    },
    [servicios, upsertServicio]
  );

  const handleTarifaRemoved = useCallback(
    (servicioId: number, tarifaId: number) => {
      const nextServicios = removeTarifaFromServicios(
        servicios,
        servicioId,
        tarifaId
      );
      const servicio = nextServicios.find((s) => s.id === servicioId);
      if (servicio) upsertServicio(servicio);
    },
    [servicios, upsertServicio]
  );

  if (!session) {
    return null;
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <TarifaServicioPickerDialog
        open={pickerOpen}
        options={servicioOptions}
        onClose={() => setPickerOpen(false)}
        onContinue={(servicioId) => {
          setPickerOpen(false);
          setCreateRequest({ servicioId, nonce: Date.now() });
        }}
      />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <section className="min-w-0" aria-labelledby="tarifas-heading">
          <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
            <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <Banknote className="size-4 text-white" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <CardTitle
                      id="tarifas-heading"
                      className="truncate text-base font-semibold text-white sm:text-lg"
                    >
                      Tarifas por servicio
                    </CardTitle>
                    <p className="truncate text-xs text-white/75">
                      {allTarifas.length} tarifa
                      {allTarifas.length === 1 ? "" : "s"} · {servicios.length}{" "}
                      servicio{servicios.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <Button
                    type="button"
                    size="sm"
                    className={primaryButtonClass}
                    disabled={loading || servicios.length === 0}
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="size-4" />
                    <span className="sm:hidden">Nueva</span>
                    <span className="hidden sm:inline">Nueva tarifa</span>
                  </Button>
                ) : null}
              </div>
            </CardHeader>

            <div className="border-b border-medical-border/80 bg-medical-surface/30 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-medical-mutedText"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por servicio, modalidad…"
                    disabled={loading}
                    aria-label="Buscar tarifas"
                    className="h-10 border-medical-border/80 bg-background pl-9 text-sm shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  <Label
                    htmlFor="tarifas-page-size"
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
                      id="tarifas-page-size"
                      size="sm"
                      className="h-10 min-w-[4.5rem] w-auto border-medical-border/80 bg-background px-3 text-sm shadow-sm [&_[data-slot=select-value]]:line-clamp-none"
                      aria-label="Cantidad por página"
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p
                    className="hidden min-w-0 max-w-[14rem] truncate text-xs text-medical-mutedText md:block"
                    aria-live="polite"
                    title={paginationHint}
                  >
                    {paginationHint}
                  </p>
                </div>
              </div>
              <p
                className="mt-2 text-xs text-medical-mutedText md:hidden"
                aria-live="polite"
              >
                {paginationHint}
              </p>
            </div>

            <CardContent className="p-0">
              <TarifasDirectoryTable
                items={pagedTarifas}
                servicios={servicios}
                loading={loading}
                error={error}
                accessToken={session.accessToken}
                userRoles={session.roles}
                createRequest={createRequest}
                onRetry={refresh}
                onTarifaSaved={handleTarifaSaved}
                onTarifaRemoved={handleTarifaRemoved}
                onNotify={(title, type, detail) => showToast(title, type, detail)}
              />
            </CardContent>

            {!loading && !error && totalFiltered > 0 ? (
              <CardFooter className="flex-col gap-4 border-t border-medical-border/80 bg-medical-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
                <p className="text-sm text-medical-mutedText">{paginationHint}</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="cursor-pointer border-medical-border/80"
                    disabled={safePage <= 1}
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <span className="min-w-24 px-1 text-center text-sm font-medium text-medical-text">
                    Página {safePage} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="cursor-pointer border-medical-border/80"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardFooter>
            ) : null}
          </Card>
        </section>
      </div>
    </>
  );
}
