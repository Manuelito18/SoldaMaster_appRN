import { ReceiptText } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { useVentas } from '@/hooks/useVentas';
import type { VentaResponse } from '@/types/api';
import { formatDateTime, formatMoney } from '@/utils/format';

export default function ListadoVentasScreen() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const { data, isLoading, isError, refetch, isFetching } = useVentas();

  const ventas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return (data ?? []).filter(
      (item) =>
        !term ||
        item.serieCorrelativa.toLowerCase().includes(term) ||
        item.idCliente.nombreRazonSocial.toLowerCase().includes(term),
    );
  }, [busqueda, data]);

  const renderItem = useCallback(
    ({ item }: { item: VentaResponse }) => {
      const pagada = item.idEstadoVenta.nombre.toUpperCase() === 'PAGADO';
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver venta ${item.serieCorrelativa}`}
          onPress={() =>
            router.push({
              pathname: '/ventas/[id]',
              params: { id: String(item.idVenta) },
            })
          }
          className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 active:bg-canvas"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
            <ReceiptText size={18} color="#78350F" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-ink" selectable>
              {item.serieCorrelativa}
            </Text>
            <Text className="text-xs text-muted" selectable>
              {`${item.idCliente.nombreRazonSocial} · ${formatDateTime(item.fechaEmision)}`}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-sm font-bold text-ink" selectable>
              {formatMoney(item.total)}
            </Text>
            <StatusBadge label={item.idEstadoVenta.nombre} tone={pagada ? 'success' : 'warning'} />
          </View>
        </Pressable>
      );
    },
    [router],
  );

  return (
    <>
      <Stack.Title>Listado de ventas</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="px-4 pt-3">
          <SearchBar
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por comprobante o cliente"
          />
        </View>
        {isLoading ? (
          <LoadingState message="Cargando ventas…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar las ventas.
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
            data={ventas}
            keyExtractor={(item) => String(item.idVenta)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin ventas"
                message="No hay resultados para la búsqueda actual."
              />
            }
          />
        )}
      </View>
    </>
  );
}
