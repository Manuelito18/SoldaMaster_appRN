import Decimal from 'decimal.js';
import { Plus, Trash2 } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { EntityPicker } from '@/components/entity-picker';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { COMPROBANTE, ESTADO } from '@/constants/system';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useEntidadesTodas } from '@/hooks/useEntidades';
import { useCrearVenta } from '@/hooks/useVentas';
import { useProductosTodos } from '@/hooks/useProductos';
import {
  selectBaseImponible,
  selectIgv,
  selectSubtotal,
  selectTotal,
  useCartStore,
  type TipoPrecio,
} from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  CuotaRequest,
  PagoRequest,
  ProductoResponse,
  VentaRequest,
} from '@/types/api';
import { formatMoney, todayLocalDate } from '@/utils/format';

const PRECIOS: { key: TipoPrecio; label: string }[] = [
  { key: 'precioVenta', label: 'Venta' },
  { key: 'precioMayorista', label: 'Mayorista' },
  { key: 'precioDistribuidor', label: 'Distribuidor' },
];

function Seccion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
      <Text className="text-base font-semibold text-ink">{title}</Text>
      {children}
    </View>
  );
}

export function PosScreen() {
  const router = useRouter();
  const { data: productos } = useProductosTodos();
  const { data: entidades } = useEntidadesTodas();
  const { metodosPago, estados } = useCatalogos();
  const idUsuario = useAuthStore((state) => state.idUsuario);
  const mutation = useCrearVenta();

  const [busqueda, setBusqueda] = useState('');
  const [producto, setProducto] = useState<ProductoResponse | null>(null);
  const [tipoPrecio, setTipoPrecio] = useState<TipoPrecio>('precioVenta');
  const [cantidad, setCantidad] = useState('1');
  const [descuentoProducto, setDescuentoProducto] = useState('0');
  const [clienteId, setClienteId] = useState(0);
  const [tipoComprobante, setTipoComprobante] = useState<string>(COMPROBANTE.FACTURA);
  const [modo, setModo] = useState<'contado' | 'credito'>('contado');
  const [metodoPagoId, setMetodoPagoId] = useState(0);
  const [descuentoGlobal, setDescuentoGlobal] = useState('0');
  const [numeroCuotas, setNumeroCuotas] = useState('2');
  const [fechaVencimiento, setFechaVencimiento] = useState(todayLocalDate());
  const [error, setError] = useState<string | null>(null);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateItem = useCartStore((state) => state.updateItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const setGlobalDiscount = useCartStore((state) => state.setDescuentoGlobal);
  const clearCart = useCartStore((state) => state.clear);
  const subtotal = useCartStore(selectSubtotal);
  const base = useCartStore(selectBaseImponible);
  const igv = useCartStore(selectIgv);
  const total = useCartStore(selectTotal);

  const productosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return (productos ?? []).filter(
      (item) =>
        !term ||
        item.nombreDescripcion.toLowerCase().includes(term) ||
        item.codigoUnico.toLowerCase().includes(term) ||
        (item.codigoBarras ?? '').toLowerCase().includes(term),
    );
  }, [busqueda, productos]);

  const estadoCuotaId = useMemo(
    () =>
      estados.find(
        (item) =>
          item.nombre.toUpperCase() === 'POR COBRAR' &&
          item.tipoCodigo?.toUpperCase() === 'CUOTA',
      )?.idEstado ??
      estados.find((item) => item.nombre.toUpperCase() === 'POR COBRAR')?.idEstado ??
      ESTADO.CUOTA_POR_COBRAR,
    [estados],
  );
  const hayEstadoCuota = estados.some((item) => item.idEstado === estadoCuotaId);

  const generarCuotas = (montoTotal: number): CuotaRequest[] => {
    const n = Math.max(1, Math.trunc(Number(numeroCuotas)) || 1);
    const valor = new Decimal(montoTotal).div(n).toDecimalPlaces(2, Decimal.ROUND_DOWN);
    return Array.from({ length: n }, (_, index) => ({
      numeroCuota: index + 1,
      fechaVencimiento,
      monto:
        index === n - 1
          ? new Decimal(montoTotal)
              .minus(valor.times(n - 1))
              .toDecimalPlaces(2)
              .toNumber()
          : valor.toNumber(),
      idEstadoCuota: estadoCuotaId,
    }));
  };

  const registrar = () => {
    setError(null);

    if (items.length === 0) {
      setError('Agrega al menos un producto al carrito.');
      return;
    }
    if (!clienteId) {
      setError('Selecciona un cliente.');
      return;
    }
    if (!idUsuario) {
      setError('No hay usuario de sesión.');
      return;
    }

    const descuento = Number(descuentoGlobal) || 0;
    const totalConDescuento = total;

    const pagosList: PagoRequest[] = [];
    let cuotasList: CuotaRequest[] = [];

    if (modo === 'contado') {
      if (metodosPago.length === 0) {
        setError(
          'El backend no tiene métodos de pago configurados. No se puede registrar una venta al contado.',
        );
        return;
      }
      if (!metodoPagoId) {
        setError('Selecciona un método de pago.');
        return;
      }
      pagosList.push({
        montoTotal: totalConDescuento,
        referenciaPago: `POS-${Date.now()}`,
        idMetodoPago: metodoPagoId,
      });
    } else {
      if (!hayEstadoCuota) {
        setError(
          'El backend no tiene el estado de cuota POR COBRAR. No se puede registrar una venta a crédito.',
        );
        return;
      }
      if (!numeroCuotas || Number(numeroCuotas) < 1) {
        setError('Indica un número de cuotas válido.');
        return;
      }
      cuotasList = generarCuotas(totalConDescuento);
    }

    const body: VentaRequest = {
      tipoComprobante,
      total: totalConDescuento,
      subtotal,
      descuentoGlobal: descuento,
      idCliente: clienteId,
      idUsuario,
      detallesVentasList: items.map((item) => ({
        cantidad: item.cantidad,
        // El servidor exige que sea exactamente uno de los tres precios del producto.
        precioUnitario: item.precioUnitario,
        descuentoProducto: item.descuentoProducto,
        subTotal: new Decimal(item.precioUnitario)
          .times(item.cantidad)
          .minus(item.descuentoProducto)
          .toDecimalPlaces(2)
          .toNumber(),
        idProducto: item.idProducto,
      })),
      pagosList,
      cuotasList,
    };

    mutation.mutate(body, {
      onSuccess: (venta) => {
        clearCart();
        setProducto(null);
        setClienteId(0);
        Alert.alert(
          'Venta registrada',
          `Comprobante: ${venta.serieCorrelativa}`,
          [
            {
              text: 'Ver detalle',
              onPress: () =>
                router.replace({
                  pathname: '/ventas/[id]',
                  params: { id: String(venta.idVenta) },
                }),
            },
          ],
        );
      },
      onError: (err) =>
        setError(
          err instanceof ApiError ? err.message : 'No se pudo registrar la venta.',
        ),
    });
  };

  const precioSeleccionado = producto ? Number(producto[tipoPrecio] ?? 0) : 0;

  return (
    <>
      <Stack.Title>Punto de venta</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <Seccion title="Cliente y comprobante">
          <EntityPicker
            label="Cliente"
            items={(entidades ?? []).map((item) => ({
              id: item.idEntidad,
              label: item.nombreRazonSocial,
            }))}
            value={clienteId || null}
            onValueChange={setClienteId}
            placeholder="Sin entidades disponibles"
          />
          <View className="flex-row gap-2">
            {[COMPROBANTE.FACTURA, COMPROBANTE.BOLETA].map((tipo) => (
              <Pressable
                key={tipo}
                accessibilityRole="button"
                accessibilityState={{ selected: tipoComprobante === tipo }}
                onPress={() => setTipoComprobante(tipo)}
                className={`flex-1 rounded-xl border px-3 py-2.5 ${
                  tipoComprobante === tipo
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface'
                }`}
              >
                <Text className="text-center text-sm font-semibold text-ink">
                  {tipo === COMPROBANTE.FACTURA ? 'Factura (F001)' : 'Boleta (B001)'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Seccion>

        <Seccion title="Agregar producto">
          <SearchBar
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar producto por nombre o código"
          />
          <View className="max-h-64">
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {productosFiltrados.map((item) => (
                <Pressable
                  key={item.idProducto}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar ${item.nombreDescripcion}`}
                  onPress={() => {
                    setProducto(item);
                    setTipoPrecio('precioVenta');
                    setCantidad('1');
                    setDescuentoProducto('0');
                  }}
                  className={`flex-row items-center gap-3 border-b border-line px-2 py-2.5 ${
                    producto?.idProducto === item.idProducto ? 'bg-brand-soft' : ''
                  }`}
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                      {item.nombreDescripcion}
                    </Text>
                    <Text className="text-xs text-muted">
                      {`${item.codigoUnico} · stock ${item.stock}`}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-ink">
                    {formatMoney(item.precioVenta)}
                  </Text>
                </Pressable>
              ))}
              {productosFiltrados.length === 0 ? (
                <Text className="py-4 text-center text-sm text-muted">
                  Sin productos para la búsqueda.
                </Text>
              ) : null}
            </ScrollView>
          </View>

          {producto ? (
            <View className="gap-3 rounded-xl border border-line bg-canvas p-3">
              <Text className="text-sm font-semibold text-ink" selectable>
                {producto.nombreDescripcion}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PRECIOS.map(({ key, label }) => {
                  const precio = Number(producto[key] ?? 0);
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityState={{ selected: tipoPrecio === key }}
                      disabled={precio <= 0}
                      onPress={() => setTipoPrecio(key)}
                      className={`rounded-full border px-3 py-1.5 disabled:opacity-30 ${
                        tipoPrecio === key
                          ? 'border-brand bg-brand-soft'
                          : 'border-line bg-surface'
                      }`}
                    >
                      <Text className="text-xs font-medium text-ink">
                        {`${label}: ${formatMoney(precio)}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-semibold text-muted">Cantidad</Text>
                  <TextInput
                    value={cantidad}
                    onChangeText={setCantidad}
                    keyboardType="number-pad"
                    className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-semibold text-muted">
                    Descuento producto
                  </Text>
                  <TextInput
                    value={descuentoProducto}
                    onChangeText={setDescuentoProducto}
                    keyboardType="decimal-pad"
                    className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
                  />
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Agregar al carrito"
                disabled={Number(cantidad) > producto.stock || precioSeleccionado <= 0}
                onPress={() => {
                  addItem(
                    producto,
                    tipoPrecio,
                    Number(cantidad),
                    Number(descuentoProducto),
                  );
                  setProducto(null);
                }}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 active:opacity-80 disabled:opacity-50"
              >
                <Plus size={17} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-white">Agregar al carrito</Text>
              </Pressable>
              {Number(cantidad) > producto.stock ? (
                <Text className="text-xs text-danger">
                  {`Stock disponible: ${producto.stock}`}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Seccion>

        <Seccion title={`Carrito (${items.length})`}>
          {items.map((item) => (
            <View
              key={item.idProducto}
              className="gap-2 rounded-xl border border-line bg-canvas p-3"
            >
              <View className="flex-row items-start gap-2">
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                    {item.nombreDescripcion}
                  </Text>
                  <Text className="text-xs text-muted">
                    {`${formatMoney(item.precioUnitario)} · ${item.tipoPrecio}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${item.nombreDescripcion}`}
                  onPress={() => removeItem(item.idProducto)}
                  className="p-1"
                >
                  <Trash2 size={17} color="#B91C1C" />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Disminuir cantidad"
                  onPress={() => updateItem(item.idProducto, { cantidad: item.cantidad - 1 })}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-surface"
                >
                  <Text className="text-lg font-bold text-ink">-</Text>
                </Pressable>
                <Text className="w-8 text-center text-base font-semibold text-ink">
                  {item.cantidad}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar cantidad"
                  disabled={item.cantidad >= item.stock}
                  onPress={() => updateItem(item.idProducto, { cantidad: item.cantidad + 1 })}
                  className="h-8 w-8 items-center justify-center rounded-lg bg-surface disabled:opacity-30"
                >
                  <Text className="text-lg font-bold text-ink">+</Text>
                </Pressable>
                <Text className="ml-auto text-sm font-bold text-ink" selectable>
                  {formatMoney(
                    item.precioUnitario * item.cantidad - item.descuentoProducto,
                  )}
                </Text>
              </View>
            </View>
          ))}
          {items.length === 0 ? (
            <Text className="py-3 text-center text-sm text-muted">
              El carrito está vacío.
            </Text>
          ) : null}
        </Seccion>

        <Seccion title="Pago">
          <View className="flex-row gap-2">
            {(['contado', 'credito'] as const).map((value) => (
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
                  {value === 'contado' ? 'Contado' : 'Crédito'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted">Descuento global</Text>
            <TextInput
              value={descuentoGlobal}
              onChangeText={(value) => {
                setDescuentoGlobal(value);
                setGlobalDiscount(Number(value) || 0);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
            />
          </View>

          {modo === 'contado' ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-ink">Método de pago</Text>
              {metodosPago.length === 0 ? (
                <StatusBadge
                  label="Sin métodos de pago en el backend"
                  tone="danger"
                />
              ) : (
                <EntityPicker
                  items={metodosPago.map((item) => ({
                    id: item.idMetodoPago,
                    label: item.nombre,
                  }))}
                  value={metodoPagoId || null}
                  onValueChange={setMetodoPagoId}
                  placeholder="Sin métodos disponibles"
                />
              )}
            </View>
          ) : (
            <View className="gap-2">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-semibold text-muted">N° de cuotas</Text>
                  <TextInput
                    value={numeroCuotas}
                    onChangeText={setNumeroCuotas}
                    keyboardType="number-pad"
                    className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-semibold text-muted">
                    1er vencimiento
                  </Text>
                  <TextInput
                    value={fechaVencimiento}
                    onChangeText={setFechaVencimiento}
                    placeholder="AAAA-MM-DD"
                    className="min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink"
                  />
                </View>
              </View>
              {!hayEstadoCuota ? (
                <StatusBadge
                  label="Falta estado POR COBRAR en el backend"
                  tone="danger"
                />
              ) : null}
            </View>
          )}

          <View className="gap-1 rounded-xl bg-canvas p-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Subtotal</Text>
              <Text className="text-sm font-medium text-ink" selectable>
                {formatMoney(subtotal)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Base imponible</Text>
              <Text className="text-sm font-medium text-ink" selectable>
                {formatMoney(base)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">IGV (18%)</Text>
              <Text className="text-sm font-medium text-ink" selectable>
                {formatMoney(igv)}
              </Text>
            </View>
            <View className="flex-row justify-between border-t border-line pt-2">
              <Text className="text-base font-semibold text-ink">Total</Text>
              <Text className="text-lg font-bold text-brand" selectable>
                {formatMoney(total)}
              </Text>
            </View>
          </View>

          {error ? (
            <View className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
              <Text className="text-sm text-danger" selectable>
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Registrar venta"
            accessibilityState={{ disabled: mutation.isPending, busy: mutation.isPending }}
            disabled={mutation.isPending}
            onPress={registrar}
            className="min-h-12 items-center justify-center rounded-xl bg-brand px-4 active:opacity-80 disabled:opacity-60"
          >
            <Text className="text-base font-semibold text-white">
              {mutation.isPending ? 'Registrando…' : 'Registrar venta'}
            </Text>
          </Pressable>
        </Seccion>
      </ScrollView>
    </>
  );
}
