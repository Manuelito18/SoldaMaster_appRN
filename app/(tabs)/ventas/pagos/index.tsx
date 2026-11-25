import { HandCoins, Receipt } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useCuotasPorCobrar, useHistorialPagos } from '@/hooks/usePagos';
import type { CuotaResponse, PagoResponse } from '@/types/api';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';

type Seccion = 'cuotas' | 'historial';

export default function PagosScreen() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>('cuotas');
  const cuotasQuery = useCuotasPorCobrar();
  const historialQuery = useHistorialPagos();

  const irAPagar = (idVenta: number, idCuota?: number) =>
    router.push({
      pathname: '/ventas/pagos/nuevo',
      params: {
        venta: String(idVenta),
        ...(idCuota ? { cuota: String(idCuota) } : {}),
      },
    });

  return (
    <>
      <Stack.Title>Pagos y cuotas</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="flex-row gap-2 px-4 pt-3">
          {(['cuotas', 'historial'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: seccion === value }}
              onPress={() => setSeccion(value)}
              className={`flex-1 rounded-xl border px-3 py-2.5 ${
                seccion === value
                  ? 'border-brand bg-brand-soft'
                  : 'border-line bg-surface'
              }`}
            >
              <Text className="text-center text-sm font-semibold text-ink">
                {value === 'cuotas' ? 'Por cobrar' : 'Historial'}
              </Text>
            </Pressable>
          ))}
        </View>

        {seccion === 'cuotas' ? (
          cuotasQuery.isLoading ? (
            <LoadingState message="Cargando cuotas…" />
          ) : cuotasQuery.isError ? (
            <View className="gap-3 px-4 py-8">
              <Text className="text-center text-sm text-danger">
                No se pudieron cargar las cuotas.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reintentar"
                onPress={() => void cuotasQuery.refetch()}
                className="self-center rounded-lg bg-brand px-4 py-2"
              >
                <Text className="font-semibold text-white">Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={cuotasQuery.data ?? []}
              keyExtractor={(item) => String(item.idCuota)}
              refreshControl={
                <RefreshControl
                  refreshing={cuotasQuery.isFetching}
                  onRefresh={() => void cuotasQuery.refetch()}
                />
              }
              renderItem={({ item }: { item: CuotaResponse }) => (
                <View className="flex-row items-center gap-3 border-b border-line px-4 py-3.5">
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-warning-soft">
                    <HandCoins size={18} color="#B45309" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink" selectable>
                      {`Cuota ${item.numeroCuota} · ${item.idVenta.serieCorrelativa}`}
                    </Text>
                    <Text className="text-xs text-muted" selectable>
                      {`Vence ${formatDate(item.fechaVencimiento)} · pendiente ${formatMoney(item.montoPendiente)}`}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Registrar pago"
                    onPress={() => irAPagar(item.idVenta.idVenta, item.idCuota)}
                    className="rounded-lg bg-brand px-3 py-2"
                  >
                    <Text className="text-xs font-semibold text-white">Pagar</Text>
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <EmptyState
                  title="Sin cuotas por cobrar"
                  message="No hay cuotas pendientes de cobro."
                />
              }
            />
          )
        ) : historialQuery.isLoading ? (
          <LoadingState message="Cargando pagos…" />
        ) : historialQuery.isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudo cargar el historial de pagos.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => void historialQuery.refetch()}
              className="self-center rounded-lg bg-brand px-4 py-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={historialQuery.data ?? []}
            keyExtractor={(item) => String(item.idPago)}
            refreshControl={
              <RefreshControl
                refreshing={historialQuery.isFetching}
                onRefresh={() => void historialQuery.refetch()}
              />
            }
            renderItem={({ item }: { item: PagoResponse }) => (
              <View className="flex-row items-center gap-3 border-b border-line px-4 py-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-success-soft">
                  <Receipt size={18} color="#15803D" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-ink" selectable>
                    {`Pago #${item.idPago} · ${item.idVenta.serieCorrelativa}`}
                  </Text>
                  <Text className="text-xs text-muted" selectable>
                    {`${item.idMetodoPago.nombre} · ${formatDateTime(item.fecha)}`}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-sm font-bold text-ink" selectable>
                    {formatMoney(item.montoTotal)}
                  </Text>
                  <StatusBadge label={item.idMetodoPago.nombre} tone="success" />
                </View>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                title="Sin pagos"
                message="Todavía no se registraron pagos."
              />
            }
          />
        )}
      </View>
    </>
  );
}
