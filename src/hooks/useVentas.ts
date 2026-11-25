import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ventasService } from '@/api/services/ventas';
import type { Id, PaginationParams, VentaRequest } from '@/types/api';

export const ventasKeys = {
  all: ['ventas'] as const,
  listAll: ['ventas', 'all'] as const,
  credito: ['ventas', 'credito'] as const,
  detail: (id: Id) => ['ventas', 'detail', id] as const,
  porCliente: (id: Id, params: PaginationParams) =>
    ['ventas', 'cliente', id, params] as const,
};

export function useVentas() {
  return useQuery({
    queryKey: ventasKeys.listAll,
    queryFn: ventasService.getAll,
  });
}

export function useVentasCredito() {
  return useQuery({
    queryKey: ventasKeys.credito,
    queryFn: ventasService.getCredito,
  });
}

export function useVenta(id: Id) {
  return useQuery({
    queryKey: ventasKeys.detail(id),
    queryFn: () => ventasService.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useVentasPorCliente(id: Id, params: PaginationParams = {}) {
  return useQuery({
    queryKey: ventasKeys.porCliente(id, params),
    queryFn: () => ventasService.listPorCliente(id, params),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCrearVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: VentaRequest) => ventasService.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ventasKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['productos'] });
      void queryClient.invalidateQueries({ queryKey: ['inventario'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}
