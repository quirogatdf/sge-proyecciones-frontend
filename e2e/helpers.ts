import { APIRequestContext } from '@playwright/test';

/** API base del backend local (Laravel + Sanctum). */
export const API_URL = 'http://localhost:8000/api';

export const ADMIN = {
  username: 'admin',
  password: 'admin123',
} as const;

export const GUEST = {
  username: 'guest',
  password: 'guest123',
} as const;

/**
 * Login por API (Sanctum). Devuelve el token.
 * El frontend guarda el token en localStorage bajo la key `auth_token`.
 */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/login`, { data: ADMIN });
  if (!res.ok()) {
    throw new Error(`Login API falló (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as { token: string };
  return body.token;
}

export function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/** Idempotente por worker: evita loguear por cada test. */
let cachedTokenValue: string | undefined;
export async function cachedToken(request: APIRequestContext): Promise<string> {
  if (cachedTokenValue) return cachedTokenValue;
  cachedTokenValue = await apiLogin(request);
  return cachedTokenValue;
}