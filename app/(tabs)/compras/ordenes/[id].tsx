import { Ban, ShoppingCart } from 'lucide-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useOrden, useRechazarOrden } from '@/hooks/useCompras';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1.5">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-ink" selectable>
        {value}
      </Text>
    </View>
  );
}

export default function DetalleOrdenScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const router = useRouter();
  const { data: orden, isLoading, isError, refetch } = useOrden(id);
  const rechazar = useRechazarOrden(id);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Cargando orden…" />;

  if (isError || !orden) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          No se pudo cargar la orden.
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

  const esPendiente = orden.idEstadoOrden.nombre.toUpperCase() === 'PENDIENTE';

  const handleRechazar = () => {
    setError(null);
    Alert.alert(
      'Rechazar orden',
      `¿Deseas rechazar la orden #${orden.idOrden}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () =>
            rechazar.mutate(undefined, {
              onSuccess: () => Alert.alert('Orden rechazada', 'Pasó al estado RECHAZADO.'),
              onError: (err) =>
                setError(
                  err instanceof ApiError ? err.message : 'No se pudo rechazar la orden.',
                ),
            }),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Title>{`Orden #${orden.idOrden}`}</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-bold text-ink" selectable>
              {orden.idProveedor.nombreRazonSocial}
            </Text>
            <StatusBadge
              label={orden.idEstadoOrden.nombre}
              tone={esPendiente ? 'warning' : 'neutral'}
            />
          </View>
          <View className="mt-1 border-t border-line pt-2">
            <Row label="Fecha de pedido" value={formatDateTime(orden.fechaPedido)} />
            <Row label="Fecha de entrega" value={formatDate(orden.fechaEntrega)} />
            <Row label="Total estimado" value={formatMoney(orden.totalEstimado)} />
            <Row label="Usuario" value={orden.idUsuario.usuario} />
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          <View className="border-b border-line px-4 py-3">
            <Text className="text-base font-semibold text-ink">Detalle</Text>
          </View>
          {orden.listaDetalles.map((item, index) => (
            <View
              key={`${item.idDetalleOrden}-${index}`}
              className="flex-row items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-ink" selectable>
                  {item.idProducto.nombreDescripcion}
                </Text>
                <Text className="text-xs text-muted" selectable>
                  {`${item.cantidadPedida} × ${formatMoney(item.precioUnitarioPactado)}`}
                </Text>
              </View>
              <Text className="text-sm font-bold text-ink" selectable>
                {formatMoney(item.cantidadPedida * item.precioUnitarioPactado)}
              </Text>
            </View>
          ))}
        </View>

        {error ? (
          <View className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
            <Text className="text-sm text-danger" selectable>
              {error}
            </Text>
          </View>
        ) : null}

        {esPendiente ? (
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rechazar orden"
              disabled={rechazar.isPending}
              onPress={handleRechazar}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-3 disabled:opacity-50"
            >
              <Ban size={17} color="#B91C1C" />
              <Text className="text-sm font-semibold text-danger">Rechazar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Convertir en compra"
              onPress={() =>
                router.push({
                  pathname: '/compras/compras/nuevo',
                  params: { orden: String(orden.idOrden) },
                })
              }
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3 active:opacity-80"
            >
              <ShoppingCart size={17} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">
                Convertir en compra
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
