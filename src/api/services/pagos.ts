import { api } from '../client';
import type {
  CrearPagoRequest,
  CuotaResponse,
  Id,
  PagoResponse,
} from '../../types/api';

export const pagosService = {
  create: async (body: CrearPagoRequest): Promise<PagoResponse> => {
    const { data } = await api.post<PagoResponse>('/pago', body);
    return data;
  },

  /** Solo cuotas en estado 9 u 11 ("por cobrar"). */
  getCuotas: async (): Promise<CuotaResponse[]> => {
    const { data } = await api.get<CuotaResponse[]>('/pago/cuotas');
    return data;
  },

  getCuotasPorVenta: async (idVenta: Id): Promise<CuotaResponse[]> => {
    const { data } = await api.get<CuotaResponse[]>(`/pago/cuotas/${idVenta}`);
    return data;
  },

  getAll: async (): Promise<PagoResponse[]> => {
    const { data } = await api.get<PagoResponse[]>('/pago');
    return data;
  },
};
