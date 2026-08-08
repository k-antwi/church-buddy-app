<template>
  <f7-page name="more" class="cp-more-page" no-navbar>
    <div class="cp-more-content">

      <div class="cp-more-topbar"></div>

      <!-- ── Profile card ── -->
      <div class="cp-profile-card">
        <div class="cp-avatar" :class="{ 'cp-avatar--loading': loadingProfile && !user }">
          <span v-if="!loadingProfile || user" class="cp-avatar__initials">{{ initials }}</span>
        </div>
        <div class="cp-profile-info">
          <h2 class="cp-profile-name" :class="{ 'cp-skeleton': loadingProfile && !user }">
            {{ (!loadingProfile || user) ? displayName : '' }}
          </h2>
          <p class="cp-profile-email" :class="{ 'cp-skeleton cp-skeleton--sm': loadingProfile && !user }">
            {{ (!loadingProfile || user) ? displayEmail : '' }}
          </p>
        </div>
      </div>

      <!-- ── Account section ── -->
      <div class="cp-more-section">
        <span class="cp-section-label">ACCOUNT</span>
        <div class="cp-menu-list">
          <button class="cp-menu-item" type="button" :disabled="loadingProfile && !user" @click="startEdit">
            <span class="cp-menu-item__icon cp-menu-item__icon--purple">
              <i class="f7-icons">person_fill</i>
            </span>
            <span class="cp-menu-item__label">Edit Profile</span>
            <i class="f7-icons cp-menu-item__chevron">chevron_right</i>
          </button>
          <div class="cp-menu-item cp-menu-divider cp-menu-item--disabled">
            <span class="cp-menu-item__icon cp-menu-item__icon--blue">
              <i class="f7-icons">bell_fill</i>
            </span>
            <span class="cp-menu-item__label">Notifications</span>
            <span class="cp-menu-item__badge">Soon</span>
            <i class="f7-icons cp-menu-item__chevron">chevron_right</i>
          </div>
        </div>
      </div>

      <!-- ── Support section ── -->
      <div class="cp-more-section">
        <span class="cp-section-label">SUPPORT</span>
        <div class="cp-menu-list">
          <div class="cp-menu-item cp-menu-item--disabled">
            <span class="cp-menu-item__icon cp-menu-item__icon--green">
              <i class="f7-icons">question_circle_fill</i>
            </span>
            <span class="cp-menu-item__label">Help & FAQs</span>
            <span class="cp-menu-item__badge">Soon</span>
            <i class="f7-icons cp-menu-item__chevron">chevron_right</i>
          </div>
        </div>
      </div>

      <!-- ── Sign out ── -->
      <div class="cp-more-section">
        <div class="cp-menu-list">
          <button class="cp-menu-item cp-menu-item--danger" type="button" :disabled="signingOut" @click="handleSignOut">
            <span class="cp-menu-item__icon cp-menu-item__icon--red">
              <i class="f7-icons">{{ signingOut ? 'circle' : 'arrow_right_square_fill' }}</i>
            </span>
            <span class="cp-menu-item__label">{{ signingOut ? 'Signing out…' : 'Sign Out' }}</span>
          </button>
        </div>
      </div>

      <p class="cp-more-version">ChurchBuddy</p>

    </div>
  </f7-page>

  <!-- ── Edit Profile Popup ── -->
  <f7-popup class="cp-edit-popup" :opened="editing" @popup:closed="cancelEdit" swipe-to-close>
    <f7-page no-navbar>
      <div class="cp-edit-popup-inner">

        <button class="cp-edit-close" type="button" @click="cancelEdit">
          <i class="f7-icons">xmark_circle_fill</i>
        </button>

        <div class="cp-edit-header">
          <span class="cp-edit-title">Edit<br>Profile</span>
        </div>

        <form class="cp-edit-form" @submit.prevent="saveProfile">

          <div class="cp-field" :class="{ 'cp-field--focused': focused === 'name', 'cp-field--error': !!fieldError('name') }">
            <span class="cp-field-icon"><i class="f7-icons">person_fill</i></span>
            <div class="cp-field-body">
              <label class="cp-field-label" for="ep-name">Full name</label>
              <input id="ep-name" v-model="form.name" type="text" autocomplete="name"
                @focus="focused = 'name'" @blur="focused = ''" />
            </div>
          </div>
          <p v-if="fieldError('name')" class="cp-field-msg">{{ fieldError('name') }}</p>

          <div class="cp-field" :class="{ 'cp-field--focused': focused === 'email', 'cp-field--error': !!fieldError('email') }">
            <span class="cp-field-icon"><i class="f7-icons">envelope_fill</i></span>
            <div class="cp-field-body">
              <label class="cp-field-label" for="ep-email">Email</label>
              <input id="ep-email" v-model="form.email" type="email" autocomplete="email"
                inputmode="email" @focus="focused = 'email'" @blur="focused = ''" />
            </div>
          </div>
          <p v-if="fieldError('email')" class="cp-field-msg">{{ fieldError('email') }}</p>

          <button type="button" class="cp-pw-toggle" @click="changingPassword = !changingPassword">
            <i class="f7-icons">{{ changingPassword ? 'chevron_up' : 'lock_fill' }}</i>
            {{ changingPassword ? 'Cancel password change' : 'Change password' }}
          </button>

          <Transition name="cp-slide">
            <div v-if="changingPassword" class="cp-pw-fields">
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'current_pw', 'cp-field--error': !!fieldError('current_password') }">
                <span class="cp-field-icon"><i class="f7-icons">lock_fill</i></span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="ep-current-pw">Current password</label>
                  <input id="ep-current-pw" v-model="form.current_password" type="password"
                    autocomplete="current-password" @focus="focused = 'current_pw'" @blur="focused = ''" />
                </div>
              </div>
              <p v-if="fieldError('current_password')" class="cp-field-msg">{{ fieldError('current_password') }}</p>

              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'new_pw', 'cp-field--error': !!fieldError('password') }">
                <span class="cp-field-icon"><i class="f7-icons">lock_shield_fill</i></span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="ep-new-pw">New password</label>
                  <input id="ep-new-pw" v-model="form.password" type="password"
                    autocomplete="new-password" @focus="focused = 'new_pw'" @blur="focused = ''" />
                </div>
              </div>
              <p v-if="fieldError('password')" class="cp-field-msg">{{ fieldError('password') }}</p>

              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'confirm_pw' }">
                <span class="cp-field-icon"><i class="f7-icons">lock_shield_fill</i></span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="ep-confirm-pw">Confirm password</label>
                  <input id="ep-confirm-pw" v-model="form.password_confirmation" type="password"
                    autocomplete="new-password" @focus="focused = 'confirm_pw'" @blur="focused = ''" />
                </div>
              </div>
            </div>
          </Transition>

          <p v-if="saveError" class="cp-save-error" role="alert">
            <i class="f7-icons">exclamationmark_circle_fill</i>
            {{ saveError }}
          </p>

          <button class="cp-save-btn" type="submit" :disabled="saving">
            <span v-if="saving" class="cp-btn-spinner"></span>
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>

        </form>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script lang="ts">
