import { ref, computed } from 'vue';
import { f7 } from 'framework7-vue';
import { isAuthenticated } from '../../ts/auth';
import { fetchEvents, type MobileEvent } from '../../ts/api/events';

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const ACCENT_COLORS: Record<number, string> = {
  0: '#9184D9',
  1: '#6366F1',
  2: '#10B981',
  3: '#F59E0B',
  4: '#14B8A6',
  5: '#6366F1',
  6: '#9184D9',
};

function dateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function useChurchPanelEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = ref<MobileEvent[]>([]);
  const loading = ref(false);
  const error = ref('');
  const weekStart = ref(startOfWeek(today));
  const selectedDate = ref(new Date(today));

  const weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.value);
      d.setDate(d.getDate() + i);
      return { dow: DOW_LABELS[d.getDay()], date: d.getDate(), full: d };
    }),
  );

  const monthLabel = computed(() => {
    const mid = weekDays.value[3].full;
    return mid.toLocaleString('en', { month: 'long', year: 'numeric' });
  });

  const weekEndKey = computed(() => {
    const end = new Date(weekStart.value);
    end.setDate(end.getDate() + 7);
    return dateKey(end);
  });

  const visibleEvents = computed(() =>
    events.value.filter(e => {
      const d = e.start_datetime.slice(0, 10);
      return d >= dateKey(weekStart.value) && d < weekEndKey.value;
    }),
  );

  const weekRangeParams = () => {
    const from = dateKey(weekStart.value);
    const end = new Date(weekStart.value);
    end.setDate(end.getDate() + 6);
    const to = dateKey(end);
    return { from, to };
  };

  const loadEvents = async () => {
    if (loading.value || !isAuthenticated()) return;
    loading.value = true;
    error.value = '';
    try {
      const { from, to } = weekRangeParams();
      events.value = await fetchEvents(from, to);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load events.';
    } finally {
      loading.value = false;
    }
  };

  const shiftWeek = (direction: number) => {
    const next = new Date(weekStart.value);
    next.setDate(next.getDate() + direction * 7);
    weekStart.value = next;
    loadEvents();
  };

  const selectDay = (day: { full: Date }) => {
    selectedDate.value = new Date(day.full);
  };

  const isSelected = (day: { full: Date }) => sameDay(day.full, selectedDate.value);
  const isToday = (day: { full: Date }) => sameDay(day.full, today);

  const formatDow = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return DOW_NAMES[new Date(y, m - 1, d).getDay()];
  };

  const formatDate = (iso: string) => String(parseInt(iso.slice(8, 10), 10));

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const accentColor = (event: MobileEvent) => {
    const dow = new Date(event.start_datetime).getDay();
    return ACCENT_COLORS[dow] ?? '#9184D9';
  };

  const openEvent = (id: number) => {
    f7.views.get('#view-events')?.router.navigate(`/events/${id}/`);
  };

  const onTabShow = () => {
    const pageName = f7.views.current.name;
    if (pageName === 'events') loadEvents();
  };

  return {
    events,
    loading,
    error,
    weekDays,
    monthLabel,
    visibleEvents,
    selectedDate,
    loadEvents,
    shiftWeek,
    selectDay,
    isSelected,
    isToday,
    formatDow,
    formatDate,
    formatTime,
    accentColor,
    openEvent,
    onTabShow,
  };
}
