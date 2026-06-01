import type { PacienteDto } from "@/lib/api/types";
import { getPacienteNombre } from "@/lib/pacientes-display";
import { calculateAgeFromBirthDate } from "@/lib/patient-qr";

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

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          color: "#4c4c4c",
          margin: "0 0 1px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, color: "#4c4c4c", fontWeight: 600, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

type PacienteCredencialCardProps = {
  paciente: PacienteDto;
};

/** Tarjeta imprimible: solo estilos inline (compatible con captura a PDF). */
export function PacienteCredencialCard({ paciente }: PacienteCredencialCardProps) {
  const obraSocialNombre = paciente.obraSocial?.nombre?.trim() ?? null;

  return (
    <div
      data-credencial-card
      style={{
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid #97c1bf",
        background: "#ffffff",
        boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.08)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        width: 340,
        color: "#0F172A",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #454c92 0%, #4b6a87 100%)",
          padding: "18px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/simeclogodos.png"
          alt="SIMEC"
          style={{
            width: 56,
            height: 56,
            padding: 2,
            borderRadius: "50%",
            objectFit: "contain",
            background: "#ffffff",
            flexShrink: 0,
          }}
        />
        <div style={{ color: "#ffffff" }}>
          <p style={{ fontSize: 18, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
            SIMEC
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            Credencial de Paciente
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 20px 16px", background: "#ffffff" }}>
        <p
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#454c92",
            margin: "0 0 4px",
          }}
        >
        Paciente:  {getPacienteNombre(paciente)}
        </p>

        {obraSocialNombre ? (
          <p
            style={{
              fontSize: 12,
              color: "#454c92",
              fontWeight: 700,
              margin: "0 0 16px",
              textTransform: "underline",
            }}
          >
           Obra Social: {obraSocialNombre}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0 0 16px",
          }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1.5px solid #97c1bf",
              background: "#F9FAFB",
              display: "inline-block",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paciente.qrDataUrl}
              alt={`QR ${paciente.codigoQr}`}
              style={{ width: 160, height: 160, display: "block" }}
            />
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
            fontWeight: 700,
            color: "#4b6a87",
            letterSpacing: "0.1em",
            margin: "0 0 14px",
          }}
        >
          {paciente.codigoQr}
        </p>

        <div style={{ height: 1, background: "#97c1bf", margin: "0 0 14px" }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 12px",
          }}
        >
          <DataRow label="DNI" value={paciente.numeroDocumento} />
          <DataRow
            label="Edad"
            value={`${calculateAgeFromBirthDate(paciente.fechaNacimiento)} años`}
          />
          <DataRow
            label="Nacimiento"
            value={formatFechaNacimiento(paciente.fechaNacimiento)}
          />
          {paciente.numeroAfiliado ? (
            <DataRow label="N° Afiliado" value={paciente.numeroAfiliado} />
          ) : null}
        </div>
      </div>

      <div
        style={{
          background: "#454c92",
          borderTop: "1px solid #97c1bf",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
      
   
      </div>
    </div>
  );
}
