import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas px-6">
      <Text className="text-2xl font-bold text-ink">Página no encontrada</Text>
      <Text className="text-center text-sm text-muted">
        La ruta solicitada no existe en esta versión de la aplicación.
      </Text>
      <Link href="/" className="mt-2 rounded-xl bg-brand px-4 py-3">
        <Text className="font-semibold text-white">Ir al inicio</Text>
      </Link>
    </View>
  );
}
