import { NativeTabs } from 'expo-router/native-tabs';

import { canAccessTab } from '@/constants/roles';
import { usePrecargarCatalogos } from '@/hooks/useCatalogos';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const role = useAuthStore((state) => state.nombreRol);
  usePrecargarCatalogos(true);

  // El rol ya está rehidratado (root layout bloquea hasta entonces), por lo que
  // la visibilidad es estática durante la sesión: no se alterna en caliente.
  return (
    <NativeTabs tintColor="#B45309">
      <NativeTabs.Trigger
        name="index"
        hidden={!canAccessTab(role, 'index')}
      >
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="ventas"
        hidden={!canAccessTab(role, 'ventas')}
      >
        <NativeTabs.Trigger.Icon sf="cart.fill" md="shopping_cart" />
        <NativeTabs.Trigger.Label>Ventas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="inventario"
        hidden={!canAccessTab(role, 'inventario')}
      >
        <NativeTabs.Trigger.Icon sf="shippingbox.fill" md="inventory_2" />
        <NativeTabs.Trigger.Label>Inventario</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="compras"
        hidden={!canAccessTab(role, 'compras')}
      >
        <NativeTabs.Trigger.Icon sf="doc.badge.plus" md="receipt_long" />
        <NativeTabs.Trigger.Label>Compras</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mas" role="more">
        <NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" md="more_horiz" />
        <NativeTabs.Trigger.Label>Más</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
