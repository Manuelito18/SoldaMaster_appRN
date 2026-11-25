import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { EntityPicker } from '@/components/entity-picker';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { TIPO_MOVIMIENTO } from '@/constants/system';
import { useKardexGlobal, useKardexProducto } from '@/hooks/useInventario';
import { useProductosTodos } from '@/hooks/useProductos';
import type { MovimientoInventarioResponse } from '@/types/api';
import { formatDateTime } from '@/utils/format';

type Modo = 'global' | 'producto';

export default function KardexScreen() {
  const params = useLocalSearchParams<{ producto?: string }>();
  const [modo, setModo] = useState<Modo>(params.producto ? 'producto' : 'global');
  const [idProducto, setIdProducto] = useState(Number(params.producto ?? 0));
  const { data: productos } = useProductosTodos();
  const globalQuery = useKardexGlobal();
  const productoQuery = useKardexProducto(idProducto);
  const query = modo === 'global' ? globalQuery : productoQuery;

  return (
    <>
      <Stack.Title>Kardex</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
          <View className="flex-row gap-2">
            {(['global', 'producto'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: modo === value }}
                onPress={() => setModo(value)}
                className={`flex-1 rounded-xl border px-3 py-2.5 ${
                  modo === value ? 'border-brand bg-brand-soft' : 'border-line bg-surface'
                }`}
              >
                <Text className="text-center text-sm font-semibold text-ink">
                  {value === 'global' ? 'Global' : 'Por producto'}
                </Text>
              </Pressable>
            ))}
          </View>

          {modo === 'producto' ? (
            <EntityPicker
              label="Producto"
              items={(productos ?? []).map((item) => ({
                id: item.idProducto,
                label: `${item.codigoUnico} · ${item.nombreDescripcion}`,
              }))}
              value={idProducto || null}
              onValueChange={setIdProducto}
              placeholder="Sin productos disponibles"
            />
          ) : (
            <Text className="text-xs text-muted">
              El backend devuelve como máximo los 100 movimientos más recientes.
            </Text>
          )}
        </View>

        {modo === 'producto' && !idProducto ? (
          <EmptyState
            title="Selecciona un producto"
            message="Elige un producto para ver su historial de movimientos."
          />
        ) : query.isLoading ? (
          <LoadingState message="Cargando movimientos…" />
        ) : query.isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar los movimientos.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => void query.refetch()}
              className="self-center rounded-lg bg-brand px-4 py-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={query.data ?? []}
            keyExtractor={(item) => String(item.idMovimiento)}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={query.isFetching}
                onRefresh={() => void query.refetch()}
              />
            }
            renderItem={({ item }: { item: MovimientoInventarioResponse }) => {
              const entrada = item.idTipoMovimiento.idTipoMovimiento === TIPO_MOVIMIENTO.ENTRADA;
              return (
                <View className="flex-row items-center gap-3 border-b border-line bg-surface px-4 py-3">
                  <View
                    className={`h-9 w-9 items-center justify-center rounded-lg ${
                      entrada ? 'bg-success-soft' : 'bg-danger-soft'
                    }`}
                  >
                    {entrada ? (
                      <ArrowUpRight size={18} color="#15803D" />
                    ) : (
                      <ArrowDownLeft size={18} color="#B91C1C" />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink" selectable numberOfLines={1}>
                      {item.referencia || 'Sin referencia'}
                    </Text>
                    <Text className="text-xs text-muted" selectable>
                      {`${formatDateTime(item.fecha)} · ${item.idProducto?.nombreDescripcion ?? ''}`}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold text-ink" selectable>
                      {entrada ? '+' : '-'}
                      {item.cantidad}
                    </Text>
                    <StatusBadge
                      label={entrada ? 'Entrada' : 'Salida'}
                      tone={entrada ? 'success' : 'danger'}
                    />
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                title="Sin movimientos"
                message="No hay movimientos de inventario para mostrar."
              />
            }
          />
        )}
      </View>
    </>
  );
}
