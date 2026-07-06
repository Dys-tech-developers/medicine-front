import { apiFetch } from "@/lib/api/client";
import type { PaginatedUsersDto, UserListItemDto } from "@/lib/api/types";

export type UpdateUserBody = {
  nombre?: string;
  email?: string;
};

export type UpdateUserEstadoBody = {
  estado: boolean;
};

export async function listUsersWithApi(
  token: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedUsersDto> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiFetch<PaginatedUsersDto>(`/api/v1/users?${params.toString()}`, {
    method: "GET",
    token,
  });
}

export async function updateUserWithApi(
  token: string,
  userId: number,
  body: UpdateUserBody
): Promise<UserListItemDto> {
  return apiFetch<UserListItemDto>(`/api/v1/users/${userId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export async function updateUserEstadoWithApi(
  token: string,
  userId: number,
  body: UpdateUserEstadoBody
): Promise<UserListItemDto> {
  return apiFetch<UserListItemDto>(`/api/v1/users/${userId}/estado`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}
