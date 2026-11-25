import { Activity, ArrowDownLeft, ArrowUpRight, Hammer } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusBadge } from '@/components/status-badge';
import { ROLE_LABEL, normalizeRole } from '@/constants/roles';
import { useActividadDashboard, useResumenDashboard } from '@/hooks/useDashboard';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime, formatMoney } from '@/utils/format';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="w-[46%] gap-1 rounded-xl border border-line bg-surface p-3.5">
      <Text className="text-xl font-bold text-ink" selectable>
        {value}
      </Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4">
      <Text className="text-sm text-danger" selectable>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar"
        onPress={onRetry}
        className="self-start rounded-lg bg-danger px-3 py-2"
      >
        <Text className="text-sm font-semibold text-white">Reintentar</Text>
      </Pressable>
    </View>
  );
}

export default function InicioScreen() {
  const entidad = useAuthStore((state) => state.entidad);
  const nombreRol = useAuthStore((state) => state.nombreRol);
  const idUsuario = useAuthStore((state) => state.idUsuario);
  const resumen = useResumenDashboard();
  const actividad = useActividadDashboard();
  const catalogos = useCatalogos();
  const role = normalizeRole(nombreRol);
  const insets = useSafeAreaInsets();

  const recargar = () => {
    void resumen.refetch();
    void actividad.refetch();
    void catalogos.refetchAll();
  };

  return (
    <>
      <Stack.Title>Inicio</Stack.Title>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              resumen.isFetching || actividad.isFetching || catalogos.isLoading
            }
            onRefresh={recargar}
          />
        }
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
        }}
      >
        <View className="gap-4 rounded-2xl bg-brand p-5">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Hammer size={22} color="#FFFFFF" />
          </View>
          <View className="gap-1">
            <Text className="text-xl font-bold text-white" selectable>
              Hola, {entidad?.nombreRazonSocial ?? 'usuario'}
            </Text>
            <Text className="text-sm text-white/80" selectable>
              Usuario #{idUsuario ?? '—'} · {role ? ROLE_LABEL[role] : 'Rol no reconocido'}
            </Text>
          </View>
          <StatusBadge label={nombreRol ?? 'SIN ROL'} tone="brand" />
        </View>

        <View className="gap-2">
          <Text className="text-lg font-semibold text-ink">Resumen</Text>
          <Text className="text-xs text-muted">Indicadores del negocio</Text>
        </View>

        {resumen.isLoading ? (
          <LoadingState message="Cargando indicadores…" />
        ) : resumen.isError || !resumen.data ? (
          <ErrorCard
            message="No se pudieron cargar los indicadores del dashboard."
            onRetry={() => void resumen.refetch()}
          />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              label="Ventas hoy"
              value={formatMoney(resumen.data.ventasHoy)}
            />
            <StatCard
              label="Ventas del mes"
              value={formatMoney(resumen.data.ventasMes)}
            />
            <StatCard
              label="Compras del mes"
              value={formatMoney(resumen.data.comprasMes)}
            />
            <StatCard
              label="Utilidad neta"
              value={formatMoney(resumen.data.utilidadNeta)}
            />
            <StatCard label="Clientes" value={resumen.data.totalClientes} />
            <StatCard label="Productos" value={resumen.data.totalProductos} />
            <StatCard
              label="Unidades en stock"
              value={resumen.data.inventarioUnidades}
            />
            <StatCard
              label="Valor de inventario"
              value={formatMoney(resumen.data.inventarioValor)}
            />
            <StatCard
              label="Alertas de stock"
              value={resumen.data.alertasStockCritico}
            />
          </View>
        )}

        <View className="gap-2">
          <Text className="text-lg font-semibold text-ink">Última actividad</Text>
          <Text className="text-xs text-muted">Movimientos y ventas recientes</Text>
        </View>

        {actividad.isLoading ? (
          <LoadingState message="Cargando actividad…" />
        ) : actividad.isError ? (
          <ErrorCard
            message="No se pudo cargar la actividad."
            onRetry={() => void actividad.refetch()}
          />
        ) : (actividad.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin actividad"
            message="Todavía no hay ventas ni movimientos de inventario."
          />
        ) : (
          <View className="overflow-hidden rounded-2xl border border-line bg-surface">
            {actividad.data?.map((item, index) => {
              const esEntrada =
                item.label.toUpperCase().includes('ENTRADA') ||
                item.label.toUpperCase().includes('KARDEX');
              const esSalida = item.label.toUpperCase().includes('SALIDA');
              return (
                <View
                  key={`${item.time}-${index}`}
                  className={`flex-row items-center gap-3 px-4 py-3 ${
                    index > 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-brand-soft">
                    {esSalida ? (
                      <ArrowDownLeft size={16} color="#B45309" />
                    ) : (
                      <ArrowUpRight size={16} color="#B45309" />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink" selectable numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text className="text-xs text-muted" selectable numberOfLines={1}>
                      {`${formatDateTime(item.time)} · ${item.desc}`}
                    </Text>
                  </View>
                  <Activity size={14} color="#64748B" />
                </View>
              );
            })}
          </View>
        )}

        <View className="gap-2">
          <Text className="text-lg font-semibold text-ink">Catálogos del sistema</Text>
          <Text className="text-xs text-muted">
            Datos cacheados para usarlos en todo el aplicativo.
          </Text>
        </View>

        {catalogos.isLoading ? (
          <LoadingState message="Cargando catálogos…" />
        ) : catalogos.isError ? (
          <ErrorCard
            message="No se pudieron cargar los catálogos."
            onRetry={() => void catalogos.refetchAll()}
          />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            <StatCard label="Categorías" value={catalogos.categorias.length} />
            <StatCard label="Medidas" value={catalogos.medidas.length} />
            <StatCard label="Estados" value={catalogos.estados.length} />
            <StatCard label="Tipos de entidad" value={catalogos.tiposEntidad.length} />
            <StatCard label="Roles" value={catalogos.roles.length} />
            <StatCard label="Métodos de pago" value={catalogos.metodosPago.length} />
          </View>
        )}
      </ScrollView>
    </>
  );
}
