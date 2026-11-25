import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      {children}
      {hint ? <Text className="text-xs text-muted">{hint}</Text> : null}
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

export const inputClass =
  'min-h-12 rounded-xl border border-line bg-canvas px-3 text-base text-ink';
