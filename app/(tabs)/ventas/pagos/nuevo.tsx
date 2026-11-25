import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/client';
import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useCuotasPorVenta, useRegistrarPago } from '@/hooks/usePagos';

const schema = z.object({
  montoTotal: z.string().refine((v) => Number(v) > 0, 'El monto debe ser mayor a 0'),
  referenciaPago: z.string(),
  idMetodoPago: z.number().min(1, 'Selecciona un método de pago'),
});

type Values = z.infer<typeof schema>;

export default function NuevoPagoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ venta?: string; cuota?: string }>();
  const idVenta = Number(params.venta ?? 0);
  const idCuota = Number(params.cuota ?? 0);
  const { metodosPago } = useCatalogos();
  const { data: cuotas } = useCuotasPorVenta(idVenta);
  const mutation = useRegistrarPago();
  const [error, setError] = useState<string | null>(null);

  const cuota = cuotas?.find((item) => item.idCuota === idCuota);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      montoTotal: String(cuota?.montoPendiente ?? 0),
      referenciaPago: `PAGO-${Date.now()}`,
      idMetodoPago: 0,
    },
  });

  const montoActual = watch('montoTotal');
  useEffect(() => {
    if (cuota && Number(montoActual) === 0) {
      setValue('montoTotal', String(cuota.montoPendiente));
    }
  }, [cuota, montoActual, setValue]);

  if (!idVenta) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          Falta el identificador de la venta.
        </Text>
      </View>
    );
  }

  const onSubmit = (values: Values) => {
    setError(null);
    mutation.mutate(
      {
        montoTotal: Number(values.montoTotal),
        referenciaPago: values.referenciaPago.trim(),
        idMetodoPago: values.idMetodoPago,
        idVenta,
      },
      {
        onSuccess: () =>
          Alert.alert('Pago registrado', 'El pago se distribuyó entre las cuotas.', [
            { text: 'Aceptar', onPress: () => router.back() },
          ]),
        onError: (err) =>
          setError(
            err instanceof ApiError ? err.message : 'No se pudo registrar el pago.',
          ),
      },
    );
  };

  return (
    <>
      <Stack.Title>Registrar pago</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
          <Text className="text-base font-semibold text-ink">
            {cuota
              ? `Cuota ${cuota.numeroCuota} · pendiente ${cuota.montoPendiente}`
              : `Venta #${idVenta}`}
          </Text>
          {metodosPago.length === 0 ? (
            <View className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
              <Text className="text-sm text-danger">
                El backend no tiene métodos de pago configurados.
              </Text>
            </View>
          ) : null}
          <FormField label="Monto" error={errors.montoTotal?.message}>
            <Controller
              control={control}
              name="montoTotal"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="decimal-pad"
                  className={inputClass}
                />
              )}
            />
          </FormField>
          <FormField label="Referencia" error={errors.referenciaPago?.message}>
            <Controller
              control={control}
              name="referenciaPago"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  className={inputClass}
                />
              )}
            />
          </FormField>
          <Controller
            control={control}
            name="idMetodoPago"
            render={({ field }) => (
              <EntityPicker
                label="Método de pago"
                items={metodosPago.map((item) => ({
                  id: item.idMetodoPago,
                  label: item.nombre,
                }))}
                value={field.value || null}
                onValueChange={field.onChange}
                placeholder="Sin métodos disponibles"
              />
            )}
          />
          {errors.idMetodoPago ? (
            <Text className="text-xs text-danger">{errors.idMetodoPago.message}</Text>
          ) : null}
        </View>

        <SubmitButton
          label="Registrar pago"
          isSubmitting={mutation.isPending}
          error={error}
          onPress={() => void handleSubmit(onSubmit)()}
        />
      </ScrollView>
    </>
  );
}
