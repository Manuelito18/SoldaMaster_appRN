import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react-native';
import Decimal from 'decimal.js';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { COMPROBANTE } from '@/constants/system';
import { useEntidadesTodas } from '@/hooks/useEntidades';
import { useProductosTodos } from '@/hooks/useProductos';
import { useAuthStore } from '@/store/useAuthStore';
import type { CompraRequest, OrdenCompraResponse } from '@/types/api';
import { formatMoney, nowLocalDateTime } from '@/utils/format';

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const NON_NEGATIVE = /^\d+(\.\d+)?$/;

const detalleSchema = z.object({
  idProducto: z.number().min(1, 'Selecciona un producto'),
  cantidad: z.string().refine((v) => /^\d+$/.test(v), 'Entero ≥ 1'),
  precioCostoUnitario: z
    .string()
    .refine((v) => NON_NEGATIVE.test(v), 'Monto no válido'),
  numeroLote: z.string(),
});

const schema = z.object({
  tipoComprobante: z.string().min(1, 'Indica el tipo de comprobante'),
  serieCorrelativa: z.string().min(1, 'Indica la serie correlativa'),
  fechaCompra: z.string().regex(ISO_DATETIME, 'Formato: AAAA-MM-DDTHH:mm:ss'),
  idProveedor: z.number().min(1, 'Selecciona un proveedor'),
  detalles: z.array(detalleSchema).min(1, 'Agrega al menos un producto'),
});

type Values = z.infer<typeof schema>;

