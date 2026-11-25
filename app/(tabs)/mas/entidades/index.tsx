import { Plus, UsersRound } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchBar } from '@/components/search-bar';
import { StatusBadge } from '@/components/status-badge';
import { TODOS } from '@/constants/system';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useEntidades } from '@/hooks/useEntidades';
import type { EntidadResponse } from '@/types/api';

const PAGE_SIZE = 10;

export default function EntidadesScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [tipoEntidadNombre, setTipoEntidadNombre] = useState<string>(TODOS);
  const deferredBusqueda = useDeferredValue(busqueda);

  const { tiposEntidad } = useCatalogos();
  const tipoEntidad =
    tipoEntidadNombre === TODOS
      ? TODOS
      : (tiposEntidad.find((item) => item.nombre === tipoEntidadNombre)?.nombre ?? TODOS);

  const { data, isLoading, isError, refetch, isFetching } = useEntidades({
    page,
    size: PAGE_SIZE,
    busqueda: deferredBusqueda || undefined,
    tipoDocumento: tipoDocumento || undefined,
    tipoEntidad,
  });

  const renderItem = useCallback(
    ({ item }: { item: EntidadResponse }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver entidad ${item.nombreRazonSocial}`}
        onPress={() =>
          router.push({
            pathname: '/mas/entidades/[id]',
            params: { id: String(item.idEntidad) },
          })
        }
        className="flex-row items-center gap-3 border-b border-line px-4 py-3.5 active:bg-canvas"
      >
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
          <UsersRound size={18} color="#78350F" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-ink" selectable numberOfLines={1}>
            {item.nombreRazonSocial}
          </Text>
          <Text className="text-xs text-muted" selectable>
            {`${item.tipoDocumento ?? ''} ${item.numeroDocumento ?? ''}`.trim() || 'Sin documento'}
            {item.idTipoEntidad ? ` · ${item.idTipoEntidad.nombre}` : ''}
          </Text>
        </View>
        <StatusBadge
          label={item.idEstado.nombre}
          tone={item.idEstado.idEstado === 1 ? 'success' : 'neutral'}
        />
      </Pressable>
    ),
    [router],
  );

  return (
    <>
      <Stack.Title>Entidades</Stack.Title>
      <View className="flex-1 bg-canvas">
        <View className="gap-3 px-4 pt-3">
          <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o documento" />
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted">TIPO DE ENTIDAD</Text>
            <View className="flex-row flex-wrap gap-2">
              {[TODOS, ...tiposEntidad.map((item) => item.nombre)].map((nombre) => (
                <Pressable
                  key={nombre}
                  accessibilityRole="button"
                  accessibilityState={{ selected: tipoEntidadNombre === nombre }}
                  onPress={() => {
                    setTipoEntidadNombre(nombre);
                    setPage(0);
                  }}
                  className={`rounded-full border px-3 py-1.5 ${
                    tipoEntidadNombre === nombre
                      ? 'border-brand bg-brand-soft'
                      : 'border-line bg-surface'
                  }`}
                >
                  <Text className="text-xs font-medium text-ink">{nombre}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextInput
            value={tipoDocumento}
            onChangeText={(value) => {
              setTipoDocumento(value);
              setPage(0);
            }}
            placeholder="Tipo de documento (DNI, RUC…)"
            placeholderTextColor="#94A3B8"
            className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nueva entidad"
            onPress={() => router.push('/mas/entidades/nuevo')}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 active:opacity-80"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="font-semibold text-white">Nueva entidad</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingState message="Cargando entidades…" />
        ) : isError ? (
          <View className="gap-3 px-4 py-8">
            <Text className="text-center text-sm text-danger">
              No se pudieron cargar las entidades.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => void refetch()}
              className="self-center rounded-lg bg-brand px-4 py-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={data?.content ?? []}
            keyExtractor={(item) => String(item.idEntidad)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 12 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <EmptyState
                title="Sin entidades"
                message="No hay resultados para los filtros actuales."
                actionLabel="Limpiar filtros"
                onAction={() => {
                  setBusqueda('');
                  setTipoDocumento('');
                  setTipoEntidadNombre(TODOS);
                  setPage(0);
                }}
              />
            }
            ListFooterComponent={
              <PaginationControls
                page={page}
                totalPages={data?.totalPages ?? 0}
                totalElements={data?.totalElements}
                onPageChange={setPage}
              />
            }
          />
        )}
      </View>
    </>
  );
}
