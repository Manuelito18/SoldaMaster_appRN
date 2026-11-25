import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { EntityPicker } from '@/components/entity-picker';
import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import { useCatalogos } from '@/hooks/useCatalogos';
import type { EntidadRequest, EntidadResponse } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  tipoDocumento: z.string().max(20, 'Máximo 20 caracteres'),
  numeroDocumento: z.string().max(20, 'Máximo 20 caracteres'),
  nombreRazonSocial: z
    .string()
    .trim()
    .min(1, 'El nombre o razón social es obligatorio')
    .max(150, 'Máximo 150 caracteres'),
  direccion: z.string().max(250, 'Máximo 250 caracteres'),
  telefono: z.string().max(20, 'Máximo 20 caracteres'),
  email: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .refine((value) => !value || EMAIL_RE.test(value), 'Correo no válido'),
  idEstado: z.number().min(1, 'Selecciona un estado'),
  idTipoEntidad: z.number().nullable(),
});

type Values = z.infer<typeof schema>;

function toValues(
  initial: EntidadResponse | undefined,
  defaultEstadoId: number,
  defaultTipoEntidadId: number | null,
): Values {
  return {
    tipoDocumento: initial?.tipoDocumento ?? '',
    numeroDocumento: initial?.numeroDocumento ?? '',
    nombreRazonSocial: initial?.nombreRazonSocial ?? '',
    direccion: initial?.direccion ?? '',
    telefono: initial?.telefono ?? '',
    email: initial?.email ?? '',
    idEstado: initial?.idEstado.idEstado ?? defaultEstadoId,
    // El listado paginado excluye entidades sin tipo; se predeterminá el primero.
    idTipoEntidad:
      initial?.idTipoEntidad?.idTipoEntidad ??
      (initial ? null : defaultTipoEntidadId),
  };
}

export function EntityForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  error,
}: {
  initialValues?: EntidadResponse;
  onSubmit: (body: EntidadRequest) => void;
  submitLabel: string;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const { estados, tiposEntidad } = useCatalogos();
  // El id de ACTIVO no es fijo: en esta BD es 2, en la semilla de la guía es 1.
  const defaultEstadoId =
    estados.find((item) => item.nombre.toUpperCase() === 'ACTIVO')?.idEstado ??
    estados[0]?.idEstado ??
    0;
  const defaultTipoEntidadId = tiposEntidad[0]?.idTipoEntidad ?? null;
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(
      initialValues,
      defaultEstadoId,
      defaultTipoEntidadId,
    ),
  });

  const idEstado = watch('idEstado');
  const idTipoEntidad = watch('idTipoEntidad');
  useEffect(() => {
    if (idEstado === 0 && defaultEstadoId > 0) {
      setValue('idEstado', defaultEstadoId);
    }
    if (idTipoEntidad === null && !initialValues && defaultTipoEntidadId !== null) {
      setValue('idTipoEntidad', defaultTipoEntidadId);
    }
  }, [
    defaultEstadoId,
    defaultTipoEntidadId,
    idEstado,
    idTipoEntidad,
    initialValues,
    setValue,
  ]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
    >
      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <FormField label="Nombre o razón social" error={errors.nombreRazonSocial?.message}>
          <Controller
            control={control}
            name="nombreRazonSocial"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ej. Ferretería Central S.A.C."
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <FormField label="Tipo de documento" error={errors.tipoDocumento?.message}>
          <Controller
            control={control}
            name="tipoDocumento"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="DNI / RUC"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <FormField label="Número de documento" error={errors.numeroDocumento?.message}>
          <Controller
            control={control}
            name="numeroDocumento"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Número"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <Controller
          control={control}
          name="idTipoEntidad"
          render={({ field }) => (
            <EntityPicker
              label="Tipo de entidad (opcional)"
              items={tiposEntidad.map((item) => ({
                id: item.idTipoEntidad,
                label: item.nombre,
              }))}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Sin tipos disponibles"
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
        {errors.idEstado ? (
          <Text className="text-xs text-danger">{errors.idEstado.message}</Text>
        ) : null}

        <FormField label="Dirección" error={errors.direccion?.message}>
          <Controller
            control={control}
            name="direccion"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Dirección"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Controller
            control={control}
            name="telefono"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="phone-pad"
                placeholder="Teléfono"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>

        <FormField label="Correo" error={errors.email?.message}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94A3B8"
                className={inputClass}
              />
            )}
          />
        </FormField>
      </View>

      <SubmitButton
        label={submitLabel}
        isSubmitting={isSubmitting}
        error={error}
        onPress={handleSubmit((values) => onSubmit(values))}
      />
    </ScrollView>
  );
}
