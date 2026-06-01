"use client";

import { useState } from "react";
import {
  Banknote,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { PrestadorDetailDialog } from "@/components/admin/PrestadorDetailDialog";
import { PrestadorEstadoCuentaDialog } from "@/components/admin/PrestadorEstadoCuentaDialog";
import {
  PrestadoresDirectoryCardsSkeleton,
  PrestadoresDirectoryTableSkeleton,
} from "@/components/skeletons/dashboard-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PrestadorEstadoCuentaDto, PrestadorListItemDto, ReportesMetaDto } from "@/lib/api/types";
import {
  estadoActivoBadgeClass,
  medicalNeutralBadge,
  medicalSuccessBox,
  medicalWarningBox,
} from "@/lib/medical-ui-classes";
import {
  getPrestadorEstadoCuenta,
  prestadorMontoTieneSaldo,
} from "@/lib/prestadores-estado-cuenta";
import { formatRegimenIva, getPrestadorInitials } from "@/lib/prestadores-display";
import {
  formatReporteHoras,
  formatReporteMonto,
  formatReporteMontoCompact,
} from "@/lib/reportes-display";
import { cn } from "@/lib/utils";

function montoTextClass(kind: "pagado" | "debe", value: string): string {
  const tieneSaldo = prestadorMontoTieneSaldo(value);
  if (kind === "pagado") {
    return tieneSaldo ? "text-medical-success" : "text-medical-mutedText";
  }
  return tieneSaldo ? "text-medical-warning" : "text-medical-mutedText";
}

export type PrestadoresDirectoryTableProps = {
  items: PrestadorListItemDto[];
  filteredItems: PrestadorListItemDto[];
  loading: boolean;
  error: string;
  meta: ReportesMetaDto | null;
  onRetry: () => void;
  onCreate: () => void;
};

const thClass =
  "px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-medical-primaryDark first:pl-5 last:pr-4 xl:px-4 xl:first:pl-6 xl:last:pr-5";
const tdClass = "px-3 py-3.5 align-middle first:pl-5 last:pr-4 xl:px-4 xl:first:pl-6 xl:last:pr-5";

type RowHandlers = {
  onOpenDetail: (row: PrestadorListItemDto) => void;
  onOpenCuenta: (row: PrestadorListItemDto) => void;
};

function PrestadorAvatar({ nombre }: { nombre: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-medical-secondary to-white text-xs font-bold text-medical-primary ring-1 ring-medical-primary/12 sm:size-9">
      {getPrestadorInitials(nombre)}
    </div>
  );
}

function EstadoBadges({ row, compact }: { row: PrestadorListItemDto; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none",
          estadoActivoBadgeClass(row.estado)
        )}
      >
        {row.estado ? "Activo" : "Inactivo"}
      </span>
      {!row.usuarioEstado ? (
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none",
            medicalNeutralBadge
          )}
        >
          Sin usuario
        </span>
      ) : null}
    </div>
  );
}

function MontoTile({
  kind,
  label,
  value,
  onClick,
  compact,
}: {
  kind: "pagado" | "debe";
  label: string;
  value: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col rounded-lg border px-3 py-2.5 text-left transition-colors",
        kind === "pagado"
          ? cn(medicalSuccessBox, "hover:bg-medical-success/15")
          : cn(medicalWarningBox, "hover:bg-medical-warning/15")
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-medical-mutedText">
        {label}
      </span>
      <span
        className={cn(
          "mt-0.5 truncate tabular-nums font-semibold",
          compact ? "text-sm" : "text-base",
          montoTextClass(kind, value)
        )}
      >
        {compact ? formatReporteMontoCompact(value) : formatReporteMonto(value)}
      </span>
    </button>
  );
}

function PrestadorCuentaResumen({
  cuenta,
  onOpenCuenta,
  compact,
}: {
  cuenta: PrestadorEstadoCuentaDto;
  onOpenCuenta: () => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MontoTile
        kind="pagado"
        label="Pagado"
        value={cuenta.montoPagado}
        onClick={onOpenCuenta}
        compact={compact}
      />
      <MontoTile
        kind="debe"
        label="Debe"
        value={cuenta.montoPendiente}
        onClick={onOpenCuenta}
        compact={compact}
      />
    </div>
  );
}

