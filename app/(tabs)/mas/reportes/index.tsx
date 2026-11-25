import { FileBarChart2 } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { EntityPicker } from '@/components/entity-picker';
import { LoadingState } from '@/components/loading-state';
import { PaginationControls } from '@/components/pagination-controls';
import { StatusBadge } from '@/components/status-badge';
import { COMPROBANTE, TODOS } from '@/constants/system';
import { useEntidadesTodas } from '@/hooks/useEntidades';
import { useReporteCompras, useReporteVentas } from '@/hooks/useReportes';
import type { CompraResponse, VentaResponse } from '@/types/api';
import { formatDateTime, formatMoney } from '@/utils/format';

const PAGE_SIZE = 10;
const DOC_TYPES = [TODOS, COMPROBANTE.FACTURA, COMPROBANTE.BOLETA] as const;

function TotalCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="w-[46%] gap-1 rounded-xl border border-line bg-surface p-3.5">
      <Text className="text-lg font-bold text-ink" selectable>
        {value}
      </Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

export default function ReportesScreen() {
  const [seccion, setSeccion] = useState<'compras' | 'ventas'>('ventas');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [proveedorId, setProveedorId] = useState(0);
  const [client, setClient] = useState('');
  const [docType, setDocType] = useState<string>(TODOS);
  const [page, setPage] = useState(0);
  const deferredClient = useDeferredValue(client);

  const { data: entidades } = useEntidadesTodas();
  const compras = useReporteCompras({
    page,
    size: PAGE_SIZE,
    dateStart: dateStart || undefined,
    dateEnd: dateEnd || undefined,
    proveedor: proveedorId || undefined,
  });
  const ventas = useReporteVentas({
    page,
    size: PAGE_SIZE,
    dateStart: dateStart || undefined,
    dateEnd: dateEnd || undefined,
    client: deferredClient || undefined,
    docType,
  });

  const query = seccion === 'compras' ? compras : ventas;
  const datos = seccion === 'compras' ? compras.data : ventas.data;
  const content = (datos?.pagina.content ?? []) as (CompraResponse | VentaResponse)[];

  const cambiar = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const recargar = () => {
    void compras.refetch();
    void ventas.refetch();
  };

  return (
    <>
      <Stack.Title>Reportes</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
          <View className="flex-row gap-2">
            {(['ventas', 'compras'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: seccion === value }}
                onPress={() => {
                  setSeccion(value);
                  setPage(0);
                }}
                className={`flex-1 rounded-xl border px-3 py-2.5 ${
                  seccion === value
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface'
                }`}
              >
                <Text className="text-center text-sm font-semibold text-ink">
                  {value === 'ventas' ? 'Ventas' : 'Compras'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-muted">Desde</Text>
              <TextInput
                value={dateStart}
                onChangeText={cambiar<string>(setDateStart)}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-muted">Hasta</Text>
              <TextInput
                value={dateEnd}
                onChangeText={cambiar<string>(setDateEnd)}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              />
            </View>
          </View>

          {seccion === 'compras' ? (
            <EntityPicker
              label="Proveedor"
              items={(entidades ?? []).map((item) => ({
                id: item.idEntidad,
                label: item.nombreRazonSocial,
              }))}
              value={proveedorId || null}
              onValueChange={cambiar<number>(setProveedorId)}
              placeholder="Todos los proveedores"
            />
          ) : (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted">Cliente</Text>
              <TextInput
                value={client}
                onChangeText={cambiar<string>(setClient)}
                placeholder="Nombre o documento"
                placeholderTextColor="#94A3B8"
                className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
              />
              <View className="flex-row flex-wrap gap-2">
                {DOC_TYPES.map((tipo) => (
                  <Pressable
                    key={tipo}
                    accessibilityRole="button"
                    accessibilityState={{ selected: docType === tipo }}
                    onPress={() => cambiar<string>(setDocType)(tipo)}
                    className={`rounded-full border px-3 py-1.5 ${
                      docType === tipo
                        ? 'border-brand bg-brand-soft'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <Text className="text-xs font-medium text-ink">{tipo}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar reporte"
            onPress={recargar}
            className="flex-row items-center justify-center gap-2 self-start rounded-lg bg-brand-soft px-3 py-2"
          >
            <FileBarChart2 size={16} color="#78350F" />
            <Text className="text-sm font-semibold text-brand-dark">Actualizar</Text>
          </Pressable>
        </View>

        {query.isLoading ? (
          <LoadingState message="Generando reporte…" />
        ) : query.isError || !datos ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudo generar el reporte. Revisa el formato de las fechas.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={recargar}
              className="self-center rounded-lg bg-brand px-4 py-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 8 }}
              className="max-h-48"
            >
              <View className="flex-row flex-wrap gap-3">
                <TotalCard label="Total del rango" value={formatMoney(datos.totalRango)} />
                <TotalCard label="Total global" value={formatMoney(datos.totalGlobal)} />
                <TotalCard label="Cantidad global" value={datos.cantidadGlobal} />
                {seccion === 'ventas' && 'ventasHoy' in datos ? (
                  <>
                    <TotalCard label="Ventas hoy" value={formatMoney(datos.ventasHoy)} />
                    <TotalCard label="Ventas del mes" value={formatMoney(datos.ventasMes)} />
                  </>
                ) : null}
              </View>
            </ScrollView>

            <FlatList
              data={content}
              keyExtractor={(item, index) =>
                seccion === 'compras'
                  ? String((item as CompraResponse).idCompra)
                  : String((item as VentaResponse).idVenta ?? index)
              }
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl
                  refreshing={query.isFetching}
                  onRefresh={recargar}
                />
              }
              renderItem={({ item }) => {
                const esCompra = seccion === 'compras';
                const compra = item as CompraResponse;
                const venta = item as VentaResponse;
                const serie = esCompra ? compra.serieCorrelativa : venta.serieCorrelativa;
                const entidad = esCompra
                  ? compra.idProveedor.nombreRazonSocial
                  : venta.idCliente.nombreRazonSocial;
                const fecha = esCompra ? compra.fechaCompra : venta.fechaEmision;
                const monto = esCompra ? compra.montoTotal : venta.total;
                return (
                  <View className="flex-row items-center gap-3 border-b border-line py-3">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-semibold text-ink" selectable>
                        {serie}
                      </Text>
                      <Text className="text-xs text-muted" selectable numberOfLines={1}>
                        {`${entidad} · ${formatDateTime(fecha)}`}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-sm font-bold text-ink" selectable>
                        {formatMoney(monto)}
                      </Text>
                      {!esCompra ? (
                        <StatusBadge label={venta.idEstadoVenta.nombre} tone="brand" />
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  title="Sin resultados"
                  message="No hay datos para los filtros seleccionados."
                />
              }
              ListFooterComponent={
                <PaginationControls
                  page={page}
                  totalPages={datos.pagina.totalPages}
                  totalElements={datos.pagina.totalElements}
                  onPageChange={setPage}
                />
              }
            />
          </>
        )}
      </View>
    </>
  );
}
