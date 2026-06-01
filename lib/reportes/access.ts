/** ADMIN y OPERADOR pueden ver reportes; solo ADMIN puede marcar facturado/pagado. */
export function canViewReportes(roles: string[]): boolean {
  return roles.includes("ADMIN") || roles.includes("OPERADOR");
}

export function canEditFinanzasReportes(roles: string[]): boolean {
  return roles.includes("ADMIN");
}
