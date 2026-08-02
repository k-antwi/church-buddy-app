<template>
  <f7-page name="home" class="cp-home-page" no-navbar @page:beforein="loadData">
    <div class="cp-home-content">

      <!-- Header -->
      <div class="cp-home-header">
        <div class="cp-home-header__left">
          <h1 class="cp-home-greeting">{{ greeting }}, {{ firstName }} 👋</h1>
          <p class="cp-home-date">{{ formattedDate }}</p>
        </div>
        <button class="cp-notif-btn" aria-label="Notifications">
          <i class="f7-icons">bell_fill</i>
          <span v-if="notifCount > 0" class="cp-notif-badge">{{ notifCount }}</span>
        </button>
      </div>

      <!-- Stats grid -->
      <div class="cp-stats-grid">
        <div class="cp-stat-card">
          <span class="cp-stat-label">MEMBERS</span>
          <span class="cp-stat-value">1,248</span>
          <span class="cp-stat-change cp-stat-change--up">+12 this month</span>
        </div>
        <div class="cp-stat-card">
          <span class="cp-stat-label">GIVING MTD</span>
          <span class="cp-stat-value">$12.4k</span>
          <span class="cp-stat-change cp-stat-change--up">+8% vs last</span>
        </div>
        <div class="cp-stat-card">
          <span class="cp-stat-label">CHECK-INS</span>
          <span class="cp-stat-value">{{ checkins }}</span>
          <span class="cp-stat-change cp-stat-change--neutral">of 120 expected</span>
        </div>
        <div class="cp-stat-card">
          <span class="cp-stat-label">PRAYER</span>
          <span class="cp-stat-value">14</span>
          <span class="cp-stat-change cp-stat-change--warn">3 need follow-up</span>
        </div>
      </div>

      <!-- Upcoming events -->
      <div class="cp-upcoming">
        <div class="cp-upcoming__header">
          <span class="cp-upcoming__title">UPCOMING</span>
          <a class="cp-upcoming__see-all" @click.prevent="goToEvents">See all</a>
        </div>

        <div v-if="loadingEvents" class="cp-upcoming__loading">
          <div class="cp-spinner"></div>
        </div>

        <div v-else-if="upcomingEvents.length === 0 && !loadingEvents" class="cp-upcoming__empty">
          <i class="f7-icons">calendar_badge_minus</i>
          <p>No upcoming events</p>
        </div>

        <div v-else class="cp-upcoming__list">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="cp-upcoming-row"
            @click="goToEvent(event.id)"
          >
            <div class="cp-upcoming-row__accent" :style="{ background: accentColor(event) }"></div>
            <div class="cp-upcoming-row__body">
              <div class="cp-upcoming-row__title">{{ event.title }}</div>
              <div class="cp-upcoming-row__meta">{{ formatEventMeta(event) }}</div>
            </div>
            <i class="f7-icons cp-upcoming-row__chevron">chevron_right</i>
          </div>
        </div>
      </div>

    </div>
  </f7-page>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue';
import { f7 } from 'framework7-vue';
import { getStoredUser } from '../../ts/auth';
import { fetchEvents, type MobileEvent } from '../../ts/api/events';

const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ACCENT_COLORS: Record<number, string> = {
  0: '#9184D9',
  1: '#6366F1',
  2: '#10B981',
  3: '#F59E0B',
  4: '#14B8A6',
  5: '#6366F1',
  6: '#F97168',
};

