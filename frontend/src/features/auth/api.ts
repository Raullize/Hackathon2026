import type { AuthResponse, PublicUser } from '@careflow/contracts';
import { apiFetch } from '@/lib/api-client';

export function getCurrentUser(): Promise<PublicUser> {
  return apiFetch<PublicUser>('/auth/me');
}

export function loginRequest(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutRequest(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' });
}
