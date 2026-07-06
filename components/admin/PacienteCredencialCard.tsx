import type { ReactNode } from "react";
import { SIMEC_LOGO_SRC } from "@/components/brand/SimecLogo";
import type { PacienteDto } from "@/lib/api/types";
import { getPacienteNombre, formatPacienteSexo } from "@/lib/pacientes-display";
import { calculateAgeFromBirthDate } from "@/lib/patient-qr";

/* Paleta de marca (solo HEX/RGBA: html2canvas no soporta oklch/lab). */
const COLORS = {
  primary: "#454c92",
  primaryDark: "#3a4078",
  slate: "#4b6a87",
  teal: "#97c1bf",
  tealSoft: "#eef6f5",
  tealBorder: "#cfe3e1",
  ink: "#1f2937",
  muted: "#6b7280",
  surface: "#f8fafc",
  border: "#e8edf3",
  white: "#ffffff",
};

function formatFechaNacimiento(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Field({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ flex: fullWidth ? "1 1 100%" : 1, minWidth: 0 }}>
      <p
        style={{
          fontSize: 9,
          color: COLORS.muted,
          margin: "0 0 2px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.25,
          color: COLORS.ink,
          fontWeight: 600,
          margin: 0,
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  children,
  last = false,
}: {
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "7px 0",
        borderBottom: last ? "none" : `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  );
}

type PacienteCredencialCardProps = {
  paciente: PacienteDto;
};

/** Tarjeta imprimible: solo estilos inline (compatible con captura a PDF). */
export function PacienteCredencialCard({ paciente }: PacienteCredencialCardProps) {
  const obraSocialNombre = paciente.obraSocial?.nombre?.trim() ?? null;
  const localidad = paciente.localidad?.trim() ?? null;
  const numeroAfiliado = paciente.numeroAfiliado?.trim() ?? null;

  return (
    <div
      data-credencial-card
      style={{
        overflow: "hidden",
        borderRadius: 18,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.white,
        boxShadow: "0 10px 30px -12px rgba(15, 23, 42, 0.25)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        width: 320,
        color: COLORS.ink,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.slate} 100%)`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -48,
            right: -36,
            width: 132,
            height: 132,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -54,
            right: 34,
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SIMEC_LOGO_SRC}
          alt="SIMEC"
          style={{
            position: "relative",
            width: 44,
            height: 44,
            padding: 3,
            borderRadius: "50%",
            objectFit: "contain",
            background: COLORS.white,
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.18)",
            flexShrink: 0,
          }}
        />
        <div style={{ position: "relative", color: COLORS.white }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "0.04em",
            }}
          >
            SIMEC
          </p>
          <p
            style={{
              fontSize: 9,
              fontWeight: 600,
              margin: "2px 0 0",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "rgba(255, 255, 255, 0.82)",
            }}
          >
            Credencial de Paciente
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 20px", background: COLORS.white }}>
        {/* Nombre */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
          <div
            style={{
              width: 4,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.teal} 100%)`,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 9,
                color: COLORS.muted,
                margin: "0 0 3px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Paciente
            </p>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: COLORS.ink,
                margin: 0,
                lineHeight: 1.2,
                wordBreak: "break-word",
              }}
            >
              {getPacienteNombre(paciente)}
            </p>
            {obraSocialNombre ? (
              <div
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: COLORS.tealSoft,
                  border: `1px solid ${COLORS.tealBorder}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.slate,
                }}
              >
                {obraSocialNombre}
              </div>
            ) : null}
          </div>
        </div>

        {/* QR */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            margin: "12px 0 2px",
          }}
        >
          <div
            style={{
              padding: 9,
              borderRadius: 14,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              boxShadow: "0 4px 14px -6px rgba(15, 23, 42, 0.18)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paciente.qrDataUrl}
              alt={`QR ${paciente.codigoQr}`}
              style={{ width: 124, height: 124, display: "block" }}
            />
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 999,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: COLORS.teal,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.slate,
                letterSpacing: "0.12em",
              }}
            >
              {paciente.codigoQr}
            </span>
          </div>
        </div>

        {/* Datos */}
        <div
          style={{
            marginTop: 10,
            padding: "0 14px",
            borderRadius: 14,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Row>
            <Field label="DNI" value={paciente.numeroDocumento || "—"} />
            <Field
              label="Edad"
              value={`${calculateAgeFromBirthDate(paciente.fechaNacimiento)} años`}
            />
          </Row>
          <Row last={!numeroAfiliado && !localidad}>
            <Field
              label="Nacimiento"
              value={formatFechaNacimiento(paciente.fechaNacimiento)}
            />
            <Field label="Sexo" value={formatPacienteSexo(paciente.sexo)} />
          </Row>
          {numeroAfiliado || localidad ? (
            <Row last>
              {numeroAfiliado ? (
                <Field label="N° Afiliado" value={numeroAfiliado} />
              ) : null}
              {localidad ? (
                <Field label="Localidad" value={localidad} />
              ) : null}
            </Row>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: COLORS.primary,
          borderTop: `3px solid ${COLORS.teal}`,
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
          }}
        >
          Presentá esta credencial en cada atención
        </p>
      </div>
    </div>
  );
}
