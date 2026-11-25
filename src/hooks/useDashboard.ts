import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '@/api/services/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  resumen: ['dashboard', 'resumen'] as const,
  actividad: ['dashboard', 'actividad'] as const,
};

export function useResumenDashboard() {
  return useQuery({
    queryKey: dashboardKeys.resumen,
    queryFn: dashboardService.getResumen,
  });
}

export function useActividadDashboard() {
  return useQuery({
    queryKey: dashboardKeys.actividad,
    queryFn: dashboardService.getActividad,
  });
}
