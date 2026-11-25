import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react-native';
import Decimal from 'decimal.js';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useEntidadesTodas } from '@/hooks/useEntidades';
import { useProductosTodos } from '@/hooks/useProductos';
import { useAuthStore } from '@/store/useAuthStore';
import type { OrdenCompraRequest } from '@/types/api';
import { formatMoney, nowLocalDateTime, todayLocalDate } from '@/utils/format';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const NON_NEGATIVE = /^\d+(\.\d+)?$/;

const detalleSchema = z.object({
  idProducto: z.number().min(1, 'Selecciona un producto'),
  cantidad: z.string().refine((v) => /^\d+$/.test(v), 'Entero ≥ 1'),
  precioUnitarioPactado: z
    .string()
    .refine((v) => NON_NEGATIVE.test(v), 'Monto no válido'),
});

const schema = z.object({
  fechaPedido: z.string().regex(ISO_DATETIME, 'Formato: AAAA-MM-DDTHH:mm:ss'),
  fechaEntrega: z
    .string()
    .refine((v) => !v || ISO_DATE.test(v), 'Formato: AAAA-MM-DD'),
  idProveedor: z.number().min(1, 'Selecciona un proveedor'),
  detalles: z.array(detalleSchema).min(1, 'Agrega al menos un producto'),
});

type Values = z.infer<typeof schema>;

export function OrdenCompraForm({
  onSubmit,
  isSubmitting = false,
}: {
  onSubmit: (body: OrdenCompraRequest) => void;
  isSubmitting?: boolean;
}) {
  const { estados } = useCatalogos();
  const { data: entidades } = useEntidadesTodas();
  const { data: productos } = useProductosTodos();
  const idUsuario = useAuthStore((state) => state.idUsuario);

  const pendingEstadoId =
    estados.find(
      (item) =>
        item.nombre.toUpperCase() === 'PENDIENTE' &&
        item.tipoCodigo?.toUpperCase() === 'ORDEN',
    )?.idEstado ?? estados.find((item) => item.nombre.toUpperCase() === 'PENDIENTE')?.idEstado ?? 0;

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fechaPedido: nowLocalDateTime(),
      fechaEntrega: todayLocalDate(),
      idProveedor: 0,
      detalles: [
        { idProducto: 0, cantidad: '1', precioUnitarioPactado: '0' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });
  const detalles = watch('detalles');
  const total = detalles.reduce(
    (sum, item) =>
      sum.plus(new Decimal(item.cantidad || '0').times(item.precioUnitarioPactado || '0')),
    new Decimal(0),
  );

  const submit = (values: Values) => {
    if (pendingEstadoId === 0) {
      setError('root', {
        message:
          'El backend no tiene configurado el estado PENDIENTE de orden (tipoCodigo ORDEN).',
      });
      return;
    }
    if (!idUsuario) {
      setError('root', { message: 'No hay usuario de sesión.' });
      return;
    }

    onSubmit({
      fechaPedido: values.fechaPedido,
      fechaEntrega: values.fechaEntrega || undefined,
      totalEstimado: Number(total.toFixed(2)),
      idProveedor: values.idProveedor,
      idEstadoOrden: pendingEstadoId,
      idUsuario,
      listaDetalles: values.detalles.map((item) => ({
        cantidadPedida: Number(item.cantidad),
        precioUnitarioPactado: Number(item.precioUnitarioPactado),
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
        <Text className="text-base font-semibold text-ink">Datos de la orden</Text>

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

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Fecha de pedido" error={errors.fechaPedido?.message}>
              <Controller
                control={control}
                name="fechaPedido"
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
          </View>
          <View className="flex-1">
            <FormField label="Fecha de entrega" error={errors.fechaEntrega?.message}>
              <Controller
                control={control}
                name="fechaEntrega"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>
      </View>

      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <Text className="text-base font-semibold text-ink">Productos solicitados</Text>
        {fields.map((field, index) => (
          <View
            key={field.id}
            className="gap-3 rounded-xl border border-line bg-canvas p-3"
          >
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
                  label="Precio pactado"
                  error={errors.detalles?.[index]?.precioUnitarioPactado?.message}
                >
                  <Controller
                    control={control}
                    name={`detalles.${index}.precioUnitarioPactado`}
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
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar producto"
          onPress={() =>
            append({ idProducto: 0, cantidad: '1', precioUnitarioPactado: '0' })
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
          <Text className="text-sm text-muted">Total estimado</Text>
          <Text className="text-base font-bold text-ink" selectable>
            {formatMoney(Number(total.toFixed(2)))}
          </Text>
        </View>
      </View>

      <SubmitButton
        label="Crear orden de compra"
        isSubmitting={isSubmitting}
        error={errors.root?.message ?? null}
        onPress={() => void handleSubmit(submit)()}
      />
    </ScrollView>
  );
}
