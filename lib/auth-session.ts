import type { AuthResponseDto } from "@/lib/api/types";

export const AUTH_SESSION_STORAGE_KEY = "medicine.auth.session";

/** Rol usado por rutas del frontend */
export type AppRole = "admin" | "prestador";

export type AuthSession = {
  accessToken: string;
  userId: number;
  email: string;
  name: string;
  role: AppRole;
  roles: string[];
  loggedAt: string;
};

export function resolveAppRole(roles: string[]): AppRole | null {
  if (roles.includes("ADMIN")) return "admin";
  if (roles.includes("PRESTADOR")) return "prestador";
  return null;
}

export function getRedirectPathForRole(role: AppRole): string {
  return role === "admin" ? "/admin" : "/prestador";
}

export function buildAuthSessionFromLogin(data: AuthResponseDto): AuthSession {
  const role = resolveAppRole(data.user.roles);
  if (!role) {
    throw new Error("Tu usuario no tiene un rol habilitado para esta aplicación.");
  }

  return {
    accessToken: data.accessToken,
    userId: data.user.id,
    email: data.user.email,
    name: data.user.nombre,
    role,
    roles: data.user.roles,
    loggedAt: new Date().toISOString(),
  };
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

/** Normaliza sesiones guardadas con el nombre de rol anterior (`operador`). */
function normalizeStoredRole(role: unknown): AppRole | null {
  if (role === "admin" || role === "prestador") return role;
  if (role === "operador") return "prestador";
  return null;
}

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    const role = normalizeStoredRole(parsed.role);
    if (!parsed.accessToken || !role || !parsed.email) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
