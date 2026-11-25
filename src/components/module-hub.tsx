import { ChevronRight } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { StatusBadge } from './status-badge';

export interface ModuleItem {
  title: string;
  description: string;
  phase: string;
}

/** Pantalla de acceso a un módulo. Las filas son informativas: no son botones falsos. */
export function ModuleHub({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ModuleItem[];
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
    >
      <View className="gap-2">
        <Text className="text-2xl font-bold text-ink">{title}</Text>
        <Text className="text-sm leading-5 text-muted">{description}</Text>
      </View>

      <View className="overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((item, index) => (
          <View
            key={item.title}
            className={`flex-row items-start gap-3 px-4 py-3.5 ${
              index > 0 ? 'border-t border-line' : ''
            }`}
          >
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-lg bg-brand-soft">
              <ChevronRight size={16} color="#78350F" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-ink">{item.title}</Text>
              <Text className="text-xs leading-4 text-muted">{item.description}</Text>
            </View>
            <StatusBadge label={item.phase} tone="brand" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
