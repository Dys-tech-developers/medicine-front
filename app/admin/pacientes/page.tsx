"use client";

import { ChevronLeft, ChevronRight, Search, User, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignPacienteServicioDialog } from "@/components/admin/AssignPacienteServicioDialog";
import { CreateHistoriaClinicaDialog } from "@/components/admin/CreateHistoriaClinicaDialog";
import { CreatePacienteForm } from "@/components/admin/CreatePacienteForm";
import { PacienteHistoriaClinicaPromptDialog } from "@/components/admin/PacienteHistoriaClinicaPromptDialog";
import { PacienteQrLookupPanel } from "@/components/admin/PacienteQrLookupPanel";
import { PacientesDirectoryTable } from "@/components/admin/PacientesDirectoryTable";
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
import type { HistoriaClinicaDto, PacienteDto, PacienteServicioDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { usePacientesList } from "@/lib/hooks/use-pacientes-list";
import { getPacienteNombre, matchesPacienteSearch } from "@/lib/pacientes-display";

type PageView = "lista" | "formulario";

const primaryButtonClass =
  "bg-[#fff] cursor-pointer text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

export default function AdminPacientesPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<PageView>("lista");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [postCreatePaciente, setPostCreatePaciente] = useState<PacienteDto | null>(null);
  const [showHistoriaForm, setShowHistoriaForm] = useState(false);
  const [showServicioForm, setShowServicioForm] = useState(false);
  const [historiaStatusKey, setHistoriaStatusKey] = useState(0);
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
      setPostCreatePaciente(paciente);
    },
    [showToast]
  );

  const handleHistoriaCreated = useCallback(
    (historia: HistoriaClinicaDto) => {
      showToast(
        "Historia clínica registrada",
        "success",
        `${historia.paciente.nombre} ${historia.paciente.apellido}`.trim()
      );
      openServicioStep();
    },
    [openServicioStep, showToast]
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
    () => items.filter((row) => matchesPacienteSearch(row, searchQuery)),
    [items, searchQuery]
  );

  const isFiltering = searchQuery.trim().length > 0;

  const paginationHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (isFiltering) {
      return filteredItems.length === 0
        ? "Sin coincidencias en esta página."
        : `${filteredItems.length} coincidencia${filteredItems.length === 1 ? "" : "s"} en esta página`;
    }
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [loading, isFiltering, filteredItems.length, total, rangeStart, rangeEnd]);

  const handlePageSizeChange = (next: string) => {
    setPageSize(Number(next));
    setPage(1);
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <PacienteHistoriaClinicaPromptDialog
        open={postCreatePaciente != null && !showHistoriaForm && !showServicioForm}
        paciente={postCreatePaciente}
        onConfirm={() => setShowHistoriaForm(true)}
        onDecline={openServicioStep}
      />
      <CreateHistoriaClinicaDialog
        open={postCreatePaciente != null && showHistoriaForm}
        paciente={postCreatePaciente}
        accessToken={session?.accessToken ?? null}
        onClose={openServicioStep}
        onSuccess={handleHistoriaCreated}
      />
      <AssignPacienteServicioDialog
        open={postCreatePaciente != null && showServicioForm}
        paciente={postCreatePaciente}
        accessToken={session?.accessToken ?? null}
        dismissLabel="Omitir por ahora"
        onFinish={finishPostCreateFlow}
        onAssigned={handleServicioAssigned}
      />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      {isListView ? (
        <section className="min-w-0" aria-labelledby="pacientes-directory-heading">
          <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
            <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <User className="size-5 text-white" />
                  </span>
                  <div className="min-w-0 space-y-2">
                    <CardTitle
                      id="pacientes-directory-heading"
                      className="text-lg font-semibold text-white sm:text-xl"
                    >
                      Pacientes
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-sm leading-relaxed text-white/85">
                      Directorio de pacientes, alta de nuevos registros y búsqueda por escaneo QR
                      (PAC-000001).
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  size="default"
                  className={primaryButtonClass}
                  onClick={() => setView("formulario")}
                >
                  <UserPlus className="size-4" />
                  Nuevo paciente
                </Button>
              </div>
            </CardHeader>

            <PacienteQrLookupPanel accessToken={session?.accessToken ?? null} />

            <div className="border-b border-medical-border/80 bg-medical-surface/50 px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="relative min-w-0 flex-1 lg:max-w-lg">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-medical-mutedText" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en esta página…"
                    disabled={loading}
                    className="h-10 border-medical-border/80 bg-background pl-9 shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="pacientes-page-size"
                      className="shrink-0 text-sm font-medium text-medical-text"
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