import { computed, ref, reactive } from 'vue';
import { f7 } from 'framework7-vue';
import { getStoredUser, storeUser, apiLogout, isAuthenticated, type AuthUser } from '../../ts/auth';
import { authState } from '../../ts/auth-state';
import { fetchProfile, updateProfile } from '../../ts/api/profile';

export default {
  name: 'MorePage',

  setup() {
    const user    = ref<AuthUser | null>(getStoredUser());
    const loadingProfile = ref(user.value === null);
    const editing = ref(false);
    const saving  = ref(false);
    const signingOut    = ref(false);
    const changingPassword = ref(false);
    const focused   = ref('');
    const saveError = ref('');
    const errors    = ref<Record<string, string>>({});

    const form = reactive({
      name: '',
      email: '',
      current_password: '',
      password: '',
      password_confirmation: '',
    });

    const displayName  = computed(() => {
      const name = user.value?.name ?? '';
      return name.trim().split(/\s+/)[0] || '';
    });
    const displayEmail = computed(() => user.value?.email ?? '');

    const initials = computed(() => {
      const name = user.value?.name ?? '';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase() || '?';
    });

    const fieldError = (key: string) => errors.value[key] ?? '';

    async function loadProfile(): Promise<void> {
      if (!isAuthenticated()) {
        loadingProfile.value = false;
        return;
      }
      try {
        const fresh = await fetchProfile();
        user.value = fresh;
        storeUser(fresh);
      } catch {
        // fall back to cached value if offline
      } finally {
        loadingProfile.value = false;
      }
    }

    function startEdit(): void {
      form.name  = user.value?.name  ?? '';
      form.email = user.value?.email ?? '';
      form.current_password      = '';
      form.password              = '';
      form.password_confirmation = '';
      changingPassword.value = false;
      saveError.value = '';
      errors.value    = {};
      editing.value   = true;
    }

    function cancelEdit(): void {
      editing.value = false;
    }

    async function saveProfile(): Promise<void> {
      if (saving.value) return;
      saving.value  = true;
      saveError.value = '';
      errors.value    = {};

      try {
        const payload: Parameters<typeof updateProfile>[0] = {
          name:  form.name.trim(),
          email: form.email.trim(),
        };

        if (changingPassword.value && form.password) {
          payload.current_password      = form.current_password;
          payload.password              = form.password;
          payload.password_confirmation = form.password_confirmation;
        }

        const updated = await updateProfile(payload);
        user.value  = updated;
        storeUser(updated);
        editing.value = false;
      } catch (err: unknown) {
        saveError.value = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      } finally {
        saving.value = false;
      }
    }

    async function handleSignOut(): Promise<void> {
      if (signingOut.value) return;
      signingOut.value = true;
      try {
        await apiLogout();
        authState.loggedIn = false;
        f7.tab.show('#view-home');
        f7.views.main.router.navigate('/', { clearPreviousHistory: true });
      } finally {
        signingOut.value = false;
      }
    }

    loadProfile();

    return {
      user, loadingProfile, editing, saving, signingOut, changingPassword,
      focused, saveError, form,
      displayName, displayEmail, initials,
      fieldError, startEdit, cancelEdit, saveProfile, handleSignOut,
    };
  },
};
</script>

