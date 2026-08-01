<template>
  <f7-page no-navbar no-toolbar name="register" class="cp-login-page">

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

          <!-- ── Request form ── -->
          <div v-if="!submitted" key="form">
            <header class="cp-card-header">
              <h2 class="cp-card-title">Request access</h2>
              <p class="cp-card-desc">Your church admin will review your request and send you an invitation.</p>
            </header>

            <form class="cp-form" @submit.prevent="handleSubmit" novalidate>

              <!-- Workspace slug -->
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'workspace' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">building_2_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-workspace">Church workspace</label>
                  <input
                    id="cp-workspace"
                    v-model="form.workspace_slug"
                    type="text"
                    inputmode="url"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="none"
                    spellcheck="false"
                    placeholder="christrends"
                    @focus="focused = 'workspace'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Full name -->
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'name' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">person_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-name">Full name</label>
                  <input
                    id="cp-name"
                    v-model="form.full_name"
                    type="text"
                    autocomplete="name"
                    autocapitalize="words"
                    placeholder="John Mensah"
                    @focus="focused = 'name'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'email' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">envelope_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-email">Email address</label>
                  <input
                    id="cp-email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    inputmode="email"
                    placeholder="john@yourchurch.org"
                    @focus="focused = 'email'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Mobile number -->
              <div class="cp-field" :class="{ 'cp-field--focused': focused === 'mobile' }">
                <span class="cp-field-icon" aria-hidden="true">
                  <i class="f7-icons">phone_fill</i>
                </span>
                <div class="cp-field-body">
                  <label class="cp-field-label" for="cp-mobile">Mobile number</label>
                  <input
                    id="cp-mobile"
                    v-model="form.mobile_number"
                    type="tel"
                    autocomplete="tel"
                    inputmode="tel"
                    placeholder="+233 24 000 0000"
                    @focus="focused = 'mobile'"
                    @blur="focused = ''"
                  />
                </div>
              </div>

              <!-- Inline error -->
              <p v-if="error" class="cp-error" role="alert">
                <i class="f7-icons">exclamationmark_circle_fill</i>
                {{ error }}
              </p>

              <button
                type="submit"
                class="cp-submit"
                :class="{ 'cp-submit--loading': loading }"
                :disabled="loading || !isFormValid"
              >
                <span v-if="!loading" class="cp-submit-label">Request Access</span>
                <i v-else class="f7-icons cp-submit-spinner">arrow_2_circlepath</i>
              </button>

            </form>
          </div>

          <!-- ── Success state ── -->
          <div v-else key="success" class="cp-success">
            <div class="cp-success-icon" aria-hidden="true">
              <i class="f7-icons">checkmark_circle_fill</i>
            </div>
            <h2 class="cp-card-title">Request submitted!</h2>
            <p class="cp-card-desc">
              Your request has been sent to <strong>{{ form.workspace_slug }}</strong>.
              The church admin will review it and send you an invitation to set up your account.
            </p>
          </div>

        </Transition>
      </div>

      <!-- Back to login -->
      <p class="cp-register">
        Already have an account?
        <a href="#" class="cp-register-link" @click.prevent="goToLogin">Sign in</a>
      </p>

    </div>
  </f7-page>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
import { f7 } from 'framework7-vue';
import { submitAccessRequest } from '../../ts/api/access-requests';

export default {
  name: 'RegisterPage',

  setup() {
    const form = ref({
      workspace_slug: '',
      full_name:      '',
      email:          '',
      mobile_number:  '',
    });

    const loading   = ref(false);
    const focused   = ref('');
    const error     = ref('');
    const submitted = ref(false);

    const isFormValid = computed(() =>
      form.value.workspace_slug.trim() !== '' &&
      form.value.full_name.trim() !== '' &&
      form.value.email.trim() !== '' &&
      form.value.mobile_number.trim() !== '',
    );

    const handleSubmit = async () => {
      error.value = '';

      if (!isFormValid.value) {
        error.value = 'Please fill in all fields.';
        return;
      }

      loading.value = true;

      try {
        await submitAccessRequest({
          workspace_slug: form.value.workspace_slug.trim().toLowerCase(),
          full_name:      form.value.full_name.trim(),
          email:          form.value.email.trim(),
          mobile_number:  form.value.mobile_number.trim(),
        });

        submitted.value = true;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'An unexpected error occurred.';
      } finally {
        loading.value = false;
      }
    };

    const goToLogin = () => {
      f7.views.main.router.navigate('/', { reloadCurrent: true });
    };

    return {
      form,
      loading,
      focused,
      error,
      submitted,
      isFormValid,
      handleSubmit,
      goToLogin,
    };
  },
};
</script>

<style lang="scss">
/* Reuses all .cp-* tokens defined in login.vue — they share the same scope
   because both pages mount on .cp-login-page. Only additions are here. */

.cp-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 0 4px;
  gap: 10px;

  .cp-card-title { margin: 0; }
  .cp-card-desc  { margin: 0; }
}

.cp-success-icon {
  i.f7-icons {
    font-size: 56px;
    color: #4ade80;
    filter: drop-shadow(0 0 16px rgba(74, 222, 128, 0.4));
  }
}
</style>
