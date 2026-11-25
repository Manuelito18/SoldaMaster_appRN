import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { entidadesService } from '@/api/services/entidades';
import type { EntidadFilters, EntidadRequest, Id } from '@/types/api';
import { entidadKeys as keys } from './query-keys';

export function useEntidades(filters: EntidadFilters) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => entidadesService.list(filters),
  });
}

export function useEntidad(id: Id) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => entidadesService.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/** Para pickers de cliente/proveedor (GET /entidad/todas). */
export function useEntidadesTodas() {
  return useQuery({
    queryKey: keys.todas,
    queryFn: entidadesService.getAll,
  });
}

export function useCrearEntidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EntidadRequest) => entidadesService.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useActualizarEntidad(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EntidadRequest) => entidadesService.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
      void queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
}
