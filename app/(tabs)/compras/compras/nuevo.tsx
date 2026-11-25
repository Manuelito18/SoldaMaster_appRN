import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/api/client';
import { CompraForm } from '@/components/forms/compra-form';
import { LoadingState } from '@/components/loading-state';
import { useCrearCompra, useOrden } from '@/hooks/useCompras';
import type { CompraRequest } from '@/types/api';

export default function NuevaCompraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orden?: string }>();
  const idOrden = Number(params.orden ?? 0);
  const { data: orden, isLoading } = useOrden(idOrden);
  const mutation = useCrearCompra();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (body: CompraRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: (compra) => {
        Alert.alert('Compra registrada', `Comprobante ${compra.serieCorrelativa}.`, [
          {
            text: 'Ver compra',
            onPress: () =>
              router.replace({
                pathname: '/compras/compras/[id]',
                params: { id: String(compra.idCompra) },
              }),
          },
        ]);
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo registrar la compra.'),
    });
  };

  if (idOrden > 0 && isLoading) {
    return <LoadingState message="Precargando la orden…" />;
  }

  return (
    <>
      <Stack.Title>Registrar compra</Stack.Title>
      <CompraForm
        initialOrden={orden}
        onSubmit={onSubmit}
        isSubmitting={mutation.isPending}
      />
    </>
  );
}
