import { Layers3, History } from 'lucide-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { ProductoForm } from '@/components/forms/producto-form';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useActualizarProducto, useProducto } from '@/hooks/useProductos';
import type { ProductoRequest } from '@/types/api';
import { formatMoney } from '@/utils/format';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-ink" selectable>
        {value}
      </Text>
    </View>
  );
}

export default function DetalleProductoScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const router = useRouter();
  const { data: producto, isLoading, isError, refetch } = useProducto(id);
  const mutation = useActualizarProducto(id);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Cargando producto…" />;

  if (isError || !producto) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          No se pudo cargar el producto.
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

  const onEdit = (body: ProductoRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: () => Alert.alert('Producto actualizado', 'Los cambios se guardaron.'),
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.'),
    });
  };

  return (
    <>
      <Stack.Title>{producto.codigoUnico}</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-bold text-ink" selectable>
              {producto.nombreDescripcion}
            </Text>
            <StatusBadge
              label={producto.stock <= producto.stockMinimo ? 'Stock bajo' : 'Disponible'}
              tone={producto.stock <= producto.stockMinimo ? 'danger' : 'success'}
            />
          </View>
          <View className="mt-1 border-t border-line pt-2">
            <DetailRow label="Precio venta" value={formatMoney(producto.precioVenta)} />
            <DetailRow label="Precio mayorista" value={formatMoney(producto.precioMayorista)} />
            <DetailRow
              label="Precio distribuidor"
              value={formatMoney(producto.precioDistribuidor)}
            />
            <DetailRow label="Stock" value={`${producto.stock} unidades`} />
            <DetailRow label="Stock mínimo" value={`${producto.stockMinimo} unidades`} />
            <DetailRow label="Categoría" value={producto.idCategoria?.nombre ?? '—'} />
            <DetailRow label="Unidad" value={producto.idUnidadMedida?.nombre ?? '—'} />
            <DetailRow label="Maneja lote" value={producto.manejaLote ? 'Sí' : 'No'} />
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver lotes"
            onPress={() =>
              router.push({
                pathname: '/inventario/lotes',
                params: { producto: String(id) },
              })
            }
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 active:bg-canvas"
          >
            <Layers3 size={17} color="#78350F" />
            <Text className="text-sm font-semibold text-ink">Lotes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver kardex"
            onPress={() =>
              router.push({
                pathname: '/inventario/kardex',
                params: { producto: String(id) },
              })
            }
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 active:bg-canvas"
          >
            <History size={17} color="#78350F" />
            <Text className="text-sm font-semibold text-ink">Kardex</Text>
          </Pressable>
        </View>

        <Text className="text-base font-semibold text-ink">Editar producto</Text>
        <ProductoForm
          mode="edit"
          initialValues={producto}
          onEdit={onEdit}
          isSubmitting={mutation.isPending}
          error={error}
        />
      </ScrollView>
    </>
  );
}
