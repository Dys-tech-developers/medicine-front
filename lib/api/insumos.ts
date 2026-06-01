import { apiFetch } from "@/lib/api/client";
import type {
  CreateInsumoBody,
  InsumoDto,
  InsumoListItemDto,
  PaginatedInsumosDto,
  UpdateInsumoBody,
} from "@/lib/api/types";

export type ListInsumosOptions = {
  page?: number;
  pageSize?: number;
  bajoStock?: boolean;
  estado?: boolean;
};

type InsumoListApiData = PaginatedInsumosDto | InsumoListItemDto[];

function normalizeInsumo(item: InsumoListItemDto & Record<string, unknown>): InsumoListItemDto {
  const stockActual = Number(item.stockActual ?? item.cantidad ?? item.stock ?? 0);
  const stockMinimo = Number(item.stockMinimo ?? 0);
  const estado = (item.estado ?? item.activo ?? true) as boolean;
  const unidadMedida = String(item.unidadMedida ?? item.unidad ?? "");

  return {
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    codigo: String(item.codigo ?? ""),
    cantidad: stockActual,
    stockActual,
    stockMinimo,
    unidad: unidadMedida,
    unidadMedida,
    requiereVencimiento: Boolean(item.requiereVencimiento),
    fechaVencimiento: (item.fechaVencimiento as string | null | undefined) ?? null,
    bajoStock:
      typeof item.bajoStock === "boolean" ? item.bajoStock : stockActual <= stockMinimo,
    activo: estado,
    estado,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function normalizeList(data: InsumoListApiData): PaginatedInsumosDto {
  if (Array.isArray(data)) {
    const items = data.map((row) => normalizeInsumo(row as InsumoListItemDto & Record<string, unknown>));
    return { items, total: items.length, page: 1, pageSize: items.length };
  }
  return {
    ...data,
    items: data.items.map((row) =>
      normalizeInsumo(row as InsumoListItemDto & Record<string, unknown>)
    ),
  };
}

function buildListQuery(options?: ListInsumosOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  if (options?.bajoStock) params.set("bajoStock", "true");
  if (options?.estado != null) params.set("estado", options.estado ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listInsumosWithApi(
  token: string,
  options?: ListInsumosOptions
): Promise<PaginatedInsumosDto> {
  const data = await apiFetch<InsumoListApiData>(`/api/v1/insumos${buildListQuery(options)}`, {
    method: "GET",
    token,
  });
  return normalizeList(data);
}

export async function getInsumoByIdWithApi(token: string, id: number): Promise<InsumoDto> {
  const data = await apiFetch<InsumoDto>(`/api/v1/insumos/${id}`, {
    method: "GET",
    token,
  });
  return normalizeInsumo(data as InsumoListItemDto & Record<string, unknown>);
}

export async function createInsumoWithApi(
  token: string,
  body: CreateInsumoBody
): Promise<InsumoDto> {
  const data = await apiFetch<InsumoDto>("/api/v1/insumos", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeInsumo(data as InsumoListItemDto & Record<string, unknown>);
}

export async function updateInsumoWithApi(
  token: string,
  id: number,
  body: UpdateInsumoBody
): Promise<InsumoDto> {
  const data = await apiFetch<InsumoDto>(`/api/v1/insumos/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeInsumo(data as InsumoListItemDto & Record<string, unknown>);
}
