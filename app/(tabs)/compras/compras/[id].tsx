import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useCompra } from '@/hooks/useCompras';
import { formatDateTime, formatMoney } from '@/utils/format';

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

export default function DetalleCompraScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const { data: compra, isLoading, isError, refetch } = useCompra(id);

  if (isLoading) return <LoadingState message="Cargando compra…" />;

  if (isError || !compra) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          No se pudo cargar la compra.
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

  return (
    <>
      <Stack.Title>{compra.serieCorrelativa}</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-bold text-ink" selectable>
              {compra.idProveedor.nombreRazonSocial}
            </Text>
            <StatusBadge label={compra.tipoComprobante} tone="brand" />
          </View>
          <View className="mt-1 border-t border-line pt-2">
            <Row label="Serie" value={compra.serieCorrelativa} />
            <Row label="Fecha" value={formatDateTime(compra.fechaCompra)} />
            <Row label="Monto total" value={formatMoney(compra.montoTotal)} />
            <Row label="Usuario" value={compra.idUsuario.usuario} />
            <Row
              label="Orden"
              value={compra.idOrden ? `#${compra.idOrden.idOrden}` : '—'}
            />
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          <View className="border-b border-line px-4 py-3">
            <Text className="text-base font-semibold text-ink">Detalle</Text>
          </View>
          {compra.listaDetalleCompra.map((item, index) => (
            <View
              key={`${item.idDetalleCompra}-${index}`}
              className="flex-row items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-ink" selectable>
                  {item.idProducto.nombreDescripcion}
                </Text>
                <Text className="text-xs text-muted" selectable>
                  {`${item.cantidad} × ${formatMoney(item.precioCostoUnitario)}`}
                  {item.idLote ? ` · Lote ${item.idLote.numeroLote ?? item.idLote.idLote}` : ''}
                </Text>
              </View>
              <Text className="text-sm font-bold text-ink" selectable>
                {formatMoney(item.cantidad * item.precioCostoUnitario)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
