"use client";

import { Building2, FileSpreadsheet, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateObraSocialForm } from "@/components/admin/CreateObraSocialForm";
import { ObrasSocialesDirectoryTable } from "@/components/admin/ObrasSocialesDirectoryTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { ObraSocialListItemDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useObrasSocialesList } from "@/lib/hooks/use-obras-sociales-list";
import {
  exportObrasSocialesWithFilters,
  obrasSocialesExportHasActiveFilters,
} from "@/lib/obras-sociales-export";

type PageView = "lista" | "formulario";
type EstadoFilter = "all" | "active" | "inactive";

const REDIRECT_AFTER_SUCCESS_MS = 2400;

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminObrasSocialesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [view, setView] = useState<PageView>("lista");
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("all");
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

  const estadoParam =
    estadoFilter === "all" ? undefined : estadoFilter === "active";

  const {
    items: obras,
    loading,
    error,
    refresh,
    upsertObraSocial,
    removeObraSocial,
  } = useObrasSocialesList({
    accessToken: token,
    enabled: Boolean(session),
    pageSize: 100,
    search: debouncedSearch.trim() || undefined,
    estado: estadoParam,
  });

  const filteredItems = useMemo(() => obras, [obras]);

  const handleObraCreated = useCallback(
    (obra: ObraSocialListItemDto) => {
      showToast("Obra social creada con éxito", "success", obra.nombre);
      window.setTimeout(() => {
        upsertObraSocial(obra);
        setSearchQuery("");
        setView("lista");
      }, REDIRECT_AFTER_SUCCESS_MS);
    },
    [upsertObraSocial, showToast]
  );

  const exportFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      estado: estadoParam,
    }),
    [debouncedSearch, estadoParam]
  );

  const hasExportFilters = useMemo(
    () => obrasSocialesExportHasActiveFilters(exportFilters),
    [exportFilters]
  );

  const handleExportObrasSociales = useCallback(async () => {
    const token = session?.accessToken;
    if (!token) {
      showToast("Sesión no válida. Volvé a iniciar sesión.", "error");
      return;
    }

    setExportingList(true);
    try {
      const count = await exportObrasSocialesWithFilters(token, exportFilters);
      if (count === 0) {
        showToast(
          "Sin obras sociales para exportar",
          "error",
          hasExportFilters
            ? "Ninguna obra social coincide con los filtros activos."
            : "No hay obras sociales registradas."
        );
        return;
      }
      showToast(
        "Listado exportado",
        "success",
        `${count} obra${count === 1 ? "" : "s"} social${count === 1 ? "" : "es"}${hasExportFilters ? " (filtros aplicados)" : ""}`
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

  if (!session) {
    return null;
  }

  const isListView = view === "lista";

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {isListView ? (
          <section className="min-w-0" aria-labelledby="obras-heading">
            <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                      <Building2 className="size-4 text-white" aria-hidden />
                    </span>
                    <CardTitle
                      id="obras-heading"
                      className="truncate text-base font-semibold text-white sm:text-lg"
                    >
                      Obras sociales
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={primaryButtonClass}
                    onClick={() => setView("formulario")}
                  >
                    <Plus className="size-4" />
                    <span className="sm:hidden">Nueva</span>
                    <span className="hidden sm:inline">Nueva obra social</span>
                  </Button>
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
                      placeholder="Buscar por nombre o código…"
                      disabled={loading}
                      aria-label="Buscar obras sociales"
                      className="h-10 border-medical-border/80 bg-background pl-9 text-sm shadow-sm"
                    />
                  </div>
                  <Select
                    value={estadoFilter}
                    onValueChange={(v) => setEstadoFilter(v as EstadoFilter)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-10 min-w-[9rem] border-medical-border/80 bg-background px-3 text-sm shadow-sm sm:w-[180px]"
                    >
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="inactive">Inactivas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 cursor-pointer border-medical-border/80 bg-background px-3 text-sm shadow-sm"
                    disabled={loading || exportingList}
                    onClick={() => void handleExportObrasSociales()}
                    title={
                      hasExportFilters
                        ? "Exportar obras sociales con los filtros activos"
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
                <ObrasSocialesDirectoryTable
                  items={obras}
                  filteredItems={filteredItems}
                  loading={loading}
                  error={error}
                  accessToken={session.accessToken}
                  onRetry={refresh}
                  onObraUpdated={upsertObraSocial}
                  onObraRemoved={removeObraSocial}
                  onNotify={(title, type, detail) => showToast(title, type, detail)}
                  onCreate={() => setView("formulario")}
                />
              </CardContent>
            </Card>
          </section>
        ) : (
          <section aria-label="Alta de obra social">
            <Card className="border-medical-border p-4 sm:p-6">
              <CreateObraSocialForm
                accessToken={session.accessToken}
                onCancel={() => setView("lista")}
                onSuccess={handleObraCreated}
              />
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
