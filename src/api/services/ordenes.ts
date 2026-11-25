import { api } from '../client';
import type {
  Id,
  OrdenCompraRequest,
  OrdenCompraResponse,
  OrdenFilters,
  Page,
} from '../../types/api';

export const ordenesService = {
  create: async (body: OrdenCompraRequest): Promise<OrdenCompraResponse> => {
    const { data } = await api.post<OrdenCompraResponse>('/orden-compra', body);
    return data;
  },

  listGlobal: async (
    filters: OrdenFilters = {},
  ): Promise<Page<OrdenCompraResponse>> => {
    const { data } = await api.get<Page<OrdenCompraResponse>>(
      '/orden-compra/global',
      { params: filters },
    );
    return data;
  },

  /** Órdenes con estado 3 (pendiente), según el backend. */
  getPendientes: async (): Promise<OrdenCompraResponse[]> => {
    const { data } = await api.get<OrdenCompraResponse[]>(
      '/orden-compra/pendientes',
    );
    return data;
  },

  getById: async (id: Id): Promise<OrdenCompraResponse> => {
    const { data } = await api.get<OrdenCompraResponse>(`/orden-compra/${id}`);
    return data;
  },

  /** Pasa la orden a estado 5 (rechazado). */
  rechazar: async (id: Id): Promise<OrdenCompraResponse> => {
    const { data } = await api.put<OrdenCompraResponse>(
      `/orden-compra/${id}/rechazar`,
    );
    return data;
  },
};
