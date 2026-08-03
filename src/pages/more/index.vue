<template>
  <f7-page name="more" class="cp-more-page" no-navbar>
    <div class="cp-more-content">

      <!-- Safe-area spacer -->
      <div class="cp-more-topbar"></div>

      <!-- Profile card -->
      <div class="cp-profile-card">
        <div class="cp-avatar">
          <span class="cp-avatar__initials">{{ initials }}</span>
        </div>
        <div class="cp-profile-info">
          <h2 class="cp-profile-name">{{ fullName }}</h2>
          <p class="cp-profile-email">{{ email }}</p>
        </div>
      </div>

      <!-- Account section -->
      <div class="cp-more-section">
        <span class="cp-section-label">ACCOUNT</span>
        <div class="cp-menu-list">
          <div class="cp-menu-item cp-menu-item--disabled">
            <span class="cp-menu-item__icon cp-menu-item__icon--purple">
              <i class="f7-icons">person_fill</i>
            </span>
            <span class="cp-menu-item__label">Edit Profile</span>
            <span class="cp-menu-item__badge">Soon</span>
            <i class="f7-icons cp-menu-item__chevron">chevron_right</i>
          </div>
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

      <!-- Support section -->
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

      <!-- Sign out -->
      <div class="cp-more-section">
        <div class="cp-menu-list">
          <button class="cp-menu-item cp-menu-item--danger" :disabled="signingOut" @click="handleSignOut">
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
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import { f7 } from 'framework7-vue';
import { getStoredUser, apiLogout } from '../../ts/auth';
import { authState } from '../../ts/auth-state';

export default {
  name: 'MorePage',

  setup() {
    const user = computed(() => getStoredUser());
    const signingOut = ref(false);

    const fullName = computed(() => user.value?.name ?? 'Unknown User');

    const email = computed(() => user.value?.email ?? '');

    const initials = computed(() => {
      const name = user.value?.name ?? '';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase() || '?';
    });

    async function handleSignOut(): Promise<void> {
      if (signingOut.value) return;
      signingOut.value = true;
      await apiLogout();
      authState.loggedIn = false;
      f7.tab.show('#view-home');
      f7.views.main.router.navigate('/', { clearPreviousHistory: true });
    }

    return { fullName, email, initials, signingOut, handleSignOut };
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

  /* Safe-area topbar */
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
  }

  .cp-profile-email {
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Sections ── */
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

  /* ── Menu list ── */
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

    &:active:not(.cp-menu-item--disabled) {
      background: rgba(145, 132, 217, 0.06);
    }

    &--disabled {
      cursor: default;
      opacity: 0.6;
    }

    &--danger &__label {
      color: var(--cp-red);
      font-weight: 700;
    }

    &--danger:active {
      background: rgba(239, 68, 68, 0.06) !important;
    }
  }

  .cp-menu-divider {
    border-top: 1px solid var(--cp-border);
  }

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
}
</style>
