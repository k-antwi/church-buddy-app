import { apiFetch } from '../auth';

export interface EvSession {
  id: number;
  date: string;
  location: string;
  notes: string | null;
  team_size: number;
  is_standalone: boolean;
  campaign: { id: number; title: string; status: string } | null;
  leader: { id: number; name: string } | null;
  contacts_count: number;
}

export interface EvContact {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  outcome: string | null;
  outcome_label: string | null;
  notes: string | null;
  is_promoted: boolean;
  promoted_at?: string | null;
}

export interface EvSessionDetail extends Omit<EvSession, 'contacts_count'> {
  contacts: EvContact[];
}

export interface CaptureContactPayload {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  outcome: string;
  notes?: string;
}

export interface Campaign {
  id: number;
  title: string;
  status: string;
}

export interface CreateSessionPayload {
  campaign_id?: number | null;
  date: string;
  location: string;
  team_size?: number;
  notes?: string;
}

export const OUTCOME_OPTIONS = [
  { value: 'interested', label: 'Interested', color: '#3B82F6' },
  { value: 'prayed', label: 'Prayed', color: '#8B5CF6' },
  { value: 'declined', label: 'Declined', color: '#6B7280' },
  { value: 'follow_up_requested', label: 'Follow-up Requested', color: '#F59E0B' },
  { value: 'saved', label: 'Saved', color: '#10B981' },
] as const;

export async function fetchSessions(): Promise<EvSession[]> {
  const res = await apiFetch('/api/mobile/ev-sessions');
  if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
  const json = await res.json() as { data: EvSession[] };
  return json.data;
}

export async function fetchSession(id: number): Promise<EvSessionDetail> {
  const res = await apiFetch(`/api/mobile/ev-sessions/${id}`);
  if (!res.ok) throw new Error(`Failed to load session (${res.status})`);
  const json = await res.json() as { data: EvSessionDetail };
  return json.data;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await apiFetch('/api/mobile/ev-campaigns');
  if (!res.ok) throw new Error(`Failed to load campaigns (${res.status})`);
  const json = await res.json() as { data: Campaign[] };
  return json.data;
}

export async function createSession(payload: CreateSessionPayload): Promise<EvSession> {
  const res = await apiFetch('/api/mobile/ev-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
    throw new Error(body.message ?? `Failed to create session (${res.status})`);
  }
  const json = await res.json() as { data: EvSession };
  return json.data;
}

export async function captureContact(
  sessionId: number,
  payload: CaptureContactPayload,
): Promise<EvContact> {
  const res = await apiFetch(`/api/mobile/ev-sessions/${sessionId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
    throw new Error(body.message ?? `Failed to save contact (${res.status})`);
  }
  const json = await res.json() as { data: EvContact };
  return json.data;
}