export default {
  name: 'HomeDashboardPage',

  setup() {
    const upcomingEvents = ref<MobileEvent[]>([]);
    const loadingEvents = ref(false);
    const notifCount = ref(3);
    const checkins = ref(87);

    const now = new Date();

    const greeting = computed(() => {
      const h = now.getHours();
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    });

    const firstName = computed(() => {
      const user = getStoredUser();
      if (!user?.name) return 'there';
      return user.name.split(' ')[0];
    });

    const formattedDate = computed(() => {
      return `${DOW_LONG[now.getDay()]}, ${now.getDate()} ${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`;
    });

    const accentColor = (event: MobileEvent) => {
      const dow = new Date(event.start_datetime).getDay();
      return ACCENT_COLORS[dow] ?? '#9184D9';
    };

    const formatEventMeta = (event: MobileEvent) => {
      const d = new Date(event.start_datetime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDay = new Date(d);
      eventDay.setHours(0, 0, 0, 0);

      const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);

      let dayLabel: string;
      if (diffDays === 0) dayLabel = 'Today';
      else if (diffDays === 1) dayLabel = 'Tomorrow';
      else dayLabel = `${DOW_LONG[d.getDay()].slice(0, 3)} ${MONTHS_LONG[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

      const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dayLabel} · ${time}`;
    };

    const loadData = async () => {
      loadingEvents.value = true;
      try {
        const all = await fetchEvents();
        const nowIso = new Date().toISOString();
        upcomingEvents.value = all
          .filter(e => e.start_datetime >= nowIso && e.status !== 'cancelled')
          .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
          .slice(0, 4);
      } catch {
        upcomingEvents.value = [];
      } finally {
        loadingEvents.value = false;
      }
    };

    const goToEvents = () => {
      f7.tab.show('#view-events');
    };

    const goToEvent = (id: number) => {
      f7.tab.show('#view-events');
      f7.views.get('#view-events')?.router.navigate(`/events/${id}/`);
    };

    return {
      upcomingEvents,
      loadingEvents,
      notifCount,
      checkins,
      greeting,
      firstName,
      formattedDate,
      accentColor,
      formatEventMeta,
      loadData,
      goToEvents,
      goToEvent,
    };
  },
};
</script>

<style lang="scss">
.cp-home-page {
  --cp-bg:      #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-border:  rgba(145, 132, 217, 0.12);
  --cp-purple:  #9184D9;
  --cp-text:    #1A1730;
  --cp-muted:   #5E5A7E;
  --cp-green:   #10B981;
  --cp-amber:   #F59E0B;
  --cp-coral:   #F97168;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }
  .page-content { background: var(--cp-bg) !important; padding-bottom: 80px; }

  .cp-home-content {
    padding:
      max(env(safe-area-inset-top, 0px), 52px)
      16px
      16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── Header ── */
  .cp-home-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .cp-home-header__left {
    flex: 1;
    min-width: 0;
  }

  .cp-home-greeting {
    font-size: 22px;
    font-weight: 800;
    color: var(--cp-text);
    margin: 0 0 4px;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .cp-home-date {
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-muted);
    margin: 0;
  }

  /* ── Notification bell ── */
  .cp-notif-btn {
    position: relative;
    width: 44px;
    height: 44px;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.12s ease;

    i.f7-icons {
      font-size: 19px;
      color: var(--cp-text);
    }

    &:active { transform: scale(0.93); }
  }

  .cp-notif-badge {
    position: absolute;
    top: 8px;
    right: 9px;
    width: 8px;
    height: 8px;
    background: #EF4444;
    border-radius: 50%;
    border: 1.5px solid var(--cp-bg);
  }

  /* ── Stats grid ── */
  .cp-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .cp-stat-card {
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    padding: 16px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  .cp-stat-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--cp-muted);
    text-transform: uppercase;
  }

  .cp-stat-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--cp-text);
    letter-spacing: -0.5px;
    line-height: 1.1;
  }

  .cp-stat-change {
    font-size: 12px;
    font-weight: 600;

    &--up   { color: var(--cp-green); }
    &--warn { color: var(--cp-amber); }
    &--neutral { color: var(--cp-muted); }
  }

  /* ── Upcoming ── */
  .cp-upcoming {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cp-upcoming__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cp-upcoming__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    color: var(--cp-muted);
    text-transform: uppercase;
  }

  .cp-upcoming__see-all {
    font-size: 13px;
    font-weight: 600;
    color: var(--cp-purple);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    text-decoration: none;
  }

  .cp-upcoming__loading {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }

  .cp-upcoming__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 0;
    color: var(--cp-muted);
    font-size: 14px;

    i.f7-icons { font-size: 40px; opacity: 0.4; }
  }

  .cp-upcoming__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── Event row ── */
  .cp-upcoming-row {
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    padding: 14px 14px 14px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

    &:active { transform: scale(0.985); }

    &__accent {
      width: 3px;
      min-height: 40px;
      border-radius: 999px;
      flex-shrink: 0;
      align-self: stretch;
    }

    &__body {
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 15px;
      font-weight: 700;
      color: var(--cp-text);
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      font-size: 12px;
      color: var(--cp-muted);
      font-weight: 500;
    }

    &__chevron {
      font-size: 14px;
      color: var(--cp-border);
      flex-shrink: 0;
    }
  }

  /* ── Spinner ── */
  .cp-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(145, 132, 217, 0.15);
    border-top-color: var(--cp-purple);
    border-radius: 50%;
    animation: cpHomeSpin 0.72s linear infinite;
  }

  @keyframes cpHomeSpin { to { transform: rotate(360deg); } }
}
</style>
