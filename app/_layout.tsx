import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/providers/query-provider';
import { selectIsAuthenticated, useAuthStore } from '@/store/useAuthStore';

function HydrationGate() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand">
        <Text className="text-xl font-bold text-white">SM</Text>
      </View>
      <ActivityIndicator color="#B45309" />
      <Text className="text-sm text-muted">Preparando Solda Master…</Text>
    </View>
  );
}

export default function RootLayout() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // No decidir la ruta con estado sin rehidratar: evita el flash de Login.
  if (!hydrated) return <HydrationGate />;

  return (
    <AppErrorBoundary>
      <QueryProvider>
        <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated} redirectTo="/login">
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        </Stack>
      </QueryProvider>
    </AppErrorBoundary>
  );
}
