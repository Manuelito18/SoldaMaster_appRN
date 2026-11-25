import { Text, View } from 'react-native';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand-dark',
};

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${TONE_CLASS[tone]}`}>
      <Text className="text-xs font-semibold" selectable>
        {label}
      </Text>
    </View>
  );
}
