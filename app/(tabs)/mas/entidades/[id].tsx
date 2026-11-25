import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { EntityForm } from '@/components/forms/entity-form';
import { LoadingState } from '@/components/loading-state';
import { useActualizarEntidad, useEntidad } from '@/hooks/useEntidades';
import type { EntidadRequest } from '@/types/api';

export default function DetalleEntidadScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { data: entidad, isLoading, isError, refetch } = useEntidad(id);
  const mutation = useActualizarEntidad(id);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Cargando entidad…" />;

  if (isError || !entidad) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          No se pudo cargar la entidad.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => void refetch()}
          className="text-sm font-semibold text-brand"
        >
          Reintentar
        </Text>
      </View>
    );
  }

  const onSubmit = (body: EntidadRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: () =>
        Alert.alert('Entidad actualizada', 'Los cambios se guardaron correctamente.'),
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.'),
    });
  };

  return (
    <>
      <Stack.Title>{entidad.nombreRazonSocial}</Stack.Title>
      <EntityForm
        initialValues={entidad}
        onSubmit={onSubmit}
        submitLabel="Guardar cambios"
        isSubmitting={mutation.isPending}
        error={error}
      />
    </>
  );
}
