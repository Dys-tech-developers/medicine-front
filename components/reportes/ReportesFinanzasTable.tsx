"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useMemo, useState } from "react";
import {
  CalendarOff,
  Check,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  Receipt,
  RefreshCw,
} from "lucide-react";
import {
  VisitaFinanzasConfirmDialog,
  type VisitaFinanzasConfirmAction,
} from "@/components/admin/VisitaFinanzasConfirmDialog";
import { ReportesFinanzasTableSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import { updateVisitaFinanzasWithApi } from "@/lib/api/visitas";
import type {
  ReporteVisitaItemDto,
  UpdateVisitaFinanzasBody,
  VisitaDetailDto,
} from "@/lib/api/types";
import {
  formatReporteMonto,
  formatReporteVisitaFecha,
  getReporteVisitaPacienteInitials,
} from "@/lib/reportes-display";
import { MODALIDAD_COBRO_LABELS } from "@/lib/servicios-tarifas-labels";
import { VisitaFinanzasFlagCell } from "@/components/admin/VisitaFinanzasFlagCell";
import { VISITA_FINANZAS_UI } from "@/lib/visita-finanzas-labels";
import { cn } from "@/lib/utils";

function FinanzasTable({ children }: { children: ReactNode }) {
  return <Table className="min-w-[960px]">{children}</Table>;
}

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass = "px-4 py-3 align-middle first:pl-6 last:pr-6 sm:px-5";

function TableHeaderRow({
  canEdit,
  allPageSelected,
  onToggleSelectAllPage,
}: {
  canEdit: boolean;
  allPageSelected: boolean;
  onToggleSelectAllPage: () => void;
}) {
  const fac = VISITA_FINANZAS_UI.facturado;
  const pag = VISITA_FINANZAS_UI.pagado;

  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        {canEdit ? (
          <TableHead className={cn(thClass, "w-11")}>
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={onToggleSelectAllPage}
              aria-label="Seleccionar todas en esta página"
              className="size-4 rounded border-medical-border text-medical-primary"
            />
          </TableHead>
        ) : null}
        <TableHead className={thClass}>Fecha</TableHead>
        <TableHead className={thClass}>Paciente</TableHead>
        <TableHead className={cn(thClass, "hidden md:table-cell")}>Prestador</TableHead>
        <TableHead className={cn(thClass, "hidden lg:table-cell")}>Servicio</TableHead>
        <TableHead className={cn(thClass, "text-right")}>Monto</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>{fac.columna}</TableHead>
        <TableHead className={cn(thClass, "hidden sm:table-cell")}>{pag.columna}</TableHead>
        {canEdit ? (
          <TableHead className={cn(thClass, "w-14 text-right")}>
            <span className="sr-only">Acciones</span>
          </TableHead>
        ) : null}
      </TableRow>
    </TableHeader>
  );
}

type RowFinanzas = Pick<
  ReporteVisitaItemDto,
  "modalidadCobro" | "valorAplicado" | "facturado" | "pagado"
>;

function ReportesFinanzasRowActionsMenu({
  visitaId,
  pacienteNombre,
  finanzas,
  accessToken,
  onUpdated,
}: {
  visitaId: number;
  pacienteNombre: string;
  finanzas: RowFinanzas;
  accessToken: string;
  onUpdated: (updated: VisitaDetailDto) => void;
}) {
  const [saving, setSaving] = useState<VisitaFinanzasConfirmAction | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<VisitaFinanzasConfirmAction | null>(null);

  const facturado = finanzas.facturado;
  const pagado = finanzas.pagado;
  const isBusy = saving !== null;
  const allDone = facturado && pagado;
  const fac = VISITA_FINANZAS_UI.facturado;
  const pag = VISITA_FINANZAS_UI.pagado;

  const patch = async (body: UpdateVisitaFinanzasBody, key: VisitaFinanzasConfirmAction) => {
    setSaving(key);
    setError("");
    try {
      const updated = await updateVisitaFinanzasWithApi(accessToken, visitaId, body);
      onUpdated(updated);
      setPending(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el seguimiento."
      );
    } finally {
      setSaving(null);
    }
  };

  const handleConfirm = () => {
    if (!pending) return;
    if (pending === "facturado") void patch({ facturado: true }, "facturado");
    if (pending === "pagado") void patch({ pagado: true }, "pagado");
  };

  if (allDone) {
    return (
      <div className="flex min-h-9 items-center justify-end">
        <span
          className="inline-flex size-8 items-center justify-center rounded-lg text-medical-success"
          title={VISITA_FINANZAS_UI.cobroCompletado}
          aria-label={VISITA_FINANZAS_UI.ambosCompletos}
        >
          <Check className="size-4" aria-hidden />
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-9 items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 cursor-pointer p-0 text-medical-mutedText hover:bg-medical-secondary hover:text-medical-text"
              onClick={(e) => e.stopPropagation()}
              disabled={isBusy}
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
              <span className="sr-only">Acciones de {pacienteNombre}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-120 w-56 border-medical-border bg-white p-1 shadow-lg"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
              {pacienteNombre}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-medical-border" />
            {!facturado ? (
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
                onSelect={() => setPending("facturado")}
              >
                <Receipt className="size-4 text-medical-primary" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>Marcar {fac.estadoSi.toLowerCase()}</span>
                  <span className="text-[11px] font-normal text-medical-mutedText">
                    Seguimiento interno de facturación
                  </span>
                </span>
              </DropdownMenuItem>
            ) : null}
            {!pagado ? (
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
                onSelect={() => setPending("pagado")}
              >
                <CircleDollarSign className="size-4 text-medical-primary" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>Marcar {pag.estadoSi.toLowerCase()}</span>
                  <span className="text-[11px] font-normal text-medical-mutedText">
                    Registrar cobro al prestador
                  </span>
                </span>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <p className="mt-1 text-right text-[11px] leading-tight text-medical-danger">{error}</p>
      ) : null}

      <VisitaFinanzasConfirmDialog
        open={pending != null}
        action={pending}
        loading={isBusy}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!isBusy) {
            setPending(null);
            setError("");
          }
        }}
      />
    </>
  );
}

