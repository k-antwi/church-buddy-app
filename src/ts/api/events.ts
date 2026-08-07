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

export interface MobileAttendance {
  id: number;
  attendee_name: string | null;
  attendee_phone: string | null;
  attendance_status: string;
  check_in_time: string | null;
  check_in_method: string | null;
  first_time_visitor: boolean;
  is_child: boolean;
}

export interface MobileEventDetail extends MobileEvent {
  description: string | null;
  location_address: string | null;
  expected_attendees: number | null;
  coordinator: { id: number; name: string } | null;
  attendances: MobileAttendance[];
}

export async function fetchEvents(from?: string, to?: string): Promise<MobileEvent[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`/api/mobile/events${query}`);
  if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
  const json = await res.json() as { data: MobileEvent[] };
  return json.data;
}

export async function fetchEventDetail(id: number): Promise<MobileEventDetail> {
  const res = await apiFetch(`/api/mobile/events/${id}`);
  if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
  const json = await res.json() as { data: MobileEventDetail };
  return json.data;
}

export async function generateCheckinList(eventId: number): Promise<MobileAttendance[]> {
  const res = await apiFetch(`/api/mobile/events/${eventId}/checkin-list`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to generate check-in list (${res.status})`);
  const json = await res.json() as { data: MobileAttendance[] };
  return json.data;
}

export async function updateAttendanceStatus(
  eventId: number,
  attendanceId: number,
  status: string,
): Promise<MobileAttendance> {
  const res = await apiFetch(`/api/mobile/events/${eventId}/attendances/${attendanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ attendance_status: status }),
  });
  if (!res.ok) throw new Error(`Failed to update attendance (${res.status})`);
  const json = await res.json() as { data: MobileAttendance };
  return json.data;
}

export async function updateAttendanceIsChild(
  eventId: number,
  attendanceId: number,
  isChild: boolean,
): Promise<MobileAttendance> {
  const res = await apiFetch(`/api/mobile/events/${eventId}/attendances/${attendanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_child: isChild }),
  });
  if (!res.ok) throw new Error(`Failed to update attendance (${res.status})`);
  const json = await res.json() as { data: MobileAttendance };
  return json.data;
}

export async function updateAttendanceFirstTimeVisitor(
  eventId: number,
  attendanceId: number,
  firstTimeVisitor: boolean,
): Promise<MobileAttendance> {
  const res = await apiFetch(`/api/mobile/events/${eventId}/attendances/${attendanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ first_time_visitor: firstTimeVisitor }),
  });
  if (!res.ok) throw new Error(`Failed to update attendance (${res.status})`);
  const json = await res.json() as { data: MobileAttendance };
  return json.data;
}
