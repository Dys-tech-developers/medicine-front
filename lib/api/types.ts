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
  fecha: string;
  tiempoMinutos: number;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  pacienteServicio: VisitaPacienteServicioResumenDto;
  prestador: VisitaPrestadorResumenDto;
  insumos: VisitaInsumoResumenDto[];
  finanzas?: VisitaFinanzasDto | null;
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

export type CreatePacienteBody = {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
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
  obraSocialId?: number;
  obraSocial?: ObraSocialResumenDto | null;
  numeroAfiliado: string;
  createdAt: string;
};

export type PacienteDto = PacienteListItemDto & {
  updatedAt: string;
  qrDataUrl: string;
};

/** Servicio asignado al paciente (GET /pacientes/qr/:codigoQr). */
export type PacienteServicioAsignadoQrDto = {
  pacienteServicioId: number;
  servicioId: number;
  servicioNombre: string;
  modalidadCobro: ModalidadCobro;
  frecuenciaTipo: FrecuenciaTipo;
  frecuenciaValor: number;
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
};

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

export type ModalidadCobro = "por_servicio" | "por_hora" | "por_dia";

export type TipoJornada = "diurno" | "nocturno";

export type TipoDia = "habil" | "sabado" | "domingo" | "feriado";

export type PacienteServicioEstado = "activa" | "suspendida" | "finalizada";

export type ServicioDto = {
  id: number;
  nombre: string;
  estado: boolean;
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

export type PacienteServicioDisponibilidadDto = {
  periodoControl?: FrecuenciaTipo | string;
  inicioVentana?: string;
  finVentana?: string;
  fechaReferencia?: string;
  cantidadUtilizada: number;
  cantidadPermitida: number;
  cantidadDisponible?: number;
  utilizadoYPermitido?: string;
};

export type ServicioPacienteAsignadoDto = {
  pacienteServicioId: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  numeroDocumento?: string;
  codigoQr?: string;
  modalidadCobro: ModalidadCobro;
  frecuenciaTipo: FrecuenciaTipo;
  frecuenciaValor: number;
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
  tarifas: CreateServicioTarifaBody[];
};

export type UpdateServicioBody = {
  nombre?: string;
  descripcion?: string | null;
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

export type FrecuenciaTipo = "diaria" | "semanal" | "mensual" | "por_horas";

export type PacienteServicioPacienteResumenDto = {
  id: number;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  codigoQr: string;
};

export type PacienteServicioServicioResumenDto = {
  id: number;
  nombre: string;
  estado: boolean;
};

export type PacienteServicioDto = {
  id: number;
  pacienteId: number;
  servicioId: number;
  fechaInicio: string;
  fechaFin: string | null;
  frecuenciaTipo: FrecuenciaTipo;
  frecuenciaValor: number;
  modalidadCobro: ModalidadCobro;
  estado: PacienteServicioEstado;
  createdAt: string;
  updatedAt: string;
  paciente: PacienteServicioPacienteResumenDto;
  servicio: PacienteServicioServicioResumenDto;
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
  fechaInicio: string;
  fechaFin?: string | null;
  /** Campo nuevo esperado por backend para definir ventana de control. */
  periodoControl: FrecuenciaTipo;
  /** Cupo del período (diario/semanal/mensual), mapeado desde frecuenciaValor. */
  cantidadPermitida: number;
  /** Compatibilidad temporal con versiones anteriores del backend. */
  frecuenciaTipo?: FrecuenciaTipo;
  frecuenciaValor: number;
  modalidadCobro: ModalidadCobro;
  estado?: PacienteServicioEstado;
};

export type PacienteServicioDisponibilidadResponseDto = {
  pacienteServicioId?: number;
  modalidadCobro?: ModalidadCobro;
  frecuenciaTipo?: FrecuenciaTipo;
  disponibilidad: PacienteServicioDisponibilidadDto;
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
