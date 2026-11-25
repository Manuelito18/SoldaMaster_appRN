import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import type { LoteRequest, ProductoResponse } from '@/types/api';
import { nowLocalDateTime } from '@/utils/format';

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

const schema = z.object({
  idProducto: z.number().min(1, 'Selecciona un producto'),
  numeroLote: z.string().min(1, 'El número de lote es obligatorio'),
  fechaEntrada: z.string().regex(ISO_DATETIME, 'Formato: AAAA-MM-DDTHH:mm:ss'),
  stockLote: z.string().refine((v) => /^\d+$/.test(v), 'Debe ser un entero ≥ 0'),
});

type Values = z.infer<typeof schema>;

export function LoteForm({
  productos,
  initialProductoId,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  productos: ProductoResponse[];
  initialProductoId?: number;
  onSubmit: (body: LoteRequest) => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      idProducto: initialProductoId ?? 0,
      numeroLote: '',
      fechaEntrada: nowLocalDateTime(),
      stockLote: '0',
    },
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
    >
      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <Controller
          control={control}
          name="idProducto"
          render={({ field }) => (
            <EntityPicker
              label="Producto"
              items={productos.map((item) => ({
                id: item.idProducto,
                label: `${item.codigoUnico} · ${item.nombreDescripcion}`,
              }))}
              value={field.value || null}
              onValueChange={field.onChange}
              placeholder="Sin productos disponibles"
            />
          )}
        />
        {errors.idProducto ? (
          <Text className="text-xs text-danger">{errors.idProducto.message}</Text>
        ) : null}

        <FormField label="Número de lote" error={errors.numeroLote?.message}>
          <Controller
            control={control}
            name="numeroLote"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="L-002"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

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

      <SubmitButton
        label="Registrar lote"
        isSubmitting={isSubmitting}
        error={error}
        onPress={() =>
          void handleSubmit((values) =>
            onSubmit({
              numeroLote: values.numeroLote.trim(),
              fechaEntrada: values.fechaEntrada,
              stockLote: Number(values.stockLote),
              idProducto: values.idProducto,
            }),
          )()
        }
      />
    </ScrollView>
  );
}
