import {
  getVisitaFinanzasEstadoLabel,
  getVisitaFinanzasShortLabel,
  type VisitaFinanzasFlag,
} from "@/lib/visita-finanzas-labels";
import { cn } from "@/lib/utils";

type Props = {
  flag: VisitaFinanzasFlag;
  value: boolean;
  /** Etiqueta corta (Fact. / Pag.) o completa (Facturado / Pagado). */
  variant?: "short" | "full";
  className?: string;
};

export function VisitaFinanzasFlagCell({
  flag,
  value,
  variant = "short",
  className,
}: Props) {
  const label =
    variant === "short"
      ? getVisitaFinanzasShortLabel(flag, value)
      : getVisitaFinanzasEstadoLabel(flag, value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        value ? "text-medical-success" : "text-medical-mutedText",
        className
      )}
      title={getVisitaFinanzasEstadoLabel(flag, value)}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          value ? "bg-medical-success" : "bg-medical-border"
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