function PrestadorRowCard({
  row,
  cuenta,
  onOpenDetail,
  onOpenCuenta,
}: {
  row: PrestadorListItemDto;
  cuenta: PrestadorEstadoCuentaDto;
} & RowHandlers) {
  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex gap-3">
        <PrestadorAvatar nombre={row.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => onOpenDetail(row)}
            >
              <p className="font-semibold leading-snug text-medical-text">{row.nombre}</p>
              <p className="mt-0.5 truncate text-xs text-medical-mutedText">{row.email}</p>
            </button>
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                aria-label={`Cuenta de ${row.nombre}`}
                className="rounded-lg p-2 text-medical-mutedText transition-colors hover:bg-medical-warning/15 hover:text-medical-warning"
                onClick={() => onOpenCuenta(row)}
              >
                <Banknote className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Ficha de ${row.nombre}`}
                className="rounded-lg p-2 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
                onClick={() => onOpenDetail(row)}
              >
                <Eye className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-medical-mutedText">
            <span>
              {cuenta.cantidadVisitas} visita{cuenta.cantidadVisitas === 1 ? "" : "s"} ·{" "}
              {formatReporteHoras(cuenta.horasTrabajadas)}
            </span>
            <span className="text-medical-border" aria-hidden>
              ·
            </span>
            <span className="font-medium text-medical-text">{row.documento}</span>
          </div>

          <div className="mt-2">
            <EstadoBadges row={row} compact />
          </div>

          <div className="mt-3">
            <PrestadorCuentaResumen cuenta={cuenta} onOpenCuenta={() => onOpenCuenta(row)} compact />
          </div>

          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-medical-border/80 bg-white py-2 text-xs font-semibold text-medical-primaryDark transition-colors hover:bg-medical-secondary/50"
            onClick={() => onOpenCuenta(row)}
          >
            Ver detalle financiero
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
        <TableHead className={thClass}>Profesional</TableHead>
        <TableHead className={cn(thClass, "hidden xl:table-cell")}>Doc. · Mat.</TableHead>
        <TableHead className={cn(thClass, "hidden 2xl:table-cell")}>Fiscal</TableHead>
        <TableHead className={cn(thClass, "w-[4.5rem] text-right")}>Visitas</TableHead>
        <TableHead className={cn(thClass, "w-[6.5rem] text-right")}>Pagado</TableHead>
        <TableHead className={cn(thClass, "w-[6.5rem] text-right")}>Debe</TableHead>
        <TableHead className={cn(thClass, "hidden xl:table-cell")}>Estado</TableHead>
        <TableHead className={cn(thClass, "w-16 text-right")}>
          <span className="sr-only">Acciones</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function PrestadorRowDesktop({
  row,
  cuenta,
  index,
  onOpenDetail,
  onOpenCuenta,
}: {
  row: PrestadorListItemDto;
  cuenta: PrestadorEstadoCuentaDto;
  index: number;
} & RowHandlers) {
  return (
    <TableRow
      className={cn(
        "transition-colors hover:bg-medical-secondary/50",
        index % 2 === 1 && "bg-medical-secondary/20",
        !row.estado && "opacity-90"
      )}
    >
      <TableCell className={cn(tdClass, "max-w-[14rem] cursor-pointer xl:max-w-none")} onClick={() => onOpenDetail(row)}>
        <div className="flex items-center gap-3">
          <PrestadorAvatar nombre={row.nombre} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-medical-text">{row.nombre}</p>
            <p className="truncate text-xs text-medical-mutedText">{row.email}</p>
            <p className="mt-1 truncate text-xs text-medical-mutedText xl:hidden">
              {row.documento} · {row.matricula}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell
        className={cn(tdClass, "hidden cursor-pointer xl:table-cell")}
        onClick={() => onOpenDetail(row)}
      >
        <p className="font-medium text-medical-text">{row.documento}</p>
        <p className="mt-0.5 text-xs text-medical-mutedText">{row.matricula}</p>
      </TableCell>

      <TableCell
        className={cn(tdClass, "hidden cursor-pointer 2xl:table-cell")}
        onClick={() => onOpenDetail(row)}
      >
        <p className="font-mono text-xs text-medical-text">{row.cuit}</p>
        <span className="mt-1 inline-block rounded-md border border-medical-primary/20 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-medical-primaryDark">
          {formatRegimenIva(row.regimenIva)}
        </span>
      </TableCell>

      <TableCell
        className={cn(tdClass, "cursor-pointer text-right tabular-nums")}
        onClick={() => onOpenCuenta(row)}
      >
        <span className="font-medium text-medical-text">{cuenta.cantidadVisitas}</span>
        <p className="text-[11px] text-medical-mutedText">{formatReporteHoras(cuenta.horasTrabajadas)}</p>
      </TableCell>

      <TableCell
        className={cn(
          tdClass,
          "cursor-pointer text-right text-sm tabular-nums",
          montoTextClass("pagado", cuenta.montoPagado)
        )}
        onClick={() => onOpenCuenta(row)}
      >
        <span className="font-semibold">{formatReporteMontoCompact(cuenta.montoPagado)}</span>
      </TableCell>

      <TableCell
        className={cn(
          tdClass,
          "cursor-pointer text-right text-sm tabular-nums",
          montoTextClass("debe", cuenta.montoPendiente)
        )}
        onClick={() => onOpenCuenta(row)}
      >
        <span className="font-semibold">{formatReporteMontoCompact(cuenta.montoPendiente)}</span>
      </TableCell>

      <TableCell
        className={cn(tdClass, "hidden cursor-pointer xl:table-cell")}
        onClick={() => onOpenDetail(row)}
      >
        <EstadoBadges row={row} />
      </TableCell>

      <TableCell className={cn(tdClass, "text-right")}>
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label={`Estado de cuenta de ${row.nombre}`}
            className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-warning/15 hover:text-medical-warning"
            onClick={() => onOpenCuenta(row)}
          >
            <Banknote className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Ver datos del prestador"
            className="rounded-lg p-1.5 text-medical-mutedText transition-colors hover:bg-medical-primary/10 hover:text-medical-primary"
            onClick={() => onOpenDetail(row)}
          >
            <Eye className="size-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PrestadoresDirectoryTable({
  items,
  filteredItems,
  loading,
  error,
  meta,
  onRetry,
  onCreate,
}: PrestadoresDirectoryTableProps) {
  const [detailTarget, setDetailTarget] = useState<PrestadorListItemDto | null>(null);
  const [cuentaTarget, setCuentaTarget] = useState<PrestadorListItemDto | null>(null);

  const handlers: RowHandlers = {
    onOpenDetail: setDetailTarget,
    onOpenCuenta: setCuentaTarget,
  };

  if (loading) {
    return (
      <>
        <PrestadoresDirectoryCardsSkeleton rows={5} />
        <div className="hidden lg:block">
          <Table className="w-full">
            <TableHeaderRow />
            <PrestadoresDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
          </Table>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-7">
        <EmptyState
          variant="error"
          icon={Stethoscope}
          title="No se pudo cargar el directorio"
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              className="cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
            >
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-7">
        <EmptyState
          icon={Stethoscope}
          title="No hay prestadores"
          description="Todavía no hay registros. Podés dar de alta el primero desde el formulario."
          action={
            <Button
              type="button"
              onClick={onCreate}
              className="cursor-pointer bg-medical-primary hover:bg-medical-primaryDark"
            >
              <UserPlus className="size-4" />
              Dar de alta
            </Button>
          }
        />
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-7">
        <EmptyState
          icon={Search}
          title="Sin coincidencias"
          description="Probá con otro término o navegá a otra página del listado."
        />
      </div>
    );
  }

  return (
    <>
      <PrestadorDetailDialog
        open={detailTarget != null}
        prestador={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
      <PrestadorEstadoCuentaDialog
        open={cuentaTarget != null}
        prestador={cuentaTarget}
        meta={meta}
        onClose={() => setCuentaTarget(null)}
      />

      {/* Móvil / tablet: cards sin scroll horizontal */}
      <ul className="divide-y divide-medical-border/60 lg:hidden" aria-label="Listado de prestadores">
        {filteredItems.map((row) => (
          <li key={row.id}>
            <PrestadorRowCard
              row={row}
              cuenta={getPrestadorEstadoCuenta(row)}
              {...handlers}
            />
          </li>
        ))}
      </ul>

      {/* Desktop: tabla fluida */}
      <div className="hidden lg:block">
        <Table className="w-full">
          <TableHeaderRow />
          <TableBody>
            {filteredItems.map((row, index) => (
              <PrestadorRowDesktop
                key={row.id}
                row={row}
                cuenta={getPrestadorEstadoCuenta(row)}
                index={index}
                {...handlers}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
