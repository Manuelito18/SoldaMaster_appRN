import { Inbox } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-12">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
        <Inbox size={22} color="#B45309" />
      </View>
      <Text className="text-center text-base font-semibold text-ink">{title}</Text>
      <Text className="text-center text-sm text-muted">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          className="mt-2 rounded-xl bg-brand px-4 py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
