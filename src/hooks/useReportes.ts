import { useQuery } from '@tanstack/react-query';

import { reportesService } from '@/api/services/reportes';
import type { ReporteComprasFilters, ReporteVentasFilters } from '@/types/api';

export const reportesKeys = {
  all: ['reportes'] as const,
  compras: (filters: ReporteComprasFilters) =>
    ['reportes', 'compras', filters] as const,
  ventas: (filters: ReporteVentasFilters) =>
    ['reportes', 'ventas', filters] as const,
};

export function useReporteCompras(filters: ReporteComprasFilters) {
  return useQuery({
    queryKey: reportesKeys.compras(filters),
    queryFn: () => reportesService.getCompras(filters),
  });
}

export function useReporteVentas(filters: ReporteVentasFilters) {
  return useQuery({
    queryKey: reportesKeys.ventas(filters),
    queryFn: () => reportesService.getVentas(filters),
  });
}