type Props = {
  items: ReporteVisitaItemDto[];
  loading: boolean;
  error: string;
  accessToken: string | null;
  canEdit: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (visitaId: number) => void;
  onToggleSelectAllPage: () => void;
  onItemsChange: (items: ReporteVisitaItemDto[]) => void;
  onRetry: () => void;
};

export function ReportesFinanzasTable({
  items,
  loading,
  error,
  accessToken,
  canEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllPage,
  onItemsChange,
  onRetry,
}: Props) {
  const allPageSelected = useMemo(
    () => items.length > 0 && items.every((v) => selectedIds.has(v.visitaId)),
    [items, selectedIds]
  );

  const handleRowUpdated = (visitaId: number, updated: VisitaDetailDto) => {
    const fin = updated.finanzas;
    if (!fin) return;
    onItemsChange(
      items.map((row) =>
        row.visitaId === visitaId
          ? { ...row, facturado: fin.facturado, pagado: fin.pagado }
          : row
      )
    );
  };

  if (loading && items.length === 0) {
    return (
      <FinanzasTable>
        <TableHeaderRow
          canEdit={canEdit}
          allPageSelected={false}
          onToggleSelectAllPage={onToggleSelectAllPage}
        />
        <ReportesFinanzasTableSkeleton rows={6} canEdit={canEdit} cellClassName={tdClass} />
      </FinanzasTable>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={ClipboardList}
          title="No se pudo cargar el reporte"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="bg-medical-primary hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-7">
        <EmptyState
          icon={CalendarOff}
          title="Sin visitas en este período"
          description="Probá ampliar el rango de fechas o quitar filtros de facturado y pagado."
        />
      </div>
    );
  }

  return (
    <FinanzasTable>
      <TableHeaderRow
        canEdit={canEdit}
        allPageSelected={allPageSelected}
        onToggleSelectAllPage={onToggleSelectAllPage}
      />
      <TableBody>
        {items.map((row) => {
          const nombre = `${row.pacienteNombre} ${row.pacienteApellido}`.trim();
          const initials = getReporteVisitaPacienteInitials(row.pacienteNombre, row.pacienteApellido);
          const { fecha, hora } = formatReporteVisitaFecha(row.fechaInicio);
          const selected = selectedIds.has(row.visitaId);
          const modalidad =
            MODALIDAD_COBRO_LABELS[row.modalidadCobro] ?? row.modalidadCobro;

          return (
            <TableRow
              key={row.visitaId}
              className={cn(
                "group transition-colors hover:bg-medical-secondary/30",
                selected && "bg-medical-primary/5"
              )}
            >
              {canEdit ? (
                <TableCell className={tdClass}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(row.visitaId)}
                    className="size-4 rounded border-medical-border text-medical-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              ) : null}

              <TableCell className={tdClass}>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium leading-snug text-foreground">{fecha}</p>
                  {hora ? <p className="text-xs text-muted-foreground">{hora}</p> : null}
                </div>
              </TableCell>

              <TableCell className={tdClass}>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-medical-secondary text-xs font-semibold text-medical-primary ring-1 ring-medical-border transition group-hover:ring-medical-primary/40">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-snug text-foreground">
                      {nombre}
                    </p>
                    {row.numeroDocumento ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        DNI {row.numeroDocumento}
                      </p>
                    ) : null}
                    <div className="mt-1 space-y-1 md:hidden">
                      <p className="text-xs text-muted-foreground">{row.prestadorNombre}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <VisitaFinanzasFlagCell flag="facturado" value={row.facturado} />
                        <VisitaFinanzasFlagCell flag="pagado" value={row.pagado} />
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                <p className="text-sm font-medium leading-snug text-foreground">
                  {row.prestadorNombre}
                </p>
              </TableCell>

              <TableCell className={cn(tdClass, "hidden lg:table-cell")}>
                <div className="min-w-0 space-y-0.5">
                  <p
                    className="max-w-48 truncate text-sm font-medium leading-snug text-foreground"
                    title={row.servicioNombre}
                  >
                    {row.servicioNombre}
                  </p>
                  <p className="text-xs text-muted-foreground">{modalidad}</p>
                </div>
              </TableCell>

              <TableCell className={cn(tdClass, "text-right")}>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatReporteMonto(row.valorAplicado)}
                </p>
              </TableCell>

              <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                <VisitaFinanzasFlagCell flag="facturado" value={row.facturado} />
              </TableCell>

              <TableCell className={cn(tdClass, "hidden sm:table-cell")}>
                <VisitaFinanzasFlagCell flag="pagado" value={row.pagado} />
              </TableCell>

              {canEdit && accessToken ? (
                <TableCell
                  className={cn(tdClass, "text-right")}
                  onClick={(e: SyntheticEvent) => e.stopPropagation()}
                  onPointerDown={(e: SyntheticEvent) => e.stopPropagation()}
                >
                  <ReportesFinanzasRowActionsMenu
                    visitaId={row.visitaId}
                    pacienteNombre={nombre}
                    finanzas={{
                      modalidadCobro: row.modalidadCobro,
                      valorAplicado: row.valorAplicado,
                      facturado: row.facturado,
                      pagado: row.pagado,
                    }}
                    accessToken={accessToken}
                    onUpdated={(updated) => handleRowUpdated(row.visitaId, updated)}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </FinanzasTable>
  );
}
