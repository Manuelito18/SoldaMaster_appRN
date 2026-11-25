import { CreditCard, HandCoins, ListOrdered, Store } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const ACCIONES = [
  {
    route: '/ventas/pos',
    title: 'Punto de venta',
    description: 'Carrito, IGV en tiempo real y comprobante.',
    Icon: Store,
  },
  {
    route: '/ventas/listado',
    title: 'Listado de ventas',
    description: 'Historial de comprobantes y detalle.',
    Icon: ListOrdered,
  },
  {
    route: '/ventas/creditos',
    title: 'Créditos',
    description: 'Ventas con cuotas pendientes de cobro.',
    Icon: CreditCard,
  },
  {
    route: '/ventas/pagos',
    title: 'Pagos y cuotas',
    description: 'Cuotas por cobrar e historial de pagos.',
    Icon: HandCoins,
  },
] as const;

export default function VentasScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Title>Ventas</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-bold text-ink">Ventas</Text>
          <Text className="text-sm text-muted">
            Registro de ventas, POS, créditos y pagos.
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
