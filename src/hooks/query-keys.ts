import type {
  EntidadFilters,
  Id,
  ProductoFilters,
} from '@/types/api';

export const entidadKeys = {
  all: ['entidades'] as const,
  list: (filters: EntidadFilters) => ['entidades', 'list', filters] as const,
  todas: ['entidades', 'todas'] as const,
  detail: (id: Id) => ['entidades', 'detail', id] as const,
};

export const productoKeys = {
  all: ['productos'] as const,
  list: (filters: ProductoFilters) => ['productos', 'list', filters] as const,
  todas: ['productos', 'todas'] as const,
  detail: (id: Id) => ['productos', 'detail', id] as const,
};

export const inventarioKeys = {
  all: ['inventario'] as const,
  lotes: (idProducto: Id) => ['inventario', 'lotes', idProducto] as const,
  kardexProducto: (idProducto: Id) =>
    ['inventario', 'kardex', idProducto] as const,
  kardexGlobal: ['inventario', 'kardex', 'global'] as const,
};
