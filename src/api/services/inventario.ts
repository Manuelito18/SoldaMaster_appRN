import { api } from '../client';
import type {
  CertificadoRequest,
  Id,
  LoteRequest,
  LoteResponse,
  MovimientoInventarioResponse,
  ProductoInventarioRequest,
} from '../../types/api';

export const inventarioService = {
  /** Alta de producto + saldo inicial (no existe POST /productos). */
  crearProducto: async (
    body: ProductoInventarioRequest,
  ): Promise<MovimientoInventarioResponse> => {
    const { data } = await api.post<MovimientoInventarioResponse>(
      '/inventario/producto',
      body,
    );
    return data;
  },

  crearLote: async (body: LoteRequest): Promise<LoteResponse> => {
    const { data } = await api.post<LoteResponse>('/inventario/lote', body);
    return data;
  },

  crearCertificado: async (
    idLote: Id,
    body: CertificadoRequest,
  ): Promise<LoteResponse> => {
    const { data } = await api.post<LoteResponse>(
      `/inventario/certificado/${idLote}`,
      body,
    );
    return data;
  },

  getLotesPorProducto: async (idProducto: Id): Promise<LoteResponse[]> => {
    const { data } = await api.get<LoteResponse[]>(`/lote/producto/${idProducto}`);
    return data;
  },

  getKardexProducto: async (
    idProducto: Id,
  ): Promise<MovimientoInventarioResponse[]> => {
    const { data } = await api.get<MovimientoInventarioResponse[]>(
      `/kardex/producto/${idProducto}`,
    );
    return data;
  },

  /** El backend limita este endpoint a los 100 movimientos más recientes. */
  getKardexGlobal: async (): Promise<MovimientoInventarioResponse[]> => {
    const { data } = await api.get<MovimientoInventarioResponse[]>('/kardex/global');
    return data;
  },
};
