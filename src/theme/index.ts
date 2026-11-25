/** Única fuente de valores visuales. NativeWind consume los mismos nombres en tailwind.config.js. */
export const colors = {
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  primary: '#B45309',
  primaryDark: '#78350F',
  primarySoft: '#FEF3C7',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  headline: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;
