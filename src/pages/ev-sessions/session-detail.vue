<template>
  <f7-page name="ev-session-detail" class="cp-session-detail-page" @page:beforein="loadDetail">

    <f7-navbar :sliding="false" back-link="Back">
      <f7-nav-title sliding>{{ session?.campaign?.title ?? 'Session' }}</f7-nav-title>
    </f7-navbar>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading-state">
      <div class="cp-spinner"></div>
      <p>Loading session…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-state">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadDetail">Try again</button>
    </div>

    <template v-else-if="session">
      <!-- Session header -->
      <div class="cp-session-header">
        <div class="cp-session-header__row">
          <div class="cp-session-header__date-badge">
            <span class="cp-session-header__day">{{ formatDay(session.date) }}</span>
            <span class="cp-session-header__month">{{ formatMonth(session.date) }}</span>
          </div>
          <div class="cp-session-header__info">
            <div class="cp-session-header__location">
              <i class="f7-icons">map_pin_fill</i>
              {{ session.location }}
            </div>
            <div v-if="session.leader" class="cp-session-header__leader">
              <i class="f7-icons">person_fill</i>
              Led by {{ session.leader.name }}
            </div>
            <div v-if="session.team_size" class="cp-session-header__team">
              <i class="f7-icons">person_2_fill</i>
              Team of {{ session.team_size }}
            </div>
          </div>
        </div>
        <div v-if="session.notes" class="cp-session-header__notes">
          {{ session.notes }}
        </div>
      </div>

      <!-- Contact count strip -->
      <div class="cp-contact-strip">
        <span class="cp-contact-strip__count">{{ session.contacts.length }}</span>
        <span class="cp-contact-strip__label">
          {{ session.contacts.length === 1 ? 'contact captured' : 'contacts captured' }}
        </span>
      </div>

      <!-- Contacts list -->
      <div v-if="session.contacts.length === 0" class="cp-empty-contacts">
        <i class="f7-icons">person_badge_plus</i>
        <p>No contacts yet. Tap <strong>+</strong> to capture your first contact.</p>
      </div>

      <div v-else class="cp-contacts-list">
        <div
          v-for="contact in session.contacts"
          :key="contact.id"
          class="cp-swipeable-wrapper"
          @touchstart="onSwipeTouchStart($event, contact.id, !!contact.phone)"
          @touchmove="onSwipeTouchMove($event, contact.id, !!contact.phone)"
          @touchend="onSwipeTouchEnd($event, contact.id, !!contact.phone)"
        >
          <!-- Call action (revealed on left-swipe) -->
          <button
            v-if="contact.phone"
            class="cp-swipe-call-btn"
            @click.stop="callContact(contact)"
          >
            <i class="f7-icons">phone_fill</i>
            <span>Call</span>
          </button>

          <div
            class="cp-contact-card"
            :style="swipeCardStyle(contact.id)"
            @click="closeSwipe(contact.id)"
          >
            <div class="cp-contact-card__avatar">
              {{ initials(contact) }}
            </div>
            <div class="cp-contact-card__body">
              <div class="cp-contact-card__name">{{ contact.full_name }}</div>
              <div v-if="contact.phone || contact.email" class="cp-contact-card__reach">
                <span v-if="contact.phone">
                  <i class="f7-icons">phone_fill</i> {{ contact.phone }}
                </span>
                <span v-if="contact.email">
                  <i class="f7-icons">envelope_fill</i> {{ contact.email }}
                </span>
              </div>
              <div v-if="contact.notes" class="cp-contact-card__notes">{{ contact.notes }}</div>
            </div>
            <div class="cp-contact-card__outcome">
              <span class="cp-outcome-badge" :class="`cp-outcome--${contact.outcome}`">
                {{ contact.outcome_label }}
              </span>
              <span v-if="contact.is_promoted" class="cp-promoted-badge" title="Promoted to Contact">
                <i class="f7-icons">checkmark_seal_fill</i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- FAB -->
    <f7-fab position="right-bottom" @click="openCapturePopup" class="cp-fab">
      <f7-icon ios="f7:plus" md="material:add"></f7-icon>
    </f7-fab>

    <!-- ── Capture contact popup ── -->
    <f7-popup
      class="cp-capture-popup"
      :opened="popupOpen"
      @popup:closed="popupOpen = false"
    >
      <f7-page>
        <f7-navbar title="Capture Contact">
          <f7-nav-right>
            <f7-link popup-close>Cancel</f7-link>
          </f7-nav-right>
        </f7-navbar>

        <f7-page-content>
          <f7-list strong inset>
            <f7-list-input
              label="First Name"
              type="text"
              placeholder="John"
              autocomplete="given-name"
              required
              :error-message="validationErrors.first_name"
              :error-message-force="fieldError('first_name')"
              :value="form.first_name"
              @input="form.first_name = ($event.target as HTMLInputElement).value"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">person_fill</i>
              </template>
            </f7-list-input>

            <f7-list-input
              label="Last Name"
              type="text"
              placeholder="Doe"
              autocomplete="family-name"
              :value="form.last_name"
              @input="form.last_name = ($event.target as HTMLInputElement).value"
            />

            <f7-list-input
              label="Phone"
              type="tel"
              inputmode="tel"
              placeholder="+1 555 000 0000"
              autocomplete="tel"
              :value="form.phone"
              @input="form.phone = ($event.target as HTMLInputElement).value"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">phone_fill</i>
              </template>
            </f7-list-input>

            <f7-list-input
              label="Email"
              type="email"
              inputmode="email"
              placeholder="john@example.com"
              autocomplete="email"
              :value="form.email"
              @input="form.email = ($event.target as HTMLInputElement).value"
            >
              <template #media>
                <i class="f7-icons" style="font-size:18px">envelope_fill</i>
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

          <f7-block-title>
            Outcome
            <span class="cp-required-hint">required</span>
          </f7-block-title>
          <div class="cp-outcome-grid" :class="{ 'cp-outcome-grid--error': fieldError('outcome') }">
            <f7-button
              v-for="opt in OUTCOME_OPTIONS"
              :key="opt.value"
              small
              outline
              :class="{ 'cp-outcome-option--selected': form.outcome === opt.value }"
              :style="form.outcome === opt.value ? `--oo-color: ${opt.color}` : ''"
              @click="form.outcome = opt.value"
            >
              {{ opt.label }}
            </f7-button>
          </div>

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
              @click="submitCapture"
            >
              <span v-if="!submitting">Save Contact</span>
              <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
            </f7-button>
          </f7-block>
        </f7-page-content>
      </f7-page>
    </f7-popup>

    <!-- ── Log call popup ── -->
    <f7-popup
      class="cp-log-call-popup"
      :opened="logCallPopupOpen"
      @popup:closed="logCallPopupOpen = false"
    >
      <f7-page class="cp-log-call-page">
        <f7-navbar title="Log Call">
          <f7-nav-right>
            <f7-link @click="dismissLogCall">Skip</f7-link>
          </f7-nav-right>
        </f7-navbar>

        <f7-page-content>
          <div class="cp-log-call-contact">
            <div class="cp-log-call-contact__avatar">
              {{ pendingCallContact ? (pendingCallContact.first_name[0] ?? '') + (pendingCallContact.last_name?.[0] ?? '') : '' }}
            </div>
            <div class="cp-log-call-contact__info">
              <span class="cp-log-call-contact__name">{{ pendingCallContact?.full_name }}</span>
              <span class="cp-log-call-contact__phone">{{ pendingCallContact?.phone }}</span>
            </div>
          </div>

          <f7-block-title>How did the call go?</f7-block-title>
          <div class="cp-log-call-outcomes">
            <button
              v-for="opt in LOG_CALL_OUTCOMES"
              :key="opt.value"
              :class="['cp-log-call-outcome-btn', { 'cp-log-call-outcome-btn--selected': logCallOutcome === opt.value }]"
              @click="logCallOutcome = logCallOutcome === opt.value ? '' : opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <f7-list strong inset>
            <f7-list-input
              label="Notes"
              type="textarea"
              placeholder="Any notes about this call…"
              resizable
              :value="logCallNotes"
              @input="logCallNotes = ($event.target as HTMLTextAreaElement).value"
            />
          </f7-list>

          <f7-block v-if="logCallError">
            <div class="cp-error" role="alert">
              <i class="f7-icons">exclamationmark_circle_fill</i>
              {{ logCallError }}
            </div>
          </f7-block>

          <f7-block>
            <f7-button
              large
              fill
              round
              :disabled="logCallSubmitting"
              class="cp-submit-btn"
              @click="submitLogCall"
            >
              <span v-if="!logCallSubmitting">Save</span>
              <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
            </f7-button>
          </f7-block>
        </f7-page-content>
      </f7-page>
    </f7-popup>

  </f7-page>
