import type {
  CreatePacienteServicioBody,
  ModalidadCobro,
  PacienteServicioEstado,
  PeriodoControl,
  PrestadorListItemDto,
  ReglasAsignacionServicioDto,
  ServicioConTarifasDto,
  UpdatePacienteServicioBody,
} from "@/lib/api/types";
import { dateInputToIso } from "@/lib/date-input";
import {
  campoAsignacionVisible,
  getReglasAsignacionFromServicio,
  modoEsRelevo,
  normalizeHoraCobertura,
  validateCoberturaDiariaPar,
} from "@/lib/reglas-asignacion";
import { prestadorTieneServicio } from "@/lib/prestador-servicios-filter";

export type PacienteServicioAsignacionFormState = {
  servicioId: string;
  prestadorIds: string[];
  fechaInicio: string;
  fechaFin: string;
  cobertura24Horas: boolean;
  coberturaDiariaInicio: string;
  coberturaDiariaFin: string;
  periodoControl: PeriodoControl | "";
  cantidadPermitida: string;
  cantidadHoras: string;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
};

export function getReglasFromServicioCatalogo(
  servicio: ServicioConTarifasDto | undefined
): ReglasAsignacionServicioDto | null {
  if (!servicio) return null;
  return getReglasAsignacionFromServicio(servicio);
}

export function prestadorFieldMultiple(reglas: ReglasAsignacionServicioDto): boolean {
  return (
    campoAsignacionVisible(reglas, "prestadorIds") &&
    reglas.minPrestadores >= 1
  );
}

export function validatePacienteServicioAsignacionForm(input: {
  values: PacienteServicioAsignacionFormState;
  reglas: ReglasAsignacionServicioDto;
  prestadores: PrestadorListItemDto[];
  servicioId: number;
}): string | null {
  const { values, reglas, prestadores, servicioId } = input;

  if (!values.fechaInicio.trim()) return "La fecha de inicio es obligatoria.";

  const minPrest = reglas.minPrestadores;
  if (
    campoAsignacionVisible(reglas, "prestadorIds") &&
    minPrest > 0 &&
    values.prestadorIds.length < minPrest
  ) {
    return `Seleccioná al menos ${minPrest} prestador${minPrest > 1 ? "es" : ""}.`;
  }

  for (const pid of values.prestadorIds) {
    const prestador = prestadores.find((p) => String(p.id) === pid);
    if (prestador && !prestadorTieneServicio(prestador, servicioId)) {
      return "Uno de los prestadores elegidos no tiene asociado el servicio indicado.";
    }
  }

  if (campoAsignacionVisible(reglas, "periodoControl") && !values.periodoControl) {
    return "Seleccioná el período de control.";
  }

  if (campoAsignacionVisible(reglas, "cantidadPermitida")) {
    const cupoRaw = values.cantidadPermitida.trim();
    if (!cupoRaw) return "La cantidad permitida es obligatoria.";
    const cupo = Number(cupoRaw);
    if (!Number.isFinite(cupo) || cupo < 1 || !Number.isInteger(cupo)) {
      return "La cantidad permitida debe ser un número entero mayor a 0.";
    }
  }

  if (
    campoAsignacionVisible(reglas, "cantidadHoras") &&
    values.modalidadCobro === "por_hora"
  ) {
    const horasRaw = values.cantidadHoras.trim();
    if (!horasRaw) return "La cantidad de horas es obligatoria para modalidad por hora.";
    const horas = Number(horasRaw);
    if (!Number.isFinite(horas) || horas < 1 || !Number.isInteger(horas)) {
      return "La cantidad de horas debe ser un número entero mayor a 0.";
    }
  }

  if (campoAsignacionVisible(reglas, "coberturaDiariaInicio")) {
    if (values.cobertura24Horas) {
      // null/null → 24h
    } else {
      const coberturaError = validateCoberturaDiariaPar(
        values.coberturaDiariaInicio,
        values.coberturaDiariaFin
      );
      if (coberturaError) return coberturaError;
    }
  }

  if (values.fechaFin && values.fechaFin < values.fechaInicio) {
    return "La fecha de fin no puede ser anterior al inicio.";
  }

  return null;
}

export function hasRequiredPacienteServicioAsignacionFields(
  values: PacienteServicioAsignacionFormState,
  reglas: ReglasAsignacionServicioDto
): boolean {
  if (!values.fechaInicio.trim()) return false;
  if (
    campoAsignacionVisible(reglas, "prestadorIds") &&
    reglas.minPrestadores > 0 &&
    values.prestadorIds.length < reglas.minPrestadores
  ) {
    return false;
  }
  if (campoAsignacionVisible(reglas, "periodoControl") && !values.periodoControl) {
    return false;
  }
  if (campoAsignacionVisible(reglas, "cantidadPermitida")) {
    const cupo = Number(values.cantidadPermitida.trim());
    if (!Number.isFinite(cupo) || cupo < 1) return false;
  }
  if (
    campoAsignacionVisible(reglas, "cantidadHoras") &&
    values.modalidadCobro === "por_hora"
  ) {
    const horas = Number(values.cantidadHoras.trim());
    if (!Number.isFinite(horas) || horas < 1) return false;
  }
  if (
    campoAsignacionVisible(reglas, "coberturaDiariaInicio") &&
    !values.cobertura24Horas
  ) {
    if (!values.coberturaDiariaInicio.trim() || !values.coberturaDiariaFin.trim()) {
      return false;
    }
  }
  return true;
}

