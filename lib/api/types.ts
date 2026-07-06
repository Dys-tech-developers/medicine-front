export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type UserPublicDto = {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  createdAt: string;
  roles: string[];
};

export type AuthResponseDto = {
  accessToken: string;
  user: UserPublicDto;
};

export type UserListItemDto = {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  createdAt: string;
  roles: string[];
};

export type PaginatedUsersDto = {
  items: UserListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type RegimenIva = "monotributo" | "responsable_inscripto" | "exento";

export type CreatePrestadorBody = {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu: string;
  regimenIva: RegimenIva;
  estado?: boolean;
  /** Servicios habilitados para el prestador (sin duplicados). */
  servicioIds?: number[];
};

export type UpdatePrestadorServiciosBody = {
  /** Reemplaza la lista completa; `[]` quita todas las habilitaciones. */
  servicioIds: number[];
};

export type PrestadorEstadoCuentaFinanzasDto = {
  totalGenerado: string;
  pagado: string;
  pendienteFacturacion: string;
  facturadoPendientePago: string;
  cantidadPagado: number;
};

export type PrestadorEstadoCuentaDto = {
  cantidadVisitas: number;
  horasTrabajadas: number;
  finanzas: PrestadorEstadoCuentaFinanzasDto;
  montoPagado: string;
  montoPendiente: string;
};

export type PrestadorServicioResumenDto = {
  id: number;
  nombre?: string;
  estado?: boolean;
};

export type PrestadorListItemDto = {
  id: number;
  userId: number;
  nombre: string;
  email: string;
  telefono: string;
  lugarResidencia: string;
  documento: string;
  matricula: string;
  cuit: string;
  cbu?: string;
  regimenIva?: RegimenIva;
  estado: boolean;
  usuarioEstado: boolean;
  createdAt: string;
  updatedAt: string;
  /** Servicios asociados en `prestador_servicios` (si el listado los incluye). */
  servicios?: PrestadorServicioResumenDto[];
  /** Presente cuando el listado incluye filtros de período. */
  estadoCuenta?: PrestadorEstadoCuentaDto;
};

export type PaginatedPrestadoresDto = {
  items: PrestadorListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  meta?: ReportesMetaDto;
};

export type CreateInsumoBody = {
  nombre: string;
  descripcion?: string | null;
  codigo: string;
  stockActual?: number;
  stockMinimo?: number;
  unidadMedida: string;
  requiereVencimiento?: boolean;
  fechaVencimiento?: string | null;
  estado?: boolean;
};

export type UpdateInsumoBody = {
  nombre?: string;
  descripcion?: string | null;
  codigo?: string;
  stockActual?: number;
  stockMinimo?: number;
  unidadMedida?: string;
  requiereVencimiento?: boolean;
  fechaVencimiento?: string | null;
  estado?: boolean;
};

export type DeleteInsumosBulkBody = {
  ids: number[];
};

export type InsumoListItemDto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo: string;
  /** Normalizado desde `stockActual` del backend. */
  cantidad: number;
  stockActual?: number;
  stockMinimo: number;
  /** Normalizado desde `unidadMedida`. */
  unidad: string;
  unidadMedida?: string;
  requiereVencimiento?: boolean;
  fechaVencimiento?: string | null;
  bajoStock?: boolean;
  activo?: boolean;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type InsumoDto = InsumoListItemDto;

export type PaginatedInsumosDto = {
  items: InsumoListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type VisitaPacienteResumenDto = {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
};

export type VisitaServicioResumenDto = {
  id: number;
  nombre: string;
};

export type VisitaPacienteServicioResumenDto = {
  id: number;
  estado: string;
  paciente: VisitaPacienteResumenDto;
  servicio: VisitaServicioResumenDto;
};

export type VisitaPrestadorResumenDto = {
  id: number;
  nombre: string;
  email: string;
};

export type VisitaEstado = "iniciada" | "finalizada" | "cancelada";

export type VisitaInsumoResumenDto = {
  id: number;
  insumoId: number;
  cantidad: number;
  insumoNombre: string;
  insumoCodigo: string;
};

export type VisitaListItemDto = {
  id: number;
  pacienteServicioId: number;
  prestadorId: number;
  estado: VisitaEstado;
  fecha: string;
  tiempoMinutos: number | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  pacienteServicio: VisitaPacienteServicioResumenDto;
  prestador: VisitaPrestadorResumenDto;
  insumos: VisitaInsumoResumenDto[];
  finanzas?: VisitaFinanzasDto | null;
  /** true si cerró por superar cantidadHoras (control horario). */
  cierreAutomatico?: boolean;
  /** true si cerró porque otra cuidadora hizo relevo. */
  cierrePorRelevo?: boolean;
  /** Quién escaneó para relevar (cierra tramo anterior). */
  prestadorRelevoId?: number | null;
};

export type PaginatedVisitasDto = {
  items: VisitaListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type ObraSocialListItemDto = {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ObraSocialDto = ObraSocialListItemDto;

export type PaginatedObrasSocialesDto = {
  items: ObraSocialListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateObraSocialBody = {
  nombre: string;
  codigo: string;
  estado?: boolean;
};

export type UpdateObraSocialBody = {
  nombre?: string;
  codigo?: string;
  estado?: boolean;
};

export type ObraSocialResumenDto = {
  id: number;
  nombre: string;
  codigo: string;
  /** Presente cuando el back embebe la obra en pacientes u otros recursos. */
  estado?: boolean;
};

/** GET /api/v1/localidades — id es el código oficial (string). */
export type LocalidadDto = {
  id: string;
  nombre: string;
};

export type CreatePacienteBody = {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
  /** Nombre de la localidad (catálogo GET /api/v1/localidades). */
  localidad: string;
  obraSocialId: number;
  numeroAfiliado: string;
};

/** PATCH /api/v1/pacientes/:id — campos parciales; codigoQr no es editable. */
export type UpdatePacienteBody = Partial<CreatePacienteBody>;

export type PacienteListItemDto = {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
  fechaNacimiento: string;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
  localidad: string;
  obraSocialId?: number;
  obraSocial?: ObraSocialResumenDto | null;
  numeroAfiliado: string;
  createdAt: string;
};

export type PacienteDto = PacienteListItemDto & {
  updatedAt: string;
  qrDataUrl: string;
};

export type PacienteServicioPrestadorResumenDto = {
  id: number;
  nombre: string;
  email: string;
};

/** Ventana de control de cupo (visitas permitidas en el período). */
export type PeriodoControl = "diario" | "semanal" | "mensual";

export type PrestadorAsignadoResumenDto = {
  id: number;
  nombre: string;
};

/** Cobertura activa en modo relevo (GET /pacientes/qr/:codigoQr). */
export type CoberturaActivaDto = {
  visitaId: number;
  prestadorId: number;
  prestadorNombre: string;
  fechaInicio: string;
};

export type ModoAsignacionServicio = "relevo" | "control_horario" | "visita_unica";

export type CampoAsignacionServicio =
  | "prestadorId"
  | "prestadorIds"
  | "fechaInicio"
  | "fechaFin"
  | "coberturaDiariaInicio"
  | "coberturaDiariaFin"
  | "periodoControl"
  | "cantidadPermitida"
  | "cantidadHoras"
  | "modalidadCobro"
  | "estado";

export type CoberturaDiariaReglasDto = {
  todoElDiaPorDefecto: boolean;
  formato: "HH:mm";
  etiquetaInicio: string;
  etiquetaFin: string;
  ayuda: string;
};

export type ReglasAsignacionServicioDto = {
  modo: ModoAsignacionServicio;
  camposVisibles: CampoAsignacionServicio[];
  defaults: Partial<{
    periodoControl: string;
    cantidadPermitida: number;
    modalidadCobro: string;
    cantidadHoras: number | null;
  }>;
  minPrestadores: number;
  ayudaFormulario: string;
  ayudaFlujoVisita: string;
  coberturaDiaria?: CoberturaDiariaReglasDto;
};

/** Servicio asignado al paciente (GET /pacientes/qr/:codigoQr). */
export type PacienteServicioAsignadoQrDto = {
  pacienteServicioId: number;
  servicioId: number;
  servicioNombre: string;
  controlHorario?: boolean;
  modoRelevo?: boolean;
  reglasAsignacion?: ReglasAsignacionServicioDto;
  visitaPendiente?: VisitaPendienteEnAsignacionDto;
  prestadoresAsignados?: PrestadorAsignadoResumenDto[];
  coberturaActiva?: CoberturaActivaDto | null;
  coberturaDiariaInicio?: string | null;
  coberturaDiariaFin?: string | null;
  prestadorId?: number;
  prestador?: PacienteServicioPrestadorResumenDto;
  modalidadCobro: ModalidadCobro;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  estado: PacienteServicioEstado;
  fechaInicio?: string;
  fechaFin?: string | null;
  tarifas?: PacienteServicioTarifaDto[];
  disponibilidad?: PacienteServicioDisponibilidadDto | null;
};

export type PacientePorQrDto = PacienteDto & {
  servicios: PacienteServicioAsignadoQrDto[];
};

/** GET /api/v1/pacientes/:id — detalle con `servicios`. */
export type PacienteDetailDto = PacienteDto & {
  servicios: PacienteServicioAsignadoQrDto[];
};

export type VisitaFinanzasDto = {
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valorUnitario: string;
  valorAplicado: string;
  facturado: boolean;
  pagado: boolean;
};

export type CreateVisitaBody = {
  pacienteServicioId: number;
  fechaInicio: string;
  tiempoMinutos: number;
  observaciones?: string | null;
  fechaFin?: string;
  /** Obligatorio cuando crea un ADMIN; debe coincidir con la asignación. */
  prestadorId?: number;
};

/** POST /api/v1/visitas/iniciar — servicios con control horario. */
export type IniciarVisitaBody = {
  pacienteServicioId: number;
};

/** POST /api/v1/visitas/:id/finalizar — servicios con control horario. */
export type FinalizarVisitaBody = {
  observaciones?: string | null;
};

/** POST /api/v1/visitas/relevar — cobertura continua con relevo por QR. */
export type RelevarVisitaBody = {
  pacienteServicioId: number;
};

export type GestionarTramoAdminAccion = "iniciar" | "finalizar" | "cancelar";

export type GestionarTramoAdminBody =
  | {
      accion: "iniciar";
      pacienteServicioId: number;
      prestadorId: number;
      observaciones?: string | null;
    }
  | {
      accion: "finalizar";
      visitaId: number;
      observaciones?: string | null;
    }
  | {
      accion: "cancelar";
      visitaId: number;
      observaciones?: string | null;
    };

export type VisitaPendienteResumenDto = {
  id: number;
  fechaInicio: string;
  estado?: VisitaEstado;
  /** fechaInicio + cantidadHoras (ISO). null si no hay cantidadHoras. */
  fechaLimite?: string | null;
};

export type VisitaPendienteCoberturaActivaDto = {
  visitaId: number;
  prestadorId: number;
  fechaInicio: string;
};

export type VisitaPendienteDto = {
  tieneVisitaPendiente: boolean;
  visita: VisitaPendienteResumenDto | null;
  visitasCerradasAutomaticamente?: number;
  modoRelevo?: boolean;
  coberturaActiva?: VisitaPendienteCoberturaActivaDto | null;
};

export type VisitaPendienteEnAsignacionDto = {
  id: number;
  fechaInicio: string;
  fechaLimite?: string | null;
};

/** POST /api/v1/visitas/:visitaId/insumos — un ítem o array `items`. */
export type VisitaInsumoConsumoItem = {
  insumoId: number;
  cantidad: number;
};

export type RegisterVisitaInsumosBody =
  | { insumoId: number; cantidad: number }
  | { items: VisitaInsumoConsumoItem[] };

export type UpdateVisitaBody = {
  fechaInicio?: string;
  tiempoMinutos?: number;
  observaciones?: string | null;
};

/** PATCH /api/v1/visitas/:id/finanzas — al menos un campo; actualización parcial. */
export type UpdateVisitaFinanzasBody = {
  facturado?: boolean;
  pagado?: boolean;
};

export type VisitaDetailDto = VisitaListItemDto & {
  fechaInicio?: string;
  fechaFin?: string | null;
  finanzas?: VisitaFinanzasDto | null;
};

/** POST /api/v1/visitas/relevar — respuesta envuelta. */
export type RelevarVisitaDto = {
  huboRelevo: boolean;
  visitaAnterior: VisitaDetailDto | null;
  visita: VisitaDetailDto;
};

export type GestionarTramoAdminResultDto = {
  accion: GestionarTramoAdminAccion;
  visita: VisitaDetailDto;
};

export type PaginatedPacientesDto = {
  items: PacienteListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type HistoriaClinicaPacienteResumenDto = {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
};

export type HistoriaClinicaEvolucionDto = {
  id: number;
  historiaClinicaId: number;
  fecha: string;
  observaciones: string | null;
  medicacion: string | null;
  createdAt: string;
};

export type HistoriaClinicaDto = {
  id: number;
  pacienteId: number;
  fechaCreacion: string;
  antecedentes: string | null;
  diagnosticoInicial: string | null;
  medicacion: string | null;
  alergias: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  paciente: HistoriaClinicaPacienteResumenDto;
  evoluciones: HistoriaClinicaEvolucionDto[];
};

export type CreateEvolucionClinicaBody = {
  historiaClinicaId: number;
  fecha: string;
  observaciones?: string | null;
  medicacion?: string | null;
};

export type PaginatedHistoriasClinicasDto = {
  items: HistoriaClinicaDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateHistoriaClinicaBody = {
  pacienteId: number;
  fechaCreacion: string;
  antecedentes?: string | null;
  diagnosticoInicial?: string | null;
  medicacion?: string | null;
  alergias?: string | null;
  observaciones?: string | null;
};

export type UpdateHistoriaClinicaBody = {
  fechaCreacion?: string;
  antecedentes?: string | null;
  diagnosticoInicial?: string | null;
  medicacion?: string | null;
  alergias?: string | null;
  observaciones?: string | null;
};

export type ModalidadCobro = "por_servicio" | "por_hora" | "por_dia";

export type TipoJornada = "diurno" | "nocturno";

export type TipoDia = "habil" | "no_habil";

export type PacienteServicioEstado = "activa" | "suspendida" | "finalizada";

export type ServicioDto = {
  id: number;
  nombre: string;
  estado: boolean;
  controlHorario?: boolean;
  modoRelevo?: boolean;
  reglasAsignacion?: ReglasAsignacionServicioDto;
};

export type ServicioTarifaDto = {
  id: number;
  servicioId?: number;
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valor: string;
  createdAt?: string;
};

/** Tarifas vigentes de la asignación paciente–servicio (GET servicios → pacientes). */
export type PacienteServicioTarifaDto = Pick<
  ServicioTarifaDto,
  "id" | "modalidadCobro" | "tipoJornada" | "tipoDia" | "valor"
>;

/** Cupo en la ventana de control (embebido en paciente o GET /disponibilidad). */
export type PacienteServicioDisponibilidadDto = {
  pacienteServicioId?: number;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadUtilizada: number;
  cantidadDisponible: number;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  /** Ej. `"1/3"` — el backend puede enviar `utilizadoYPemitido`. */
  utilizadoYPemitido: string;
};

export type ServicioPacienteAsignadoDto = {
  pacienteServicioId: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  numeroDocumento?: string;
  codigoQr?: string;
  modalidadCobro: ModalidadCobro;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  estado: PacienteServicioEstado;
  fechaInicio?: string;
  fechaFin?: string | null;
  tarifas: PacienteServicioTarifaDto[];
};

export type ServicioConTarifasDto = ServicioDto & {
  descripcion: string | null;
  createdAt: string;
  tarifas: ServicioTarifaDto[];
  pacientes: ServicioPacienteAsignadoDto[];
};

export type PaginatedServiciosDto = {
  items: ServicioConTarifasDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateServicioTarifaBody = {
  modalidadCobro: ModalidadCobro;
  tipoJornada: TipoJornada;
  tipoDia: TipoDia;
  valor: number;
};

export type CreateServicioBody = {
  nombre: string;
  descripcion?: string | null;
  estado?: boolean;
  controlHorario?: boolean;
  modoRelevo?: boolean;
  tarifas: CreateServicioTarifaBody[];
};

export type UpdateServicioBody = {
  nombre?: string;
  descripcion?: string | null;
  controlHorario?: boolean;
  modoRelevo?: boolean;
};

/** Respuesta de PATCH /servicios/:id (sin tarifas ni pacientes). */
export type ServicioPatchResponseDto = ServicioDto & {
  descripcion?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateServicioTarifaBody = {
  modalidadCobro?: ModalidadCobro;
  tipoJornada?: TipoJornada;
  tipoDia?: TipoDia;
  valor?: number;
};

export type UpdateServicioEstadoBody = {
  estado: boolean;
};

export type PacienteServicioPacienteResumenDto = {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
  direccion?: string;
  localidad?: string;
};

export type PacienteServicioServicioResumenDto = {
  id: number;
  nombre: string;
  estado: boolean;
  controlHorario?: boolean;
  modoRelevo?: boolean;
  reglasAsignacion?: ReglasAsignacionServicioDto;
};

export type PacienteServicioDto = {
  id: number;
  pacienteId: number;
  servicioId: number;
  /** null = cualquier prestador habilitado para el servicio puede atender. */
  prestadorId: number | null;
  /** Varios prestadores (servicios con relevamiento). */
  prestadorIds?: number[];
  /** Varios prestadores (servicios con relevamiento). */
  prestadoresAsignados?: PrestadorAsignadoResumenDto[];
  coberturaDiariaInicio?: string | null;
  coberturaDiariaFin?: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  cantidadHoras: number | null;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
  createdAt: string;
  updatedAt: string;
  paciente: PacienteServicioPacienteResumenDto;
  servicio: PacienteServicioServicioResumenDto;
  prestador: PacienteServicioPrestadorResumenDto | null;
};

export type PaginatedPacienteServiciosDto = {
  items: PacienteServicioDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreatePacienteServicioBody = {
  pacienteId: number;
  servicioId: number;
  /** Opcional: sin valor, cualquier prestador habilitado puede atender. */
  prestadorId?: number | null;
  /** Varios prestadores (servicios con relevamiento). */
  prestadorIds?: number[];
  fechaInicio: string;
  fechaFin?: string | null;
  /** Solo relevo: "HH:mm" o null (24h). */
  coberturaDiariaInicio?: string | null;
  coberturaDiariaFin?: string | null;
  /** No enviar en modo relevo — el back completa defaults. */
  periodoControl?: PeriodoControl;
  /** Visitas permitidas en la ventana de control. */
  cantidadPermitida?: number;
  /** Obligatorio cuando `modalidadCobro === "por_hora"`. */
  cantidadHoras?: number | null;
  modalidadCobro?: ModalidadCobro;
  estado?: PacienteServicioEstado;
};

export type UpdatePacienteServicioBody = {
  servicioId?: number;
  prestadorId?: number | null;
  prestadorIds?: number[];
  fechaInicio?: string;
  fechaFin?: string | null;
  coberturaDiariaInicio?: string | null;
  coberturaDiariaFin?: string | null;
  periodoControl?: PeriodoControl;
  cantidadPermitida?: number;
  cantidadHoras?: number | null;
  modalidadCobro?: ModalidadCobro;
  estado?: PacienteServicioEstado;
};

/** GET /paciente-servicios/:id/disponibilidad — plano o envuelto en `disponibilidad`. */
export type PacienteServicioDisponibilidadResponseDto =
  | PacienteServicioDisponibilidadDto
  | {
      pacienteServicioId?: number;
      modalidadCobro?: ModalidadCobro;
      periodoControl?: PeriodoControl;
      disponibilidad?: PacienteServicioDisponibilidadDto;
    };

export type ReportePeriodo = "diario" | "semanal" | "mensual";

export type ReportesMetaDto = {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  periodo?: ReportePeriodo | string | null;
  prestadorId?: number | null;
  servicioId?: number | null;
  facturado?: boolean | null;
  pagado?: boolean | null;
  totalVisitas?: number;
  [key: string]: unknown;
};

export type ReportePrestadorItemDto = {
  prestadorId: number;
  nombre?: string;
  cantidadVisitas: number;
  horasTrabajadas: number;
  totalGenerado: string;
  totalFacturado: string;
  totalPagado: string;
};

export type ReporteServicioItemDto = {
  servicioId: number;
  nombreServicio: string;
  cantidadVisitas: number;
  horasTotales: number;
  totalGenerado: string;
};

export type ReportePrestadoresResponseDto = {
  items: ReportePrestadorItemDto[];
  meta: ReportesMetaDto;
};

export type ReporteServiciosResponseDto = {
  items: ReporteServicioItemDto[];
  meta: ReportesMetaDto;
};

export type ReporteVisitaItemDto = {
  visitaId: number;
  fechaInicio: string;
  tiempoMinutos: number;
  prestadorId: number;
  prestadorNombre: string;
  pacienteNombre: string;
  pacienteApellido: string;
  numeroDocumento: string;
  servicioId: number;
  servicioNombre: string;
  modalidadCobro: ModalidadCobro;
  valorAplicado: string;
  facturado: boolean;
  pagado: boolean;
};

export type ResumenFinancieroDto = {
  cantidadVisitas: number;
  totalGenerado: string;
  totalFacturado: string;
  totalPagado: string;
  pendienteFacturar: string;
  pendientePago: string;
};

export type ReporteVisitasResponseDto = {
  items: ReporteVisitaItemDto[];
  total: number;
  page: number;
  pageSize: number;
  meta: ReportesMetaDto;
  resumen: ResumenFinancieroDto;
};

export type BulkUpdateReporteVisitasFinanzasBody = {
  visitaIds: number[];
  facturado?: boolean;
  pagado?: boolean;
};

export type BulkUpdateReporteVisitasFinanzasResponseDto = {
  actualizadas: number;
  items: ReporteVisitaItemDto[];
};
