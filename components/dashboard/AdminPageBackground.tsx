/** Decoración de fondo para páginas del panel admin (patrón + blobs + viñeta). */
export function AdminPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base neutra — evita el verde plano lavado */}
      <div className="absolute inset-0" />

      {/* Patrón médico sutil */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='12' y='24' width='28' height='4' rx='2' fill='%232BA84A' fill-opacity='0.08'/%3E%3Crect x='24' y='12' width='4' height='28' rx='2' fill='%232BA84A' fill-opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Blobs de profundidad */}
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-medical-primary/12 blur-3xl" />
      <div className="absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full bg-medical-accent/14 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-medical-primaryDark/8 blur-3xl" />

      {/* Viñeta y brillo superior */}
      <div className="absolute inset-0 bg-linear-to-b from-white/70 via-white/20 to-[#eef2ef]/90" />
      <div
        className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(69,76,146,0.06), transparent 55%)",
          }}
      />
    </div>
  );
}
