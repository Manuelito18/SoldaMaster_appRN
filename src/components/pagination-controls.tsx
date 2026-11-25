import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export function PaginationControls({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  /** Página actual basada en 0, igual que el parámetro `page` del backend. */
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
}) {
  const canGoBack = page > 0;
  const canGoForward = page < totalPages - 1;

  return (
    <View className="flex-row items-center justify-between gap-3 px-1 py-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        accessibilityState={{ disabled: !canGoBack }}
        disabled={!canGoBack}
        onPress={() => onPageChange(page - 1)}
        className={`flex-row items-center gap-1 rounded-lg px-3 py-2 ${
          canGoBack ? 'bg-brand-soft active:opacity-80' : 'opacity-40'
        }`}
      >
        <ChevronLeft size={16} color="#78350F" />
        <Text className="text-sm font-medium text-brand-dark">Anterior</Text>
      </Pressable>

      <Text className="text-center text-xs text-muted" selectable>
        {`Página ${page + 1} de ${Math.max(totalPages, 1)}`}
        {totalElements !== undefined ? `\n${totalElements} registros` : ''}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Página siguiente"
        accessibilityState={{ disabled: !canGoForward }}
        disabled={!canGoForward}
        onPress={() => onPageChange(page + 1)}
        className={`flex-row items-center gap-1 rounded-lg px-3 py-2 ${
          canGoForward ? 'bg-brand-soft active:opacity-80' : 'opacity-40'
        }`}
      >
        <Text className="text-sm font-medium text-brand-dark">Siguiente</Text>
        <ChevronRight size={16} color="#78350F" />
      </Pressable>
    </View>
  );
}
