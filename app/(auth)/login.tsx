import { zodResolver } from '@hookform/resolvers/zod';
import { Hammer, LockKeyhole, UserRound } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { ApiError } from '@/api/client';
import { authService } from '@/api/services/auth';
import { useAuthStore } from '@/store/useAuthStore';

const schema = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type FormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="text-xs text-danger">{message}</Text>;
}

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { usuario: '', password: '' },
  });

  const onSubmit = async ({ usuario, password }: FormValues) => {
    try {
      const session = await authService.login({ usuario, password });
      setSession(session);
      // One-way door: volver no debe reentrar al login.
      router.replace('/');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.path?.includes('/auth/login') && error.status >= 500
            ? 'Usuario o contraseña incorrectos.'
            : error.message
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
      setError('root', { message });
    }
  };

  return (
    <>
      <Stack.Title>Iniciar sesión</Stack.Title>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View className="mx-auto w-full max-w-[420px] gap-6">
            <View className="items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand">
                <Hammer size={30} color="#FFFFFF" />
              </View>
              <View className="items-center gap-1">
                <Text className="text-2xl font-bold text-ink">Solda Master</Text>
                <Text className="text-sm text-muted">ERP / POS para ferretería</Text>
              </View>
            </View>

            <View className="gap-4 rounded-2xl border border-line bg-surface p-5">
              <View className="gap-1">
                <Text className="text-lg font-semibold text-ink">Bienvenido</Text>
                <Text className="text-sm text-muted">
                  Ingresa tus credenciales para continuar.
                </Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-ink">Usuario</Text>
                <View className="flex-row items-center gap-2 rounded-xl border border-line bg-canvas px-3">
                  <UserRound size={18} color="#64748B" />
                  <Controller
                    control={control}
                    name="usuario"
                    render={({ field }) => (
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Tu usuario"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="username"
                        returnKeyType="next"
                        className="min-h-12 flex-1 text-base text-ink"
                      />
                    )}
                  />
                </View>
                <FieldError message={errors.usuario?.message} />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-ink">Contraseña</Text>
                <View className="flex-row items-center gap-2 rounded-xl border border-line bg-canvas px-3">
                  <LockKeyhole size={18} color="#64748B" />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Tu contraseña"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="current-password"
                        returnKeyType="go"
                        onSubmitEditing={() => void handleSubmit(onSubmit)()}
                        className="min-h-12 flex-1 text-base text-ink"
                      />
                    )}
                  />
                </View>
                <FieldError message={errors.password?.message} />
              </View>

              {errors.root?.message ? (
                <View className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
                  <Text className="text-sm text-danger" selectable>
                    {errors.root.message}
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
                accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => void handleSubmit(onSubmit)()}
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 active:opacity-80 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : null}
                <Text className="text-base font-semibold text-white">
                  {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
                </Text>
              </Pressable>
            </View>

            <Text className="text-center text-xs leading-4 text-muted">
              El backend valida usuario y contraseña. No se almacena ningún token.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
