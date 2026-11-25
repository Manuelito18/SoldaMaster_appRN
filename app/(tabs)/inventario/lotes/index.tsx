import { Award, Plus } from 'lucide-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { EntityPicker } from '@/components/entity-picker';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useLotes } from '@/hooks/useInventario';
import { useProductosTodos } from '@/hooks/useProductos';
import type { LoteResponse } from '@/types/api';
import { formatDateTime } from '@/utils/format';

export default function LotesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ producto?: string }>();
  const [idProducto, setIdProducto] = useState(Number(params.producto ?? 0));

  const { data: productos } = useProductosTodos();
  const { data, isLoading, isError, refetch, isFetching } = useLotes(idProducto);

  return (
    <>
      <Stack.Title>Lotes</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar lote"
            disabled={!idProducto}
            onPress={() =>
              router.push({
                pathname: '/inventario/lotes/nuevo',
                params: { producto: String(idProducto) },
              })
            }
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 active:opacity-80 disabled:opacity-50"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="font-semibold text-white">Registrar lote</Text>
          </Pressable>
        </View>

        {!idProducto ? (
          <EmptyState
            title="Selecciona un producto"
            message="Elige un producto para consultar sus lotes."
          />
        ) : isLoading ? (
          <LoadingState message="Cargando lotes…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar los lotes.
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
            keyExtractor={(item) => String(item.idLote)}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            renderItem={({ item }: { item: LoteResponse }) => (
              <View className="flex-row items-center gap-3 border-b border-line bg-surface px-4 py-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
                  <Award size={18} color="#78350F" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-semibold text-ink" selectable>
                    {item.numeroLote || `Lote #${item.idLote}`}
                  </Text>
                  <Text className="text-xs text-muted" selectable>
                    {formatDateTime(item.fechaEntrada)}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-sm font-semibold text-ink" selectable>
                    {item.stockLote ?? 0} und.
                  </Text>
                  {item.idCertificado ? (
                    <StatusBadge label="Certificado" tone="success" />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Agregar certificado"
                      onPress={() =>
                        router.push({
                          pathname: '/inventario/certificados/nuevo',
                          params: {
                            lote: String(item.idLote),
                            producto: String(idProducto),
                          },
                        })
                      }
                    >
                      <Text className="text-xs font-semibold text-brand">
                        Agregar certificado
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                title="Sin lotes"
                message="Este producto todavía no tiene lotes registrados."
              />
            }
          />
        )}
      </View>
    </>
  );
}