export function CompraForm({
  initialOrden,
  onSubmit,
  isSubmitting = false,
}: {
  /** Si viene de una OC pendiente, precarga el formulario (no ejecuta la compra). */
  initialOrden?: OrdenCompraResponse;
  onSubmit: (body: CompraRequest) => void;
  isSubmitting?: boolean;
}) {
  const { data: entidades } = useEntidadesTodas();
  const { data: productos } = useProductosTodos();
  const idUsuario = useAuthStore((state) => state.idUsuario);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoComprobante: COMPROBANTE.FACTURA,
      serieCorrelativa: initialOrden
        ? `OC-${initialOrden.idOrden}`
        : '',
      fechaCompra: nowLocalDateTime(),
      idProveedor: initialOrden?.idProveedor.idEntidad ?? 0,
      detalles: initialOrden
        ? initialOrden.listaDetalles.map((item) => ({
            idProducto: item.idProducto.idProducto,
            cantidad: String(item.cantidadPedida),
            precioCostoUnitario: String(item.precioUnitarioPactado),
            numeroLote: '',
          }))
        : [{ idProducto: 0, cantidad: '1', precioCostoUnitario: '0', numeroLote: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detalles = watch('detalles');
  const total = detalles.reduce(
    (sum, item) =>
      sum.plus(new Decimal(item.cantidad || '0').times(item.precioCostoUnitario || '0')),
    new Decimal(0),
  );

  const submit = (values: Values) => {
    if (!idUsuario) {
      setError('root', { message: 'No hay usuario de sesión.' });
      return;
    }

    onSubmit({
      tipoComprobante: values.tipoComprobante.trim(),
      serieCorrelativa: values.serieCorrelativa.trim(),
      fechaCompra: values.fechaCompra,
      montoTotal: Number(total.toFixed(2)),
      idOrden: initialOrden?.idOrden ?? null,
      idProveedor: values.idProveedor,
      idUsuario,
      listaDetalleCompra: values.detalles.map((item) => ({
        cantidad: Number(item.cantidad),
        precioCostoUnitario: Number(item.precioCostoUnitario),
        numeroLote: item.numeroLote.trim() || undefined,
        idProducto: item.idProducto,
      })),
    });
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
    >
      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <Text className="text-base font-semibold text-ink">Datos de la compra</Text>
        {initialOrden ? (
          <View className="rounded-xl border border-brand/30 bg-brand-soft px-3 py-2">
            <Text className="text-sm font-semibold text-brand-dark">
              {`Desde orden #${initialOrden.idOrden} · ${initialOrden.idProveedor.nombreRazonSocial}`}
            </Text>
            <Text className="text-xs text-brand-dark">
              Al registrar la compra, el backend aprobará la orden.
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="Tipo de comprobante"
              error={errors.tipoComprobante?.message}
            >
              <Controller
                control={control}
                name="tipoComprobante"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Factura"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Serie correlativa" error={errors.serieCorrelativa?.message}>
              <Controller
                control={control}
                name="serieCorrelativa"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="F001-000001"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>

        <FormField label="Fecha de compra" error={errors.fechaCompra?.message}>
          <Controller
            control={control}
            name="fechaCompra"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="AAAA-MM-DDTHH:mm:ss"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <Controller
          control={control}
          name="idProveedor"
          render={({ field }) => (
            <EntityPicker
              label="Proveedor"
              items={(entidades ?? []).map((item) => ({
                id: item.idEntidad,
                label: item.nombreRazonSocial,
              }))}
              value={field.value || null}
              onValueChange={field.onChange}
              placeholder="Sin entidades disponibles"
            />
          )}
        />
        {errors.idProveedor ? (
          <Text className="text-xs text-danger">{errors.idProveedor.message}</Text>
        ) : null}
      </View>

      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <Text className="text-base font-semibold text-ink">Detalle de compra</Text>
        {fields.map((field, index) => (
          <View key={field.id} className="gap-3 rounded-xl border border-line bg-canvas p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-ink">{`Producto ${index + 1}`}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar producto ${index + 1}`}
                disabled={fields.length === 1}
                onPress={() => remove(index)}
                className="p-1 disabled:opacity-30"
              >
                <Trash2 size={17} color="#B91C1C" />
              </Pressable>
            </View>
            <Controller
              control={control}
              name={`detalles.${index}.idProducto`}
              render={({ field: productField }) => (
                <EntityPicker
                  items={(productos ?? []).map((item) => ({
                    id: item.idProducto,
                    label: `${item.codigoUnico} · ${item.nombreDescripcion}`,
                  }))}
                  value={productField.value || null}
                  onValueChange={productField.onChange}
                  placeholder="Sin productos disponibles"
                />
              )}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField
                  label="Cantidad"
                  error={errors.detalles?.[index]?.cantidad?.message}
                >
                  <Controller
                    control={control}
                    name={`detalles.${index}.cantidad`}
                    render={({ field: qtyField }) => (
                      <TextInput
                        value={qtyField.value}
                        onChangeText={qtyField.onChange}
                        onBlur={qtyField.onBlur}
                        keyboardType="number-pad"
                        placeholder="1"
                        placeholderTextColor="#94A3B8"
                        className={inputClass}
                      />
                    )}
                  />
                </FormField>
              </View>
              <View className="flex-1">
                <FormField
                  label="Costo unitario"
                  error={errors.detalles?.[index]?.precioCostoUnitario?.message}
                >
                  <Controller
                    control={control}
                    name={`detalles.${index}.precioCostoUnitario`}
                    render={({ field: priceField }) => (
                      <TextInput
                        value={priceField.value}
                        onChangeText={priceField.onChange}
                        onBlur={priceField.onBlur}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        className={inputClass}
                      />
                    )}
                  />
                </FormField>
              </View>
            </View>
            <FormField label="Número de lote (opcional)">
              <Controller
                control={control}
                name={`detalles.${index}.numeroLote`}
                render={({ field: lotField }) => (
                  <TextInput
                    value={lotField.value}
                    onChangeText={lotField.onChange}
                    onBlur={lotField.onBlur}
                    placeholder="Si se indica, el backend crea el lote"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar producto"
          onPress={() =>
            append({
              idProducto: 0,
              cantidad: '1',
              precioCostoUnitario: '0',
              numeroLote: '',
            })
          }
          className="flex-row items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-4 py-2.5"
        >
          <Plus size={17} color="#78350F" />
          <Text className="text-sm font-semibold text-brand-dark">Agregar producto</Text>
        </Pressable>
        {errors.detalles?.message ? (
          <Text className="text-xs text-danger">{errors.detalles.message}</Text>
        ) : null}
        <View className="flex-row justify-between border-t border-line pt-3">
          <Text className="text-sm text-muted">Monto total</Text>
          <Text className="text-base font-bold text-ink" selectable>
            {formatMoney(Number(total.toFixed(2)))}
          </Text>
        </View>
      </View>

      <SubmitButton
        label="Registrar compra"
        isSubmitting={isSubmitting}
        error={errors.root?.message ?? null}
        onPress={() => void handleSubmit(submit)()}
      />
    </ScrollView>
  );
}
