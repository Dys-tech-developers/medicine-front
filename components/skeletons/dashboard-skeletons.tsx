import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-medical-border bg-medical-card p-6 shadow-sm"
        >
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-medical-border bg-medical-card p-6 shadow-sm sm:col-span-2">
      <Skeleton className="mb-4 h-5 w-44" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

/** Lista de visitas en el resumen del dashboard admin. */
export function VisitFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul
      className="divide-y divide-medical-border/80"
      aria-busy="true"
      aria-label="Cargando visitas"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
            i % 2 === 1 ? "bg-white/55" : "bg-transparent"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36 max-w-[70%]" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pl-12 sm:block sm:shrink-0 sm:pl-0 sm:text-right">
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tabla inventario admin: insumo, stock, vencimiento, estado, acciones. */
export function InsumosStockTableSkeleton({
  rows = 6,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
  canSelect = false,
}: {
  rows?: number;
  cellClassName?: string;
  canSelect?: boolean;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          {canSelect ? (
            <td className={cellClassName}>
              <Skeleton className="size-4 rounded" />
            </td>
          ) : null}
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-1 w-28 rounded-full" />
          </td>
          <td className={cn(cellClassName, "hidden md:table-cell")}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-1 h-3 w-24" />
          </td>
          <td className={cn(cellClassName, "hidden lg:table-cell")}>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-1 h-3 w-12" />
          </td>
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function StockListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-medical-border/80">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "flex items-center gap-3 border-l-2 border-l-medical-border px-4 py-3.5 sm:gap-4 sm:px-5",
            i % 2 === 1 && "bg-medical-secondary/10"
          )}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="shrink-0 space-y-1.5 text-right">
            <Skeleton className="ml-auto h-5 w-10" />
            <Skeleton className="ml-auto h-3 w-14" />
          </div>
          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
        </li>
      ))}
    </ul>
  );
}

/** Lista de prestadores en el resumen del dashboard admin (mismo layout que PrestadorItem). */
export function PrestadoresListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-medical-border/60 bg-medical-surface/20">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-3 sm:px-5",
            i % 2 === 1 && "bg-medical-secondary/20"
          )}
        >
          <Skeleton className="size-8 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="hidden h-3 w-44 sm:block" />
          </div>
          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function PrestadoresTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <tbody className="divide-y divide-medical-border/80">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className={i % 2 === 1 ? "bg-medical-secondary/25" : "bg-white"}>
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-5 py-3.5">
            <Skeleton className="h-4 w-40" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Tabla directorio admin: paciente, documento, contacto, afiliación, acciones. */
export function PacientesDirectoryTableSkeleton({
  rows = 5,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden md:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-20" />
          </td>
          <td className={cn(cellClassName, "hidden lg:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-36" />
          </td>
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-20" />
          </td>
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end">
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Tabla liquidación / finanzas: visita, prestador, montos, acciones. */
export function ReportesFinanzasTableSkeleton({
  rows = 6,
  canEdit = false,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  canEdit?: boolean;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          {canEdit ? (
            <td className={cellClassName}>
              <Skeleton className="size-4 rounded" />
            </td>
          ) : null}
          <td className={cellClassName}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-14" />
          </td>
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden md:table-cell")}>
            <Skeleton className="h-4 w-28" />
          </td>
          <td className={cn(cellClassName, "hidden lg:table-cell")}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-20" />
          </td>
          <td className={cn(cellClassName, "text-right")}>
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className={cellClassName}>
            <Skeleton className="h-4 w-16" />
          </td>
          <td className={cellClassName}>
            <Skeleton className="h-4 w-16" />
          </td>
          {canEdit ? (
            <td className={cellClassName}>
              <div className="flex min-h-8 items-center justify-end">
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </td>
          ) : null}
        </tr>
      ))}
    </tbody>
  );
}

/** Tabla directorio admin: paciente, prestador, fecha, duración, prestación, insumos. */
export function VisitasDirectoryTableSkeleton({
  rows = 6,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          {/* Paciente */}
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          {/* Prestador */}
          <td className={cn(cellClassName, "hidden md:table-cell")}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </td>
          {/* Fecha */}
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-16" />
          </td>
          {/* Duración */}
          <td className={cellClassName}>
            <Skeleton className="h-6 w-20 rounded-lg" />
          </td>
          {/* Estado */}
          <td className={cellClassName}>
            <Skeleton className="h-6 w-24 rounded-md" />
          </td>
          {/* Prestación */}
          <td className={cn(cellClassName, "hidden lg:table-cell")}>
            <Skeleton className="h-4 w-28" />
          </td>
          {/* Seguimiento */}
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end">
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </td>
          {/* Detalle */}
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Listado en cards (prestadores, móvil). */
export function PrestadoresDirectoryCardsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-medical-border/60 lg:hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="px-4 py-4 sm:px-5">
          <div className="flex gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tabla directorio admin: profesional, doc, fiscal, servicios, visitas, pagado, debe, estado, acciones. */
export function PrestadoresDirectoryTableSkeleton({
  rows = 6,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full sm:size-10" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden xl:table-cell")}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </td>
          <td className={cn(cellClassName, "hidden 2xl:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1.5 h-5 w-24 rounded-full" />
          </td>
          <td className={cn(cellClassName, "hidden xl:table-cell")}>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </td>
          <td className={cn(cellClassName, "text-right")}>
            <div className="ml-auto space-y-1.5">
              <Skeleton className="ml-auto h-4 w-8" />
              <Skeleton className="ml-auto h-3 w-14" />
            </div>
          </td>
          <td className={cn(cellClassName, "text-right")}>
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className={cn(cellClassName, "text-right")}>
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className={cn(cellClassName, "hidden xl:table-cell")}>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </td>
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end gap-1">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Tabla directorio admin: servicio, tarifas, pacientes, estado. */
/** Tabla directorio admin: obra social, código, estado. */
/** Tabla directorio admin: obra social, código, estado, acciones. */
export function ObrasSocialesDirectoryTableSkeleton({
  rows = 6,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20 sm:hidden" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-4 w-24" />
          </td>
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          <td className={cellClassName}>
            <div className="flex min-h-9 items-center justify-end">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function ServiciosDirectoryTableSkeleton({
  rows = 5,
  cellClassName = "px-4 py-3 whitespace-normal first:pl-6 last:pr-6 sm:px-5",
}: {
  rows?: number;
  cellClassName?: string;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className={cellClassName}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className={cn(cellClassName, "hidden md:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-20" />
          </td>
          <td className={cn(cellClassName, "hidden lg:table-cell")}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-36" />
          </td>
          <td className={cn(cellClassName, "hidden sm:table-cell")}>
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          <td className={cellClassName}>
            <div className="flex min-h-8 items-center justify-end">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function CredentialCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-3xl border border-medical-border bg-medical-card shadow-sm">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="flex gap-4 p-6">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-[200px] w-[200px] shrink-0 rounded-xl" />
      </div>
    </article>
  );
}

export function SuppliesFormSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-medical-border bg-medical-secondary/40 p-3">
      <Skeleton className="h-4 w-36" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function VisitCardsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-medical-border bg-medical-surface px-3 py-3"
        >
          <div className="flex justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-3 h-4 w-full max-w-xs" />
        </li>
      ))}
    </ul>
  );
}
