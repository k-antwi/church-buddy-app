const DEFAULT_API_BASE = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '');

export interface AccessRequestPayload {
  workspace_slug: string;
  full_name: string;
  email: string;
  mobile_number: string;
}

export async function submitAccessRequest(payload: AccessRequestPayload): Promise<void> {
  let res: Response;

  try {
    res = await fetch(`${DEFAULT_API_BASE}/api/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to connect. Check your internet connection and try again.');
  }

  const body = await res.json() as { message?: string; error?: string; errors?: Record<string, string[]> };

  if (!res.ok) {
    if (body.errors) {
      const first = Object.values(body.errors)[0];
      throw new Error(Array.isArray(first) ? first[0] : String(first));
    }
    throw new Error(body.error ?? `Something went wrong (${res.status}). Please try again.`);
  }
}
