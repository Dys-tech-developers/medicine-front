"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  ClipboardList,
  IdCard,
  Loader2,
  Mail,
  RefreshCw,
  Stethoscope,
  User,
  UserCircle2,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getPrestadorMeWithApi } from "@/lib/api/prestadores";
import type { PrestadorListItemDto } from "@/lib/api/types";
import {
  formatPrestadorCbu,
  formatPrestadorDateTime,
  formatRegimenIva,
  getPrestadorInitials,
} from "@/lib/prestadores-display";
import { estadoActivoBadgeClass, medicalWarningBanner } from "@/lib/medical-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string | null;
  loggedAt?: string | null;
};

function ProfileField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-medical-border bg-white px-3 py-2",
        className
      )}
    >
      <dt className="text-xs font-medium text-medical-mutedText">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-semibold text-medical-text break-words",
          mono && "font-mono text-[13px] font-medium"
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function PerfilSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-medical-border" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-medical-border" />
          <div className="h-3 w-52 rounded bg-medical-border/70" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-medical-border/60" />
        ))}
      </div>
    </div>
  );
}

function getPrestadorMeErrorMessage(error: ApiError): string {
  if (error.status === 404) {
    return "No encontramos tu perfil de prestador. Contactá al administrador.";
  }
  if (error.status === 403) {
    return "Tu usuario no tiene permisos de prestador.";
  }
  return error.message || "No se pudo cargar el perfil.";
}

function formatDeviceLogin(iso?: string | null): string {
  if (!iso) return "No disponible";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "No disponible";
  }
}

function PrestadorProfileContent({
  prestador,
  loggedAt,
}: {
  prestador: PrestadorListItemDto;
  loggedAt?: string | null;
}) {
  const canRegisterVisits = prestador.estado && prestador.usuarioEstado;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-medical-primary/10 text-sm font-bold text-medical-primary">
            {getPrestadorInitials(prestador.nombre)}
          </span>
          <div>
            <p className="text-sm font-semibold text-medical-text">{prestador.nombre}</p>
            <p className="text-xs text-medical-mutedText">{prestador.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs font-semibold",
              estadoActivoBadgeClass(prestador.estado)
            )}
          >
            Perfil {prestador.estado ? "activo" : "inactivo"}
          </span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs font-semibold",
              estadoActivoBadgeClass(prestador.usuarioEstado)
            )}
          >
            Cuenta {prestador.usuarioEstado ? "habilitada" : "deshabilitada"}
          </span>
        </div>
      </div>

      {!canRegisterVisits ? (
        <p className={cn("mb-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs", medicalWarningBanner)}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          No podés registrar visitas hasta que tu cuenta y perfil de prestador estén activos.
        </p>
      ) : null}

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
          <User className="h-3.5 w-3.5 text-medical-primary" />
          Acceso
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="Email" value={prestador.email} className="sm:col-span-2" />
          <ProfileField label="Último acceso (este dispositivo)" value={formatDeviceLogin(loggedAt)} />
          <ProfileField
            label="Registrar visitas"
            value={canRegisterVisits ? "Sí" : "No"}
          />
        </dl>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
          <Mail className="h-3.5 w-3.5 text-medical-primary" />
          Contacto
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="Teléfono" value={prestador.telefono} />
          <ProfileField label="Residencia" value={prestador.lugarResidencia} />
        </dl>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
          <Stethoscope className="h-3.5 w-3.5 text-medical-primary" />
          Identidad profesional
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="Documento" value={prestador.documento} mono />
          <ProfileField label="Matrícula" value={prestador.matricula} mono />
        </dl>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
          <Building2 className="h-3.5 w-3.5 text-medical-primary" />
          Datos fiscales
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="CUIT" value={prestador.cuit} mono />
          <ProfileField label="CBU" value={formatPrestadorCbu(prestador.cbu)} mono />
          <ProfileField
            label="Régimen IVA"
            value={formatRegimenIva(prestador.regimenIva)}
            className="sm:col-span-2"
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-medical-mutedText">
          <ClipboardList className="h-3.5 w-3.5 text-medical-primary" />
          Registro
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="Alta en el sistema" value={formatPrestadorDateTime(prestador.createdAt)} />
          <ProfileField label="Última actualización" value={formatPrestadorDateTime(prestador.updatedAt)} />
        </dl>
      </section>
    </>
  );
}

export function PrestadorPerfilTab({ accessToken, loggedAt }: Props) {
  const [prestador, setPrestador] = useState<PrestadorListItemDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!accessToken) {
      setError("Sesión no válida. Volvé a iniciar sesión.");
      setPrestador(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getPrestadorMeWithApi(accessToken);
      setPrestador(data);
    } catch (err) {
      setPrestador(null);
      const message =
        err instanceof ApiError
          ? getPrestadorMeErrorMessage(err)
          : "No se pudo cargar el perfil.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return (
    <section className="mb-5 rounded-2xl border border-medical-border bg-medical-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-medical-primary" />
          <div>
            <h2 className="text-base font-semibold text-medical-text">Mi perfil</h2>
            <p className="text-xs text-medical-mutedText">Datos de tu cuenta y perfil profesional.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={loading || !accessToken}
          className="inline-flex h-9 w-9 items-center cursor-pointer justify-center rounded-lg border border-medical-border text-medical-mutedText transition hover:bg-medical-secondary disabled:opacity-50"
          aria-label="Actualizar perfil"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="rounded-xl border border-medical-border bg-medical-surface p-4">
        {loading && !prestador ? <PerfilSkeleton /> : null}

        {error && !loading ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-danger/10 text-medical-danger">
              <IdCard className="h-5 w-5" />
            </span>
            <p className="text-sm text-medical-danger">{error}</p>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="text-sm font-semibold text-medical-primary underline-offset-2 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!loading && prestador ? (
          <PrestadorProfileContent prestador={prestador} loggedAt={loggedAt} />
        ) : null}
      </div>
    </section>
  );
}
