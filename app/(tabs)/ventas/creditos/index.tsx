import { CreditCard } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useVentasCredito } from '@/hooks/useVentas';
import type { VentaCreditoResponse } from '@/types/api';
import { formatMoney } from '@/utils/format';

export default function CreditosScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useVentasCredito();

  const tone = (estado: string) =>
    estado === 'Cancelada'
      ? ('success' as const)
      : estado === 'Parcial'
        ? ('warning' as const)
        : ('danger' as const);

  const renderItem = useCallback(
    ({ item }: { item: VentaCreditoResponse }) => (
      <View className="flex-row items-center gap-3 border-b border-line px-4 py-3.5">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-warning-soft">
          <CreditCard size={18} color="#B45309" />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver crédito ${item.serieCorrelativa}`}
          onPress={() =>
            router.push({
              pathname: '/ventas/[id]',
              params: { id: String(item.idVenta) },
            })
          }
          className="flex-1 gap-0.5"
        >
          <Text className="text-base font-semibold text-ink" selectable>
            {item.serieCorrelativa}
          </Text>
          <Text className="text-xs text-muted" selectable numberOfLines={1}>
            {item.cliente.nombreRazonSocial}
          </Text>
        </Pressable>
        <View className="items-end gap-1">
          <Text className="text-sm font-bold text-ink" selectable>
            {formatMoney(item.totalPendiente)}
          </Text>
          <StatusBadge label={item.estado} tone={tone(item.estado)} />
        </View>
      </View>
    ),
    [router],
  );

  return (
    <>
      <Stack.Title>Créditos</Stack.Title>
      <View className="flex-1 bg-canvas">
        {isLoading ? (
          <LoadingState message="Cargando créditos…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar los créditos.
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
            keyExtractor={(item) => String(item.idVenta)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin créditos"
                message="No hay ventas con cuotas pendientes."
              />
            }
          />
        )}
      </View>
    </>
  );
}
