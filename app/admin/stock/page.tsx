"use client";

import { Boxes, ChevronLeft, ChevronRight, PackagePlus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateInsumoForm } from "@/components/admin/CreateInsumoForm";
import { InsumosStockTable } from "@/components/admin/InsumosStockTable";
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
import { Switch } from "@/components/ui/switch";
import { ToastStack } from "@/components/ui/toast-stack";
import { useToast } from "@/components/ui/use-toast";
import type { InsumoDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useInsumosList } from "@/lib/hooks/use-insumos-list";
import { matchesInsumoSearch } from "@/lib/insumos-display";

type PageView = "lista" | "formulario";

const REDIRECT_AFTER_SUCCESS_MS = 2400;

const primaryButtonClass =
  "bg-white text-medical-primary hover:scale-105 transition-all duration-300 shadow-md shadow-medical-primary/20";

export default function AdminStockPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<PageView>("lista");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);
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

  const isListView = view === "lista";

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const filteredItems = useMemo(
    () => items.filter((row) => matchesInsumoSearch(row, searchQuery)),
    [items, searchQuery]
  );

  const isFiltering = searchQuery.trim().length > 0;

  const paginationHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (soloBajoStock) return "Filtro: solo stock bajo o sin stock.";
    if (isFiltering) {
      return filteredItems.length === 0
        ? "Sin coincidencias en esta página."
        : `${filteredItems.length} coincidencia${filteredItems.length === 1 ? "" : "s"} en esta página`;
    }
    if (total === 0) return "Sin registros.";
    return `Mostrando ${rangeStart}–${rangeEnd} de ${total}`;
  }, [loading, soloBajoStock, isFiltering, filteredItems.length, total, rangeStart, rangeEnd]);

  const handlePageSizeChange = (next: string) => {
    setPageSize(Number(next));
    setPage(1);
  };

  const handleBajoStockChange = (checked: boolean) => {
    setSoloBajoStock(checked);
    setPage(1);
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {isListView ? (
          <section className="min-w-0" aria-labelledby="insumos-stock-heading">
            <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
              <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                      <Boxes className="size-5 text-white" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <CardTitle
                        id="insumos-stock-heading"
                        className="text-lg font-semibold text-white sm:text-xl"
                      >
                        Stock de insumos
                      </CardTitle>
                      <CardDescription className="max-w-2xl text-sm leading-relaxed text-white/85">
                        Inventario, alta de insumos y ajuste de stock. Usá el filtro para ver solo
                        insumos con stock bajo o agotado.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="default"
                    className={primaryButtonClass + " cursor-pointer"}
                    onClick={() => setView("formulario")}
                  >
                    <PackagePlus className="size-4" />
                    Nuevo insumo
                  </Button>
                </div>
              </CardHeader>

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
                    <div className="flex items-center gap-3 rounded-xl border border-medical-border/80 bg-background px-3 py-2 shadow-sm">
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
                        Solo stock bajo
                      </Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="stock-page-size"
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
                          id="stock-page-size"
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
                <InsumosStockTable
                  items={items}
                  filteredItems={filteredItems}
                  loading={loading}
                  error={error}
                  onRetry={refresh}
                  onCreate={() => setView("formulario")}
                  accessToken={session?.accessToken ?? null}
                  onUpdated={handleInsumoUpdated}
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
