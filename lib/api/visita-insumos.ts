import { apiFetch } from "@/lib/api/client";
import type {
  RegisterVisitaInsumosBody,
  VisitaInsumoConsumoItem,
  VisitaInsumoResumenDto,
} from "@/lib/api/types";

type VisitaInsumoApiRow = {
  id: number;
  visitaId: number;
  insumoId: number;
  cantidad: number;
  insumo?: {
    nombre?: string;
    codigo?: string;
  };
  insumoNombre?: string;
  insumoCodigo?: string;
};

function toResumen(row: VisitaInsumoApiRow): VisitaInsumoResumenDto {
  return {
    id: Number(row.id),
    insumoId: Number(row.insumoId),
    cantidad: Number(row.cantidad ?? 0),
    insumoNombre: String(row.insumoNombre ?? row.insumo?.nombre ?? ""),
    insumoCodigo: String(row.insumoCodigo ?? row.insumo?.codigo ?? ""),
  };
}

export async function registerVisitaInsumosWithApi(
  token: string,
  visitaId: number,
  body: RegisterVisitaInsumosBody
): Promise<VisitaInsumoResumenDto[]> {
  const data = await apiFetch<{ items?: VisitaInsumoApiRow[] } | VisitaInsumoApiRow[]>(
    `/api/v1/visitas/${visitaId}/insumos`,
    {
      method: "POST",
      token,
      body: JSON.stringify(
        "items" in body ? body : { insumoId: body.insumoId, cantidad: body.cantidad }
      ),
    }
  );

  const rows = Array.isArray(data) ? data : (data.items ?? []);
  return rows.map(toResumen);
}

export function buildRegisterVisitaInsumosBody(
  items: VisitaInsumoConsumoItem[]
): RegisterVisitaInsumosBody | null {
  if (items.length === 0) return null;
  if (items.length === 1) {
    return { insumoId: items[0].insumoId, cantidad: items[0].cantidad };
  }
  return { items };
}
