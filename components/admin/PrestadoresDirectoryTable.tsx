"use client";

import type { ElementType, ReactNode, SyntheticEvent } from "react";
import { useState } from "react";
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FileText,
  IdCard,
  Layers,
  MoreHorizontal,
  RefreshCw,
  Search,
  Stethoscope,
  ToggleLeft,
  UserPlus,
  Wallet,
} from "lucide-react";
import { PrestadorDetailDialog } from "@/components/admin/PrestadorDetailDialog";
import { PrestadorEstadoCuentaDialog } from "@/components/admin/PrestadorEstadoCuentaDialog";
import { PrestadorServiciosEditDialog } from "@/components/admin/PrestadorServiciosEditDialog";
import {
  PrestadoresDirectoryCardsSkeleton,
  PrestadoresDirectoryTableSkeleton,
} from "@/components/skeletons/dashboard-skeletons";
import { Badge } from "@/components/ui/badge";
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
import {
  formatPrestadorHorasEnPeriodo,
  formatPrestadorVisitasCount,
  formatPrestadorVisitasResumen,
  formatRegimenIva,
  getPrestadorInitials,
} from "@/lib/prestadores-display";
import {
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
  accessToken?: string | null;
  onRetry: () => void;
  onCreate: () => void;
  onRefresh?: () => void;
};

const thClass =
  "h-11 px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6 sm:px-5";
const tdClass =
  "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5";

function PrestadoresTable({ children }: { children: ReactNode }) {
  return <Table className="w-full">{children}</Table>;
}

function ColumnHeader({
  icon: Icon,
  label,
  className,
  align = "left",
}: {
  icon: ElementType;
  label: string;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <TableHead className={cn(thClass, className)}>
      <span
        className={cn(
          "inline-flex items-center gap-2",
          align === "right" && "w-full justify-end"
        )}
      >
        <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
        {label}
      </span>
    </TableHead>
  );
}

type RowHandlers = {
  onOpenDetail: (row: PrestadorListItemDto) => void;
  onOpenCuenta: (row: PrestadorListItemDto) => void;
  onEditServicios?: (row: PrestadorListItemDto) => void;
};