export function buildCreatePacienteServicioBody(input: {
  pacienteId: number;
  values: PacienteServicioAsignacionFormState;
  reglas: ReglasAsignacionServicioDto;
}): CreatePacienteServicioBody {
  const { pacienteId, values, reglas } = input;
  const fin = values.fechaFin.trim();
  const prestadorIds = values.prestadorIds.map(Number).filter((id) => id > 0);

  const body: CreatePacienteServicioBody = {
    pacienteId,
    servicioId: Number(values.servicioId),
    fechaInicio: dateInputToIso(values.fechaInicio),
    fechaFin: fin ? dateInputToIso(fin) : null,
    estado: values.estado,
  };

  if (modoEsRelevo(reglas.modo)) {
    if (prestadorIds.length > 0) body.prestadorIds = prestadorIds;
    body.coberturaDiariaInicio = values.cobertura24Horas
      ? null
      : normalizeHoraCobertura(values.coberturaDiariaInicio);
    body.coberturaDiariaFin = values.cobertura24Horas
      ? null
      : normalizeHoraCobertura(values.coberturaDiariaFin);
    return body;
  }

  if (prestadorIds.length > 1) {
    body.prestadorIds = prestadorIds;
  } else if (prestadorIds.length === 1) {
    body.prestadorId = prestadorIds[0];
  }

  if (campoAsignacionVisible(reglas, "periodoControl") && values.periodoControl) {
    body.periodoControl = values.periodoControl as PeriodoControl;
  }
  if (campoAsignacionVisible(reglas, "cantidadPermitida")) {
    body.cantidadPermitida = Number(values.cantidadPermitida);
  }
  if (campoAsignacionVisible(reglas, "modalidadCobro")) {
    body.modalidadCobro = values.modalidadCobro;
  }
  if (
    campoAsignacionVisible(reglas, "cantidadHoras") &&
    values.modalidadCobro === "por_hora"
  ) {
    body.cantidadHoras = Number(values.cantidadHoras);
  }

  return body;
}

export function buildUpdatePacienteServicioBody(input: {
  original: {
    servicioId: number;
    prestadorId: number | null;
    prestadoresAsignados?: { id: number }[];
    fechaInicio: string;
    fechaFin: string | null;
    coberturaDiariaInicio?: string | null;
    coberturaDiariaFin?: string | null;
    periodoControl: PeriodoControl;
    cantidadPermitida: number;
    cantidadHoras: number | null;
    modalidadCobro: ModalidadCobro;
    estado: PacienteServicioEstado;
  };
  values: PacienteServicioAsignacionFormState;
  reglas: ReglasAsignacionServicioDto;
  originalPrestadorIds: string[];
}): UpdatePacienteServicioBody {
  const { original, values, reglas, originalPrestadorIds } = input;
  const body: UpdatePacienteServicioBody = {};
  const servicioId = Number(values.servicioId);
  const prestadorIds = values.prestadorIds.map(Number).filter((id) => id > 0);
  const fin = values.fechaFin.trim();

  if (servicioId !== original.servicioId) body.servicioId = servicioId;

  const prestadoresCambio =
    values.prestadorIds.length !== originalPrestadorIds.length ||
    [...values.prestadorIds].sort().join(",") !== [...originalPrestadorIds].sort().join(",");

  if (prestadoresCambio) {
    if (modoEsRelevo(reglas.modo) || prestadorIds.length > 1) {
      body.prestadorIds = prestadorIds;
    } else {
      body.prestadorId = prestadorIds.length === 1 ? prestadorIds[0] : null;
    }
  }

  const fechaInicioIso = dateInputToIso(values.fechaInicio);
  if (fechaInicioIso !== original.fechaInicio) body.fechaInicio = fechaInicioIso;

  const fechaFinIso = fin ? dateInputToIso(fin) : null;
  if (fechaFinIso !== original.fechaFin) body.fechaFin = fechaFinIso;

  if (modoEsRelevo(reglas.modo)) {
    const cobInicio = values.cobertura24Horas
      ? null
      : normalizeHoraCobertura(values.coberturaDiariaInicio);
    const cobFin = values.cobertura24Horas
      ? null
      : normalizeHoraCobertura(values.coberturaDiariaFin);
    if (cobInicio !== (original.coberturaDiariaInicio ?? null)) {
      body.coberturaDiariaInicio = cobInicio;
    }
    if (cobFin !== (original.coberturaDiariaFin ?? null)) {
      body.coberturaDiariaFin = cobFin;
    }
    return body;
  }

  if (
    campoAsignacionVisible(reglas, "periodoControl") &&
    values.periodoControl &&
    values.periodoControl !== original.periodoControl
  ) {
    body.periodoControl = values.periodoControl as PeriodoControl;
  }
  const cantidadPermitida = Number(values.cantidadPermitida);
  if (
    campoAsignacionVisible(reglas, "cantidadPermitida") &&
    cantidadPermitida !== original.cantidadPermitida
  ) {
    body.cantidadPermitida = cantidadPermitida;
  }
  if (
    campoAsignacionVisible(reglas, "modalidadCobro") &&
    values.modalidadCobro !== original.modalidadCobro
  ) {
    body.modalidadCobro = values.modalidadCobro;
  }
  const cantidadHoras =
    values.modalidadCobro === "por_hora" ? Number(values.cantidadHoras) : null;
  if (
    campoAsignacionVisible(reglas, "cantidadHoras") &&
    cantidadHoras !== original.cantidadHoras
  ) {
    body.cantidadHoras = cantidadHoras;
  }
  if (values.estado !== original.estado) body.estado = values.estado;

  return body;
}
