import { apiFetch } from "@/lib/api/client";
import type {
  CreatePacienteServicioBody,
  PaginatedPacienteServiciosDto,
  PacienteServicioDisponibilidadResponseDto,
  PacienteServicioDto,
  PacienteServicioEstado,
} from "@/lib/api/types";

export type ListPacienteServiciosOptions = {
  page?: number;
  pageSize?: number;
  pacienteId?: number;
  servicioId?: number;
  estado?: PacienteServicioEstado;
};

function buildListQuery(options?: ListPacienteServiciosOptions): string {
  const params = new URLSearchParams();
  if (options?.page != null) params.set("page", String(options.page));
  if (options?.pageSize != null) params.set("pageSize", String(options.pageSize));
  if (options?.pacienteId != null) params.set("pacienteId", String(options.pacienteId));
  if (options?.servicioId != null) params.set("servicioId", String(options.servicioId));
  if (options?.estado) params.set("estado", options.estado);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listPacienteServiciosWithApi(
  token: string,
  options?: ListPacienteServiciosOptions
): Promise<PaginatedPacienteServiciosDto> {
  return apiFetch<PaginatedPacienteServiciosDto>(
    `/api/v1/paciente-servicios${buildListQuery(options)}`,
    { method: "GET", token }
  );
}

export async function getPacienteServicioByIdWithApi(
  token: string,
  id: number
): Promise<PacienteServicioDto> {
  return apiFetch<PacienteServicioDto>(`/api/v1/paciente-servicios/${id}`, {
    method: "GET",
    token,
  });
}

export async function createPacienteServicioWithApi(
  token: string,
  body: CreatePacienteServicioBody
): Promise<PacienteServicioDto> {
  return apiFetch<PacienteServicioDto>("/api/v1/paciente-servicios", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function getPacienteServicioDisponibilidadWithApi(
  token: string,
  pacienteServicioId: number
): Promise<PacienteServicioDisponibilidadResponseDto> {
  return apiFetch<PacienteServicioDisponibilidadResponseDto>(
    `/api/v1/paciente-servicios/${pacienteServicioId}/disponibilidad`,
    {
      method: "GET",
      token,
    }
  );
}
