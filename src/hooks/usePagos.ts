import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { pagosService } from '@/api/services/pagos';
import type { CrearPagoRequest, Id } from '@/types/api';

export const pagosKeys = {
  all: ['pagos'] as const,
  cuotas: ['pagos', 'cuotas'] as const,
  cuotasPorVenta: (id: Id) => ['pagos', 'cuotas', id] as const,
  historial: ['pagos', 'historial'] as const,
};

export function useCuotasPorCobrar() {
  return useQuery({
    queryKey: pagosKeys.cuotas,
    queryFn: pagosService.getCuotas,
  });
}

export function useCuotasPorVenta(id: Id) {
  return useQuery({
    queryKey: pagosKeys.cuotasPorVenta(id),
    queryFn: () => pagosService.getCuotasPorVenta(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useHistorialPagos() {
  return useQuery({
    queryKey: pagosKeys.historial,
    queryFn: pagosService.getAll,
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearPagoRequest) => pagosService.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pagosKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['ventas'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