<style lang="scss">
.cp-more-page {
  --cp-bg:      #F5F3FA;
  --cp-surface: #FFFFFF;
  --cp-border:  rgba(145, 132, 217, 0.12);
  --cp-purple:  #9184D9;
  --cp-text:    #1A1730;
  --cp-muted:   #5E5A7E;
  --cp-red:     #EF4444;
  --cp-green:   #10B981;
  --cp-blue:    #6366F1;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }
  .page-content { background: var(--cp-bg) !important; padding-bottom: 80px; }

  .cp-more-content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cp-more-topbar {
    height: max(env(safe-area-inset-top, 0px), 20px);
  }

  /* ── Profile card ── */
  .cp-profile-card {
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 20px;
    padding: 24px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  .cp-avatar {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    background: linear-gradient(135deg, #9184D9 0%, #6366F1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);

    &__initials {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
  }

  .cp-profile-info {
    flex: 1;
    min-width: 0;
  }

  .cp-profile-name {
    font-size: 18px;
    font-weight: 800;
    color: var(--cp-text);
    margin: 0 0 3px;
    letter-spacing: -0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 22px;
  }

  .cp-profile-email {
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 16px;
  }

  .cp-avatar--loading {
    background: rgba(145, 132, 217, 0.25);
    box-shadow: none;
  }

  .cp-skeleton {
    border-radius: 6px;
    background: linear-gradient(90deg,
      rgba(145, 132, 217, 0.12) 25%,
      rgba(145, 132, 217, 0.22) 50%,
      rgba(145, 132, 217, 0.12) 75%
    );
    background-size: 200% 100%;
    animation: cpSkeleton 1.4s ease infinite;
    color: transparent !important;
    width: 120px;

    &--sm { width: 160px; }
  }

  @keyframes cpSkeleton {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Edit card ── */
  .cp-edit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .cp-edit-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--cp-text);
    letter-spacing: -0.1px;
  }

  .cp-edit-close {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--cp-muted);
    display: flex;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons { font-size: 22px; }
    &:active { opacity: 0.6; }
  }

  .cp-edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Shared field ── */
  .cp-field {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--cp-bg);
    border: 1.5px solid rgba(145, 132, 217, 0.18);
    border-radius: 14px;
    padding: 0 14px 0 12px;
    transition: border-color 0.15s ease;

    &--focused { border-color: var(--cp-purple); }
    &--error   { border-color: var(--cp-red);    }
  }

  .cp-field-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--cp-muted);
    i.f7-icons { font-size: 16px; }
  }

  .cp-field-body {
    flex: 1;
    padding: 10px 0;
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cp-field-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cp-muted);
  }

  .cp-field input {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: var(--cp-text);
    padding: 0;
    -webkit-appearance: none;

    &::placeholder { color: rgba(94, 90, 126, 0.45); }
  }

  .cp-field-msg {
    font-size: 12px;
    font-weight: 500;
    color: var(--cp-red);
    margin: -4px 0 0 4px;
  }

  /* ── Password change toggle ── */
  .cp-pw-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--cp-purple);
    cursor: pointer;
    padding: 4px 0;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons { font-size: 14px; }
  }

  .cp-pw-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Save error ── */
  .cp-save-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-red);
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0;

    i.f7-icons { font-size: 14px; flex-shrink: 0; }
  }

  /* ── Save button ── */
  .cp-save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: linear-gradient(135deg, #9184D9 0%, #6366F1 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    padding: 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s ease, transform 0.1s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    margin-top: 4px;

    &:active:not(:disabled) { transform: scale(0.98); }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  .cp-btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cpMoreSpin 0.7s linear infinite;
  }

  @keyframes cpMoreSpin { to { transform: rotate(360deg); } }

  /* ── Sections & menu ── */
  .cp-more-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cp-section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    color: var(--cp-muted);
    text-transform: uppercase;
    padding: 0 4px;
  }

  .cp-menu-list {
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  .cp-menu-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    transition: background 0.1s ease;

    &:active:not(.cp-menu-item--disabled):not(:disabled) {
      background: rgba(145, 132, 217, 0.06);
    }

    &--disabled { cursor: default; opacity: 0.6; }

    &--danger .cp-menu-item__label {
      color: var(--cp-red);
      font-weight: 700;
    }

    &--danger:active:not(:disabled) {
      background: rgba(239, 68, 68, 0.06) !important;
    }
  }

  .cp-menu-divider { border-top: 1px solid var(--cp-border); }

  .cp-menu-item__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i.f7-icons { font-size: 17px; color: #fff; }

    &--purple { background: linear-gradient(135deg, #9184D9, #6366F1); }
    &--blue   { background: linear-gradient(135deg, #6366F1, #4F46E5); }
    &--green  { background: linear-gradient(135deg, #10B981, #059669); }
    &--red    { background: linear-gradient(135deg, #EF4444, #DC2626); }
  }

  .cp-menu-item__label {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--cp-text);
  }

  .cp-menu-item__badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--cp-muted);
    background: var(--cp-bg);
    border: 1px solid var(--cp-border);
    border-radius: 6px;
    padding: 2px 7px;
    text-transform: uppercase;
  }

  .cp-menu-item__chevron {
    font-size: 13px;
    color: var(--cp-border);
    flex-shrink: 0;
    filter: brightness(0.7);
  }

  /* ── Version footer ── */
  .cp-more-version {
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: var(--cp-muted);
    opacity: 0.5;
    margin: 4px 0 0;
  }

  /* ── Slide transition ── */
  .cp-slide-enter-active,
  .cp-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .cp-slide-enter-from,
  .cp-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* ── Edit Profile Popup (rendered outside .cp-more-page by F7) ── */
.cp-edit-popup {
  --cp-bg:     #F5F3FA;
  --cp-surface:#FFFFFF;
  --cp-border: rgba(145, 132, 217, 0.12);
  --cp-purple: #9184D9;
  --cp-text:   #1A1730;
  --cp-muted:  #5E5A7E;
  --cp-red:    #EF4444;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.popup { border-radius: 24px 24px 0 0 !important; }

  .page { --f7-page-bg-color: var(--cp-bg); }

  .cp-edit-popup-inner {
    position: relative;
    padding: 28px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cp-edit-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--cp-text);
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  .cp-edit-close {
    position: absolute;
    top: 28px;
    right: 20px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--cp-muted);
    display: flex;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons { font-size: 26px; }
    &:active { opacity: 0.6; }
  }

  .cp-edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cp-field {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--cp-bg);
    border: 1.5px solid rgba(145, 132, 217, 0.18);
    border-radius: 14px;
    padding: 0 14px 0 12px;
    transition: border-color 0.15s ease;

    &--focused { border-color: var(--cp-purple); }
    &--error   { border-color: var(--cp-red);    }
  }

  .cp-field-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--cp-muted);
    i.f7-icons { font-size: 16px; }
  }

  .cp-field-body {
    flex: 1;
    padding: 10px 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cp-field-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cp-muted);
  }

  .cp-field input {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: var(--cp-text);
    padding: 0;
    -webkit-appearance: none;

    &::placeholder { color: rgba(94, 90, 126, 0.45); }
  }

  .cp-field-msg {
    font-size: 12px;
    font-weight: 500;
    color: var(--cp-red);
    margin: -4px 0 0 4px;
  }

  .cp-pw-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: var(--cp-purple);
    cursor: pointer;
    padding: 4px 0;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons { font-size: 14px; }
  }

  .cp-pw-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cp-save-error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-red);
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0;

    i.f7-icons { font-size: 14px; flex-shrink: 0; }
  }

  .cp-save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: linear-gradient(135deg, #9184D9 0%, #6366F1 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    padding: 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s ease, transform 0.1s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    margin-top: 4px;

    &:active:not(:disabled) { transform: scale(0.98); }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  .cp-btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cpMoreSpin 0.7s linear infinite;
  }

  .cp-slide-enter-active,
  .cp-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .cp-slide-enter-from,
  .cp-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
</style>
