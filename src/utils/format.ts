import { format, parseISO } from 'date-fns';
import type { LocalDate, LocalDateTime, Money } from '@/types/api';

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

export function formatMoney(value: Money | null | undefined): string {
  return moneyFormatter.format(value ?? 0);
}

export function formatDate(value: LocalDate | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd/MM/yyyy');
  } catch {
    return value;
  }
}

export function formatDateTime(value: LocalDateTime | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm');
  } catch {
    return value;
  }
}

export function nowLocalDateTime(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

export function todayLocalDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
