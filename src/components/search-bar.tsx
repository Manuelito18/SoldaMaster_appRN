import { Search, X } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar…',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-line bg-surface px-3">
      <Search size={18} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCorrect={false}
        className="min-h-11 flex-1 text-base text-ink"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <X size={18} color="#64748B" />
        </Pressable>
      ) : null}
    </View>
  );
}
