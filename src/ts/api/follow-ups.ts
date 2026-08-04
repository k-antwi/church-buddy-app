import { apiFetch } from '../auth';

export interface LogCallPayload {
  outcome?: string;
  notes?: string;
}

export async function logCall(contactId: number, payload: LogCallPayload): Promise<void> {
  const res = await apiFetch(`/api/mobile/ev-contacts/${contactId}/follow-ups`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Failed to log call (${res.status})`);
  }
}
