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
          class="cp-contact-card"
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
    </template>

    <!-- FAB -->
    <f7-fab position="right-bottom" @click="openCaptureSheet" class="cp-fab">
      <f7-icon ios="f7:plus" md="material:add"></f7-icon>
    </f7-fab>

    <!-- ── Capture contact sheet ── -->
    <f7-sheet
      class="cp-capture-sheet"
      :opened="sheetOpen"
      swipe-to-close
      backdrop
      @sheet:closed="sheetOpen = false"
    >
      <div class="cp-sheet-inner">
        <div class="cp-sheet-handle"></div>

        <h2 class="cp-sheet-title">Capture Contact</h2>

        <form class="cp-capture-form" @submit.prevent="submitCapture" novalidate>

          <!-- Name row -->
          <div class="cp-field-row">
            <div class="cp-field" :class="{ 'cp-field--focused': focused === 'first_name', 'cp-field--error': fieldError('first_name') }">
              <div class="cp-field-body">
                <label class="cp-field-label" for="cp-first-name">First Name *</label>
                <input
                  id="cp-first-name"
                  v-model="form.first_name"
                  type="text"
                  autocomplete="given-name"
                  placeholder="John"
                  @focus="focused = 'first_name'"
                  @blur="focused = ''"
                />
              </div>
            </div>
            <div class="cp-field" :class="{ 'cp-field--focused': focused === 'last_name' }">
              <div class="cp-field-body">
                <label class="cp-field-label" for="cp-last-name">Last Name</label>
                <input
                  id="cp-last-name"
                  v-model="form.last_name"
                  type="text"
                  autocomplete="family-name"
                  placeholder="Doe"
                  @focus="focused = 'last_name'"
                  @blur="focused = ''"
                />
              </div>
            </div>
          </div>

          <!-- Phone -->
          <div class="cp-field" :class="{ 'cp-field--focused': focused === 'phone' }">
            <span class="cp-field-icon"><i class="f7-icons">phone_fill</i></span>
            <div class="cp-field-body">
              <label class="cp-field-label" for="cp-phone">Phone</label>
              <input
                id="cp-phone"
                v-model="form.phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                placeholder="+1 555 000 0000"
                @focus="focused = 'phone'"
                @blur="focused = ''"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="cp-field" :class="{ 'cp-field--focused': focused === 'email' }">
            <span class="cp-field-icon"><i class="f7-icons">envelope_fill</i></span>
            <div class="cp-field-body">
              <label class="cp-field-label" for="cp-email">Email</label>
              <input
                id="cp-email"
                v-model="form.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="john@example.com"
                @focus="focused = 'email'"
                @blur="focused = ''"
              />
            </div>
          </div>

          <!-- Outcome -->
          <div class="cp-field-label-standalone">Outcome *</div>
          <div class="cp-outcome-grid" :class="{ 'cp-field--error': fieldError('outcome') }">
            <button
              v-for="opt in OUTCOME_OPTIONS"
              :key="opt.value"
              type="button"
              class="cp-outcome-option"
              :class="{ 'cp-outcome-option--selected': form.outcome === opt.value }"
              :style="form.outcome === opt.value ? `--oo-color: ${opt.color}` : ''"
              @click="form.outcome = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- Notes -->
          <div class="cp-field" :class="{ 'cp-field--focused': focused === 'notes' }">
            <div class="cp-field-body">
              <label class="cp-field-label" for="cp-notes">Notes</label>
              <textarea
                id="cp-notes"
                v-model="form.notes"
                rows="2"
                placeholder="Any additional notes…"
                @focus="focused = 'notes'"
                @blur="focused = ''"
              ></textarea>
            </div>
          </div>

          <!-- Submit error -->
          <p v-if="submitError" class="cp-error" role="alert">
            <i class="f7-icons">exclamationmark_circle_fill</i>
            {{ submitError }}
          </p>

          <button
            type="submit"
            class="cp-submit"
            :class="{ 'cp-submit--loading': submitting }"
            :disabled="submitting"
          >
            <span v-if="!submitting">Save Contact</span>
            <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
          </button>

        </form>
      </div>
    </f7-sheet>

  </f7-page>
</template>

<script lang="ts">
import { ref, reactive } from 'vue';
import {
  fetchSession,
  captureContact,
  OUTCOME_OPTIONS,
  type EvSessionDetail,
  type EvContact,
} from '../../ts/api/evangelism-sessions';

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
    const sheetOpen = ref(false);
    const focused = ref('');
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

    const openCaptureSheet = () => {
      resetForm();
      sheetOpen.value = true;
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
          last_name: form.last_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          outcome: form.outcome,
          notes: form.notes.trim() || undefined,
        });

        session.value?.contacts.unshift(contact);
        sheetOpen.value = false;
        resetForm();
      } catch (err) {
        submitError.value = err instanceof Error ? err.message : 'Failed to save contact.';
      } finally {
        submitting.value = false;
      }
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

    return {
      session,
      loading,
      error,
      sheetOpen,
      focused,
      submitting,
      submitError,
      form,
      OUTCOME_OPTIONS,
      loadDetail,
      openCaptureSheet,
      submitCapture,
      fieldError,
      initials,
      formatDay,
      formatMonth,
    };
  },
};
</script>

