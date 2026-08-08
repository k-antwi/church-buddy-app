import { ref, reactive } from 'vue';
import { f7 } from 'framework7-vue';
import { isAuthenticated } from '../../ts/auth';
import {
  fetchSessions,
  fetchCampaigns,
  createSession,
  type EvSession,
  type Campaign,
} from '../../ts/api/evangelism-sessions';

function todayIso(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function useEvSessions() {
  const sessions = ref<EvSession[]>([]);
  const loading = ref(false);
  const error = ref('');

  const campaigns = ref<Campaign[]>([]);
  const createPopupOpen = ref(false);
  const submitting = ref(false);
  const submitError = ref('');

  const form = reactive({
    campaign_id: null as number | null,
    date: todayIso(),
    location: '',
    team_size: 1,
    notes: '',
  });

  const resetForm = () => {
    form.campaign_id = null;
    form.date = todayIso();
    form.location = '';
    form.team_size = 1;
    form.notes = '';
    submitError.value = '';
  };

  const loadSessions = async () => {
    if (!isAuthenticated()) return;
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

  const openCreatePopup = async () => {
    resetForm();
    createPopupOpen.value = true;
    if (campaigns.value.length === 0) {
      campaigns.value = await fetchCampaigns().catch(() => []);
    }
  };

  const submitCreate = async () => {
    submitError.value = '';

    if (!form.location.trim()) {
      submitError.value = 'Location is required.';
      return;
    }
    if (!form.date) {
      submitError.value = 'Date is required.';
      return;
    }

    submitting.value = true;
    try {
      const session = await createSession({
        campaign_id: form.campaign_id ?? undefined,
        date: form.date,
        location: form.location.trim(),
        team_size: form.team_size,
        notes: form.notes.trim() || undefined,
      });
      sessions.value.unshift(session);
      createPopupOpen.value = false;
      resetForm();
    } catch (err) {
      submitError.value = err instanceof Error ? err.message : 'Failed to create session.';
    } finally {
      submitting.value = false;
    }
  };

  const openSession = (id: number) => {
    f7.views.get('#view-ev-sessions')?.router.navigate(`/ev-sessions/${id}/`);
  };

  const formatDay = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').getDate().toString().padStart(2, '0');

  const formatMonth = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleString('en', { month: 'short' }).toUpperCase();

  const onTabShow = () => {
    const pageName = f7.views.current.name;
    if (pageName === 'ev-sessions') loadSessions();
  };

  return {
    sessions,
    loading,
    error,
    campaigns,
    createPopupOpen,
    submitting,
    submitError,
    form,
    loadSessions,
    openCreatePopup,
    submitCreate,
    openSession,
    formatDay,
    formatMonth,
    onTabShow,
  };
}
