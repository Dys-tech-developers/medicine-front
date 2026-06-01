/** Unidades de medida admitidas para insumos (alta y edición). */
export const UNIDADES_MEDIDA = [
  "unidad",
  "caja",
  "ml",
  "paquete",
  "frasco",
  "ampolla",
  "rollo",
] as const;

export type UnidadMedida = (typeof UNIDADES_MEDIDA)[number];

export const UNIDAD_MEDIDA_LABELS: Record<UnidadMedida, string> = {
  unidad: "Unidad",
  caja: "Caja",
  ml: "ml",
  paquete: "Paquete",
  frasco: "Frasco",
  ampolla: "Ampolla",
  rollo: "Rollo",
};

export function isUnidadMedida(value: string): value is UnidadMedida {
  return (UNIDADES_MEDIDA as readonly string[]).includes(value);
}

/** Opciones del select; incluye valor legacy si no está en el catálogo. */
export function unidadMedidaSelectOptions(current?: string): { value: string; label: string }[] {
  const base = UNIDADES_MEDIDA.map((v) => ({
    value: v,
    label: UNIDAD_MEDIDA_LABELS[v],
  }));
  const trimmed = current?.trim();
  if (trimmed && !isUnidadMedida(trimmed)) {
    return [{ value: trimmed, label: `${trimmed} (registrado)` }, ...base];
  }
  return base;
}
