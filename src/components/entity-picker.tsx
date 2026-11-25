import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

export interface PickerItem {
  id: number;
  label: string;
}

/** Selector presentacional: recibe la lista ya resuelta por React Query. */
export function EntityPicker({
  items,
  value,
  onValueChange,
  placeholder = 'Selecciona una opción',
  label,
}: {
  items: PickerItem[];
  value: number | null;
  onValueChange: (id: number) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-ink">{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {items.length === 0 ? (
          <Text className="py-2 text-sm text-muted">{placeholder}</Text>
        ) : (
          items.map((item) => {
            const selected = item.id === value;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
                onPress={() => onValueChange(item.id)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                  selected
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface'
                }`}
              >
                {selected ? <Check size={14} color="#78350F" /> : null}
                <Text
                  className={`text-sm font-medium ${
                    selected ? 'text-brand-dark' : 'text-muted'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
