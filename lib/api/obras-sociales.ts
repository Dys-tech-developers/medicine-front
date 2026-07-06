import { apiFetch } from "@/lib/api/client";
import { fetchAllPaginatedItems } from "@/lib/api/list-pagination";
import type {
  CreateObraSocialBody,
  ObraSocialDto,
  PaginatedObrasSocialesDto,
  UpdateObraSocialBody,
} from "@/lib/api/types";

type ObraSocialRaw = Partial<ObraSocialDto> &
  Record<string, unknown> & { id: number; nombre: string; codigo?: string };

function normalizeObraSocial(item: ObraSocialRaw): ObraSocialDto {
  const estado = (item.estado ?? item.activo ?? true) as boolean;
  return {
    id: Number(item.id),
    nombre: String(item.nombre ?? ""),
    codigo: String(item.codigo ?? ""),
    estado,
    createdAt: String(item.createdAt ?? ""),
    updatedAt: item.updatedAt != null ? String(item.updatedAt) : undefined,
  };
}

type ObraSocialListApiData = PaginatedObrasSocialesDto | ObraSocialDto[];

function normalizeList(data: ObraSocialListApiData): PaginatedObrasSocialesDto {
  if (Array.isArray(data)) {
    const items = data.map((row) => normalizeObraSocial(row as ObraSocialRaw));
    return { items, total: items.length, page: 1, pageSize: items.length };
  }
  const items = (data.items ?? []).map((row) =>
    normalizeObraSocial(row as ObraSocialRaw)
  );
  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? items.length,
  };
}

export type ListObrasSocialesOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: boolean;
};

function buildListQuery(options?: ListObrasSocialesOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  const search = options?.search?.trim();
  if (search) params.set("search", search);
  if (options?.estado != null) params.set("estado", options.estado ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listObrasSocialesWithApi(
  token: string,
  options?: ListObrasSocialesOptions
): Promise<PaginatedObrasSocialesDto> {
  const data = await apiFetch<ObraSocialListApiData>(
    `/api/v1/obras-sociales${buildListQuery(options)}`,
    { method: "GET", token }
  );
  return normalizeList(data);
}

/** Listado completo para exportación (respeta filtros de búsqueda y estado). */
export async function listObrasSocialesAllWithApi(
  token: string,
  options?: Omit<ListObrasSocialesOptions, "page" | "pageSize">
): Promise<ObraSocialDto[]> {
  return fetchAllPaginatedItems((page, pageSize) =>
    listObrasSocialesWithApi(token, { ...options, page, pageSize })
  );
}

export async function getObraSocialByIdWithApi(
  token: string,
  id: number
): Promise<ObraSocialDto> {
  const data = await apiFetch<ObraSocialDto>(`/api/v1/obras-sociales/${id}`, {
    method: "GET",
    token,
  });
  return normalizeObraSocial(data);
}

export async function createObraSocialWithApi(
  token: string,
  body: CreateObraSocialBody
): Promise<ObraSocialDto> {
  const data = await apiFetch<ObraSocialDto>("/api/v1/obras-sociales", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeObraSocial(data);
}

export async function updateObraSocialWithApi(
  token: string,
  id: number,
  body: UpdateObraSocialBody
): Promise<ObraSocialDto> {
  const data = await apiFetch<ObraSocialDto>(`/api/v1/obras-sociales/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeObraSocial(data);
}

export async function deleteObraSocialWithApi(token: string, id: number): Promise<void> {
  await apiFetch<unknown>(`/api/v1/obras-sociales/${id}`, {
    method: "DELETE",
    token,
  });
}
