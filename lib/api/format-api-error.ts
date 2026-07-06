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
  apellido: "Apellido",
  numeroDocumento: "Número de documento",
  fechaNacimiento: "Fecha de nacimiento",
  sexo: "Sexo",
  direccion: "Dirección",
  localidad: "Localidad",
  localidadId: "Localidad",
  obraSocialId: "Obra social",
  numeroAfiliado: "Número de afiliado",
  email: "Email",
  password: "Contraseña",
  currentPassword: "Contraseña actual",
  newPassword: "Nueva contraseña",
  code: "Código",
  telefono: "Teléfono",
  lugarResidencia: "Lugar de residencia",
  documento: "Documento",
  matricula: "Matrícula",
  cuit: "CUIT",
  estado: "Estado",
  descripcion: "Descripción",
  tarifas: "Tarifas",
  cantidadPermitida: "Cantidad permitida",
  cantidadHoras: "Cantidad de horas",
  modalidadCobro: "Modalidad de cobro",
  tipoJornada: "Tipo de jornada",
  tipoDia: "Tipo de día",
  valor: "Valor",
  servicioId: "Servicio",
  pacienteId: "Paciente",
  fechaCreacion: "Fecha de creación",
  antecedentes: "Antecedentes",
  diagnosticoInicial: "Diagnóstico inicial",
  medicacion: "Medicación",
  alergias: "Alergias",
  observaciones: "Observaciones",
  prestadorId: "Prestador",
  fechaInicio: "Fecha de inicio",
  fechaFin: "Fecha de fin",
  periodoControl: "Período de control",
};

const ZOD_MESSAGE_TRANSLATIONS: Record<string, string> = {
  Required: "es obligatorio",
  "Invalid enum value": "valor no válido",
  "Invalid date": "fecha no válida",
  "String must contain at least 1 character(s)": "es obligatorio",
  "String must contain at least 1 character": "es obligatorio",
};

function translateZodMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  return ZOD_MESSAGE_TRANSLATIONS[trimmed] ?? trimmed;
}

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
          const translated = translateZodMessage(msg.trim());
          messages.push(`${fieldLabel(field)} ${translated}.`);
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
