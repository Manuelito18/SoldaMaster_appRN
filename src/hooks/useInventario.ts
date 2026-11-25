import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { inventarioService } from '@/api/services/inventario';
import type {
  CertificadoRequest,
  Id,
  LoteRequest,
  ProductoInventarioRequest,
} from '@/types/api';
import { inventarioKeys as keys, productoKeys } from './query-keys';

export function useLotes(idProducto: Id) {
  return useQuery({
    queryKey: keys.lotes(idProducto),
    queryFn: () => inventarioService.getLotesPorProducto(idProducto),
    enabled: Number.isInteger(idProducto) && idProducto > 0,
  });
}

export function useKardexProducto(idProducto: Id) {
  return useQuery({
    queryKey: keys.kardexProducto(idProducto),
    queryFn: () => inventarioService.getKardexProducto(idProducto),
    enabled: Number.isInteger(idProducto) && idProducto > 0,
  });
}

export function useKardexGlobal() {
  return useQuery({
    queryKey: keys.kardexGlobal,
    queryFn: inventarioService.getKardexGlobal,
  });
}

function useInvalidarInventario() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: keys.all });
    void queryClient.invalidateQueries({ queryKey: productoKeys.all });
  };
}

export function useCrearProductoConSaldo() {
  const invalidar = useInvalidarInventario();
  return useMutation({
    mutationFn: (body: ProductoInventarioRequest) =>
      inventarioService.crearProducto(body),
    onSuccess: invalidar,
  });
}

export function useCrearLote() {
  const invalidar = useInvalidarInventario();
  return useMutation({
    mutationFn: (body: LoteRequest) => inventarioService.crearLote(body),
    onSuccess: invalidar,
  });
}

export function useCrearCertificado(idLote: Id) {
  const invalidar = useInvalidarInventario();
  return useMutation({
    mutationFn: (body: CertificadoRequest) =>
      inventarioService.crearCertificado(idLote, body),
    onSuccess: invalidar,
  });
}
