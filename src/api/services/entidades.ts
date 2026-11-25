import { api } from '../client';
import type {
  EntidadFilters,
  EntidadRequest,
  EntidadResponse,
  Id,
  Page,
} from '../../types/api';

export const entidadesService = {
  list: async (filters: EntidadFilters = {}): Promise<Page<EntidadResponse>> => {
    const { data } = await api.get<Page<EntidadResponse>>('/entidad', {
      params: filters,
    });
    return data;
  },

  /** Sin paginación; pensado para pickers de cliente/proveedor. */
  getAll: async (): Promise<EntidadResponse[]> => {
    const { data } = await api.get<EntidadResponse[]>('/entidad/todas');
    return data;
  },

  getById: async (id: Id): Promise<EntidadResponse> => {
    const { data } = await api.get<EntidadResponse>(`/entidad/${id}`);
    return data;
  },

  create: async (body: EntidadRequest): Promise<EntidadResponse> => {
    const { data } = await api.post<EntidadResponse>('/entidad', body);
    return data;
  },

  update: async (id: Id, body: EntidadRequest): Promise<EntidadResponse> => {
    const { data } = await api.put<EntidadResponse>(`/entidad/${id}`, body);
    return data;
  },

  // El backend no expone DELETE /entidad/{id}; no se inventa.
};
