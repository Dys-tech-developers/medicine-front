import type {
  CampoAsignacionServicio,
  CoberturaDiariaReglasDto,
  ModoAsignacionServicio,
  ReglasAsignacionServicioDto,
} from "@/lib/api/types";

const CAMPOS_RELEVO: CampoAsignacionServicio[] = [
  "prestadorIds",
  "fechaInicio",
  "fechaFin",
  "coberturaDiariaInicio",
  "coberturaDiariaFin",
  "estado",
];

const CAMPOS_CONTROL_HORARIO: CampoAsignacionServicio[] = [
  "prestadorId",
  "prestadorIds",
  "fechaInicio",
  "fechaFin",
  "periodoControl",
  "cantidadPermitida",
  "modalidadCobro",
  "estado",
  "cantidadHoras",
];

const CAMPOS_VISITA_UNICA: CampoAsignacionServicio[] = [
  "prestadorId",
  "prestadorIds",
  "fechaInicio",
  "fechaFin",
  "periodoControl",
  "cantidadPermitida",
  "modalidadCobro",
  "estado",
  "cantidadHoras",
];

const DEFAULTS_POR_MODO: Record<
  ModoAsignacionServicio,
  Omit<ReglasAsignacionServicioDto, "modo">
> = {
  relevo: {
    camposVisibles: CAMPOS_RELEVO,
    defaults: {
      periodoControl: "diario",
      cantidadPermitida: 1,
      modalidadCobro: "por_hora",
      cantidadHoras: null,
    },
    minPrestadores: 1,
    ayudaFormulario:
      "Asigná las cuidadoras que pueden cubrir. El relevo se hace escaneando el QR del paciente.",
    ayudaFlujoVisita:
      "Escaneá el QR para tomar la cobertura. Si otra cuidadora está activa, se cerrará su tramo automáticamente.",
    coberturaDiaria: {
      todoElDiaPorDefecto: true,
      formato: "HH:mm",
      etiquetaInicio: "Inicio de cobertura diaria",
      etiquetaFin: "Fin de cobertura diaria",
      ayuda: "Dejá ambos vacíos para cobertura las 24 horas. Si indicás horario, completá inicio y fin.",
    },
  },
  control_horario: {
    camposVisibles: CAMPOS_CONTROL_HORARIO,
    defaults: {},
    minPrestadores: 0,
    ayudaFormulario:
      "El prestador inicia y finaliza la visita por separado. Si la modalidad es por hora, indicá la cantidad de horas.",
    ayudaFlujoVisita: "Iniciá la visita al llegar y finalizala al terminar.",
  },
  visita_unica: {
    camposVisibles: CAMPOS_VISITA_UNICA,
    defaults: {},
    minPrestadores: 0,
    ayudaFormulario:
      "Registro en un paso al escanear el QR. Configurá período de control y cupo según la prestación.",
    ayudaFlujoVisita: "Escaneá el QR y registrá la visita en un solo paso.",
  },
};

function normalizeCoberturaDiaria(
  raw: unknown
): CoberturaDiariaReglasDto | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  return {
    todoElDiaPorDefecto: Boolean(
      row.todoElDiaPorDefecto ?? row.todo_el_dia_por_defecto ?? true
    ),
    formato: "HH:mm",
    etiquetaInicio: String(
      row.etiquetaInicio ?? row.etiqueta_inicio ?? "Inicio de cobertura diaria"
    ),
    etiquetaFin: String(
      row.etiquetaFin ?? row.etiqueta_fin ?? "Fin de cobertura diaria"
    ),
    ayuda: String(
      row.ayuda ??
        "Dejá ambos vacíos para cobertura las 24 horas. Si indicás horario, completá inicio y fin."
    ),
  };
}

function parseModo(value: unknown): ModoAsignacionServicio | null {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "relevo" || raw === "control_horario" || raw === "visita_unica") {
    return raw;
  }
  return null;
}