</template>

<script lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  fetchSession,
  captureContact,
  OUTCOME_OPTIONS,
  type EvSessionDetail,
  type EvContact,
} from '../../ts/api/evangelism-sessions';
import { logCall } from '../../ts/api/follow-ups';

export default {
  name: 'EvSessionDetailPage',

  props: {
    f7route: { type: Object, required: true as const },
  },

  setup(props) {
    const sessionId = Number(props.f7route.params.id);
    const session = ref<EvSessionDetail | null>(null);
    const loading = ref(false);
    const error = ref('');
    const popupOpen = ref(false);
    const submitting = ref(false);
    const submitError = ref('');
    const validationErrors = ref<Record<string, string>>({});

    const form = reactive({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      outcome: '',
      notes: '',
    });

    const resetForm = () => {
      form.first_name = '';
      form.last_name = '';
      form.phone = '';
      form.email = '';
      form.outcome = '';
      form.notes = '';
      submitError.value = '';
      validationErrors.value = {};
    };

    const loadDetail = async () => {
      loading.value = true;
      error.value = '';
      try {
        session.value = await fetchSession(sessionId);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load session.';
      } finally {
        loading.value = false;
      }
    };

    const openCapturePopup = () => {
      resetForm();
      popupOpen.value = true;
    };

    const fieldError = (field: string): boolean => field in validationErrors.value;

    const submitCapture = async () => {
      validationErrors.value = {};
      submitError.value = '';

      if (!form.first_name.trim()) {
        validationErrors.value.first_name = 'Required';
        submitError.value = 'First name is required.';
        return;
      }
      if (!form.outcome) {
        validationErrors.value.outcome = 'Required';
        submitError.value = 'Please select an outcome.';
        return;
      }

      submitting.value = true;
      try {
        const contact: EvContact = await captureContact(sessionId, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          outcome: form.outcome,
          notes: form.notes.trim() || undefined,
        });

        session.value?.contacts.unshift(contact);
        popupOpen.value = false;
        resetForm();
      } catch (err) {
        submitError.value = err instanceof Error ? err.message : 'Failed to save contact.';
      } finally {
        submitting.value = false;
      }
    };

    // ── Swipe-to-call ──
    const SWIPE_ACTION_WIDTH = 80;
    const SWIPE_COMMIT_THRESHOLD = 36;

    const swipeOffsets = ref<Record<number, number>>({});
    const swipingId = ref<number | null>(null);
    const openSwipeId = ref<number | null>(null);
    const swipeTouchStartX = ref(0);
    const swipeTouchStartY = ref(0);
    const swipeIsHorizontal = ref(false);

    const swipeCardStyle = (id: number) => ({
      transform: `translateX(${swipeOffsets.value[id] ?? 0}px)`,
      transition: swipingId.value === id ? 'none' : 'transform 0.25s ease',
    });

    const onSwipeTouchStart = (e: TouchEvent, id: number, hasPhone: boolean) => {
      if (!hasPhone) return;
      if (openSwipeId.value !== null && openSwipeId.value !== id) {
        swipeOffsets.value = { ...swipeOffsets.value, [openSwipeId.value]: 0 };
        openSwipeId.value = null;
      }
      swipeTouchStartX.value = e.touches[0].clientX;
      swipeTouchStartY.value = e.touches[0].clientY;
      swipeIsHorizontal.value = false;
      swipingId.value = id;
    };

    const onSwipeTouchMove = (e: TouchEvent, id: number, hasPhone: boolean) => {
      if (!hasPhone || swipingId.value !== id) return;
      const dx = e.touches[0].clientX - swipeTouchStartX.value;
      const dy = e.touches[0].clientY - swipeTouchStartY.value;
      if (!swipeIsHorizontal.value) {
        if (Math.abs(dy) > Math.abs(dx)) { swipingId.value = null; return; }
        swipeIsHorizontal.value = true;
      }
      const base = openSwipeId.value === id ? -SWIPE_ACTION_WIDTH : 0;
      swipeOffsets.value = { ...swipeOffsets.value, [id]: Math.min(0, Math.max(-SWIPE_ACTION_WIDTH, base + dx)) };
    };

    const onSwipeTouchEnd = (_e: TouchEvent, id: number, hasPhone: boolean) => {
      if (!hasPhone || swipingId.value !== id) return;
      const current = swipeOffsets.value[id] ?? 0;
      const wasOpen = openSwipeId.value === id;
      if (!wasOpen && current < -SWIPE_COMMIT_THRESHOLD) {
        swipeOffsets.value = { ...swipeOffsets.value, [id]: -SWIPE_ACTION_WIDTH };
        openSwipeId.value = id;
      } else if (wasOpen && current > -SWIPE_ACTION_WIDTH + SWIPE_COMMIT_THRESHOLD) {
        swipeOffsets.value = { ...swipeOffsets.value, [id]: 0 };
        openSwipeId.value = null;
      } else {
        swipeOffsets.value = { ...swipeOffsets.value, [id]: wasOpen ? -SWIPE_ACTION_WIDTH : 0 };
      }
      swipingId.value = null;
    };

    const closeSwipe = (id: number) => {
      if (openSwipeId.value === id) {
        swipeOffsets.value = { ...swipeOffsets.value, [id]: 0 };
        openSwipeId.value = null;
      }
    };

    // ── Log-call popup ──
    const LOG_CALL_OUTCOMES = [
      { value: 'Answered',          label: 'Answered' },
      { value: 'No answer',         label: 'No Answer' },
      { value: 'Voicemail',         label: 'Voicemail' },
      { value: 'Left message',      label: 'Left Message' },
    ] as const;

    const logCallPopupOpen   = ref(false);
    const pendingCallContact = ref<EvContact | null>(null);
    const logCallOutcome     = ref('');
    const logCallNotes       = ref('');
    const logCallSubmitting  = ref(false);
    const logCallError       = ref('');

    const callContact = (contact: EvContact) => {
      if (!contact.phone) return;
      closeSwipe(contact.id);
      pendingCallContact.value = contact;
      logCallOutcome.value     = '';
      logCallNotes.value       = '';
      logCallError.value       = '';
      logCallPopupOpen.value   = true;
      window.location.href     = `tel:${contact.phone}`;
    };

    const submitLogCall = async () => {
      if (!pendingCallContact.value || logCallSubmitting.value) return;
      logCallSubmitting.value = true;
      logCallError.value      = '';
      try {
        await logCall(pendingCallContact.value.id, {
          outcome: logCallOutcome.value || undefined,
          notes:   logCallNotes.value.trim() || undefined,
        });
        logCallPopupOpen.value = false;
      } catch (err) {
        logCallError.value = err instanceof Error ? err.message : 'Failed to save.';
      } finally {
        logCallSubmitting.value = false;
      }
    };

    const dismissLogCall = () => {
      logCallPopupOpen.value = false;
    };

    const initials = (contact: EvContact): string => {
      const f = contact.first_name?.[0] ?? '';
      const l = contact.last_name?.[0] ?? '';
      return (f + l).toUpperCase() || '?';
    };

    const formatDay = (dateStr: string) =>
      new Date(dateStr + 'T00:00:00').getDate().toString().padStart(2, '0');

    const formatMonth = (dateStr: string) =>
      new Date(dateStr + 'T00:00:00').toLocaleString('en', { month: 'short' }).toUpperCase();

    onMounted(loadDetail);

    return {
      session,
      loading,
      error,
      popupOpen,
      submitting,
      submitError,
      validationErrors,
      form,
      OUTCOME_OPTIONS,
      loadDetail,
      openCapturePopup,
      submitCapture,
      fieldError,
      initials,
      formatDay,
      formatMonth,
      swipeCardStyle,
      onSwipeTouchStart,
      onSwipeTouchMove,
      onSwipeTouchEnd,
      closeSwipe,
      callContact,
      LOG_CALL_OUTCOMES,
      logCallPopupOpen,
      pendingCallContact,
      logCallOutcome,
      logCallNotes,
      logCallSubmitting,
      logCallError,
      submitLogCall,
      dismissLogCall,
    };
  },
};
</script>

