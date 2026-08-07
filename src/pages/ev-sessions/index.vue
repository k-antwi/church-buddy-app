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

    <!-- FAB — only users with create_campaigns permission may start new sessions -->
    <f7-fab v-if="canCreateCampaigns" position="right-bottom" class="cp-fab" @click="openCreatePopup">
      <f7-icon ios="f7:plus" md="material:add"></f7-icon>
    </f7-fab>

    <!-- Create session popup -->
    <f7-popup
      class="cp-create-session-popup"
      :opened="createPopupOpen"
      @popup:closed="createPopupOpen = false"
    >
      <f7-page>
        <f7-navbar title="New Session">
          <f7-nav-right>
            <f7-link popup-close>Cancel</f7-link>
          </f7-nav-right>
        </f7-navbar>

        <f7-page-content>
          <f7-list strong inset>
            <f7-list-input
              label="Date"
              type="date"
              :value="form.date"
              @change="form.date = ($event.target as HTMLInputElement).value"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">calendar</i>
              </template>
            </f7-list-input>

            <f7-list-input
              label="Location"
              type="text"
              placeholder="Where is the team going?"
              :value="form.location"
              @input="form.location = ($event.target as HTMLInputElement).value"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">map_pin_fill</i>
              </template>
            </f7-list-input>

            <f7-list-input
              label="Campaign (optional)"
              type="select"
              :value="form.campaign_id ?? ''"
              @change="form.campaign_id = Number(($event.target as HTMLSelectElement).value) || null"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">megaphone_fill</i>
              </template>
              <option value="">Standalone – no campaign</option>
              <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.title }}</option>
            </f7-list-input>

            <f7-list-input
              label="Team Size"
              type="number"
              inputmode="numeric"
              min="1"
              :value="form.team_size"
              @input="form.team_size = Math.max(1, Number(($event.target as HTMLInputElement).value))"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">person_2_fill</i>
              </template>
            </f7-list-input>

            <f7-list-input
              label="Notes"
              type="textarea"
              placeholder="Any additional notes…"
              resizable
              :value="form.notes"
              @input="form.notes = ($event.target as HTMLTextAreaElement).value"
            />
          </f7-list>

          <f7-block v-if="submitError">
            <div class="cp-error" role="alert">
              <i class="f7-icons">exclamationmark_circle_fill</i>
              {{ submitError }}
            </div>
          </f7-block>

          <f7-block>
            <f7-button
              large
              fill
              round
              :disabled="submitting"
              class="cp-submit-btn"
              @click="submitCreate"
            >
              <span v-if="!submitting">Create Session</span>
              <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
            </f7-button>
          </f7-block>
        </f7-page-content>
      </f7-page>
    </f7-popup>

  </f7-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { f7 } from 'framework7-vue';
import { useEvSessions } from './useEvSessions';
import { can } from '../../ts/rbac';

const canCreateCampaigns = computed(() => can('create_campaigns'));

defineOptions({ name: 'EvSessionsPage' });

    const { 
      sessions,
      loading,
      error,
      loadSessions,
      submitCreate,
      createPopupOpen,
      submitting,
      submitError,
      form,
      campaigns,
      openCreatePopup,
      openSession,
      formatDay,
      formatMonth,
      onTabShow,
    } = useEvSessions();

    f7.on('tabShow', onTabShow);

    onMounted(loadSessions);
</script>

<style lang="scss">
.cp-ev-sessions-page {
  --cp-bg: #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-border: rgba(145, 132, 217, 0.12);
  --cp-purple: #9184D9;
  --cp-purple-l: #6B5ABE;
  --cp-text: #1A1730;
  --cp-muted: #5E5A7E;
  --cp-green: #047857;
  --cp-amber: #B45309;

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

  /* ── Sessions list ── */
  .cp-sessions-list {
    padding: 12px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── FAB ── */
  .cp-fab {
    --f7-fab-bg-color: var(--cp-purple);
    --f7-fab-box-shadow: 0 6px 22px rgba(145, 132, 217, 0.5);
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

      &.cp-tag--active { background: rgba(4, 120, 87, 0.08); color: var(--cp-green); }
      &.cp-tag--planning { background: rgba(145, 132, 217, 0.10); color: var(--cp-purple); }
      &.cp-tag--completed { background: rgba(94, 90, 126, 0.10); color: var(--cp-muted); }
      &.cp-tag--cancelled { background: rgba(224, 122, 138, 0.10); color: #BE3F55; }
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
/* ── Create session popup ── */
.cp-create-session-popup {
  --cp-purple: #9184D9;
  --cp-purple-l: #6B5ABE;
  --f7-theme-color: var(--cp-purple);

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Error callout ── */
.cp-error {
  display: flex !important;
  align-items: center;
  gap: 7px;
  background: rgba(224, 122, 138, 0.1);
  border: 1px solid rgba(224, 122, 138, 0.25);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #E07A8A;

  i.f7-icons { font-size: 15px; flex-shrink: 0; }
}

/* ── Submit button ── */
.cp-submit-btn.button {
  background: linear-gradient(130deg, #A999EE 0%, #9184D9 55%, #7D6FC6 100%);
  box-shadow: 0 5px 26px rgba(145, 132, 217, 0.38);
}

.cp-submit-spinner {
  font-size: 22px !important;
  animation: cpSessionSpin 0.72s linear infinite;
}

@keyframes cpSessionSpin { to { transform: rotate(360deg); } }
</style>
