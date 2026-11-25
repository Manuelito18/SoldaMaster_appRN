import { Plus, ShoppingCart } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { useCompras } from '@/hooks/useCompras';
import type { CompraResponse } from '@/types/api';
import { formatDateTime, formatMoney } from '@/utils/format';

const PAGE_SIZE = 10;

export default function HistorialComprasScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const deferred = useDeferredValue(busqueda);
  const { data, isLoading, isError, refetch, isFetching } = useCompras({
    page,
    size: PAGE_SIZE,
    search: deferred || undefined,
  });

  const renderItem = useCallback(
    ({ item }: { item: CompraResponse }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver compra ${item.serieCorrelativa}`}
        onPress={() =>
          router.push({
            pathname: '/compras/compras/[id]',
            params: { id: String(item.idCompra) },
          })
        }
        className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 active:bg-canvas"
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
          <ShoppingCart size={18} color="#78350F" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-ink" selectable>
            {item.serieCorrelativa}
          </Text>
          <Text className="text-xs text-muted" selectable>
            {`${item.idProveedor.nombreRazonSocial} · ${formatDateTime(item.fechaCompra)}`}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-sm font-bold text-ink" selectable>
            {formatMoney(item.montoTotal)}
          </Text>
          <StatusBadge label={item.tipoComprobante} tone="brand" />
        </View>
      </Pressable>
    ),
    [router],
  );

  return (
    <>
      <Stack.Title>Historial de compras</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
          <SearchBar
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por serie o proveedor"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar compra"
            onPress={() => router.push('/compras/compras/nuevo')}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 active:opacity-80"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="font-semibold text-white">Registrar compra</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingState message="Cargando compras…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar las compras.
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
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.idCompra)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin compras"
                message="No hay resultados para la búsqueda actual."
                actionLabel="Limpiar búsqueda"
                onAction={() => {
                  setBusqueda('');
                  setPage(0);
                }}
              />
            }
            ListFooterComponent={
              <PaginationControls
                page={page}
                totalPages={data?.totalPages ?? 0}
                totalElements={data?.totalElements}
                onPageChange={setPage}
              />
            }
          />
        )}
      </View>
    </>
  );
}
