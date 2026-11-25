import { api } from '../client';
import type {
  CategoriaResponse,
  EstadoResponse,
  MedidaResponse,
  MetodoPagoResponse,
  RolResponse,
  TipoEntidadResponse,
} from '../../types/api';

export const catalogosService = {
  getCategorias: async (): Promise<CategoriaResponse[]> => {
    const { data } = await api.get<CategoriaResponse[]>('/categoria');
    return data;
  },

  getMedidas: async (): Promise<MedidaResponse[]> => {
    const { data } = await api.get<MedidaResponse[]>('/medida');
    return data;
  },

  getEstados: async (): Promise<EstadoResponse[]> => {
    const { data } = await api.get<EstadoResponse[]>('/estado');
    return data;
  },

  /** `codigo` es tipoCodigo, no el id numérico. Devuelve [] si no existe. */
  getEstadosPorCodigo: async (codigo: string): Promise<EstadoResponse[]> => {
    const { data } = await api.get<EstadoResponse[]>(
      `/estado/${encodeURIComponent(codigo)}`,
    );
    return data;
  },

  getTiposEntidad: async (): Promise<TipoEntidadResponse[]> => {
    const { data } = await api.get<TipoEntidadResponse[]>('/tipo-entidad');
    return data;
  },

  getRoles: async (): Promise<RolResponse[]> => {
    const { data } = await api.get<RolResponse[]>('/usuarios/roles');
    return data;
  },

  getMetodosPago: async (): Promise<MetodoPagoResponse[]> => {
    const { data } = await api.get<MetodoPagoResponse[]>('/venta/metodo-pago');
    return data;
  },
};
