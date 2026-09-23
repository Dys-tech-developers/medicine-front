import { apiFetch } from "@/lib/api/client";
import type {
  CreateFeriadoBody,
  FeriadoDto,
  PaginatedFeriadosDto,
  UpdateFeriadoBody,
} from "@/lib/api/types";

type FeriadoRaw = Partial<FeriadoDto> & Record<string, unknown> & { id: number };

function normalizeFeriado(item: FeriadoRaw): FeriadoDto {
  return {
    id: Number(item.id),
    fecha: String(item.fecha ?? "").slice(0, 10),
    titulo: String(item.titulo ?? ""),
    descripcion:
      item.descripcion == null || item.descripcion === ""
        ? null
        : String(item.descripcion),
    activo: Boolean(item.activo ?? true),
    createdAt: String(item.createdAt ?? item.created_at ?? ""),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? ""),
  };
}

type FeriadoListApiData = PaginatedFeriadosDto | FeriadoDto[];

function normalizeList(data: FeriadoListApiData): PaginatedFeriadosDto {
  if (Array.isArray(data)) {
    const items = data.map((row) => normalizeFeriado(row as FeriadoRaw));
    return { items, total: items.length, page: 1, pageSize: items.length };
  }
  const items = (data.items ?? []).map((row) => normalizeFeriado(row as FeriadoRaw));
  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? items.length,
  };
}

export type ListFeriadosOptions = {
  page?: number;
  pageSize?: number;
  /** YYYY-MM-DD */
  desde?: string;
  /** YYYY-MM-DD */
  hasta?: string;
  activo?: boolean;
};

function buildListQuery(options?: ListFeriadosOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  if (options?.desde) params.set("desde", options.desde);
  if (options?.hasta) params.set("hasta", options.hasta);
  if (options?.activo != null) params.set("activo", options.activo ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listFeriadosWithApi(
  token: string,
  options?: ListFeriadosOptions
): Promise<PaginatedFeriadosDto> {
  const data = await apiFetch<FeriadoListApiData>(
    `/api/v1/feriados${buildListQuery(options)}`,
    { method: "GET", token }
  );
  return normalizeList(data);
}

export async function getFeriadoByIdWithApi(
  token: string,
  id: number
): Promise<FeriadoDto> {
  const data = await apiFetch<FeriadoRaw>(`/api/v1/feriados/${id}`, {
    method: "GET",
    token,
  });
  return normalizeFeriado(data);
}

export async function createFeriadoWithApi(
  token: string,
  body: CreateFeriadoBody
): Promise<FeriadoDto> {
  const data = await apiFetch<FeriadoRaw>("/api/v1/feriados", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return normalizeFeriado(data);
}

export async function updateFeriadoWithApi(
  token: string,
  id: number,
  body: UpdateFeriadoBody
): Promise<FeriadoDto> {
  const data = await apiFetch<FeriadoRaw>(`/api/v1/feriados/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return normalizeFeriado(data);
}

export async function deleteFeriadoWithApi(token: string, id: number): Promise<void> {
  await apiFetch<unknown>(`/api/v1/feriados/${id}`, {
    method: "DELETE",
    token,
  });
}
