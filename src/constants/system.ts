/**
 * IDs fijos que el backend asume (BACKEND_API_GUIDE.md §3 y Apéndice A.6).
 * No son reglas nuevas: están documentados en la guía.
 */
export const ESTADO = {
  ACTIVO: 1,
  ORDEN_PENDIENTE: 3,
  ORDEN_RECHAZADO: 5,
  VENTA_CREDITO: 6,
  VENTA_ANULADO: 7,
  VENTA_PAGADO: 8,
  CUOTA_POR_COBRAR: 9,
  CUOTA_CANCELADO: 10,
  CUOTA_PENDIENTE: 11,
  ORDEN_APROBADO: 23,
} as const;

export const TIPO_MOVIMIENTO = {
  ENTRADA: 1,
  SALIDA: 2,
} as const;

/** `tipoCodigo` documentados para GET /estado/{codigo}. */
export const CODIGOS_ESTADO = ['GENERAL', 'ORDEN', 'VENTA', 'CUOTA'] as const;

/** Comodín literal documentado en filtros. */
export const TODOS = 'Todos';

/** Prefijos de comprobante generados por el servidor. */
export const COMPROBANTE = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta',
} as const;

export const IGV = 0.18;
