import { apiFetch } from '../auth';

export interface MobilePerson {
  id: number;
  first_name: string;
  last_name: string;
  type: string | null;
  branch: { id: number; name: string } | null;
}

export interface MobileContact {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string | null;
  email: string | null;
  stage: string | null;
  contact_source: string | null;
  branch: { id: number; name: string } | null;
}

export async function fetchPeople(): Promise<MobilePerson[]> {
  const res = await apiFetch('/api/mobile/people');
  if (!res.ok) throw new Error(`Failed to load people (${res.status})`);
  const json = await res.json() as { data: MobilePerson[] };
  return json.data;
}

export async function fetchContacts(): Promise<MobileContact[]> {
  const res = await apiFetch('/api/mobile/contacts');
  if (!res.ok) throw new Error(`Failed to load contacts (${res.status})`);
  const json = await res.json() as { data: MobileContact[] };
  return json.data;
}
