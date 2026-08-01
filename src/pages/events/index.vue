<template>
  <f7-page name="events" class="cp-events-page" @page:beforein="loadEvents">
    <f7-navbar :sliding="false">
      <f7-nav-title sliding>Events</f7-nav-title>
      <f7-nav-right>
        <div class="cp-add-btn">
          <i class="f7-icons">plus</i>
        </div>
      </f7-nav-right>
    </f7-navbar>

    <!-- Week strip calendar -->
    <div class="cp-calendar-strip">
      <div class="cp-calendar-strip__header">
        <span class="cp-calendar-strip__month">{{ monthLabel }}</span>
        <div class="cp-calendar-strip__nav">
          <button class="cp-calendar-strip__arrow" @click="shiftWeek(-1)">
            <i class="f7-icons">chevron_left</i>
          </button>
          <button class="cp-calendar-strip__arrow" @click="shiftWeek(1)">
            <i class="f7-icons">chevron_right</i>
          </button>
        </div>
      </div>

      <div class="cp-calendar-strip__days">
        <div
          v-for="(day, i) in weekDays"
          :key="i"
          class="cp-calendar-strip__day"
          :class="{ 'is-selected': isSelected(day), 'is-today': isToday(day) }"
          @click="selectDay(day)"
        >
          <span class="cp-calendar-strip__dow">{{ day.dow }}</span>
          <span class="cp-calendar-strip__date">{{ day.date }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading-state">
      <div class="cp-spinner"></div>
      <p>Loading events…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-state">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadEvents">Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="visibleEvents.length === 0" class="cp-empty-state">
      <i class="f7-icons">calendar_badge_minus</i>
      <p>No events this week.</p>
    </div>

    <!-- Events list -->
    <div v-else class="cp-events-list">
      <div
        v-for="event in visibleEvents"
        :key="event.id"
        class="cp-event-row"
        @click="openEvent(event.id)"
      >
        <div class="cp-event-row__accent" :style="{ background: accentColor(event) }"></div>

        <div class="cp-event-row__day-col">
          <span class="cp-event-row__dow">{{ formatDow(event.start_datetime) }}</span>
          <span class="cp-event-row__date">{{ formatDate(event.start_datetime) }}</span>
        </div>

        <div class="cp-event-row__body">
          <div class="cp-event-row__title">{{ event.title }}</div>
          <div class="cp-event-row__meta">
            {{ formatTime(event.start_datetime) }}
            <template v-if="event.location"> · {{ event.location }}</template>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
import { f7 } from 'framework7-vue';
import { fetchEvents, type MobileEvent } from '../../ts/api/events';

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const ACCENT_COLORS: Record<number, string> = {
  0: '#9184D9', // Sunday   → purple
  1: '#6366F1', // Monday   → indigo
  2: '#10B981', // Tuesday  → green
  3: '#F59E0B', // Wednesday → amber
  4: '#14B8A6', // Thursday  → teal
  5: '#6366F1', // Friday   → indigo
  6: '#9184D9', // Saturday → purple
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

export default {
  name: 'EventsPage',

  setup() {
    const events = ref<MobileEvent[]>([]);
    const loading = ref(false);
    const error = ref('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = ref(startOfWeek(today));
    const selectedDate = ref(new Date(today));

    const weekDays = computed(() => {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart.value);
        d.setDate(d.getDate() + i);
        return { dow: DOW_LABELS[d.getDay()], date: d.getDate(), full: d };
      });
    });

    const monthLabel = computed(() => {
      // Label based on the majority month in the week (Wed = index 3)
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

    const isSelected = (day: { full: Date }) => sameDay(day.full, selectedDate.value);
    const isToday = (day: { full: Date }) => sameDay(day.full, today);

    const selectDay = (day: { full: Date }) => {
      selectedDate.value = new Date(day.full);
    };

    const shiftWeek = (direction: number) => {
      const next = new Date(weekStart.value);
      next.setDate(next.getDate() + direction * 7);
      weekStart.value = next;
    };

    const loadEvents = async () => {
      if (loading.value) return;
      loading.value = true;
      error.value = '';
      try {
        events.value = await fetchEvents();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load events.';
      } finally {
        loading.value = false;
      }
    };

    const formatDow = (iso: string) => {
      const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
      return DOW_NAMES[new Date(y, m - 1, d).getDay()];
    };

    const formatDate = (iso: string) => String(parseInt(iso.slice(8, 10), 10));

    const formatTime = (iso: string) => {
      return new Date(iso).toLocaleTimeString('en', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const accentColor = (event: MobileEvent) => {
      const dow = new Date(event.start_datetime).getDay();
      return ACCENT_COLORS[dow] ?? '#9184D9';
    };

    const openEvent = (id: number) => {
      f7.views.get('#view-events')?.router.navigate(`/events/${id}/`);
    };

    return {
      loading,
      error,
      weekDays,
      monthLabel,
      visibleEvents,
      isSelected,
      isToday,
      selectDay,
      shiftWeek,
      loadEvents,
      formatDow,
      formatDate,
      formatTime,
      accentColor,
      openEvent,
    };
  },
};
</script>

<style lang="scss">
.cp-events-page {
  --cp-bg: #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-border: rgba(145, 132, 217, 0.12);
  --cp-purple: #9184D9;
  --cp-text: #1A1730;
  --cp-muted: #5E5A7E;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }
  .page-content { background: var(--cp-bg) !important; }

  /* ── Navbar add button ── */
  .cp-add-btn {
    width: 36px;
    height: 36px;
    background: rgba(145, 132, 217, 0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    cursor: pointer;

    i.f7-icons {
      font-size: 18px;
      color: var(--cp-purple);
    }
  }

  /* ── Calendar strip ── */
  .cp-calendar-strip {
    background: var(--cp-surface);
    border-radius: 16px;
    margin: 8px 16px 0;
    padding: 14px 16px 12px;
    border: 1px solid var(--cp-border);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    &__month {
      font-size: 15px;
      font-weight: 700;
      color: var(--cp-text);
    }

    &__nav {
      display: flex;
      gap: 4px;
    }

    &__arrow {
      background: rgba(145, 132, 217, 0.08);
      border: none;
      border-radius: 8px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      i.f7-icons {
        font-size: 13px;
        color: var(--cp-muted);
      }

      &:active { background: rgba(145, 132, 217, 0.18); }
    }

    &__days {
      display: flex;
      justify-content: space-between;
    }

    &__day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-width: 36px;
      padding: 6px 4px;
      border-radius: 12px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.12s ease;

      &.is-selected {
        background: var(--cp-purple);

        .cp-calendar-strip__dow,
        .cp-calendar-strip__date { color: #fff; }
      }

      &:not(.is-selected):active { background: rgba(145, 132, 217, 0.1); }
    }

    &__dow {
      font-size: 11px;
      font-weight: 600;
      color: var(--cp-muted);
      letter-spacing: 0.03em;
    }

    &__date {
      font-size: 15px;
      font-weight: 700;
      color: var(--cp-text);
    }
  }

  /* ── States ── */
  .cp-loading-state,
  .cp-error-state,
  .cp-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 260px;
    color: var(--cp-muted);
    font-size: 14px;
    text-align: center;
    padding: 24px;

    i.f7-icons { font-size: 48px; opacity: 0.45; }
  }

  .cp-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(145, 132, 217, 0.15);
    border-top-color: var(--cp-purple);
    border-radius: 50%;
    animation: cpSpin 0.72s linear infinite;
  }

  @keyframes cpSpin { to { transform: rotate(360deg); } }

  .cp-retry-btn {
    background: rgba(145, 132, 217, 0.08);
    border: 1px solid rgba(145, 132, 217, 0.22);
    border-radius: 10px;
    color: var(--cp-purple);
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 22px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Events list ── */
  .cp-events-list {
    padding: 16px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* ── Event row ── */
  .cp-event-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--cp-surface);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s ease;

    &:active { transform: scale(0.985); }

    &__accent {
      width: 3px;
      height: 44px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    &__day-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 36px;
      flex-shrink: 0;
    }

    &__dow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--cp-muted);
    }

    &__date {
      font-size: 22px;
      font-weight: 800;
      color: var(--cp-text);
      line-height: 1.1;
    }

    &__body {
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 15px;
      font-weight: 700;
      color: var(--cp-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 3px;
    }

    &__meta {
      font-size: 12px;
      color: var(--cp-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
