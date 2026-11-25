import { FileBarChart2, LogOut, RefreshCw, UserRound, UsersRound } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { StatusBadge } from '@/components/status-badge';
import { ROLE_LABEL, normalizeRole } from '@/constants/roles';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useAuthStore } from '@/store/useAuthStore';

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-ink" selectable>
        {value || '—'}
      </Text>
    </View>
  );
}

export default function MasScreen() {
  const router = useRouter();
  const entidad = useAuthStore((state) => state.entidad);
  const nombreRol = useAuthStore((state) => state.nombreRol);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { isLoading, isError, refetchAll } = useCatalogos();

  const role = normalizeRole(nombreRol);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar la sesión actual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          clearSession();
          // Una vez cerrada, back no debe devolver a las pestañas.
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Title>Más</Stack.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-2 rounded-2xl border border-line bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
              <UserRound size={20} color="#78350F" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-ink" selectable>
                {entidad?.nombreRazonSocial ?? 'Sin perfil'}
              </Text>
              <Text className="text-xs text-muted">
                {role ? ROLE_LABEL[role] : 'Rol no reconocido'}
              </Text>
            </View>
            <StatusBadge label={nombreRol ?? 'SIN ROL'} tone="brand" />
          </View>

          <View className="mt-2 border-t border-line pt-2">
            <DataRow label="Documento" value={entidad?.numeroDocumento} />
            <DataRow label="Tipo" value={entidad?.tipoDocumento} />
            <DataRow label="Teléfono" value={entidad?.telefono} />
            <DataRow label="Correo" value={entidad?.email} />
            <DataRow label="Dirección" value={entidad?.direccion} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a entidades"
          onPress={() => router.push('/mas/entidades')}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-canvas"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
            <UsersRound size={20} color="#78350F" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-ink">Entidades</Text>
            <Text className="text-xs text-muted">
              Clientes, proveedores y empleados
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a reportes"
          onPress={() => router.push('/mas/reportes')}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-canvas"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
            <FileBarChart2 size={20} color="#78350F" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-ink">Reportes</Text>
            <Text className="text-xs text-muted">Ventas y compras por rango</Text>
          </View>
        </Pressable>

        <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
          <Text className="text-base font-semibold text-ink">Catálogos</Text>
          <Text className="text-xs text-muted">
            {isLoading
              ? 'Cargando…'
              : isError
                ? 'No se pudieron cargar. Revisa el servidor.'
                : 'Disponibles y cacheados en el dispositivo.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar catálogos"
            disabled={isLoading}
            onPress={() => void refetchAll()}
            className="flex-row items-center gap-2 self-start rounded-lg bg-brand-soft px-3 py-2 active:opacity-80 disabled:opacity-50"
          >
            <RefreshCw size={16} color="#78350F" />
            <Text className="text-sm font-semibold text-brand-dark">Actualizar</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={handleLogout}
          className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 active:opacity-80"
        >
          <LogOut size={18} color="#B91C1C" />
          <Text className="text-base font-semibold text-danger">Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}
