import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { EntityForm } from '@/components/forms/entity-form';
import { ApiError } from '@/api/client';
import { useCrearEntidad } from '@/hooks/useEntidades';
import type { EntidadRequest } from '@/types/api';

export default function NuevaEntidadScreen() {
  const router = useRouter();
  const mutation = useCrearEntidad();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (body: EntidadRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: () => {
        Alert.alert('Entidad creada', 'La entidad se registró correctamente.', [
          { text: 'Aceptar', onPress: () => router.back() },
        ]);
      },
      onError: (err) => {
        setError(
          err instanceof ApiError ? err.message : 'No se pudo crear la entidad.',
        );
      },
    });
  };

  return (
    <>
      <Stack.Title>Nueva entidad</Stack.Title>
      <EntityForm
        onSubmit={onSubmit}
        submitLabel="Crear entidad"
        isSubmitting={mutation.isPending}
        error={error}
      />
    </>
  );
}
