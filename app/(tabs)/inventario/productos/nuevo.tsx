import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { ApiError } from '@/api/client';
import { ProductoForm } from '@/components/forms/producto-form';
import { useCrearProductoConSaldo } from '@/hooks/useInventario';
import type { ProductoInventarioRequest } from '@/types/api';

export default function NuevoProductoScreen() {
  const router = useRouter();
  const mutation = useCrearProductoConSaldo();
  const [error, setError] = useState<string | null>(null);

  const onCreate = (body: ProductoInventarioRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: (response) => {
        Alert.alert('Producto creado', 'El saldo inicial se registró correctamente.', [
          {
            text: 'Ver producto',
            onPress: () =>
              router.replace({
                pathname: '/inventario/productos/[id]',
                params: { id: String(response.idProducto.idProducto) },
              }),
          },
        ]);
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo crear el producto.'),
    });
  };

  return (
    <>
      <Stack.Title>Nuevo producto</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ProductoForm
          mode="create"
          onCreate={onCreate}
          isSubmitting={mutation.isPending}
          error={error}
        />
      </ScrollView>
    </>
  );
}
