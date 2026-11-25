/**
 * Contratos del backend Solda Master.
 * Fuente: BACKEND_API_GUIDE.md (Apéndice A: DTOs de request/response).
 * Los nombres de campos se respetan literalmente; no se inventan campos ni reglas.
 */

/** BigDecimal de Java se serializa como número JSON. */
export type Money = number;
/** LocalDate -> "YYYY-MM-DD". */
export type LocalDate = string;
/** LocalDateTime -> "YYYY-MM-DDTHH:mm:ss". */
export type LocalDateTime = string;
export type Id = number;

/** Forma real de Spring Data Page<T> (no un array plano). */
export interface Page<T> {
  content: T[];
  pageable?: {
    pageNumber?: number;
    pageSize?: number;
    offset?: number;
    paged?: boolean;
    unpaged?: boolean;
    sort?: { sorted?: boolean; unsorted?: boolean; empty?: boolean };
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort?: { sorted?: boolean; unsorted?: boolean; empty?: boolean };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

/* -------------------------------------------------------------------------- */
/* Catálogos y referencias                                                    */
/* -------------------------------------------------------------------------- */

export interface EstadoResponse {
  idEstado: Id;
  tipoCodigo: string;
  nombre: string;
}

export interface CategoriaResponse {
  idCategoria: Id;
  nombre: string;
}

export interface MedidaResponse {
  idMedida: Id;
  nombre: string;
}

export interface TipoEntidadResponse {
  idTipoEntidad: Id;
  nombre: string;
}

export interface RolResponse {
  idRol: Id;
  nombre: string;
}

export interface MetodoPagoResponse {
  idMetodoPago: Id;
  nombre: string;
}

export interface TipoMovimientoResponse {
  idTipoMovimiento: Id;
  nombre: string;
}

export interface EntidadResponse {
  idEntidad: Id;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombreRazonSocial: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  idEstado: EstadoResponse;
  idTipoEntidad: TipoEntidadResponse | null;
}

/**
 * Usuario anidado en ventas/compras/órdenes.
 * El backend serializa el hash BCrypt en `password`: NUNCA mostrarlo ni loguearlo.
 */
export interface UsuarioResponse {
  idUsuario: Id;
  usuario: string;
  password?: string;
  idEntidad: EntidadResponse;
  idEstado: EstadoResponse;
  idRol: RolResponse;
}

export interface LoginResponse {
  idUsuario: Id;
  entidad: EntidadResponse;
  nombreRol: string;
}

/* -------------------------------------------------------------------------- */
/* Productos, lotes, certificados y kardex                                    */
/* -------------------------------------------------------------------------- */

export interface ProductoResponse {
  idProducto: Id;
  codigoBarras: string | null;
  nombreDescripcion: string;
  precioVenta: Money;
  stock: number;
  stockMinimo: number;
  imagenUrl: string | null;
  manejaLote: boolean | null;
  precioMayorista: Money | null;
  precioDistribuidor: Money | null;
  codigoUnico: string;
  idCategoria: CategoriaResponse;
  idEstado: EstadoResponse;
  idUnidadMedida: MedidaResponse;
}

export interface CertificadoResponse {
  idCertificado: Id;
  numero: string | null;
  fechaEmision: LocalDate | null;
  archivoUrl: string | null;
}

export interface LoteResponse {
  idLote: Id;
  numeroLote: string | null;
  fechaEntrada: LocalDateTime | null;
  stockLote: number | null;
  idCertificado: CertificadoResponse | null;
  idProducto: ProductoResponse;
}

export interface MovimientoInventarioResponse {
  idMovimiento: Id;
  cantidad: number;
  fecha: LocalDateTime;
  referencia: string | null;
  idLote: LoteResponse | null;
  idProducto: ProductoResponse;
  idTipoMovimiento: TipoMovimientoResponse;
}

/* -------------------------------------------------------------------------- */
/* Órdenes de compra y compras                                                */
/* -------------------------------------------------------------------------- */

export interface DetalleOrdenResponse {
  idDetalleOrden: Id;
  cantidadPedida: number;
  precioUnitarioPactado: Money;
  idOrden?: OrdenCompraResponse | null;
  idProducto: ProductoResponse;
}

export interface OrdenCompraResponse {
  idOrden: Id;
  fechaPedido: LocalDateTime;
  fechaEntrega: LocalDate | null;
  totalEstimado: Money;
  idProveedor: EntidadResponse;
  idEstadoOrden: EstadoResponse;
  idUsuario: UsuarioResponse;
  listaDetalles: DetalleOrdenResponse[];
}

export interface DetalleCompraResponse {
  idDetalleCompra: Id;
  cantidad: number;
  precioCostoUnitario: Money;
  idCompra?: CompraResponse | null;
  idLote: LoteResponse | null;
  idProducto: ProductoResponse;
}

export interface CompraResponse {
  idCompra: Id;
  tipoComprobante: string;
  serieCorrelativa: string;
  fechaCompra: LocalDateTime;
  montoTotal: Money;
  idOrden: OrdenCompraResponse | null;
  idProveedor: EntidadResponse;
  idUsuario: UsuarioResponse;
  listaDetalleCompra: DetalleCompraResponse[];
}

/* -------------------------------------------------------------------------- */
/* Ventas, pagos, cuotas y créditos                                           */
/* -------------------------------------------------------------------------- */

export interface DetalleVentaResponse {
  cantidad: number;
  precioUnitario: Money;
  descuentoProducto: Money | null;
  subTotal: Money;
  idLote: LoteResponse | null;
  idProducto: ProductoResponse;
  idVenta?: VentaResponse | null;
}

export interface VentaResponse {
  idVenta: Id;
  idVentaOrigen: Id | null;
  tipoComprobante: string;
  fechaEmision: LocalDateTime;
  serieCorrelativa: string;
  total: Money;
  subtotal: Money;
  descuentoGlobal: Money | null;
  idCliente: EntidadResponse;
  idEstadoVenta: EstadoResponse;
  idUsuario: UsuarioResponse;
  detallesVentasList: DetalleVentaResponse[];
}

export interface VentaCreditoResponse {
  idVenta: Id;
  serieCorrelativa: string;
  total: Money;
  totalPendiente: Money;
  /** "Cancelada" | "Parcial" | "Pendiente" (calculado por el servidor). */
  estado: string;
  cliente: EntidadResponse;
}

export interface CuotaResponse {
  idCuota: Id;
  numeroCuota: number;
  fechaVencimiento: LocalDate;
  monto: Money;
  idEstadoCuota: EstadoResponse;
  idVenta: VentaResponse;
  montoPagado: Money;
  montoPendiente: Money;
}

export interface DetallePagoResponse {
  idDetallePago: Id;
  monto: Money;
  idCuota: CuotaResponse;
  idPago?: PagoResponse | null;
}

export interface PagoResponse {
  idPago: Id;
  montoTotal: Money;
  fecha: LocalDateTime;
  referenciaPago: string | null;
  idMetodoPago: MetodoPagoResponse;
  idVenta: VentaResponse;
}

/* -------------------------------------------------------------------------- */
/* Dashboard y reportes                                                       */
/* -------------------------------------------------------------------------- */

export interface ActividadDTO {
  time: string;
  label: string;
  desc: string;
  /** `@JsonIgnore` en el backend: no viene en la respuesta. */
  fechaFiltro?: never;
}

export interface ResumenDashboardDTO {
  ventasHoy: Money;
  ventasMes: Money;
  comprasMes: Money;
  utilidadNeta: Money;
  totalClientes: number;
  totalProductos: number;
  inventarioUnidades: number;
  inventarioValor: Money;
  alertasStockCritico: number;
}

export interface ReporteCompraDTO {
  pagina: Page<CompraResponse>;
  totalRango: Money;
  totalGlobal: Money;
  cantidadGlobal: number;
}

export interface ReporteVentaDTO {
  pagina: Page<VentaResponse>;
  totalRango: Money;
  totalGlobal: Money;
  cantidadGlobal: number;
  ventasHoy: Money;
  ventasMes: Money;
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

export interface UsuarioCredenciales {
  usuario: string;
  password: string;
}

export interface EntidadRequest {
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombreRazonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  idEstado: Id;
  /** Omitido => null en el backend (tanto en alta como en actualización). */
  idTipoEntidad?: Id | null;
}

export interface ProductoRequest {
  codigoBarras?: string;
  nombreDescripcion: string;
  precioVenta: Money;
  stock?: number;
  stockMinimo?: number;
  imagenUrl?: string;
  /** Si es null, el backend puede fallar con 500. */
  manejaLote: boolean;
  precioMayorista?: Money;
  precioDistribuidor?: Money;
  codigoUnico: string;
  /** Nombre de categoría (no id); el backend la crea si no existe. */
  idCategoria?: string;
  idEstado: Id;
  /** Nombre de unidad de medida (no id); el backend la crea si no existe. */
  idUnidadMedida?: string;
}

export interface LoteRequest {
  numeroLote?: string;
  fechaEntrada?: LocalDateTime;
  stockLote?: number;
  idCertificado?: Id;
  idProducto?: Id;
}

export interface CertificadoRequest {
  numero?: string;
  fechaEmision?: LocalDate;
  archivoUrl?: string;
}

export interface ProductoInventarioRequest {
  producto: ProductoRequest;
  /** Obligatorio cuando `producto.manejaLote === true`. */
  lote: LoteRequest;
  certificado?: CertificadoRequest | null;
}

export interface DetalleOrdenRequest {
  cantidadPedida: number;
  precioUnitarioPactado: Money;
  idOrden?: Id;
  idProducto: Id;
}

export interface OrdenCompraRequest {
  fechaPedido: LocalDateTime;
  fechaEntrega?: LocalDate;
  totalEstimado: Money;
  idProveedor: Id;
  /** Id 3 = pendiente (según datos semilla de la guía). */
  idEstadoOrden: Id;
  idUsuario: Id;
  listaDetalles: DetalleOrdenRequest[];
}

export interface DetalleCompraRequest {
  cantidad: number;
  precioCostoUnitario: Money;
  idCompra?: Id;
  idLote?: Id;
  /** No blank => el backend crea un lote nuevo automáticamente. */
  numeroLote?: string;
  idProducto: Id;
}

export interface CompraRequest {
  tipoComprobante: string;
  /** El backend NO genera serie para compras: la aporta el cliente. */
  serieCorrelativa: string;
  fechaCompra: LocalDateTime;
  montoTotal: Money;
  /** Si se envía, la orden pasa a estado 23 (aprobada). */
  idOrden?: Id | null;
  idProveedor: Id;
  idUsuario: Id;
  listaDetalleCompra: DetalleCompraRequest[];
}

export interface PagoRequest {
  montoTotal: Money;
  referenciaPago?: string;
  idMetodoPago: Id;
  /** Obligatorio en POST /pago; se ignora cuando va anidado en una venta. */
  idVenta?: Id;
}

export interface CuotaRequest {
  numeroCuota: number;
  fechaVencimiento: LocalDate;
  monto: Money;
  idEstadoCuota: Id;
  idVenta?: Id;
}

export interface DetalleVentaRequest {
  cantidad: number;
  /** Debe ser exactamente precioVenta, precioMayorista o precioDistribuidor. */
  precioUnitario: Money;
  descuentoProducto?: Money;
  subTotal: Money;
  idLote?: Id | null;
  idProducto: Id;
  idVenta?: Id;
}

export interface VentaRequest {
  idVentaOrigen?: Id | null;
  /** El servidor la sobrescribe. */
  serieCorrelativa?: string;
  /** "Factura" (case-insensitive) => serie F001-; cualquier otro => B001-. */
  tipoComprobante: string;
  /** El servidor la ignora y usa now() en America/Lima. */
  fechaEmision?: LocalDateTime;
  total: Money;
  subtotal: Money;
  descuentoGlobal?: Money;
  idCliente: Id;
  /** El servidor lo fuerza a 8 (pagado) o 6 (crédito). */
  idEstadoVenta?: Id;
  idUsuario: Id;
  detallesVentasList: DetalleVentaRequest[];
  pagosList?: PagoRequest[];
  cuotasList?: CuotaRequest[];
}

/** POST /pago exige idVenta (en VentaRequest se sobrescribe). */
export type CrearPagoRequest = PagoRequest & { idVenta: Id };

/* -------------------------------------------------------------------------- */
/* Filtros de query (según parámetros documentados)                           */
/* -------------------------------------------------------------------------- */

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface EntidadFilters extends PaginationParams {
  /** "Todos" (o vacío) = sin filtro. */
  tipoEntidad?: string;
  tipoDocumento?: string;
  busqueda?: string;
}

export interface ProductoFilters extends PaginationParams {
  busqueda?: string;
  idCategoria?: Id;
}

export interface OrdenFilters extends PaginationParams {
  search?: string;
}

export interface CompraFilters extends PaginationParams {
  search?: string;
}

export interface ReporteComprasFilters extends PaginationParams {
  proveedor?: Id;
  /** Formato estricto YYYY-MM-DD. */
  dateStart?: LocalDate;
  dateEnd?: LocalDate;
}

export interface ReporteVentasFilters extends PaginationParams {
  /** Formato estricto YYYY-MM-DD. */
  dateStart?: LocalDate;
  dateEnd?: LocalDate;
  /** Coincidencia exacta; "Todos"/vacío = sin filtro. */
  docType?: string;
  client?: string;
}
