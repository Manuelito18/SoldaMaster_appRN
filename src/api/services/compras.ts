import { api } from '../client';
import type {
  CompraFilters,
  CompraRequest,
  CompraResponse,
  Id,
  Page,
  PaginationParams,
} from '../../types/api';

export const comprasService = {
  /** Si `idOrden` viene informado, el backend aprueba la orden (estado 23). */
  create: async (body: CompraRequest): Promise<CompraResponse> => {
    const { data } = await api.post<CompraResponse>('/compra', body);
    return data;
  },

  getById: async (id: Id): Promise<CompraResponse> => {
    const { data } = await api.get<CompraResponse>(`/compra/${id}`);
    return data;
  },

  listGlobal: async (
    filters: CompraFilters = {},
  ): Promise<Page<CompraResponse>> => {
    const { data } = await api.get<Page<CompraResponse>>('/compra/global', {
      params: filters,
    });
    return data;
  },

  listPorProveedor: async (
    idProveedor: Id,
    filters: PaginationParams = {},
  ): Promise<Page<CompraResponse>> => {
    const { data } = await api.get<Page<CompraResponse>>(
      `/compra/proveedor/${idProveedor}`,
      { params: filters },
    );
    return data;
  },
};
