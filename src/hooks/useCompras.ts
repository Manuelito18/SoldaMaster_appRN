import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { comprasService } from '@/api/services/compras';
import { ordenesService } from '@/api/services/ordenes';
import type {
  CompraFilters,
  CompraRequest,
  Id,
  OrdenCompraRequest,
  OrdenFilters,
} from '@/types/api';

export const comprasKeys = {
  all: ['compras'] as const,
  ordenes: ['compras', 'ordenes'] as const,
  ordenList: (filters: OrdenFilters) =>
    ['compras', 'ordenes', 'list', filters] as const,
  ordenPendientes: ['compras', 'ordenes', 'pendientes'] as const,
  ordenDetail: (id: Id) => ['compras', 'ordenes', 'detail', id] as const,
  compraList: (filters: CompraFilters) =>
    ['compras', 'compras', 'list', filters] as const,
  compraDetail: (id: Id) => ['compras', 'compras', 'detail', id] as const,
};

export function useOrdenes(filters: OrdenFilters) {
  return useQuery({
    queryKey: comprasKeys.ordenList(filters),
    queryFn: () => ordenesService.listGlobal(filters),
  });
}

export function useOrdenesPendientes() {
  return useQuery({
    queryKey: comprasKeys.ordenPendientes,
    queryFn: ordenesService.getPendientes,
  });
}

export function useOrden(id: Id) {
  return useQuery({
    queryKey: comprasKeys.ordenDetail(id),
    queryFn: () => ordenesService.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCompras(filters: CompraFilters) {
  return useQuery({
    queryKey: comprasKeys.compraList(filters),
    queryFn: () => comprasService.listGlobal(filters),
  });
}

export function useCompra(id: Id) {
  return useQuery({
    queryKey: comprasKeys.compraDetail(id),
    queryFn: () => comprasService.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

function useInvalidarCompras() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: comprasKeys.all });
  };
}

export function useCrearOrden() {
  const invalidar = useInvalidarCompras();
  return useMutation({
    mutationFn: (body: OrdenCompraRequest) => ordenesService.create(body),
    onSuccess: invalidar,
  });
}

export function useRechazarOrden(id: Id) {
  const invalidar = useInvalidarCompras();
  return useMutation({
    mutationFn: () => ordenesService.rechazar(id),
    onSuccess: invalidar,
  });
}

export function useCrearCompra() {
  const invalidar = useInvalidarCompras();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CompraRequest) => comprasService.create(body),
    onSuccess: () => {
      invalidar();
      // La compra incrementa stock y puede aprobar la orden (estado 23).
      void queryClient.invalidateQueries({ queryKey: ['productos'] });
      void queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
  });
}
