import { useEffect } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { catalogosService } from '@/api/services/catalogos';
import { CODIGOS_ESTADO } from '@/constants/system';

/** Todas las listas se consideran frescas para siempre: se cachean en memoria. */
const INFINITE = { staleTime: Infinity } as const;

export const catalogKeys = {
  all: ['catalogos'] as const,
  categorias: ['catalogos', 'categorias'] as const,
  medidas: ['catalogos', 'medidas'] as const,
  estados: ['catalogos', 'estados'] as const,
  estadosPorCodigo: (codigo: string) =>
    ['catalogos', 'estados', codigo] as const,
  tiposEntidad: ['catalogos', 'tipos-entidad'] as const,
  roles: ['catalogos', 'roles'] as const,
  metodosPago: ['catalogos', 'metodos-pago'] as const,
};

export function useCategorias() {
  return useQuery({
    queryKey: catalogKeys.categorias,
    queryFn: catalogosService.getCategorias,
    ...INFINITE,
  });
}

export function useMedidas() {
  return useQuery({
    queryKey: catalogKeys.medidas,
    queryFn: catalogosService.getMedidas,
    ...INFINITE,
  });
}

export function useEstados() {
  return useQuery({
    queryKey: catalogKeys.estados,
    queryFn: catalogosService.getEstados,
    ...INFINITE,
  });
}

export function useTiposEntidad() {
  return useQuery({
    queryKey: catalogKeys.tiposEntidad,
    queryFn: catalogosService.getTiposEntidad,
    ...INFINITE,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: catalogKeys.roles,
    queryFn: catalogosService.getRoles,
    ...INFINITE,
  });
}

export function useMetodosPago() {
  return useQuery({
    queryKey: catalogKeys.metodosPago,
    queryFn: catalogosService.getMetodosPago,
    ...INFINITE,
  });
}

export function useEstadosPorCodigo() {
  return useQueries({
    queries: CODIGOS_ESTADO.map((codigo) => ({
      queryKey: catalogKeys.estadosPorCodigo(codigo),
      queryFn: () => catalogosService.getEstadosPorCodigo(codigo),
      ...INFINITE,
    })),
    combine: (results) => ({
      data: results.map((result, index) => ({
        codigo: CODIGOS_ESTADO[index],
        estados: result.data ?? [],
      })),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
    }),
  });
}

/** Consulta agregada usada por pantallas que necesitan varios catálogos a la vez. */
export function useCatalogos() {
  const queryClient = useQueryClient();
  const categorias = useCategorias();
  const medidas = useMedidas();
  const estados = useEstados();
  const estadosPorCodigo = useEstadosPorCodigo();
  const tiposEntidad = useTiposEntidad();
  const roles = useRoles();
  const metodosPago = useMetodosPago();

  return {
    categorias: categorias.data ?? [],
    medidas: medidas.data ?? [],
    estados: estados.data ?? [],
    estadosPorCodigo: estadosPorCodigo.data,
    tiposEntidad: tiposEntidad.data ?? [],
    roles: roles.data ?? [],
    metodosPago: metodosPago.data ?? [],
    isLoading:
      categorias.isLoading ||
      medidas.isLoading ||
      estados.isLoading ||
      estadosPorCodigo.isLoading ||
      tiposEntidad.isLoading ||
      roles.isLoading ||
      metodosPago.isLoading,
    isError:
      categorias.isError ||
      medidas.isError ||
      estados.isError ||
      estadosPorCodigo.isError ||
      tiposEntidad.isError ||
      roles.isError ||
      metodosPago.isError,
    refetchAll: () =>
      queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  };
}

/** Precarga los siete catálogos al iniciar la sesión; `staleTime: Infinity` evita refetch. */
export function usePrecargarCatalogos(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: catalogKeys.categorias,
        queryFn: catalogosService.getCategorias,
        ...INFINITE,
      }),
      queryClient.prefetchQuery({
        queryKey: catalogKeys.medidas,
        queryFn: catalogosService.getMedidas,
        ...INFINITE,
      }),
      queryClient.prefetchQuery({
        queryKey: catalogKeys.estados,
        queryFn: catalogosService.getEstados,
        ...INFINITE,
      }),
      ...CODIGOS_ESTADO.map((codigo) =>
        queryClient.prefetchQuery({
          queryKey: catalogKeys.estadosPorCodigo(codigo),
          queryFn: () => catalogosService.getEstadosPorCodigo(codigo),
          ...INFINITE,
        }),
      ),
      queryClient.prefetchQuery({
        queryKey: catalogKeys.tiposEntidad,
        queryFn: catalogosService.getTiposEntidad,
        ...INFINITE,
      }),
      queryClient.prefetchQuery({
        queryKey: catalogKeys.roles,
        queryFn: catalogosService.getRoles,
        ...INFINITE,
      }),
      queryClient.prefetchQuery({
        queryKey: catalogKeys.metodosPago,
        queryFn: catalogosService.getMetodosPago,
        ...INFINITE,
      }),
    ]);
  }, [enabled, queryClient]);
}
