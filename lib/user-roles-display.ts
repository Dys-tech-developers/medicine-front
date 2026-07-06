const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PRESTADOR: "Prestador",
  OPERADOR: "Operador",
};

export function formatUserRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function formatUserRoles(roles: string[]): string {
  if (roles.length === 0) return "Sin roles";
  return roles.map(formatUserRole).join(", ");
}
