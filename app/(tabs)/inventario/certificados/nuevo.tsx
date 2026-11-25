import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { CertificadoForm } from '@/components/forms/certificado-form';
import { useCrearCertificado } from '@/hooks/useInventario';
import type { CertificadoRequest } from '@/types/api';

export default function NuevoCertificadoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lote?: string; producto?: string }>();
  const idLote = Number(params.lote ?? 0);
  const mutation = useCrearCertificado(idLote);
  const [error, setError] = useState<string | null>(null);

  if (!idLote) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-center text-sm text-danger">
          Falta el identificador del lote.
        </Text>
      </View>
    );
  }

  const onSubmit = (body: CertificadoRequest) => {
    setError(null);
    mutation.mutate(body, {
      onSuccess: () =>
        Alert.alert('Certificado registrado', 'Quedó asociado al lote.', [
          { text: 'Aceptar', onPress: () => router.back() },
        ]),
      onError: (err) =>
        setError(
          err instanceof ApiError ? err.message : 'No se pudo registrar el certificado.',
        ),
    });
  };

  return (
    <>
      <Stack.Title>Nuevo certificado</Stack.Title>
      <CertificadoForm
        onSubmit={onSubmit}
        isSubmitting={mutation.isPending}
        error={error}
      />
    </>
  );
}
