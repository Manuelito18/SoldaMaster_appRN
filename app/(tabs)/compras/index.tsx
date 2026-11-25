import { ClipboardList, Clock3, History, Plus, ShoppingCart } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const ACCIONES = [
  {
    route: '/compras/ordenes',
    title: 'Órdenes de compra',
    description: 'Listado global y detalle de órdenes.',
    Icon: ClipboardList,
  },
  {
    route: '/compras/pendientes',
    title: 'Pendientes',
    description: 'Órdenes pendientes de aprobación.',
    Icon: Clock3,
  },
  {
    route: '/compras/ordenes/nuevo',
    title: 'Registrar orden',
    description: 'Crear una orden de compra con sus productos.',
    Icon: Plus,
  },
  {
    route: '/compras/compras',
    title: 'Historial de compras',
    description: 'Compras registradas y su detalle.',
    Icon: History,
  },
  {
    route: '/compras/compras/nuevo',
    title: 'Registrar compra',
    description: 'Registro directo o desde una orden pendiente.',
    Icon: ShoppingCart,
  },
] as const;

export default function ComprasScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Title>Compras</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-bold text-ink">Compras</Text>
          <Text className="text-sm text-muted">
            Órdenes, pendientes, rechazo, registro e historial.
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
