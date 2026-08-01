import { apiFetch } from '../auth';

export interface MobileEvent {
  id: number;
  title: string;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  status: string;
  service_type: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
}

export async function fetchEvents(): Promise<MobileEvent[]> {
  const res = await apiFetch('/api/mobile/events');
  if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
  const json = await res.json() as { data: MobileEvent[] };
  return json.data;
}
