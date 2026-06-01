"use client";

import { Layers, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreateServicioForm } from "@/components/admin/CreateServicioForm";
import { ServiciosDirectoryTable } from "@/components/admin/ServiciosDirectoryTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import type { ServicioConTarifasDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useServiciosList } from "@/lib/hooks/use-servicios-list";

type PageView = "lista" | "formulario";

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

export default function AdminServiciosPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [view, setView] = useState<PageView>("lista");
  const [searchQuery, setSearchQuery] = useState("");
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

  if (!session) {
    return null;
  }

  const isListView = view === "lista";

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {isListView ? (
          <section className="min-w-0" aria-labelledby="servicios-heading">
            <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                      <Layers className="size-5 text-white" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <CardTitle
                        id="servicios-heading"
                        className="text-lg font-semibold text-white sm:text-xl"
                      >
                        Servicios
                      </CardTitle>
                      <CardDescription className="max-w-2xl text-sm leading-relaxed text-white/85">
                        Catálogo de tipos de atención que pueden asignarse a pacientes. Los
                        servicios inactivos no estarán disponibles para nuevas asignaciones.
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
                    Nuevo servicio
                  </Button>
                </div>
              </CardHeader>

              <div className="border-b border-medical-border/80 bg-medical-surface/50 px-5 py-4 sm:px-7">
                <div className="relative max-w-lg">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medical-mutedText" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar servicio por nombre…"
                    className="h-10 border-medical-border/80 bg-background pl-9 shadow-sm"
                  />
                </div>
              </div>

              <CardContent className="p-0">
                <ServiciosDirectoryTable
                  items={servicios}
                  filteredItems={servicios}
                  loading={loading}
                  error={error}
                  accessToken={session.accessToken}
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
