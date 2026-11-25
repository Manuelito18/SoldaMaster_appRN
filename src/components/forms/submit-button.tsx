import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function SubmitButton({
  label,
  isSubmitting,
  error,
  onPress,
}: {
  label: string;
  isSubmitting: boolean;
  error?: string | null;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      {error ? (
        <View className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5">
          <Text className="text-sm text-danger" selectable>
            {error}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        disabled={isSubmitting}
        onPress={onPress}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-brand px-4 active:opacity-80 disabled:opacity-60"
      >
        {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text className="text-base font-semibold text-white">
          {isSubmitting ? 'Guardando…' : label}
        </Text>
      </Pressable>
    </View>
  );
}
