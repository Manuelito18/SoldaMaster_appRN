import { api } from '../client';
import type {
  Id,
  Page,
  ProductoFilters,
  ProductoRequest,
  ProductoResponse,
} from '../../types/api';

export const productosService = {
  /** Sin paginación según el contrato. */
  getAll: async (): Promise<ProductoResponse[]> => {
    const { data } = await api.get<ProductoResponse[]>('/productos/todos');
    return data;
  },

  list: async (filters: ProductoFilters = {}): Promise<Page<ProductoResponse>> => {
    const { data } = await api.get<Page<ProductoResponse>>('/productos', {
      params: filters,
    });
    return data;
  },

  getById: async (id: Id): Promise<ProductoResponse> => {
    const { data } = await api.get<ProductoResponse>(`/productos/${id}`);
    return data;
  },

  /** No existe POST /productos: el alta se hace en inventario/producto. */
  update: async (id: Id, body: ProductoRequest): Promise<ProductoResponse> => {
    const { data } = await api.put<ProductoResponse>(`/productos/${id}`, body);
    return data;
  },
};
