/** Etiqueta de sección para el navbar según la ruta del panel admin. */
export function getAdminSectionLabel(pathname: string): string {
  if (pathname === "/admin") return "Resumen";
  if (pathname.startsWith("/admin/prestadores")) return "Prestadores";
  if (pathname.startsWith("/admin/visitas")) return "Visitas";
  if (pathname.startsWith("/admin/pacientes")) return "Pacientes";
  if (pathname.startsWith("/admin/obras-sociales")) return "Obras sociales";
  if (pathname.startsWith("/admin/servicios")) return "Servicios";
  if (pathname.startsWith("/admin/stock")) return "Stock";
  if (pathname.startsWith("/admin/reportes")) return "Reportes";
  if (pathname.startsWith("/admin/configuracion")) return "Configuración";
  return "Panel Admin";
}
