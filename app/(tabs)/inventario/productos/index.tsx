import { Plus, Package } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { TODOS } from '@/constants/system';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useProductos } from '@/hooks/useProductos';
import { formatMoney } from '@/utils/format';
import type { ProductoResponse } from '@/types/api';

const PAGE_SIZE = 10;

export default function ProductosScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaNombre, setCategoriaNombre] = useState<string>(TODOS);
  const deferredBusqueda = useDeferredValue(busqueda);

  const { categorias } = useCatalogos();
  const idCategoria =
    categoriaNombre === TODOS
      ? undefined
      : categorias.find((item) => item.nombre === categoriaNombre)?.idCategoria;

  const { data, isLoading, isError, refetch, isFetching } = useProductos({
    page,
    size: PAGE_SIZE,
    busqueda: deferredBusqueda || undefined,
    idCategoria,
  });

  const renderItem = useCallback(
    ({ item }: { item: ProductoResponse }) => {
      const critical = item.stock <= item.stockMinimo;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver producto ${item.nombreDescripcion}`}
          onPress={() =>
            router.push({
              pathname: '/inventario/productos/[id]',
              params: { id: String(item.idProducto) },
            })
          }
          className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 active:bg-canvas"
        >
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
            <Package size={18} color="#78350F" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-ink" selectable numberOfLines={1}>
              {item.nombreDescripcion}
            </Text>
            <Text className="text-xs text-muted" selectable>
              {`${item.codigoUnico} · ${formatMoney(item.precioVenta)}`}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-sm font-semibold text-ink" selectable>
              {item.stock} und.
            </Text>
            <StatusBadge
              label={critical ? 'Stock bajo' : 'Disponible'}
              tone={critical ? 'danger' : 'success'}
            />
          </View>
        </Pressable>
      );
    },
    [router],
  );

  return (
    <>
      <Stack.Title>Productos</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
          <SearchBar
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre, código o barcode"
          />
          <View className="flex-row flex-wrap gap-2">
            {[TODOS, ...categorias.map((item) => item.nombre)].map((nombre) => (
              <Pressable
                key={nombre}
                accessibilityRole="button"
                accessibilityState={{ selected: categoriaNombre === nombre }}
                onPress={() => {
                  setCategoriaNombre(nombre);
                  setPage(0);
                }}
                className={`rounded-full border px-3 py-1.5 ${
                  categoriaNombre === nombre
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface'
                }`}
              >
                <Text className="text-xs font-medium text-ink">{nombre}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo producto"
            onPress={() => router.push('/inventario/productos/nuevo')}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 active:opacity-80"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="font-semibold text-white">Nuevo producto</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingState message="Cargando productos…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar los productos.
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
            keyExtractor={(item) => String(item.idProducto)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin productos"
                message="No hay resultados para los filtros actuales."
                actionLabel="Limpiar filtros"
                onAction={() => {
                  setBusqueda('');
                  setCategoriaNombre(TODOS);
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
