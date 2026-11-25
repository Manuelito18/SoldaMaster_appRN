import { api } from '../client';
import type { ActividadDTO, ResumenDashboardDTO } from '../../types/api';

export const dashboardService = {
  getResumen: async (): Promise<ResumenDashboardDTO> => {
    const { data } = await api.get<ResumenDashboardDTO>('/dashboard/resumen');
    return data;
  },

  /** El servidor ya limita la lista a 20 eventos. */
  getActividad: async (): Promise<ActividadDTO[]> => {
    const { data } = await api.get<ActividadDTO[]>('/dashboard/actividad');
    return data;
  },
};