<style lang="scss">
// CP tokens available to both the page tree and the portal-rendered sheet
.cp-session-detail-page,
.cp-capture-sheet {
  --cp-bg: #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-field: #EDE9F9;
  --cp-border: rgba(145, 132, 217, 0.12);
  --cp-purple: #9184D9;
  --cp-purple-l: #6B5ABE;
  --cp-amber: #B45309;
  --cp-text: #1A1730;
  --cp-muted: #5E5A7E;
  --cp-green: #047857;
}

.cp-session-detail-page {
  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }
  .page-content { background: var(--cp-bg) !important; padding-bottom: 100px; }

  /* ── States ── */
  .cp-loading-state,
  .cp-error-state,
  .cp-empty-contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    color: var(--cp-muted);
    font-size: 14px;
    text-align: center;

    i.f7-icons { font-size: 48px; opacity: 0.4; }
    strong { color: var(--cp-purple-l); }
  }

  .cp-spinner {
    width: 30px;
    height: 30px;
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
  }

  /* ── Session header ── */
  .cp-session-header {
    margin: 8px 16px 0;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    padding: 16px;

    &__row {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    &__date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(145, 132, 217, 0.12);
      border-radius: 10px;
      padding: 8px 10px;
      flex-shrink: 0;
    }

    &__day {
      font-size: 24px;
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

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    &__location,
    &__leader,
    &__team {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--cp-muted);

      i.f7-icons { font-size: 12px; color: var(--cp-purple); }
    }

    &__location { color: var(--cp-text); font-weight: 600; }

    &__notes {
      margin-top: 10px;
      font-size: 13px;
      color: var(--cp-muted);
      line-height: 1.45;
      border-top: 1px solid var(--cp-border);
      padding-top: 10px;
    }
  }

  /* ── Contact strip ── */
  .cp-contact-strip {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 14px 20px 4px;

    &__count {
      font-size: 28px;
      font-weight: 800;
      color: var(--cp-text);
    }

    &__label {
      font-size: 13px;
      color: var(--cp-muted);
    }
  }

  /* ── Contacts list ── */
  .cp-contacts-list {
    padding: 4px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── Contact card ── */
  .cp-contact-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    padding: 12px;

    &__avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(145, 132, 217, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: var(--cp-purple-l);
      flex-shrink: 0;
    }

    &__body {
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 15px;
      font-weight: 700;
      color: var(--cp-text);
      margin-bottom: 3px;
    }

    &__reach {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
      color: var(--cp-muted);

      span { display: flex; align-items: center; gap: 4px; }
      i.f7-icons { font-size: 11px; }
    }

    &__notes {
      margin-top: 5px;
      font-size: 12px;
      color: var(--cp-muted);
      line-height: 1.4;
    }

    &__outcome {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }
  }

  /* Outcome badge on card */
  .cp-outcome-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;

    &.cp-outcome--interested { background: rgba(59, 130, 246, 0.08); color: #2563EB; }
    &.cp-outcome--prayed { background: rgba(139, 92, 246, 0.08); color: #7C3AED; }
    &.cp-outcome--declined { background: rgba(107, 114, 128, 0.08); color: #4B5563; }
    &.cp-outcome--follow_up_requested { background: rgba(245, 158, 11, 0.08); color: #B45309; }
    &.cp-outcome--saved { background: rgba(4, 120, 87, 0.08); color: #047857; }
  }

  .cp-promoted-badge {
    i.f7-icons { font-size: 14px; color: var(--cp-green); }
  }

  /* ── Swipeable row ── */
  .cp-swipeable-wrapper {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
  }

  .cp-swipe-call-btn {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: #059669;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons {
      font-size: 20px;
      color: #fff;
    }

    span {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      font-family: 'Outfit', -apple-system, sans-serif;
      letter-spacing: 0.03em;
    }
  }

  /* ── FAB ── */
  .cp-fab {
    --f7-fab-bg-color: var(--cp-purple);
    --f7-fab-box-shadow: 0 6px 22px rgba(145, 132, 217, 0.5);
  }
}

/* ── Capture sheet ── */
.cp-capture-sheet {
  --f7-sheet-bg-color: var(--cp-surface);
  --f7-theme-color: var(--cp-purple);
  border-radius: 22px 22px 0 0;
  max-height: 90vh;
}

.cp-sheet-handle {
  width: 36px;
  height: 4px;
  background: rgba(145, 132, 217, 0.3);
  border-radius: 2px;
  margin: 10px auto 0;
}

/* ── Outcome selector ── */
.cp-outcome-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 8px;

  &--error .button { border-color: rgba(224, 122, 138, 0.4); }

  .button {
    font-size: 12px;
    font-weight: 600;
    height: 36px;

    &.cp-outcome-option--selected {
      background: color-mix(in srgb, var(--oo-color, var(--cp-purple)) 15%, transparent);
      border-color: var(--oo-color, var(--cp-purple));
      color: var(--oo-color, var(--cp-purple-l));
    }
  }
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
  animation: cpSpin 0.72s linear infinite;
}

@keyframes cpSpin { to { transform: rotate(360deg); } }

/* ── Log call popup ── */
.cp-log-call-page {
  --cp-bg: #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-border: rgba(145, 132, 217, 0.12);
  --cp-purple: #9184D9;
  --cp-purple-l: #6B5ABE;
  --cp-text: #1A1730;
  --cp-muted: #5E5A7E;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  &.page { --f7-page-bg-color: var(--cp-bg); }
  .page-content { background: var(--cp-bg) !important; }
}

.cp-log-call-contact {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px 16px 4px;
  padding: 14px;
  background: var(--cp-surface);
  border: 1px solid var(--cp-border);
  border-radius: 14px;

  &__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(145, 132, 217, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: var(--cp-purple-l);
    text-transform: uppercase;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: var(--cp-text);
  }

  &__phone {
    font-size: 13px;
    color: var(--cp-muted);
  }
}

.cp-log-call-outcomes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 16px 8px;
}

.cp-log-call-outcome-btn {
  height: 40px;
  border-radius: 10px;
  border: 1.5px solid rgba(145, 132, 217, 0.25);
  background: var(--cp-surface);
  font-family: 'Outfit', -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-muted);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &--selected {
    background: rgba(145, 132, 217, 0.12);
    border-color: var(--cp-purple);
    color: var(--cp-purple-l);
  }
}
</style>
