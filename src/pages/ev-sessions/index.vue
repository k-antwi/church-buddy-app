<template>
  <f7-page name="ev-sessions" class="cp-ev-sessions-page" @page:beforein="loadSessions">
    <f7-navbar large :sliding="false">
      <f7-nav-title sliding>Ev. Sessions</f7-nav-title>
      <f7-nav-title-large>Evangelism Sessions</f7-nav-title-large>
    </f7-navbar>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading-state">
      <div class="cp-spinner"></div>
      <p>Loading sessions…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-state">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadSessions">Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="sessions.length === 0" class="cp-empty-state">
      <i class="f7-icons">megaphone</i>
      <p>No sessions assigned to you yet.</p>
    </div>

    <!-- Sessions list -->
    <div v-else class="cp-sessions-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="cp-session-card"
        @click="openSession(session.id)"
      >
        <div class="cp-session-card__date-col">
          <span class="cp-session-card__day">{{ formatDay(session.date) }}</span>
          <span class="cp-session-card__month">{{ formatMonth(session.date) }}</span>
        </div>

        <div class="cp-session-card__body">
          <div class="cp-session-card__title">
            {{ session.campaign?.title ?? 'Standalone Session' }}
          </div>
          <div class="cp-session-card__meta">
            <span class="cp-session-card__location">
              <i class="f7-icons">map_pin_fill</i>
              {{ session.location }}
            </span>
            <span v-if="session.team_size" class="cp-session-card__team">
              <i class="f7-icons">person_2_fill</i>
              {{ session.team_size }}
            </span>
          </div>
          <div v-if="session.campaign" class="cp-session-card__tag" :class="`cp-tag--${session.campaign.status}`">
            {{ session.campaign.status }}
          </div>
        </div>

        <div class="cp-session-card__contacts">
          <span class="cp-session-card__count">{{ session.contacts_count }}</span>
          <span class="cp-session-card__count-label">contacts</span>
          <i class="f7-icons cp-session-card__chevron">chevron_right</i>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script lang="ts">
import { ref } from 'vue';
import { f7 } from 'framework7-vue';
import { fetchSessions, type EvSession } from '../../ts/api/evangelism-sessions';

export default {
  name: 'EvSessionsPage',

  setup() {
    const sessions = ref<EvSession[]>([]);
    const loading = ref(false);
    const error = ref('');

    const loadSessions = async () => {
      loading.value = true;
      error.value = '';
      try {
        sessions.value = await fetchSessions();
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load sessions.';
      } finally {
        loading.value = false;
      }
    };

    const openSession = (id: number) => {
      f7.views.get('#view-ev-sessions')?.router.navigate(`/ev-sessions/${id}/`);
    };

    const formatDay = (dateStr: string) => {
      return new Date(dateStr + 'T00:00:00').getDate().toString().padStart(2, '0');
    };

    const formatMonth = (dateStr: string) => {
      return new Date(dateStr + 'T00:00:00').toLocaleString('en', { month: 'short' }).toUpperCase();
    };

    return { sessions, loading, error, loadSessions, openSession, formatDay, formatMonth };
  },
};
</script>

<style lang="scss">
.cp-ev-sessions-page {
  --cp-bg: #0A0816;
  --cp-surface: #130F24;
  --cp-border: rgba(145, 132, 217, 0.15);
  --cp-purple: #9184D9;
  --cp-purple-l: #C0B0F5;
  --cp-text: #EAE5FC;
  --cp-muted: #6A6090;
  --cp-green: #10B981;
  --cp-amber: #F59E0B;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }

  .page-content { background: var(--cp-bg) !important; }

  /* ── States ── */
  .cp-loading-state,
  .cp-error-state,
  .cp-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 300px;
    color: var(--cp-muted);
    font-size: 14px;
    text-align: center;
    padding: 24px;

    i.f7-icons { font-size: 48px; opacity: 0.45; }
  }

  .cp-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(145, 132, 217, 0.2);
    border-top-color: var(--cp-purple);
    border-radius: 50%;
    animation: cpSpin 0.72s linear infinite;
  }

  @keyframes cpSpin { to { transform: rotate(360deg); } }

  .cp-retry-btn {
    background: rgba(145, 132, 217, 0.15);
    border: 1px solid rgba(145, 132, 217, 0.3);
    border-radius: 10px;
    color: var(--cp-purple-l);
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 22px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Sessions list ── */
  .cp-sessions-list {
    padding: 12px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Session card ── */
  .cp-session-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    padding: 14px 12px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.15s ease, transform 0.1s ease;

    &:active {
      transform: scale(0.985);
      border-color: rgba(145, 132, 217, 0.35);
    }

    &__date-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 44px;
      background: rgba(145, 132, 217, 0.1);
      border-radius: 10px;
      padding: 8px 6px;
      flex-shrink: 0;
    }

    &__day {
      font-size: 22px;
      font-weight: 800;
      color: var(--cp-purple-l);
      line-height: 1;
    }

    &__month {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--cp-muted);
      margin-top: 2px;
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
      margin-bottom: 5px;
    }

    &__meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    &__location,
    &__team {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--cp-muted);

      i.f7-icons { font-size: 11px; }
    }

    &__tag {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 999px;

      &.cp-tag--active { background: rgba(16, 185, 129, 0.15); color: var(--cp-green); }
      &.cp-tag--planning { background: rgba(145, 132, 217, 0.15); color: var(--cp-purple-l); }
      &.cp-tag--completed { background: rgba(106, 96, 144, 0.15); color: var(--cp-muted); }
      &.cp-tag--cancelled { background: rgba(224, 122, 138, 0.1); color: #E07A8A; }
    }

    &__contacts {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      flex-shrink: 0;
      min-width: 48px;
    }

    &__count {
      font-size: 20px;
      font-weight: 800;
      color: var(--cp-text);
      line-height: 1;
    }

    &__count-label {
      font-size: 10px;
      color: var(--cp-muted);
      white-space: nowrap;
    }

    &__chevron {
      font-size: 14px !important;
      color: var(--cp-muted);
      margin-top: 4px;
    }
  }
}
</style>
