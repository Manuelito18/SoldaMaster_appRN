import { HandCoins } from 'lucide-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { useCuotasPorVenta } from '@/hooks/usePagos';
import { useVenta } from '@/hooks/useVentas';
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

export default function DetalleVentaScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Number(rawId);
  const router = useRouter();
  const { data: venta, isLoading, isError, refetch } = useVenta(id);
  const { data: cuotas } = useCuotasPorVenta(id);

  if (isLoading) return <LoadingState message="Cargando venta…" />;

  if (isError || !venta) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          No se pudo cargar la venta.
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

  const esCredito = venta.idEstadoVenta.nombre.toUpperCase() === 'CREDITO';

  return (
    <>
      <Stack.Title>Detalle de venta</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-2 rounded-2xl bg-brand p-5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Comprobante
          </Text>
          <Text className="text-2xl font-bold text-white" selectable>
            {venta.serieCorrelativa}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-white/80" selectable>
              {venta.tipoComprobante}
            </Text>
            <StatusBadge
              label={venta.idEstadoVenta.nombre}
              tone={esCredito ? 'warning' : 'success'}
            />
          </View>
        </View>

        <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
          <View className="border-b border-line pb-2">
            <Row label="Cliente" value={venta.idCliente.nombreRazonSocial} />
            <Row label="Fecha" value={formatDateTime(venta.fechaEmision)} />
            <Row label="Subtotal" value={formatMoney(venta.subtotal)} />
            <Row label="Descuento global" value={formatMoney(venta.descuentoGlobal)} />
            <Row label="Total" value={formatMoney(venta.total)} />
            <Row label="Usuario" value={venta.idUsuario.usuario} />
          </View>
          {venta.detallesVentasList.map((item, index) => (
            <View
              key={`${item.idProducto.idProducto}-${index}`}
              className="flex-row items-center gap-3 py-2"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-ink" selectable>
                  {item.idProducto.nombreDescripcion}
                </Text>
                <Text className="text-xs text-muted" selectable>
                  {`${item.cantidad} × ${formatMoney(item.precioUnitario)}`}
                </Text>
              </View>
              <Text className="text-sm font-bold text-ink" selectable>
                {formatMoney(item.subTotal)}
              </Text>
            </View>
          ))}
        </View>

        {cuotas && cuotas.length > 0 ? (
          <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
            <Text className="text-base font-semibold text-ink">Cuotas</Text>
            {cuotas.map((cuota) => (
              <View
                key={cuota.idCuota}
                className="flex-row items-center gap-3 border-b border-line py-2 last:border-b-0"
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-ink" selectable>
                    {`Cuota ${cuota.numeroCuota}`}
                  </Text>
                  <Text className="text-xs text-muted" selectable>
                    {`Vence ${formatDate(cuota.fechaVencimiento)} · pagado ${formatMoney(cuota.montoPagado)}`}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-sm font-bold text-ink" selectable>
                    {formatMoney(cuota.montoPendiente)}
                  </Text>
                  <StatusBadge
                    label={cuota.idEstadoCuota.nombre}
                    tone={cuota.montoPendiente <= 0 ? 'success' : 'warning'}
                  />
                </View>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Registrar pago"
              onPress={() =>
                router.push({
                  pathname: '/ventas/pagos/nuevo',
                  params: { venta: String(id) },
                })
              }
              className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 active:opacity-80"
            >
              <HandCoins size={17} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">Registrar pago</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
