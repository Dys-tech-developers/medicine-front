import { apiFetch } from "@/lib/api/client";
import type { AuthResponseDto, UserPublicDto } from "@/lib/api/types";

export type UpdateProfileBody = {
  nombre?: string;
  email?: string;
};

export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordBody = {
  email: string;
};

export type ResetPasswordBody = {
  email: string;
  code: string;
  newPassword: string;
};

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

export async function updateProfileWithApi(
  token: string,
  body: UpdateProfileBody
): Promise<UserPublicDto> {
  return apiFetch<UserPublicDto>("/api/v1/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export async function changePasswordWithApi(
  token: string,
  body: ChangePasswordBody
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/change-password", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function forgotPasswordWithApi(
  body: ForgotPasswordBody
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function resetPasswordWithApi(
  body: ResetPasswordBody
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
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
