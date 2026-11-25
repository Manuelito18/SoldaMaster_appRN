import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/api/client';
import { LoteForm } from '@/components/forms/lote-form';
import { useCrearLote } from '@/hooks/useInventario';
import { useProductosTodos } from '@/hooks/useProductos';
import type { LoteRequest } from '@/types/api';

export default function NuevoLoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ producto?: string }>();
  const { data: productos } = useProductosTodos();
  const mutation = useCrearLote();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (body: LoteRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: () =>
        Alert.alert('Lote registrado', 'El stock del producto se actualizó.', [
          { text: 'Aceptar', onPress: () => router.back() },
        ]),
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo registrar el lote.'),
    });
  };

  return (
    <>
      <Stack.Title>Nuevo lote</Stack.Title>
      <LoteForm
        productos={productos ?? []}
        initialProductoId={Number(params.producto ?? 0) || undefined}
        onSubmit={onSubmit}
        isSubmitting={mutation.isPending}
        error={error}
      />
    </>
  );
}
