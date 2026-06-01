import { apiFetch } from "@/lib/api/client";
import type { PaginatedUsersDto } from "@/lib/api/types";

export async function listUsersWithApi(
  token: string,
  page = 1,
  pageSize = 50
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
