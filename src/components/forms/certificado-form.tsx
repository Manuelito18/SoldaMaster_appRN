import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, TextInput, View } from 'react-native';
import { z } from 'zod';

import { FormField, inputClass } from '@/components/forms/form-field';
import { SubmitButton } from '@/components/forms/submit-button';
import type { CertificadoRequest } from '@/types/api';
import { todayLocalDate } from '@/utils/format';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  numero: z.string().trim().min(1, 'El número es obligatorio'),
  fechaEmision: z.string().regex(ISO_DATE, 'Formato: AAAA-MM-DD'),
  archivoUrl: z.string(),
});

type Values = z.infer<typeof schema>;

export function CertificadoForm({
  onSubmit,
  isSubmitting = false,
  error,
}: {
  onSubmit: (body: CertificadoRequest) => void;
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
      numero: '',
      fechaEmision: todayLocalDate(),
      archivoUrl: '',
    },
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
    >
      <View className="gap-4 rounded-2xl border border-line bg-surface p-4">
        <FormField label="Número de certificado" error={errors.numero?.message}>
          <Controller
            control={control}
            name="numero"
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

        <FormField label="Fecha de emisión" error={errors.fechaEmision?.message}>
          <Controller
            control={control}
            name="fechaEmision"
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

        <FormField label="URL del archivo (opcional)" error={errors.archivoUrl?.message}>
          <Controller
            control={control}
            name="archivoUrl"
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

      <SubmitButton
        label="Registrar certificado"
        isSubmitting={isSubmitting}
        error={error}
        onPress={() =>
          void handleSubmit((values) =>
            onSubmit({
              numero: values.numero.trim(),
              fechaEmision: values.fechaEmision,
              archivoUrl: values.archivoUrl.trim() || undefined,
            }),
          )()
        }
      />
    </ScrollView>
  );
}
