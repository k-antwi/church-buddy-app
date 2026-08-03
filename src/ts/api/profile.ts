import { apiFetch, type AuthUser } from '../auth';

export interface ProfileUpdatePayload {
  name: string;
  email: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export async function fetchProfile(): Promise<AuthUser> {
  const res = await apiFetch('/api/mobile/me');
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  return (await res.json() as { data: AuthUser }).data;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<AuthUser> {
  const res = await apiFetch('/api/mobile/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({})) as { data?: AuthUser; error?: string; message?: string; errors?: Record<string, string[]> };

  if (!res.ok) {
    if (body.errors) {
      const first = Object.values(body.errors)[0];
      throw new Error(Array.isArray(first) ? first[0] : String(first));
    }
    throw new Error(body.error ?? body.message ?? `Failed to update profile (${res.status})`);
  }

  return body.data!;
}
