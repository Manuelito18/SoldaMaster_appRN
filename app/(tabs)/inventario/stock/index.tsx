import { AlertTriangle } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useProductosTodos } from '@/hooks/useProductos';
import type { ProductoResponse } from '@/types/api';

export default function StockScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useProductosTodos();
  const criticos = useMemo(
    () => (data ?? []).filter((item) => item.stock <= item.stockMinimo),
    [data],
  );

  return (
    <>
      <Stack.Title>Stock</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="px-4 pt-3">
          <View className="flex-row items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
            <AlertTriangle size={18} color="#B91C1C" />
            <Text className="flex-1 text-sm text-danger">
              {`${criticos.length} producto(s) con stock en o por debajo del mínimo`}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingState message="Calculando alertas de stock…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudo cargar el inventario.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => void refetch()}
              className="self-center rounded-lg bg-brand px-4 py-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={criticos}
            keyExtractor={(item) => String(item.idProducto)}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            renderItem={({ item }: { item: ProductoResponse }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver producto ${item.nombreDescripcion}`}
                onPress={() =>
                  router.push({
                    pathname: '/inventario/productos/[id]',
                    params: { id: String(item.idProducto) },
                  })
                }
                className="flex-row items-center gap-3 border-b border-line bg-surface px-4 py-3.5 active:bg-canvas"
              >
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-ink" numberOfLines={1} selectable>
                    {item.nombreDescripcion}
                  </Text>
                  <Text className="text-xs text-muted" selectable>
                    {`${item.codigoUnico} · mínimo ${item.stockMinimo}`}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-base font-bold text-danger" selectable>
                    {item.stock}
                  </Text>
                  <StatusBadge label="Stock bajo" tone="danger" />
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyState
                title="Sin alertas"
                message="Todos los productos tienen stock por encima del mínimo."
              />
            }
          />
        )}
      </View>
    </>
  );
}
