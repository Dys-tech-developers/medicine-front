import type { PacienteDto } from "@/lib/api/types";

/** Formato del backend: PAC-000001 */
const PACIENTE_QR_CODE_REGEX = /^PAC-\d{6}$/;

export type OperatorPatient = {
  id: string;
  fullName: string;
  document: string;
  age: number;
  insurance: string;
  codigoQr: string;
  telefono: string;
  direccion: string;
};

export function calculateAgeFromBirthDate(iso: string): number {
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function formatObraSocialLabel(dto: PacienteDto): string {
  const obraNombre = dto.obraSocial?.nombre?.trim();
  if (obraNombre) {
    return `${obraNombre}${dto.numeroAfiliado ? ` · Af. ${dto.numeroAfiliado}` : ""}`;
  }
  return dto.numeroAfiliado || "Sin obra social";
}

export function mapPacienteDtoToOperatorPatient(dto: PacienteDto): OperatorPatient {
  return {
    id: String(dto.id),
    fullName: `${dto.nombre} ${dto.apellido}`.trim(),
    document: dto.numeroDocumento,
    age: calculateAgeFromBirthDate(dto.fechaNacimiento),
    insurance: formatObraSocialLabel(dto),
    codigoQr: dto.codigoQr,
    telefono: dto.telefono,
    direccion: dto.direccion,
  };
}

/** Extrae el código PAC-XXXXXX del texto leído por la cámara o ingreso manual. */
export function extractCodigoQrFromScan(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = trimmed.toUpperCase();
  if (PACIENTE_QR_CODE_REGEX.test(direct)) return direct;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const candidates = [parsed.codigoQr, parsed.id, parsed.code];
    for (const value of candidates) {
      if (typeof value !== "string") continue;
      const code = value.trim().toUpperCase();
      if (PACIENTE_QR_CODE_REGEX.test(code)) return code;
    }
  } catch {
    // no es JSON
  }

  const match = trimmed.toUpperCase().match(/PAC-\d{6}/);
  return match ? match[0] : null;
}

/** @deprecated El QR del backend codifica solo el código PAC-XXXXXX; usar extractCodigoQrFromScan + API. */
export function parsePatientFromQr(payload: string): OperatorPatient | null {
  const codigo = extractCodigoQrFromScan(payload);
  if (!codigo) return null;
  return {
    id: codigo,
    fullName: codigo,
    document: "",
    age: 0,
    insurance: "",
    codigoQr: codigo,
    telefono: "",
    direccion: "",
  };
}