function PrestadorRowActionsMenu({
  row,
  onOpenDetail,
  onOpenCuenta,
  onEditServicios,
  compact,
}: {
  row: PrestadorListItemDto;
  compact?: boolean;
} & RowHandlers) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "sm"}
          className={cn(
            "cursor-pointer border-medical-border text-medical-text hover:bg-medical-secondary",
            compact ? "h-8 gap-1 px-2.5 text-xs" : "h-8 gap-1.5 px-2.5 text-xs font-medium"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {compact ? <MoreHorizontal className="size-4" /> : null}
          {compact ? null : (
            <>
              Acciones
              <ChevronDown className="size-3.5 opacity-60" />
            </>
          )}
          {compact ? <span className="sr-only">Acciones de {row.nombre}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[120] w-52 border-medical-border bg-white p-1 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-medical-text">
          {row.nombre}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-medical-border" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => onOpenDetail(row)}
        >
          <Eye className="size-4 text-medical-primary" />
          Ver ficha
        </DropdownMenuItem>
        {onEditServicios ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
            onSelect={() => onEditServicios(row)}
          >
            <Layers className="size-4 text-medical-primary" />
            Gestionar servicios
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-lg focus:bg-medical-secondary"
          onSelect={() => onOpenCuenta(row)}
        >
          <Banknote className="size-4 text-medical-warning" />
          Estado de cuenta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PrestadorAvatar({ nombre }: { nombre: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground sm:size-10">
      {getPrestadorInitials(nombre)}
    </div>
  );
}

function PrestadorServiciosCell({
  servicios,
  onAgregar,
}: {
  servicios: PrestadorListItemDto["servicios"];
  onAgregar?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const stop = (e: SyntheticEvent) => e.stopPropagation();

  const chipClass =
    "inline-flex max-w-56 items-center truncate rounded-md bg-medical-primary/10 px-1.5 py-0.5 text-xs font-medium text-medical-primaryDark";

  const actionButtonClass =
    "inline-flex h-5 shrink-0 cursor-pointer items-center rounded-md border border-medical-border bg-white px-1.5 text-[11px] font-semibold leading-none text-medical-primary transition hover:bg-medical-secondary";

  if (servicios === undefined) {
    return <span className="text-xs text-medical-mutedText">—</span>;
  }

  if (servicios.length === 0) {
    if (!onAgregar) {
      return <span className="text-xs text-medical-mutedText">—</span>;
    }
    return (
      <div onClick={stop} onKeyDown={stop}>
        <button type="button" onClick={onAgregar} className={actionButtonClass}>
          + Agregar servicios
        </button>
      </div>
    );
  }

  const label = (s: NonNullable<typeof servicios>[number]) =>
    s.nombre?.trim() || `#${s.id}`;

  if (servicios.length === 1) {
    return (
      <div onClick={stop} onKeyDown={stop}>
        <div className="flex max-w-full flex-wrap items-center gap-1">
          <Stethoscope className="size-3.5 shrink-0 text-medical-primary/70" aria-hidden />
          <span className={chipClass} title={label(servicios[0])}>
            {label(servicios[0])}
          </span>
        </div>
      </div>
    );
  }

  const [first, ...rest] = servicios;

  return (
    <div
      className="max-w-[11rem] xl:max-w-[14rem]"
      onClick={stop}
      onKeyDown={stop}
    >
      <div className="flex flex-wrap items-center gap-1">
        <Stethoscope className="size-3.5 shrink-0 text-medical-primary/70" aria-hidden />
        <span className={chipClass} title={label(first)}>
          {label(first)}
        </span>
        {expanded
          ? rest.map((s) => (
              <span key={s.id} className={chipClass} title={label(s)}>
                {label(s)}
              </span>
            ))
          : null}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? "Ocultar servicios adicionales"
              : `Ver ${rest.length} servicio${rest.length === 1 ? "" : "s"} más`
          }
          className={actionButtonClass}
        >
          {expanded ? "−" : `+${rest.length}`}
        </button>
      </div>
    </div>
  );
}

function EstadoBadges({ row, compact }: { row: PrestadorListItemDto; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
      <Badge
        variant="outline"
        className={cn("font-normal", estadoActivoBadgeClass(row.estado))}
      >
        {row.estado ? "Activo" : "Inactivo"}
      </Badge>
      {!row.usuarioEstado ? (
        <Badge variant="outline" className={cn("font-normal", medicalNeutralBadge)}>
          Sin usuario
        </Badge>
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
  onEditServicios,
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
            <div className="flex shrink-0 gap-1">
              <PrestadorRowActionsMenu
                row={row}
                compact
                onOpenDetail={onOpenDetail}
                onOpenCuenta={onOpenCuenta}
                onEditServicios={onEditServicios}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-medical-mutedText">
            <span>{formatPrestadorVisitasResumen(cuenta)}</span>
            <span className="text-medical-border" aria-hidden>
              ·
            </span>
            <span className="font-medium text-medical-text">{row.documento}</span>
          </div>

          <div className="mt-2">
            <EstadoBadges row={row} compact />
          </div>

          <div className="mt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-medical-mutedText">
              Servicios habilitados
            </p>
            <PrestadorServiciosCell
              servicios={row.servicios}
              onAgregar={onEditServicios ? () => onEditServicios(row) : undefined}
            />
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
      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
        <ColumnHeader icon={Stethoscope} label="Profesional" />
        <ColumnHeader icon={IdCard} label="Doc. · Mat." className="hidden xl:table-cell" />
        <ColumnHeader icon={FileText} label="Fiscal" className="hidden 2xl:table-cell" />
        <ColumnHeader icon={Layers} label="Servicios" className="hidden xl:table-cell" />
        <ColumnHeader
          icon={ClipboardList}
          label="Visitas"
          className="w-[4.5rem] text-right"
          align="right"
        />
        <ColumnHeader
          icon={Wallet}
          label="Pagado"
          className="w-[6.5rem] text-right"
          align="right"
        />
        <ColumnHeader
          icon={CircleDollarSign}
          label="Debe"
          className="w-[6.5rem] text-right"
          align="right"
        />
        <ColumnHeader icon={ToggleLeft} label="Estado" className="hidden xl:table-cell" />
        <ColumnHeader
          icon={MoreHorizontal}
          label="Acciones"
          className="w-[7.5rem] text-right"
          align="right"
        />
      </TableRow>
    </TableHeader>
  );
}

function PrestadorRowDesktop({
  row,
  cuenta,
  onOpenDetail,
  onOpenCuenta,
  onEditServicios,
}: {
  row: PrestadorListItemDto;
  cuenta: PrestadorEstadoCuentaDto;
} & RowHandlers) {
  return (
    <TableRow className={cn(!row.estado && "opacity-90")}>
      <TableCell
        className={cn(tdClass, "max-w-[14rem] cursor-pointer xl:max-w-none")}
        onClick={() => onOpenDetail(row)}
      >
        <div className="flex items-center gap-3">
          <PrestadorAvatar nombre={row.nombre} />
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium leading-none text-foreground">{row.nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
            <p className="truncate text-xs text-muted-foreground xl:hidden">
              {row.documento} · {row.matricula}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell
        className={cn(tdClass, "hidden cursor-pointer xl:table-cell")}
        onClick={() => onOpenDetail(row)}
      >
        <div className="space-y-1">
          <p className="font-medium leading-none text-foreground">{row.documento}</p>
          <p className="text-xs text-muted-foreground">{row.matricula}</p>
        </div>
      </TableCell>

      <TableCell
        className={cn(tdClass, "hidden cursor-pointer 2xl:table-cell")}
        onClick={() => onOpenDetail(row)}
      >
        <div className="space-y-1.5">
          <p className="font-mono text-xs text-foreground">{row.cuit}</p>
          <Badge variant="outline" className="font-normal">
            {formatRegimenIva(row.regimenIva)}
          </Badge>
        </div>
      </TableCell>

      <TableCell className={cn(tdClass, "hidden xl:table-cell")}>
        <PrestadorServiciosCell
          servicios={row.servicios}
          onAgregar={onEditServicios ? () => onEditServicios(row) : undefined}
        />
      </TableCell>

      <TableCell
        className={cn(tdClass, "cursor-pointer text-right tabular-nums")}
        onClick={() => onOpenCuenta(row)}
      >
        <div className="space-y-1">
          <span
            className={cn(
              "font-medium",
              cuenta.cantidadVisitas > 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {formatPrestadorVisitasCount(cuenta.cantidadVisitas)}
          </span>
          {cuenta.cantidadVisitas > 0 ? (
            <p className="text-xs text-muted-foreground">
              {formatPrestadorHorasEnPeriodo(cuenta.horasTrabajadas)}
            </p>
          ) : null}
        </div>
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
        <div className="flex min-h-8 items-center justify-end">
          <PrestadorRowActionsMenu
            row={row}
            onOpenDetail={onOpenDetail}
            onOpenCuenta={onOpenCuenta}
            onEditServicios={onEditServicios}
          />
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
  accessToken = null,
  onRetry,
  onCreate,
  onRefresh,
}: PrestadoresDirectoryTableProps) {
  const [detailTarget, setDetailTarget] = useState<PrestadorListItemDto | null>(null);
  const [cuentaTarget, setCuentaTarget] = useState<PrestadorListItemDto | null>(null);
  const [serviciosTarget, setServiciosTarget] = useState<PrestadorListItemDto | null>(null);

  const handlers: RowHandlers = {
    onOpenDetail: setDetailTarget,
    onOpenCuenta: setCuentaTarget,
    ...(accessToken ? { onEditServicios: setServiciosTarget } : {}),
  };

  if (loading) {
    return (
      <>
        <PrestadoresDirectoryCardsSkeleton rows={5} />
        <div className="hidden lg:block">
          <PrestadoresTable>
            <TableHeaderRow />
            <PrestadoresDirectoryTableSkeleton rows={6} cellClassName={tdClass} />
          </PrestadoresTable>
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
        onEditServicios={
          accessToken
            ? (p) => {
                setDetailTarget(null);
                setServiciosTarget(p);
              }
            : undefined
        }
        onOpenCuenta={(p) => {
          setDetailTarget(null);
          setCuentaTarget(p);
        }}
      />
      <PrestadorServiciosEditDialog
        open={serviciosTarget != null}
        prestador={serviciosTarget}
        accessToken={accessToken}
        onClose={() => setServiciosTarget(null)}
        onUpdated={() => {
          setServiciosTarget(null);
          onRefresh?.();
        }}
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
        <PrestadoresTable>
          <TableHeaderRow />
          <TableBody>
            {filteredItems.map((row) => (
              <PrestadorRowDesktop
                key={row.id}
                row={row}
                cuenta={getPrestadorEstadoCuenta(row)}
                {...handlers}
              />
            ))}
          </TableBody>
        </PrestadoresTable>
      </div>
    </>
  );
}
