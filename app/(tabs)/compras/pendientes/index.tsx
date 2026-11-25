import { Clock3 } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useOrdenesPendientes } from '@/hooks/useCompras';
import type { OrdenCompraResponse } from '@/types/api';
import { formatDate, formatMoney } from '@/utils/format';

export default function PendientesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useOrdenesPendientes();

  const renderItem = useCallback(
    ({ item }: { item: OrdenCompraResponse }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver orden pendiente ${item.idOrden}`}
        onPress={() =>
          router.push({
            pathname: '/compras/ordenes/[id]',
            params: { id: String(item.idOrden) },
          })
        }
        className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 active:bg-canvas"
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-warning-soft">
          <Clock3 size={18} color="#B45309" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-ink" selectable>
            {`Orden #${item.idOrden} · ${item.idProveedor.nombreRazonSocial}`}
          </Text>
          <Text className="text-xs text-muted" selectable>
            {`${formatDate(item.fechaEntrega)} · ${formatMoney(item.totalEstimado)}`}
          </Text>
        </View>
        <StatusBadge label="Pendiente" tone="warning" />
      </Pressable>
    ),
    [router],
  );

  return (
    <>
      <Stack.Title>Órdenes pendientes</Stack.Title>
      <View className="flex-1 bg-canvas">
        {isLoading ? (
          <LoadingState message="Cargando pendientes…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar las órdenes pendientes.
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
            data={data ?? []}
            keyExtractor={(item) => String(item.idOrden)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin pendientes"
                message="No hay órdenes en estado pendiente."
              />
            }
          />
        )}
      </View>
    </>
  );
}
