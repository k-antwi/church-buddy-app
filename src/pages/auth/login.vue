<template>
  <f7-page no-navbar no-toolbar name="login" class="cp-login-page">

    <!-- Background layer -->
    <div class="cp-bg" aria-hidden="true">
      <div class="cp-blob cp-blob--a"></div>
      <div class="cp-blob cp-blob--b"></div>
    </div>

    <div class="cp-body">

      <!-- Brand -->
      <div class="cp-brand">
        <div class="cp-brand-icon">
          <img src="/logo.png" alt="ChurchBuddy" class="cp-brand-logo" />
        </div>
        <h1 class="cp-brand-name">ChurchBuddy</h1>
        <p class="cp-brand-tagline">Ministry management, simplified</p>
      </div>

      <!-- Form card -->
      <div class="cp-card">
        <Transition name="cp-step" mode="out-in">

          <!-- ── Step 1: Workspace domain ── -->
          <div v-if="step === 'domain'" key="domain">
            <header class="cp-card-header">
              <h2 class="cp-card-title">Find your workspace</h2>
              <p class="cp-card-desc">Enter your organization's ChurchBuddy domain</p>
            </header>

            <form class="cp-form" @submit.prevent="handleContinue" novalidate>

              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'domain' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">building_2_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-domain">Workspace</label>
                  <input
                    id="cp-domain"
                    ref="domainInput"
                    v-model="domain"
                    type="text"
                    inputmode="url"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="none"
                    spellcheck="false"
                    placeholder="christrends"
                    @focus="focused = 'domain'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Resolved domain hint -->
              <p v-if="resolvedHint" class="cp-domain-hint">
                <i class="f7-icons">arrow_right_circle_fill</i>
                {{ resolvedHint }}
              </p>

              <!-- Inline error -->
              <p v-if="error" class="cp-error" role="alert">
                <i class="f7-icons">exclamationmark_circle_fill</i>
                {{ error }}
              </p>

              <button
                type="submit"
                class="cp-submit"
                :class="{ 'cp-submit--loading': loading }"
                :disabled="loading || !domain.trim()"
              >
                <span v-if="!loading" class="cp-submit-label">Continue</span>
                <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
              </button>

              <button type="button" class="cp-skip-btn" @click="skipToCredentials">
                Sign in without a workspace
              </button>

            </form>
          </div>

          <!-- ── Step 2: Credentials ── -->
          <div v-else key="credentials">

            <!-- Tenant pill (shown when a workspace was resolved) -->
            <div v-if="tenant" class="cp-tenant-pill">
              <i class="f7-icons">building_2_fill</i>
              <span class="cp-tenant-pill-domain">{{ tenant }}</span>
              <button type="button" class="cp-tenant-change" @click="backToDomain" aria-label="Change workspace">
                <i class="f7-icons">xmark_circle_fill</i>
              </button>
            </div>

            <header class="cp-card-header">
              <h2 class="cp-card-title">Sign in</h2>
              <p class="cp-card-desc">
                {{ tenant ? `Sign in to ${tenantName}` : 'Welcome back to your community' }}
              </p>
            </header>

            <form class="cp-form" @submit.prevent="handleLogin" novalidate>

              <!-- Email -->
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'email' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">envelope_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-email">Email</label>
                  <input
                    id="cp-email"
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    inputmode="email"
                    placeholder="pastor@yourchurch.org"
                    @focus="focused = 'email'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Password -->
              <div class="cp-field cp-field--has-action" :class="{ 'cp-field--focused': focused === 'password' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">lock_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-password">Password</label>
                  <input
                    id="cp-password"
                    v-model="password"
                    :type="showPass ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    @focus="focused = 'password'"
                    @blur="focused = ''"
                  />
                </div>
                <button
                  type="button"
                  class="cp-eye-btn"
                  :aria-label="showPass ? 'Hide password' : 'Show password'"
                  @click="showPass = !showPass"
                >
                  <i class="f7-icons">{{ showPass ? 'eye_slash_fill' : 'eye_fill' }}</i>
                </button>
              </div>

              <a href="#" class="cp-forgot">Forgot password?</a>

              <!-- Inline error -->
              <p v-if="error" class="cp-error" role="alert">
                <i class="f7-icons">exclamationmark_circle_fill</i>
                {{ error }}
              </p>

              <button
                type="submit"
                class="cp-submit"
                :class="{ 'cp-submit--loading': loading }"
                :disabled="loading"
              >
                <span v-if="!loading" class="cp-submit-label">Sign In</span>
                <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
              </button>

            </form>
          </div>

        </Transition>
      </div>

      <!-- Register -->
      <p class="cp-register">
        New to ChurchBuddy?
        <a href="#" class="cp-register-link" @click.prevent="goToRegister">Create account</a>
      </p>

    </div>
  </f7-page>
</template>

<script lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { f7 } from 'framework7-vue';
import { login, resolveDomain, isAuthenticated } from '../../ts/auth';

