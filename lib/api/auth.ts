import { apiFetch } from "@/lib/api/client";
import type { AuthResponseDto, UserPublicDto } from "@/lib/api/types";

export async function loginWithApi(email: string, password: string): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfileWithApi(token: string): Promise<UserPublicDto> {
  return apiFetch<UserPublicDto>("/api/v1/auth/me", {
    method: "GET",
    token,
  });
}

export async function logoutWithApi(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    token,
  });
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>("/health", { method: "GET" });
    return true;
  } catch {
    return false;
  }
}