/** Normaliza `reglasAsignacion` del backend; si falta, infiere desde flags. */
export function normalizeReglasAsignacion(
  raw: unknown,
  flags?: { modoRelevo?: boolean; controlHorario?: boolean }
): ReglasAsignacionServicioDto {
  if (raw && typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    const modo =
      parseModo(row.modo) ?? inferModoFromFlags(flags ?? {});
    const fallback = DEFAULTS_POR_MODO[modo];
    const camposRaw = row.camposVisibles ?? row.campos_visibles;
    const camposVisibles = Array.isArray(camposRaw)
      ? (camposRaw.map(String) as CampoAsignacionServicio[])
      : fallback.camposVisibles;
    const defaultsRaw = row.defaults;
    const defaults =
      defaultsRaw && typeof defaultsRaw === "object"
        ? (defaultsRaw as ReglasAsignacionServicioDto["defaults"])
        : fallback.defaults;
    const minPrestadoresRaw = row.minPrestadores ?? row.min_prestadores;
    const minPrestadores =
      minPrestadoresRaw != null && Number.isFinite(Number(minPrestadoresRaw))
        ? Number(minPrestadoresRaw)
        : fallback.minPrestadores;
    const coberturaDiaria =
      normalizeCoberturaDiaria(row.coberturaDiaria ?? row.cobertura_diaria) ??
      fallback.coberturaDiaria;

    return {
      modo,
      camposVisibles,
      defaults: defaults ?? {},
      minPrestadores,
      ayudaFormulario: String(
        row.ayudaFormulario ??
          row.ayuda_formulario ??
          fallback.ayudaFormulario ??
          ""
      ),
      ayudaFlujoVisita: String(
        row.ayudaFlujoVisita ??
          row.ayuda_flujo_visita ??
          fallback.ayudaFlujoVisita ??
          ""
      ),
      ...(coberturaDiaria ? { coberturaDiaria } : {}),
    };
  }

  const modo = inferModoFromFlags(flags ?? {});
  return { modo, ...DEFAULTS_POR_MODO[modo] };
}

export function inferModoFromFlags(servicio: {
  modoRelevo?: boolean;
  controlHorario?: boolean;
}): ModoAsignacionServicio {
  if (servicio.modoRelevo) return "relevo";
  if (servicio.controlHorario) return "control_horario";
  return "visita_unica";
}

export function getReglasAsignacionFromServicio(servicio: {
  modoRelevo?: boolean;
  controlHorario?: boolean;
  reglasAsignacion?: ReglasAsignacionServicioDto;
}): ReglasAsignacionServicioDto {
  if (servicio.reglasAsignacion) return servicio.reglasAsignacion;
  return normalizeReglasAsignacion(null, servicio);
}

export function campoAsignacionVisible(
  reglas: ReglasAsignacionServicioDto,
  campo: CampoAsignacionServicio
): boolean {
  return reglas.camposVisibles.includes(campo);
}

export function modoEsRelevo(modo: ModoAsignacionServicio): boolean {
  return modo === "relevo";
}

export function modoEsControlHorario(modo: ModoAsignacionServicio): boolean {
  return modo === "control_horario";
}

export function modoEsVisitaUnica(modo: ModoAsignacionServicio): boolean {
  return modo === "visita_unica";
}

const MODO_LABELS: Record<ModoAsignacionServicio, string> = {
  relevo: "Relevamiento",
  control_horario: "Control horario",
  visita_unica: "Registro en un paso",
};

export function formatModoAsignacion(modo: ModoAsignacionServicio): string {
  return MODO_LABELS[modo] ?? modo;
}

/** Valida formato HH:mm o vacío. */
export function isValidHoraCobertura(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed);
}

export function normalizeHoraCobertura(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function validateCoberturaDiariaPar(
  inicio: string,
  fin: string
): string | null {
  const hasInicio = inicio.trim().length > 0;
  const hasFin = fin.trim().length > 0;
  if (hasInicio !== hasFin) {
    return "Debe indicar hora inicio y fin, o dejar ambas vacías.";
  }
  if (hasInicio && !isValidHoraCobertura(inicio)) {
    return "La hora de inicio debe tener formato HH:mm (ej. 08:00).";
  }
  if (hasFin && !isValidHoraCobertura(fin)) {
    return "La hora de fin debe tener formato HH:mm (ej. 20:00).";
  }
  return null;
}

export function formatCoberturaDiariaDisplay(
  inicio: string | null | undefined,
  fin: string | null | undefined
): string {
  if (!inicio && !fin) return "24 horas";
  if (inicio && fin) return `${inicio} – ${fin}`;
  return "—";
}
