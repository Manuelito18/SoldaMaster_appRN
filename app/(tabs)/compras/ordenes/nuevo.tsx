import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { ApiError } from '@/api/client';
import { OrdenCompraForm } from '@/components/forms/orden-compra-form';
import { useCrearOrden } from '@/hooks/useCompras';
import type { OrdenCompraRequest } from '@/types/api';

export default function NuevaOrdenScreen() {
  const router = useRouter();
  const mutation = useCrearOrden();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (body: OrdenCompraRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: (orden) => {
        Alert.alert('Orden creada', `La orden #${orden.idOrden} se registró.`, [
          {
            text: 'Ver orden',
            onPress: () =>
              router.replace({
                pathname: '/compras/ordenes/[id]',
                params: { id: String(orden.idOrden) },
              }),
          },
        ]);
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo crear la orden.'),
    });
  };

  return (
    <>
      <Stack.Title>Nueva orden de compra</Stack.Title>
      <OrdenCompraForm onSubmit={onSubmit} isSubmitting={mutation.isPending} />
    </>
  );
}
