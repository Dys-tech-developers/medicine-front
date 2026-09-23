/**
 * Permisos del panel admin según la matriz de roles del backend
 * (ver ENDPOINTS_BACKEND.MD). ADMIN y OPERADOR comparten el panel, pero
 * OPERADOR no puede gestionar prestadores, stock, obras sociales ni usuarios.
 * La autoridad real siempre es del backend; esto solo alinea la UI.
 */

export function isAdmin(roles: string[]): boolean {
  return roles.includes("ADMIN");
}

/** GET/POST/PATCH /prestadores es solo ADMIN: OPERADOR ni siquiera puede listar. */
export function canAccessPrestadores(roles: string[]): boolean {
  return isAdmin(roles);
}

/** POST/PATCH/DELETE /insumos es solo ADMIN. */
export function canManageStock(roles: string[]): boolean {
  return isAdmin(roles);
}

/** POST/PATCH/DELETE /obras-sociales es solo ADMIN. */
export function canManageObrasSociales(roles: string[]): boolean {
  return isAdmin(roles);
}

/** PATCH /users/:id/estado y edición de usuarios es solo ADMIN. */
export function canManageUsers(roles: string[]): boolean {
  return isAdmin(roles);
}

/** PATCH /config/jornada y CRUD /feriados es solo ADMIN. OPERADOR puede consultar. */
export function canManageJornadasFeriados(roles: string[]): boolean {
  return isAdmin(roles);
}

export function getAdminRoleLabel(roles: string[]): string {
  return isAdmin(roles) ? "Administrador" : "Operador";
}
