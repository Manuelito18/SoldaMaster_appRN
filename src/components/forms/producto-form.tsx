import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { useCatalogos } from '@/hooks/useCatalogos';
import type {
  ProductoInventarioRequest,
  ProductoRequest,
  ProductoResponse,
} from '@/types/api';
import { nowLocalDateTime, todayLocalDate } from '@/utils/format';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const NON_NEGATIVE = /^\d+(\.\d+)?$/;

const schema = z.object({
  codigoBarras: z.string(),
  nombreDescripcion: z.string().trim().min(1, 'El nombre es obligatorio'),
  codigoUnico: z
    .string()
    .trim()
    .min(1, 'El código único es obligatorio')
    .max(10, 'Máximo 10 caracteres'),
  precioVenta: z.string().refine((v) => NON_NEGATIVE.test(v), 'Monto no válido'),
  precioMayorista: z.string().refine((v) => !v || NON_NEGATIVE.test(v), 'Monto no válido'),
  precioDistribuidor: z
    .string()
    .refine((v) => !v || NON_NEGATIVE.test(v), 'Monto no válido'),
  stock: z.string().refine((v) => /^\d+$/.test(v), 'Debe ser un entero ≥ 0'),
  stockMinimo: z.string().refine((v) => /^\d+$/.test(v), 'Debe ser un entero ≥ 0'),
  imagenUrl: z.string(),
  manejaLote: z.boolean(),
  idCategoria: z.string(),
  idUnidadMedida: z.string(),
  idEstado: z.number().min(1, 'Selecciona un estado'),
  numeroLote: z.string(),
  fechaEntrada: z.string().regex(ISO_DATETIME, 'Formato: AAAA-MM-DDTHH:mm:ss'),
  stockLote: z.string().refine((v) => /^\d+$/.test(v), 'Debe ser un entero ≥ 0'),
  certificadoNumero: z.string(),
  certificadoFechaEmision: z
    .string()
    .refine((v) => !v || ISO_DATE.test(v), 'Formato: AAAA-MM-DD'),
  certificadoArchivoUrl: z.string(),
});

type Values = z.infer<typeof schema>;

function toValues(initial: ProductoResponse | undefined, defaultEstadoId: number): Values {
  return {
    codigoBarras: initial?.codigoBarras ?? '',
    nombreDescripcion: initial?.nombreDescripcion ?? '',
    codigoUnico: initial?.codigoUnico ?? '',
    precioVenta: initial ? String(initial.precioVenta) : '0',
    precioMayorista: initial?.precioMayorista
      ? String(initial.precioMayorista)
      : '',
    precioDistribuidor: initial?.precioDistribuidor
      ? String(initial.precioDistribuidor)
      : '',
    stock: initial ? String(initial.stock) : '0',
    stockMinimo: initial ? String(initial.stockMinimo) : '0',
    imagenUrl: initial?.imagenUrl ?? '',
    manejaLote: initial?.manejaLote ?? false,
    idCategoria: initial?.idCategoria?.nombre ?? '',
    idUnidadMedida: initial?.idUnidadMedida?.nombre ?? '',
    idEstado: initial?.idEstado.idEstado ?? defaultEstadoId,
    numeroLote: '',
    fechaEntrada: nowLocalDateTime(),
    stockLote: initial ? String(initial.stock) : '0',
    certificadoNumero: '',
    certificadoFechaEmision: todayLocalDate(),
    certificadoArchivoUrl: '',
  };
}

function buildProducto(values: Values): ProductoRequest {
  return {
    codigoBarras: values.codigoBarras.trim() || undefined,
    nombreDescripcion: values.nombreDescripcion.trim(),
    precioVenta: Number(values.precioVenta),
    stock: Number(values.stock),
    stockMinimo: Number(values.stockMinimo),
    imagenUrl: values.imagenUrl.trim() || undefined,
    manejaLote: values.manejaLote,
    precioMayorista: values.precioMayorista
      ? Number(values.precioMayorista)
      : undefined,
    precioDistribuidor: values.precioDistribuidor
      ? Number(values.precioDistribuidor)
      : undefined,
    codigoUnico: values.codigoUnico.trim(),
    // El backend espera nombres, no ids (findByNombre).
    idCategoria: values.idCategoria.trim() || undefined,
    idUnidadMedida: values.idUnidadMedida.trim() || undefined,
    idEstado: values.idEstado,
  };
}