export default {
  name: 'LoginPage',

  setup() {
    const step     = ref<'domain' | 'credentials'>('domain');
    const domain   = ref('');
    const tenant   = ref('');   // fully-resolved hostname, e.g. "christrends.churchpanel.org"
    const email    = ref('');
    const password = ref('');
    const showPass = ref(false);
    const loading  = ref(false);
    const focused  = ref('');
    const error    = ref('');

    const domainInput = ref<HTMLInputElement | null>(null);

    onMounted(() => {
      if (isAuthenticated()) {
        f7.tab.show('#view-ev-sessions');
      }
    });

    // Friendly display name derived from the first label in the domain.
    const tenantName = computed(() => {
      if (!tenant.value) return '';
      const sub = tenant.value.split('.')[0];
      return sub.charAt(0).toUpperCase() + sub.slice(1);
    });

    // Shows the fully-resolved domain beneath the input when it differs from what was typed.
    const resolvedHint = computed(() => {
      const raw = domain.value.trim();
      if (!raw) return '';
      const resolved = resolveDomain(raw);
      return resolved !== raw.toLowerCase() ? resolved : '';
    });

    // ── Step 1 ──────────────────────────────────────────────────────────────

    const handleContinue = () => {
      error.value = '';
      const raw = domain.value.trim();
      if (!raw) return;
      tenant.value = resolveDomain(raw);
      step.value = 'credentials';
    };

    const skipToCredentials = () => {
      error.value = '';
      tenant.value = '';
      step.value = 'credentials';
    };

    const backToDomain = () => {
      error.value = '';
      step.value = 'domain';
      nextTick(() => domainInput.value?.focus());
    };

    // ── Step 2 ──────────────────────────────────────────────────────────────

    const handleLogin = async () => {
      error.value = '';

      if (!email.value.trim() || !password.value) {
        error.value = 'Please enter your email and password.';
        return;
      }

      loading.value = true;

      try {
        await login(email.value.trim(), password.value, tenant.value || undefined);
        f7.tab.show('#view-ev-sessions');
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'An unexpected error occurred.';
      } finally {
        loading.value = false;
      }
    };

    const goToRegister = () => {
      f7.views.main.router.navigate('/register/');
    };

    return {
      step, domain, tenant, tenantName, resolvedHint,
      email, password, showPass, loading, focused, error,
      domainInput,
      handleContinue, skipToCredentials, backToDomain, handleLogin, goToRegister,
    };
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

.cp-login-page {
  /* ── Design tokens ── */
  --cp-bg:        #0A0816;
  --cp-surface:   #130F24;
  --cp-field:     #1A1535;
  --cp-border:    rgba(145, 132, 217, 0.15);
  --cp-purple:    #9184D9;
  --cp-purple-l:  #C0B0F5;
  --cp-amber:     #E8A548;
  --cp-text:      #EAE5FC;
  --cp-muted:     #6A6090;

  font-family: 'Outfit', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;

  &.page { --f7-page-bg-color: var(--cp-bg); }

  .page-content {
    background: var(--cp-bg) !important;
    overflow-x: hidden;
  }

  /* ── Background ── */
  .cp-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;

    background-image: radial-gradient(
      circle,
      rgba(145, 132, 217, 0.1) 1px,
      transparent 1px
    );
    background-size: 26px 26px;
  }

  .cp-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);

    &--a {
      width: 340px;
      height: 340px;
      background: #9184D9;
      opacity: 0.2;
      top: -90px;
      right: -90px;
      animation: cpDrift 11s ease-in-out infinite alternate;
    }

    &--b {
      width: 220px;
      height: 220px;
      background: #E8A548;
      opacity: 0.1;
      bottom: -70px;
      left: -70px;
      animation: cpDrift 15s ease-in-out infinite alternate-reverse;
    }
  }

  @keyframes cpDrift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(22px, 18px) scale(1.08); }
  }

  /* ── Body layout ── */
  .cp-body {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding:
      max(env(safe-area-inset-top, 0px), 40px)
      22px
      max(env(safe-area-inset-bottom, 0px), 40px);
  }

  /* ── Brand ── */
  .cp-brand {
    text-align: center;
    margin-bottom: 30px;
    animation: cpRise 0.5s cubic-bezier(.22, 1, .36, 1) both;
  }

  .cp-brand-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 16px;
    filter: drop-shadow(0 0 26px rgba(145, 132, 217, 0.55));
  }

  .cp-brand-logo {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 16px;
  }

  .cp-brand-name {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--cp-text);
    margin: 0 0 5px;
    line-height: 1.1;
  }

  .cp-brand-tagline {
    font-size: 14px;
    font-weight: 400;
    color: var(--cp-muted);
    margin: 0;
    letter-spacing: 0.01em;
  }

  /* ── Card ── */
  .cp-card {
    width: 100%;
    max-width: 390px;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 22px;
    padding: 26px 20px 22px;
    animation: cpRise 0.5s 0.07s cubic-bezier(.22, 1, .36, 1) both;
    overflow: hidden;
  }

  .cp-card-header {
    margin-bottom: 20px;
  }

  .cp-card-title {
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--cp-text);
    margin: 0 0 3px;
  }

  .cp-card-desc {
    font-size: 14px;
    color: var(--cp-muted);
    margin: 0;
  }

  /* ── Step transition ── */
  .cp-step-enter-active,
  .cp-step-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .cp-step-enter-from { opacity: 0; transform: translateX(18px); }
  .cp-step-leave-to   { opacity: 0; transform: translateX(-18px); }

  /* ── Tenant pill ── */
  .cp-tenant-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(145, 132, 217, 0.12);
    border: 1px solid rgba(145, 132, 217, 0.25);
    border-radius: 999px;
    padding: 4px 10px 4px 8px;
    margin-bottom: 14px;

    i.f7-icons {
      font-size: 13px;
      color: var(--cp-purple-l);
      flex-shrink: 0;
    }
  }

  .cp-tenant-pill-domain {
    font-size: 12px;
    font-weight: 600;
    color: var(--cp-purple-l);
    letter-spacing: 0.01em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cp-tenant-change {
    background: none;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    color: var(--cp-muted);
    margin-left: 2px;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s ease;

    i.f7-icons { font-size: 14px; }
    &:hover, &:active { color: var(--cp-purple-l); }
  }

  /* ── Form ── */
  .cp-form {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
  }

  /* ── Input fields ── */
  .cp-field {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--cp-field);
    border: 1.5px solid transparent;
    border-radius: 13px;
    padding: 11px 13px;
    margin-bottom: 10px;
    position: relative;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &--has-action { padding-right: 44px; }

    &--focused {
      border-color: var(--cp-purple);
      box-shadow: 0 0 0 3px rgba(145, 132, 217, 0.13);

      .cp-field-icon { color: var(--cp-purple-l); }
    }
  }

  .cp-field-icon {
    flex-shrink: 0;
    color: var(--cp-muted);
    display: flex;
    align-items: center;
    transition: color 0.2s ease;

    i.f7-icons { font-size: 17px; line-height: 1; }
  }

  .cp-field-body {
    flex: 1;
    min-width: 0;
  }

  .cp-field-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cp-muted);
    margin-bottom: 2px;
    cursor: pointer;
  }

  .cp-field-body input {
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
    -webkit-appearance: none;

    &::placeholder { color: rgba(106, 96, 144, 0.55); }
  }

  .cp-eye-btn {
    position: absolute;
    right: 13px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    outline: none;
    color: var(--cp-muted);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    -webkit-tap-highlight-color: transparent;

    i.f7-icons { font-size: 17px; }
    &:active { color: var(--cp-purple-l); }
  }

  /* ── Domain resolution hint ── */
  .cp-domain-hint {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: var(--cp-purple-l);
    margin: -4px 0 10px 2px;

    i.f7-icons { font-size: 13px; flex-shrink: 0; }
  }

  /* ── Skip link ── */
  .cp-skip-btn {
    background: none;
    border: none;
    outline: none;
    cursor: pointer;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--cp-muted);
    text-align: center;
    margin-top: 12px;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s ease;

    &:hover, &:active { color: var(--cp-purple-l); }
  }

  /* ── Forgot ── */
  .cp-forgot {
    align-self: flex-end;
    font-size: 13px;
    font-weight: 600;
    color: var(--cp-amber);
    text-decoration: none;
    margin-bottom: 20px;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Inline error ── */
  .cp-error {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(224, 122, 138, 0.1);
    border: 1px solid rgba(224, 122, 138, 0.25);
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #E07A8A;
    line-height: 1.4;

    i.f7-icons { font-size: 15px; flex-shrink: 0; }
  }

  /* ── Submit button ── */
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
    letter-spacing: 0.01em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease;

    &:active {
      transform: scale(0.975);
      box-shadow: 0 2px 12px rgba(145, 132, 217, 0.25);
    }

    &:disabled { opacity: 0.45; cursor: not-allowed; }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        transparent 25%,
        rgba(255, 255, 255, 0.18) 50%,
        transparent 75%
      );
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }

    &:not(:disabled):not(.cp-submit--loading):hover::after {
      transform: translateX(100%);
    }
  }

  .cp-submit-label { line-height: 1; }

  .cp-submit-spinner {
    font-size: 22px !important;
    line-height: 1;
    animation: cpSpin 0.72s linear infinite;
  }

  @keyframes cpSpin { to { transform: rotate(360deg); } }

  /* ── Register prompt ── */
  .cp-register {
    margin-top: 22px;
    font-size: 14px;
    font-weight: 400;
    color: var(--cp-muted);
    text-align: center;
    animation: cpRise 0.5s 0.14s cubic-bezier(.22, 1, .36, 1) both;
  }

  .cp-register-link {
    font-weight: 700;
    color: var(--cp-amber);
    text-decoration: none;
    margin-left: 4px;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Entry animation ── */
  @keyframes cpRise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .cp-brand,
    .cp-card,
    .cp-register  { animation: none; opacity: 1; }
    .cp-blob      { animation: none; }
    .cp-submit-spinner { animation: none; }
    .cp-submit::after  { display: none; }
    .cp-step-enter-active,
    .cp-step-leave-active { transition: none; }
  }
}
</style>