<style lang="scss">
.cp-session-detail-page {
  --cp-bg: #0A0816;
  --cp-surface: #130F24;
  --cp-field: #1A1535;
  --cp-border: rgba(145, 132, 217, 0.15);
  --cp-purple: #9184D9;
  --cp-purple-l: #C0B0F5;
  --cp-amber: #E8A548;
  --cp-text: #EAE5FC;
  --cp-muted: #6A6090;
  --cp-green: #10B981;

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

    &.cp-outcome--interested { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
    &.cp-outcome--prayed { background: rgba(139, 92, 246, 0.15); color: #A78BFA; }
    &.cp-outcome--declined { background: rgba(107, 114, 128, 0.15); color: #9CA3AF; }
    &.cp-outcome--follow_up_requested { background: rgba(245, 158, 11, 0.15); color: #FCD34D; }
    &.cp-outcome--saved { background: rgba(16, 185, 129, 0.15); color: #34D399; }
  }

  .cp-promoted-badge {
    i.f7-icons { font-size: 14px; color: var(--cp-green); }
  }

  /* ── FAB ── */
  .cp-fab {
    --f7-fab-bg-color: var(--cp-purple);
    --f7-fab-box-shadow: 0 6px 22px rgba(145, 132, 217, 0.5);
  }

  /* ── Capture sheet ── */
  .cp-capture-sheet {
    --f7-sheet-bg-color: var(--cp-surface);
    border-radius: 22px 22px 0 0;
    max-height: 90vh;
    overflow-y: auto;
  }

  .cp-sheet-inner {
    padding: 0 20px max(env(safe-area-inset-bottom, 0px), 20px);
  }

  .cp-sheet-handle {
    width: 36px;
    height: 4px;
    background: rgba(145, 132, 217, 0.3);
    border-radius: 2px;
    margin: 10px auto 20px;
  }

  .cp-sheet-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--cp-text);
    margin: 0 0 20px;
  }

  /* ── Capture form ── */
  .cp-capture-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cp-field-row {
    display: flex;
    gap: 10px;

    .cp-field { flex: 1; }
  }

  .cp-field {
    background: var(--cp-field);
    border: 1.5px solid transparent;
    border-radius: 13px;
    padding: 10px 13px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &--focused {
      border-color: var(--cp-purple);
      box-shadow: 0 0 0 3px rgba(145, 132, 217, 0.13);
      .cp-field-icon { color: var(--cp-purple-l); }
    }

    &--error { border-color: rgba(224, 122, 138, 0.6); }
  }

  .cp-field-icon {
    flex-shrink: 0;
    color: var(--cp-muted);
    i.f7-icons { font-size: 16px; line-height: 1; }
  }

  .cp-field-body { flex: 1; min-width: 0; }

  .cp-field-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cp-muted);
    margin-bottom: 2px;
  }

  .cp-field-label-standalone {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cp-muted);
    padding-left: 2px;
  }

  .cp-field-body input,
  .cp-field-body textarea {
    display: block;
    width: 100%;
    background: none;
    border: none;
    outline: none;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: var(--cp-text);
    padding: 0;
    resize: none;
    -webkit-appearance: none;

    &::placeholder { color: rgba(106, 96, 144, 0.55); }
  }

  /* ── Outcome grid ── */
  .cp-outcome-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    &.cp-field--error .cp-outcome-option { border-color: rgba(224, 122, 138, 0.3); }
  }

  .cp-outcome-option {
    background: var(--cp-field);
    border: 1.5px solid transparent;
    border-radius: 10px;
    padding: 9px 6px;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--cp-muted);
    text-align: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.15s ease;

    &--selected {
      background: rgba(var(--oo-color, 145, 132, 217), 0.12);
      border-color: var(--oo-color, var(--cp-purple));
      color: var(--oo-color, var(--cp-purple-l));
    }
  }

  /* ── Error / submit ── */
  .cp-error {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(224, 122, 138, 0.1);
    border: 1px solid rgba(224, 122, 138, 0.25);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #E07A8A;
    margin: 0;

    i.f7-icons { font-size: 15px; flex-shrink: 0; }
  }

  .cp-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 50px;
    border: none;
    border-radius: 13px;
    background: linear-gradient(130deg, #A999EE 0%, #9184D9 55%, #7D6FC6 100%);
    box-shadow: 0 5px 26px rgba(145, 132, 217, 0.38);
    color: #fff;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease;
    margin-top: 4px;

    &:active { transform: scale(0.975); box-shadow: 0 2px 12px rgba(145, 132, 217, 0.25); }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  .cp-submit-spinner {
    font-size: 22px !important;
    animation: cpSpin 0.72s linear infinite;
  }
}
</style>
