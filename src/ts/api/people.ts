import { apiFetch } from '../auth';

export interface MobilePerson {
  id: number;
  first_name: string;
  last_name: string;
  type: string | null;
  branch: { id: number; name: string } | null;
}

export async function fetchPeople(): Promise<MobilePerson[]> {
  const res = await apiFetch('/api/mobile/people');
  if (!res.ok) throw new Error(`Failed to load people (${res.status})`);
  const json = await res.json() as { data: MobilePerson[] };
  return json.data;
}
