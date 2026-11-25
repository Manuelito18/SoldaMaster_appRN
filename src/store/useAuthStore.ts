import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EntidadResponse, LoginResponse } from '@/types/api';
import { normalizeRole } from '@/constants/roles';

interface AuthState {
  idUsuario: number | null;
  entidad: EntidadResponse | null;
  nombreRol: string | null;
  /** Bloquea el render hasta que AsyncStorage termina de rehidratar. */
  hydrated: boolean;
  setSession: (session: LoginResponse) => void;
  clearSession: () => void;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      idUsuario: null,
      entidad: null,
      nombreRol: null,
      hydrated: false,

      setSession: ({ idUsuario, entidad, nombreRol }) =>
        set({ idUsuario, entidad, nombreRol }),

      clearSession: () =>
        set({ idUsuario: null, entidad: null, nombreRol: null }),

      hasRole: (...roles) => {
        const role = normalizeRole(get().nombreRol);
        return role !== null && roles.includes(role);
      },
    }),
    {
      name: 'solda_auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        idUsuario: state.idUsuario,
        entidad: state.entidad,
        nombreRol: state.nombreRol,
      }),
      onRehydrateStorage: () => () => {
        // Se marca incluso si no había sesión guardada o hubo error al leer.
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export const selectIsAuthenticated = (state: AuthState) => state.idUsuario !== null;
