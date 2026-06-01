import Link from "next/link";
import { IdCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function CredencialesPage() {
  const steps = [
    {
      n: "1",
      icon: "icon-[tabler--id-badge-2]",
      title: "Paciente presenta su QR",
      desc:  "El paciente muestra su credencial digital desde su dispositivo o impresa.",
    },
    {
      n: "2",
      icon: "icon-[tabler--scan]",
      title: "Prestador escanea el código",
      desc:  "Con la cámara de la app, el prestador captura el QR en segundos.",
    },
    {
      n: "3",
      icon: "icon-[tabler--clipboard-check]",
      title: "Datos cargados automáticamente",
      desc:  "El sistema identifica al paciente y habilita el registro de la visita.",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#e4f5e9] via-[#f0faf9] to-[#d8f0ee]">
      {/* Capa 1 — patrón de cruces médicas */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='12' y='24' width='28' height='4' rx='2' fill='%232BA84A' fill-opacity='0.14'/%3E%3Crect x='24' y='12' width='4' height='28' rx='2' fill='%232BA84A' fill-opacity='0.14'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Capa 2 — blobs de color saturados */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -right-48 -top-48 h-[650px] w-[650px] rounded-full bg-medical-primary/25 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[650px] w-[650px] rounded-full bg-medical-accent/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-medical-primaryDark/15 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-medical-accent/20 blur-2xl" />
      </div>

      {/* Capa 3 — viñeta suave para dar profundidad */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, rgba(31,143,59,0.07) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 py-14">

        {/* ── Encabezado ───────────────────────────────── */}
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-medical-border bg-white px-4 py-1.5 text-xs font-semibold text-medical-primary shadow-sm">
            <span className="icon-[tabler--shield-check] size-3.5" />
            Credenciales digitales · DYS Medicine
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-medical-text">
            Credenciales de Pacientes
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-medical-mutedText">
            Cada paciente tiene una credencial digital con QR único que el prestador escanea para registrar visitas al instante.
          </p>
        </header>

        {/* ── Credenciales ─────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-medical-border bg-white shadow-sm">
          <EmptyState
            icon={IdCard}
            title="No hay credenciales para mostrar"
            description="Las credenciales digitales de los pacientes aparecerán acá cuando estén disponibles en el sistema."
            action={
              <Link
                href="/prestador"
                className="inline-flex items-center gap-2 rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-medical-primary/25 transition hover:bg-medical-primaryDark"
              >
                <span className="icon-[tabler--scan] size-4" />
                Probar escaneo como prestador
              </Link>
            }
          />
        </section>

        {/* ── Cómo funciona ─────────────────────────────── */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-medical-border bg-white shadow-sm">
          <div className="border-b border-medical-border px-8 py-5">
            <h2 className="text-lg font-bold text-medical-text">¿Cómo funciona?</h2>
            <p className="text-sm text-medical-mutedText">
              El flujo completo desde la credencial hasta el registro de la visita.
            </p>
          </div>
          <div className="grid divide-y divide-medical-border md:grid-cols-3 md:divide-x md:divide-y-0 px-0">
            {steps.map(({ n, icon, title, desc }) => (
              <div key={n} className="flex flex-col items-center p-8 text-center">
                <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-secondary">
                  <span className={`${icon} size-7 text-medical-primary`} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-medical-primary text-[10px] font-bold text-white shadow">
                    {n}
                  </span>
                </div>
                <p className="mb-1 font-semibold text-medical-text">{title}</p>
                <p className="text-xs leading-relaxed text-medical-mutedText">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/prestador"
            className="inline-flex items-center gap-2 rounded-xl bg-medical-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-medical-primary/25 transition hover:bg-medical-primaryDark"
          >
            <span className="icon-[tabler--device-mobile] size-4" />
            Abrir vista del prestador
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-medical-border bg-white px-6 py-3 text-sm font-semibold text-medical-text transition hover:bg-medical-secondary"
          >
            <span className="icon-[tabler--layout-dashboard] size-4" />
            Panel de administración
          </Link>
        </div>

      </div>
    </main>
  );
}
