import { api } from '../client';
import type {
  ReporteCompraDTO,
  ReporteComprasFilters,
  ReporteVentaDTO,
  ReporteVentasFilters,
} from '../../types/api';

export const reportesService = {
  /** Sin filtro docType: el backend no lo expone para compras. */
  getCompras: async (
    filters: ReporteComprasFilters = {},
  ): Promise<ReporteCompraDTO> => {
    const { data } = await api.get<ReporteCompraDTO>('/reporte/compras', {
      params: filters,
    });
    return data;
  },

  getVentas: async (
    filters: ReporteVentasFilters = {},
  ): Promise<ReporteVentaDTO> => {
    const { data } = await api.get<ReporteVentaDTO>('/reporte/ventas', {
      params: filters,
    });
    return data;
  },
};
