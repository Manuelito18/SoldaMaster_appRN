import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ message = 'Cargando…' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-12">
      <ActivityIndicator size="large" color="#B45309" />
      <Text className="text-center text-sm text-muted">{message}</Text>
    </View>
  );
}
