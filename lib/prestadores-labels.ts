import type { RegimenIva } from "@/lib/api/types";

export const REGIMENES_IVA: RegimenIva[] = [
  "monotributo",
  "responsable_inscripto",
  "exento",
];

export const REGIMEN_IVA_LABELS: Record<RegimenIva, string> = {
  monotributo: "Monotributo",
  responsable_inscripto: "Responsable inscripto",
  exento: "Exento",
};