export function ProductoForm({
  mode,
  initialValues,
  onCreate,
  onEdit,
  isSubmitting = false,
  error,
}: {
  mode: 'create' | 'edit';
  initialValues?: ProductoResponse;
  onCreate?: (body: ProductoInventarioRequest) => void;
  onEdit?: (body: ProductoRequest) => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const { categorias, medidas, estados } = useCatalogos();
  const defaultEstadoId =
    estados.find((item) => item.nombre.toUpperCase() === 'ACTIVO')?.idEstado ??
    estados[0]?.idEstado ??
    0;
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initialValues, defaultEstadoId),
  });

  const idEstado = watch('idEstado');
  useEffect(() => {
    if (idEstado === 0 && defaultEstadoId > 0) {
      setValue('idEstado', defaultEstadoId);
    }
  }, [defaultEstadoId, idEstado, setValue]);

  const submit = (values: Values) => {
    const producto = buildProducto(values);

    if (mode === 'edit') {
      onEdit?.(producto);
      return;
    }

    if (values.manejaLote && !values.numeroLote.trim()) {
      setError('numeroLote', {
        message: 'El número de lote es obligatorio cuando maneja lote',
      });
      return;
    }

    onCreate?.({
      producto,
      lote: {
        numeroLote: values.numeroLote.trim() || undefined,
        fechaEntrada: values.fechaEntrada,
        stockLote: Number(values.stockLote),
      },
      certificado: values.certificadoNumero.trim()
        ? {
            numero: values.certificadoNumero.trim(),
            fechaEmision: values.certificadoFechaEmision,
            archivoUrl: values.certificadoArchivoUrl.trim() || undefined,
          }
        : null,
    });
  };

  return (
    <View className="gap-4 p-4 pb-8">
      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <Text className="text-base font-semibold text-ink">Datos del producto</Text>

        <FormField label="Nombre y descripción" error={errors.nombreDescripcion?.message}>
          <Controller
            control={control}
            name="nombreDescripcion"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ej. Ariete soldador 200A"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Código único" error={errors.codigoUnico?.message}>
              <Controller
                control={control}
                name="codigoUnico"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="P001"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Código de barras" error={errors.codigoBarras?.message}>
              <Controller
                control={control}
                name="codigoBarras"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Opcional"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Precio venta" error={errors.precioVenta?.message}>
              <Controller
                control={control}
                name="precioVenta"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Precio mayorista" error={errors.precioMayorista?.message}>
              <Controller
                control={control}
                name="precioMayorista"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="decimal-pad"
                    placeholder="Opcional"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>

        <FormField label="Precio distribuidor" error={errors.precioDistribuidor?.message}>
          <Controller
            control={control}
            name="precioDistribuidor"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="decimal-pad"
                placeholder="Opcional"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Stock" error={errors.stock?.message}>
              <Controller
                control={control}
                name="stock"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Stock mínimo" error={errors.stockMinimo?.message}>
              <Controller
                control={control}
                name="stockMinimo"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>

        <Controller
          control={control}
          name="idCategoria"
          render={({ field }) => (
            <EntityPicker
              label="Categoría (nombre)"
              items={categorias.map((item) => ({
                id: item.idCategoria,
                label: item.nombre,
              }))}
              value={
                categorias.find((item) => item.nombre === field.value)?.idCategoria ?? null
              }
              onValueChange={(id) =>
                field.onChange(categorias.find((item) => item.idCategoria === id)?.nombre ?? '')
              }
              placeholder="Sin categorías disponibles"
            />
          )}
        />

        <Controller
          control={control}
          name="idUnidadMedida"
          render={({ field }) => (
            <EntityPicker
              label="Unidad de medida (nombre)"
              items={medidas.map((item) => ({
                id: item.idMedida,
                label: item.nombre,
              }))}
              value={
                medidas.find((item) => item.nombre === field.value)?.idMedida ?? null
              }
              onValueChange={(id) =>
                field.onChange(medidas.find((item) => item.idMedida === id)?.nombre ?? '')
              }
              placeholder="Sin medidas disponibles"
            />
          )}
        />

        <Controller
          control={control}
          name="idEstado"
          render={({ field }) => (
            <EntityPicker
              label="Estado"
              items={estados.map((item) => ({
                id: item.idEstado,
                label: item.nombre,
              }))}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Sin estados disponibles"
            />
          )}
        />

        <FormField label="URL de imagen (opcional)" error={errors.imagenUrl?.message}>
          <Controller
            control={control}
            name="imagenUrl"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="https://…"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <Controller
          control={control}
          name="manejaLote"
          render={({ field }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Maneja lote"
              accessibilityState={{ checked: field.value }}
              onPress={() => field.onChange(!field.value)}
              className="flex-row items-center gap-2 self-start rounded-xl border border-line bg-canvas px-3 py-2.5"
            >
              {field.value ? (
                <View className="h-5 w-5 items-center justify-center rounded-md bg-brand">
                  <Check size={14} color="#FFFFFF" />
                </View>
              ) : (
                <View className="h-5 w-5 rounded-md border border-line bg-surface" />
              )}
              <Text className="text-sm font-medium text-ink">Maneja lote</Text>
            </Pressable>
          )}
        />
      </View>

      {mode === 'create' ? (
        <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
          <Text className="text-base font-semibold text-ink">Saldo inicial y lote</Text>

          <FormField label="Número de lote" error={errors.numeroLote?.message}>
            <Controller
              control={control}
              name="numeroLote"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="L-001"
                  placeholderTextColor="#94A3B8"
                  className={inputClass}
                />
              )}
            />
          </FormField>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField label="Fecha de entrada" error={errors.fechaEntrada?.message}>
                <Controller
                  control={control}
                  name="fechaEntrada"
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
              <FormField label="Stock del lote" error={errors.stockLote?.message}>
                <Controller
                  control={control}
                  name="stockLote"
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      className={inputClass}
                    />
                  )}
                />
              </FormField>
            </View>
          </View>

          <View className="gap-3 rounded-xl border border-line bg-canvas p-3">
            <Text className="text-sm font-semibold text-ink">
              Certificado (opcional)
            </Text>
            <FormField label="Número" error={errors.certificadoNumero?.message}>
              <Controller
                control={control}
                name="certificadoNumero"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="CERT-001"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
            <FormField
              label="Fecha de emisión"
              error={errors.certificadoFechaEmision?.message}
            >
              <Controller
                control={control}
                name="certificadoFechaEmision"
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
            <FormField label="URL del archivo" error={errors.certificadoArchivoUrl?.message}>
              <Controller
                control={control}
                name="certificadoArchivoUrl"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="https://…"
                    placeholderTextColor="#94A3B8"
                    className={inputClass}
                  />
                )}
              />
            </FormField>
          </View>
        </View>
      ) : null}

      <SubmitButton
        label={mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        isSubmitting={isSubmitting}
        error={error}
        onPress={() => void handleSubmit(submit)()}
      />
    </View>
  );
}
