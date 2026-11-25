import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { productosService } from '@/api/services/productos';
import type { Id, ProductoFilters, ProductoRequest } from '@/types/api';
import { inventarioKeys, productoKeys as keys } from './query-keys';

export function useProductos(filters: ProductoFilters) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => productosService.list(filters),
  });
}

export function useProductosTodos() {
  return useQuery({
    queryKey: keys.todas,
    queryFn: productosService.getAll,
  });
}

export function useProducto(id: Id) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => productosService.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useActualizarProducto(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductoRequest) => productosService.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
      void queryClient.invalidateQueries({ queryKey: keys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}

export function useInvalidarProductos() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: keys.all });
    void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
  };
}
