import { Boxes, History, Package, TriangleAlert } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const ACCIONES = [
  {
    route: '/inventario/productos',
    title: 'Productos',
    description: 'Alta con saldo inicial, edición y consulta.',
    Icon: Package,
  },
  {
    route: '/inventario/stock',
    title: 'Stock',
    description: 'Alertas de stock mínimo y existencias.',
    Icon: TriangleAlert,
  },
  {
    route: '/inventario/lotes',
    title: 'Lotes',
    description: 'Registro de lotes y certificados.',
    Icon: Boxes,
  },
  {
    route: '/inventario/kardex',
    title: 'Kardex',
    description: 'Movimientos globales y por producto.',
    Icon: History,
  },
] as const;

export default function InventarioScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Title>Inventario</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-bold text-ink">Inventario</Text>
          <Text className="text-sm text-muted">
            Productos, stock, lotes, certificados y kardex.
          </Text>
        </View>

        {ACCIONES.map(({ route, title, description, Icon }) => (
          <Pressable
            key={route}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={() => router.push(route)}
            className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-canvas"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
              <Icon size={20} color="#78350F" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-ink">{title}</Text>
              <Text className="text-xs text-muted">{description}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}
