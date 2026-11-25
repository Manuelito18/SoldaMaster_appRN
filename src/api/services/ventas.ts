import { api } from '../client';
import type {
  Id,
  Page,
  PaginationParams,
  VentaCreditoResponse,
  VentaRequest,
  VentaResponse,
} from '../../types/api';

export const ventasService = {
  /** El servidor genera la serie y fuerza el estado (8 pagado / 6 crédito). */
  create: async (body: VentaRequest): Promise<VentaResponse> => {
    const { data } = await api.post<VentaResponse>('/venta', body);
    return data;
  },

  /** Sin paginación según el contrato. */
  getAll: async (): Promise<VentaResponse[]> => {
    const { data } = await api.get<VentaResponse[]>('/venta');
    return data;
  },

  /** Única forma garantizada de obtener los detalles completos. */
  getById: async (id: Id): Promise<VentaResponse> => {
    const { data } = await api.get<VentaResponse>(`/venta/${id}`);
    return data;
  },

  listPorCliente: async (
    idCliente: Id,
    filters: PaginationParams = {},
  ): Promise<Page<VentaResponse>> => {
    const { data } = await api.get<Page<VentaResponse>>(
      `/venta/cliente/${idCliente}`,
      { params: filters },
    );
    return data;
  },

  getCredito: async (): Promise<VentaCreditoResponse[]> => {
    const { data } = await api.get<VentaCreditoResponse[]>('/venta/credito');
    return data;
  },
};
