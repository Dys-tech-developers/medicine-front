"use client";

import { Building2, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateObraSocialForm } from "@/components/admin/CreateObraSocialForm";
import { ObrasSocialesDirectoryTable } from "@/components/admin/ObrasSocialesDirectoryTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import type { ObraSocialListItemDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useObrasSocialesList } from "@/lib/hooks/use-obras-sociales-list";

type PageView = "lista" | "formulario";
type EstadoFilter = "all" | "active" | "inactive";

const REDIRECT_AFTER_SUCCESS_MS = 2400;

const primaryButtonClass =
  "bg-white text-medical-primary cursor-pointer hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

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
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                      <Building2 className="size-5 text-white" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <CardTitle
                        id="obras-heading"
                        className="text-lg font-semibold text-white sm:text-xl"
                      >
                        Obras sociales
                      </CardTitle>
                      <CardDescription className="max-w-2xl text-sm leading-relaxed text-white/85">
                        Catálogo de coberturas para asignar al alta de pacientes. Las inactivas no
                        aparecen en el selector de nuevos pacientes.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="default"
                    className={primaryButtonClass}
                    onClick={() => setView("formulario")}
                  >
                    <Plus className="size-4" />
                    Nueva obra social
                  </Button>
                </div>
              </CardHeader>

              <div className="flex flex-col gap-3 border-b border-medical-border/80 bg-medical-surface/50 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                <div className="relative max-w-lg flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medical-mutedText" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o código…"
                    className="h-10 border-medical-border/80 bg-background pl-9 shadow-sm"
                  />
                </div>
                <Select
                  value={estadoFilter}
                  onValueChange={(v) => setEstadoFilter(v as EstadoFilter)}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-10 border-medical-border/80 bg-background sm:w-[180px]"
                  >
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
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
