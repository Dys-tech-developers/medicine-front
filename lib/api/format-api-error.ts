export type ApiErrorLike = {
  code: string;
  message: string;
  details?: unknown;
};

type ZodFlattenedError = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

const FIELD_LABELS: Record<string, string> = {
  nombre: "Nombre",
  email: "Email",
  password: "Contraseña",
  telefono: "Teléfono",
  lugarResidencia: "Lugar de residencia",
  documento: "Documento",
  matricula: "Matrícula",
  cuit: "CUIT",
  estado: "Estado",
  descripcion: "Descripción",
  tarifas: "Tarifas",
  modalidadCobro: "Modalidad de cobro",
  tipoJornada: "Tipo de jornada",
  tipoDia: "Tipo de día",
  valor: "Valor",
  servicioId: "Servicio",
  pacienteId: "Paciente",
  fechaInicio: "Fecha de inicio",
  fechaFin: "Fecha de fin",
  frecuenciaTipo: "Frecuencia",
  frecuenciaValor: "Valor de frecuencia",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function extractZodFlattenMessages(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];

  const flat = details as ZodFlattenedError;
  const messages: string[] = [];

  if (Array.isArray(flat.formErrors)) {
    for (const msg of flat.formErrors) {
      if (typeof msg === "string" && msg.trim()) messages.push(msg.trim());
    }
  }

  if (flat.fieldErrors && typeof flat.fieldErrors === "object") {
    for (const [field, errs] of Object.entries(flat.fieldErrors)) {
      if (!Array.isArray(errs)) continue;
      for (const msg of errs) {
        if (typeof msg === "string" && msg.trim()) {
          messages.push(`${fieldLabel(field)}: ${msg.trim()}`);
        }
      }
    }
  }

  return messages;
}

/** Mensajes concretos para mostrar al usuario (validación, conflictos, etc.). */
export function getApiErrorMessages(error: ApiErrorLike): string[] {
  const fromDetails = extractZodFlattenMessages(error.details);
  if (fromDetails.length > 0) return fromDetails;

  if (error.code === "VALIDATION_ERROR") {
    return ["Revisá los datos del formulario."];
  }

  if (error.message?.trim()) {
    return [error.message.trim()];
  }

  return ["Ocurrió un error. Intentá de nuevo."];
}

export function formatApiErrorMessage(error: ApiErrorLike): string {
  return getApiErrorMessages(error).join("\n");
}
