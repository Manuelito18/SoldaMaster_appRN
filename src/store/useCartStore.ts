import Decimal from 'decimal.js';
import { create } from 'zustand';

import { IGV } from '@/constants/system';
import type { ProductoResponse } from '@/types/api';

export type TipoPrecio =
  | 'precioVenta'
  | 'precioMayorista'
  | 'precioDistribuidor';

export interface CartItem {
  idProducto: number;
  codigoUnico: string;
  nombreDescripcion: string;
  stock: number;
  tipoPrecio: TipoPrecio;
  precioUnitario: number;
  cantidad: number;
  descuentoProducto: number;
}

interface CartState {
  items: CartItem[];
  descuentoGlobal: number;
  addItem: (
    producto: ProductoResponse,
    tipoPrecio: TipoPrecio,
    cantidad: number,
    descuentoProducto: number,
  ) => void;
  updateItem: (idProducto: number, cambios: Partial<CartItem>) => void;
  removeItem: (idProducto: number) => void;
  setDescuentoGlobal: (monto: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  descuentoGlobal: 0,

  addItem: (producto, tipoPrecio, cantidad, descuentoProducto) =>
    set((state) => {
      const precioUnitario = Number(producto[tipoPrecio] ?? 0);
      const cantidadValidada = Math.max(
        1,
        Math.min(Math.trunc(cantidad) || 1, producto.stock),
      );
      const existente = state.items.find(
        (item) => item.idProducto === producto.idProducto,
      );
      if (existente) {
        return {
          items: state.items.map((item) =>
            item.idProducto === producto.idProducto
              ? {
                  ...item,
                  cantidad: Math.min(
                    item.cantidad + cantidadValidada,
                    producto.stock,
                  ),
                  precioUnitario,
                  tipoPrecio,
                  descuentoProducto,
                }
              : item,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            idProducto: producto.idProducto,
            codigoUnico: producto.codigoUnico,
            nombreDescripcion: producto.nombreDescripcion,
            stock: producto.stock,
            tipoPrecio,
            precioUnitario,
            cantidad: cantidadValidada,
            descuentoProducto: Math.max(0, descuentoProducto || 0),
          },
        ],
      };
    }),

  updateItem: (idProducto, cambios) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.idProducto === idProducto
          ? {
              ...item,
              ...cambios,
              cantidad: Math.max(
                1,
                Math.min(Math.trunc(cambios.cantidad ?? item.cantidad) || 1, item.stock),
              ),
            }
          : item,
      ),
    })),

  removeItem: (idProducto) =>
    set((state) => ({
      items: state.items.filter((item) => item.idProducto !== idProducto),
    })),

  setDescuentoGlobal: (monto) =>
    set({ descuentoGlobal: Math.max(0, monto || 0) }),

  clear: () => set({ items: [], descuentoGlobal: 0 }),
}));

export function selectSubtotal(state: CartState): number {
  return state.items
    .reduce(
      (sum, item) =>
        sum.plus(
          new Decimal(item.precioUnitario)
            .times(item.cantidad)
            .minus(item.descuentoProducto),
        ),
      new Decimal(0),
    )
    .toDecimalPlaces(2)
    .toNumber();
}

/** IGV 18% sobre (subtotal - descuentoGlobal), según la regla documentada. */
export function selectBaseImponible(state: CartState): number {
  return Decimal.max(
    0,
    new Decimal(selectSubtotal(state)).minus(state.descuentoGlobal),
  )
    .toDecimalPlaces(2)
    .toNumber();
}

export function selectIgv(state: CartState): number {
  return new Decimal(selectBaseImponible(state))
    .times(IGV)
    .toDecimalPlaces(2)
    .toNumber();
}

export function selectTotal(state: CartState): number {
  return new Decimal(selectBaseImponible(state))
    .plus(selectIgv(state))
    .toDecimalPlaces(2)
    .toNumber();
}
