import { api } from '../client';
import type { LoginResponse, UsuarioCredenciales } from '../../types/api';

export const authService = {
  login: async (credenciales: UsuarioCredenciales): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credenciales);
    return data;
  },
};
