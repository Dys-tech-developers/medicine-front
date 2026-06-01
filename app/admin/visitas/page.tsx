"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VisitasDirectoryTable } from "@/components/admin/VisitasDirectoryTable";
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
import type { VisitaDetailDto } from "@/lib/api/types";
import { loadAuthSession, type AuthSession } from "@/lib/auth-session";
import { useVisitasList } from "@/lib/hooks/use-visitas-list";
import { matchesVisitaSearch } from "@/lib/visitas-display";

export default function AdminVisitasPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const parsed = loadAuthSession();
    if (!parsed || parsed.role !== "admin") {
      window.location.assign("/login");
      return;
    }
    setSession(parsed);
  }, []);

  const { items, total, loading, error, refresh, setListData } = useVisitasList({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session),
    page,
    pageSize,
  });

  const handleVisitaUpdated = (updated: VisitaDetailDto) => {
    setListData({
      items: items.map((row) =>
        row.id === updated.id
          ? { ...row, finanzas: updated.finanzas ?? row.finanzas }
          : row
      ),
      total,
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const filteredItems = useMemo(
    () => items.filter((row) => matchesVisitaSearch(row, searchQuery)),
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
    <div className="relative z-0 w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
      <section className="min-w-0" aria-labelledby="visitas-directory-heading">
        <Card className="overflow-hidden border-medical-border py-0 shadow-md ring-medical-border/50">
          <CardHeader className="gap-0 border-b border-medical-border bg-medical-primary px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <ClipboardList className="size-5 text-white" />
              </span>
              <div className="min-w-0 space-y-2">
                <CardTitle
                  id="visitas-directory-heading"
                  className="text-lg font-semibold text-white sm:text-xl"
                >
                  Visitas registradas
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-relaxed text-white/85">
                  Historial de visitas médicas: paciente, prestador, fecha, duración y
                  prestación. Buscá por nombre, documento, prestador u observaciones en la
                  página actual.
                </CardDescription>
              </div>
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
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="visitas-page-size"
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
                      id="visitas-page-size"
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
            <VisitasDirectoryTable
              items={items}
              filteredItems={filteredItems}
              loading={loading}
              error={error}
              accessToken={session?.accessToken ?? null}
              onRetry={refresh}
              onVisitaUpdated={handleVisitaUpdated}
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
    </div>
  );
}
