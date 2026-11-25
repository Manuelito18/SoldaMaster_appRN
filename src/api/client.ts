import axios, { AxiosError, AxiosInstance } from 'axios';

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!RAW_BASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está definida. Copia .env.example a .env y reinicia Expo.',
  );
}

/** Sin token: el backend tiene todas las rutas en permitAll. */
export const api: AxiosInstance = axios.create({
  baseURL: RAW_BASE_URL.replace(/\/$/, ''),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * El backend no tiene @RestControllerAdvice: casi cualquier fallo llega como 500
 * con un cuerpo genérico de Spring y mensajes no fiables. No se muestra ni se
 * loguea el cuerpo (puede contener el hash BCrypt de UsuarioResponse.password).
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const path = error.config?.url;
    const status = error.response?.status ?? 0;

    if (status >= 500) {
      return Promise.reject(
        new ApiError(
          'El servidor no pudo completar la operación. Inténtalo de nuevo.',
          status,
          path,
        ),
      );
    }

    if (status > 0) {
      return Promise.reject(
        new ApiError('Revisa los datos enviados e inténtalo de nuevo.', status, path),
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError('Tiempo de espera agotado. Comprueba la conexión con el servidor.', 0, path),
      );
    }

    return Promise.reject(
      new ApiError(
        'No se pudo conectar con el servidor. Verifica la URL y la red.',
        0,
        path,
      ),
    );
  },
);
