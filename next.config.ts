import type { NextConfig } from "next";

// Guard de build: el export estático congela NEXT_PUBLIC_API_URL en el bundle,
// así que un build apuntando a localhost/ngrok subido a Hostinger rompe todo.
// Para un build local de prueba: ALLOW_LOCAL_API=1 npm run build
if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_API) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!apiUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_API_URL. Para producción usá `npm run build:prod` " +
        "o definí la variable explícitamente."
    );
  }
  if (/localhost|127\.0\.0\.1|ngrok/i.test(apiUrl)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL apunta a un entorno local (${apiUrl}). ` +
        "Para producción usá `npm run build:prod`. " +
        "Para un build local de prueba: ALLOW_LOCAL_API=1 npm run build"
    );
  }
}

/** Hosts ngrok/extra para HMR en dev (sin protocolo). Ver DEV_ALLOWED_ORIGINS en .env.local */
const allowedDevOrigins = [
  "4cae-181-230-38-98.ngrok-free.app",
  ...(process.env.DEV_ALLOWED_ORIGINS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  output: "export",
  // Genera /admin/index.html en lugar de /admin.html para que Apache
  // (Hostinger) resuelva las rutas como directorios y no devuelva 403.
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  allowedDevOrigins,
};

export default nextConfig;
