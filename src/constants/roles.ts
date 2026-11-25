/** Roles informativos del backend (no son seguridad: todas las rutas están permitAll). */
export const ROLES = ['ADMIN', 'VENDEDOR', 'CONTADOR'] as const;
export type AppRole = (typeof ROLES)[number];

export type TabKey = 'index' | 'ventas' | 'inventario' | 'compras' | 'mas';

/**
 * Visibilidad de UI únicamente. Decisión de producto, no regla del backend.
 * Un rol desconocido solo ve Inicio y Más (acceso mínimo).
 */
const TAB_ACCESS: Record<AppRole, readonly TabKey[]> = {
  ADMIN: ['index', 'ventas', 'inventario', 'compras', 'mas'],
  VENDEDOR: ['index', 'ventas', 'inventario', 'mas'],
  CONTADOR: ['index', 'ventas', 'compras', 'mas'],
};

export function normalizeRole(value: string | null | undefined): AppRole | null {
  return ROLES.find((role) => role === value) ?? null;
}

export function canAccessTab(role: string | null | undefined, tab: TabKey): boolean {
  const parsed = normalizeRole(role);
  if (!parsed) return tab === 'index' || tab === 'mas';
  return TAB_ACCESS[parsed].includes(tab);
}

export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CONTADOR: 'Contador',
};
