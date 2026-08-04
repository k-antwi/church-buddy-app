<template>
  <f7-page name="event-detail" class="cp-event-detail-page" @page:beforein="loadDetail">

    <f7-navbar :sliding="false" back-link="Back">
      <f7-nav-title sliding>{{ event?.title ?? 'Event' }}</f7-nav-title>
    </f7-navbar>

    <!-- Loading -->
    <div v-if="loading" class="cp-state cp-state--loading">
      <div class="cp-spinner"></div>
      <p>Loading event…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-state cp-state--error">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadDetail">Try again</button>
    </div>

    <template v-else-if="event">
      <!-- Hero header -->
      <div class="cp-detail-hero">
        <div class="cp-detail-hero__accent" :style="{ background: accentColor }"></div>
        <div class="cp-detail-hero__body">
          <div class="cp-detail-hero__date-badge">
            <span class="cp-detail-hero__day">{{ formatDay(event.start_datetime) }}</span>
            <span class="cp-detail-hero__month">{{ formatMonth(event.start_datetime) }}</span>
          </div>
          <div class="cp-detail-hero__info">
            <div class="cp-detail-hero__title">{{ event.title }}</div>
            <div class="cp-detail-hero__time">
              {{ formatTime(event.start_datetime) }}
              <template v-if="event.end_datetime"> – {{ formatTime(event.end_datetime) }}</template>
            </div>
            <div class="cp-detail-hero__tags">
              <span class="cp-status-badge" :class="`cp-status--${event.status}`">
                {{ statusLabel(event.status) }}
              </span>
              <span v-if="event.service_type" class="cp-type-badge">
                {{ event.service_type.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="cp-tab-bar" :class="{ 'cp-tab-bar--refreshing': refreshing }">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['cp-tab-btn', { 'cp-tab-btn--active': activeTab === tab.id }]"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'checkin' && totalCheckedIn > 0" class="cp-tab-count">
            {{ totalCheckedIn }}
          </span>
          <span v-if="tab.id === 'expecting' && event.attendances.length > 0" class="cp-tab-count">
            {{ event.attendances.length }}
          </span>
        </button>
      </div>

      <!-- Tab: Details -->
      <div v-show="activeTab === 'details'" class="cp-tab-content">
        <div class="cp-detail-section">
          <div v-if="event.location" class="cp-detail-row">
            <div class="cp-detail-row__icon">
              <i class="f7-icons">map_pin_fill</i>
            </div>
            <div class="cp-detail-row__body">
              <span class="cp-detail-row__label">Location</span>
              <span class="cp-detail-row__value">{{ event.location }}</span>
              <span v-if="event.location_address && event.location_address !== event.location" class="cp-detail-row__sub">
                {{ event.location_address }}
              </span>
            </div>
          </div>

          <div v-if="event.branch" class="cp-detail-row">
            <div class="cp-detail-row__icon">
              <i class="f7-icons">building_2_fill</i>
            </div>
            <div class="cp-detail-row__body">
              <span class="cp-detail-row__label">Branch</span>
              <span class="cp-detail-row__value">{{ event.branch.name }}</span>
            </div>
          </div>

          <div v-if="event.coordinator" class="cp-detail-row">
            <div class="cp-detail-row__icon">
              <i class="f7-icons">person_fill</i>
            </div>
            <div class="cp-detail-row__body">
              <span class="cp-detail-row__label">Coordinator</span>
              <span class="cp-detail-row__value">{{ event.coordinator.name }}</span>
            </div>
          </div>

          <div v-if="event.expected_attendees" class="cp-detail-row">
            <div class="cp-detail-row__icon">
              <i class="f7-icons">person_2_fill</i>
            </div>
            <div class="cp-detail-row__body">
              <span class="cp-detail-row__label">Expected Attendance</span>
              <span class="cp-detail-row__value">{{ event.expected_attendees }}</span>
            </div>
          </div>
        </div>

        <div v-if="event.description" class="cp-detail-description">
          <div class="cp-detail-description__label">About this event</div>
          <p class="cp-detail-description__text">{{ event.description }}</p>
        </div>
      </div>

      <!-- Tab: Check-In -->
      <div v-show="activeTab === 'checkin'" class="cp-tab-content">
        <!-- Stats strip -->
        <div class="cp-checkin-stats">
          <div class="cp-checkin-stat">
            <span class="cp-checkin-stat__num">{{ totalCheckedIn }}</span>
            <span class="cp-checkin-stat__lbl">Checked In</span>
          </div>
          <div class="cp-checkin-stat">
            <span class="cp-checkin-stat__num">{{ firstTimeCount }}</span>
            <span class="cp-checkin-stat__lbl">First-timers</span>
          </div>
          <div class="cp-checkin-stat">
            <span class="cp-checkin-stat__num">{{ childrenCount }}</span>
            <span class="cp-checkin-stat__lbl">Children</span>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="presentAttendances.length === 0" class="cp-state cp-state--empty">
          <i class="f7-icons">person_badge_plus</i>
          <p>No one has checked in yet.</p>
        </div>

        <!-- Checked-in list -->
        <div v-else class="cp-checkin-list">
          <div
            v-for="attendance in presentAttendances"
            :key="attendance.id"
            class="cp-checkin-card"
          >
            <div class="cp-checkin-card__avatar" :class="{ 'cp-checkin-card__avatar--child': attendance.is_child }">
              {{ initials(attendance.attendee_name) }}
            </div>
            <div class="cp-checkin-card__body">
              <div class="cp-checkin-card__name">
                {{ attendance.attendee_name ?? 'Unknown' }}
                <span v-if="attendance.first_time_visitor" class="cp-first-time-dot" title="First-time visitor"></span>
              </div>
              <div class="cp-checkin-card__meta">
                <template v-if="attendance.check_in_time">
                  {{ formatTime(attendance.check_in_time) }}
                </template>
                <template v-if="attendance.check_in_method">
                  · {{ methodLabel(attendance.check_in_method) }}
                </template>
              </div>
            </div>
            <div class="cp-checkin-card__status">
              <span class="cp-attendance-badge cp-attendance--present">Present</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Roll Call -->
      <div v-show="activeTab === 'expecting'" class="cp-tab-content">
        <!-- Generate button — visible from the day before the event until end of event day -->
        <div v-if="isCheckinWindowOpen" class="cp-generate-bar">
          <button class="cp-generate-btn" :disabled="generating" @click="handleGenerateCheckinList">
            <template v-if="generating">
              <span class="cp-generate-btn__spinner"></span>
              Generating…
            </template>
            <template v-else>
              <i class="f7-icons">person_2_fill</i>
              Generate Check-In List
            </template>
          </button>
        </div>

        <!-- Empty -->
        <div v-if="event.attendances.length === 0" class="cp-state cp-state--empty">
          <i class="f7-icons">list_bullet_clipboard</i>
          <p v-if="isCheckinWindowOpen">Tap "Generate Check-In List" to load all expected attendees.</p>
          <p v-else>The check-in list will be available from the day before the event.</p>
        </div>

        <!-- Roll call list -->
        <div v-else class="cp-checkin-list">
          <div
            v-for="attendance in event.attendances"
            :key="attendance.id"
            class="cp-swipeable-wrapper"
            @touchstart="onSwipeTouchStart($event, attendance.id, !!attendance.attendee_phone)"
            @touchmove="onSwipeTouchMove($event, attendance.id, !!attendance.attendee_phone)"
            @touchend="onSwipeTouchEnd($event, attendance.id, !!attendance.attendee_phone)"
          >
            <!-- Call action (revealed on left-swipe) -->
            <button
              v-if="attendance.attendee_phone"
              class="cp-swipe-call-btn"
              @click.stop="callAttendee(attendance)"
            >
              <i class="f7-icons">phone_fill</i>
              <span>Call</span>
            </button>

            <!-- Card -->
            <div
              class="cp-checkin-card"
              :style="swipeCardStyle(attendance.id)"
              @click="closeSwipe(attendance.id)"
            >
              <div class="cp-checkin-card__avatar" :class="{ 'cp-checkin-card__avatar--child': attendance.is_child }">
                {{ initials(attendance.attendee_name) }}
              </div>
              <div class="cp-checkin-card__body">
                <div class="cp-checkin-card__name">
                  {{ attendance.attendee_name ?? 'Unknown' }}
                  <span v-if="attendance.first_time_visitor" class="cp-first-time-dot" title="First-time visitor"></span>
                </div>
                <div class="cp-checkin-card__meta">
                  <template v-if="attendance.check_in_time">
                    {{ formatTime(attendance.check_in_time) }}
                  </template>
                </div>
              </div>
              <div class="cp-checkin-card__action">
                <button
                  v-if="attendance.attendance_status === 'present'"
                  class="cp-child-btn"
                  :class="{ 'cp-child-btn--active': attendance.is_child }"
                  :disabled="togglingChildId === attendance.id || togglingId === attendance.id || togglingFirstTimerId === attendance.id"
                  :title="attendance.is_child ? 'Mark as adult' : 'Mark as child'"
                  @click.stop="toggleIsChild(attendance)"
                >
                  <span v-if="togglingChildId === attendance.id" class="cp-toggle-btn__spinner"></span>
                  <i v-else class="f7-icons">person_crop_circle_fill</i>
                </button>
                <button
                  v-if="attendance.attendance_status === 'present'"
                  class="cp-first-timer-btn"
                  :class="{ 'cp-first-timer-btn--active': attendance.first_time_visitor }"
                  :disabled="togglingFirstTimerId === attendance.id || togglingId === attendance.id || togglingChildId === attendance.id"
                  :title="attendance.first_time_visitor ? 'Remove first-timer' : 'Mark as first-timer'"
                  @click.stop="toggleFirstTimer(attendance)"
                >
                  <span v-if="togglingFirstTimerId === attendance.id" class="cp-toggle-btn__spinner"></span>
                  <i v-else class="f7-icons">star_fill</i>
                </button>
                <button
                  class="cp-toggle-btn"
                  :class="attendance.attendance_status === 'present' ? 'cp-toggle-btn--present' : 'cp-toggle-btn--absent'"
                  :disabled="togglingId === attendance.id || togglingChildId === attendance.id || togglingFirstTimerId === attendance.id"
                  @click.stop="toggleAttendance(attendance)"
                >
                  <span v-if="togglingId === attendance.id" class="cp-toggle-btn__spinner"></span>
                  <template v-else>
                    <i class="f7-icons">{{ attendance.attendance_status === 'present' ? 'checkmark_circle_fill' : 'circle' }}</i>
                    {{ attendance.attendance_status === 'present' ? 'Present' : 'Absent' }}
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </f7-page>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  fetchEventDetail,
  generateCheckinList,
  updateAttendanceStatus,
  updateAttendanceIsChild,
  updateAttendanceFirstTimeVisitor,
  type MobileEventDetail,
  type MobileAttendance,
} from '../../ts/api/events';

const ACCENT_COLORS: Record<number, string> = {
  0: '#9184D9',
  1: '#6366F1',
  2: '#10B981',
  3: '#F59E0B',
  4: '#14B8A6',
  5: '#6366F1',
  6: '#9184D9',
};

export default {
  name: 'EventDetailPage',

  props: {
    f7route: { type: Object, required: true as const },
  },

  setup(props) {
    const eventId = Number(props.f7route.params.id);
    const event = ref<MobileEventDetail | null>(null);
    const loading = ref(false);
    const refreshing = ref(false);
    const error = ref('');
    const activeTab = ref('details');
    const generating = ref(false);
    const togglingId = ref<number | null>(null);
    const togglingChildId = ref<number | null>(null);
    const togglingFirstTimerId = ref<number | null>(null);

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

    const callAttendee = (attendance: MobileAttendance) => {
      if (!attendance.attendee_phone) return;
      window.location.href = `tel:${attendance.attendee_phone}`;
    };

    const tabs = [
      { id: 'details', label: 'Details' },
      { id: 'checkin', label: 'Check-In' },
      { id: 'expecting', label: 'Expecting' },
    ];

    const loadDetail = async () => {
      if (loading.value) return;
      loading.value = true;
      error.value = '';
      try {
        event.value = await fetchEventDetail(eventId);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load event.';
      } finally {
        loading.value = false;
      }
    };

    const refreshDetail = async () => {
      if (refreshing.value || loading.value) return;
      refreshing.value = true;
      try {
        event.value = await fetchEventDetail(eventId);
      } catch {
        // silent — keep existing data on failure
      } finally {
        refreshing.value = false;
      }
    };

    const selectTab = (id: string) => {
      activeTab.value = id;
      refreshDetail();
    };

    const handleGenerateCheckinList = async () => {
      if (generating.value || !event.value) return;
      generating.value = true;
      try {
        const attendances = await generateCheckinList(eventId);
        event.value = { ...event.value, attendances };
      } catch (err) {
        console.error(err);
      } finally {
        generating.value = false;
      }
    };

    const toggleIsChild = async (attendance: MobileAttendance) => {
      if (togglingId.value !== null || togglingChildId.value !== null || !event.value) return;
      togglingChildId.value = attendance.id;
      const newValue = !attendance.is_child;
      attendance.is_child = newValue;
      try {
        const updated = await updateAttendanceIsChild(eventId, attendance.id, newValue);
        const idx = event.value.attendances.findIndex(a => a.id === attendance.id);
        if (idx !== -1) event.value.attendances[idx] = updated;
      } catch (err) {
        attendance.is_child = !newValue;
        console.error(err);
      } finally {
        togglingChildId.value = null;
      }
    };

    const toggleFirstTimer = async (attendance: MobileAttendance) => {
      if (togglingId.value !== null || togglingChildId.value !== null || togglingFirstTimerId.value !== null || !event.value) return;
      togglingFirstTimerId.value = attendance.id;
      const newValue = !attendance.first_time_visitor;
      attendance.first_time_visitor = newValue;
      try {
        const updated = await updateAttendanceFirstTimeVisitor(eventId, attendance.id, newValue);
        const idx = event.value.attendances.findIndex(a => a.id === attendance.id);
        if (idx !== -1) event.value.attendances[idx] = updated;
      } catch (err) {
        attendance.first_time_visitor = !newValue;
        console.error(err);
      } finally {
        togglingFirstTimerId.value = null;
      }
    };

    const toggleAttendance = async (attendance: MobileAttendance) => {
      if (togglingId.value !== null || togglingChildId.value !== null || !event.value) return;
      togglingId.value = attendance.id;
      const nextStatus = attendance.attendance_status === 'present' ? 'absent' : 'present';
      const prevStatus = attendance.attendance_status;
      attendance.attendance_status = nextStatus;
      try {
        const updated = await updateAttendanceStatus(eventId, attendance.id, nextStatus);
        const idx = event.value.attendances.findIndex(a => a.id === attendance.id);
        if (idx !== -1) event.value.attendances[idx] = updated;
      } catch (err) {
        attendance.attendance_status = prevStatus;
        console.error(err);
      } finally {
        togglingId.value = null;
      }
    };

    const isCheckinWindowOpen = computed(() => {
      if (!event.value) return false;
      const now = new Date();
      const eventDate = new Date(event.value.start_datetime);
      const windowOpen = new Date(eventDate);
      windowOpen.setDate(windowOpen.getDate() - 1);
      windowOpen.setHours(0, 0, 0, 0);
      const windowClose = new Date(eventDate);
      windowClose.setHours(23, 59, 59, 999);
      return now >= windowOpen && now <= windowClose;
    });

    const accentColor = computed(() => {
      if (!event.value) return '#9184D9';
      const dow = new Date(event.value.start_datetime).getDay();
      return ACCENT_COLORS[dow] ?? '#9184D9';
    });

    const presentAttendances = computed(() =>
      event.value?.attendances.filter(a => a.attendance_status === 'present') ?? [],
    );

    const totalCheckedIn = computed(() => presentAttendances.value.length);

    const firstTimeCount = computed(() =>
      presentAttendances.value.filter(a => a.first_time_visitor).length,
    );

    const childrenCount = computed(() =>
      presentAttendances.value.filter(a => a.is_child).length,
    );

    const formatDay = (iso: string) =>
      new Date(iso).getDate().toString().padStart(2, '0');

    const formatMonth = (iso: string) =>
      new Date(iso).toLocaleString('en', { month: 'short' }).toUpperCase();

    const formatTime = (iso: string) =>
      new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });

    const statusLabel = (status: string) => ({
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }[status] ?? status);

    const methodLabel = (method: string) => ({
      manual: 'Manual',
      qr_code: 'QR Code',
      self: 'Self',
      walkin: 'Walk-in',
    }[method] ?? method);

    const attendanceStatusLabel = (status: string) => ({
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
    }[status] ?? status);

    const initials = (name: string | null): string => {
      if (!name) return '?';
      const parts = name.trim().split(' ');
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
    };

    onMounted(loadDetail);

    return {
      event,
      loading,
      refreshing,
      error,
      activeTab,
      tabs,
      selectTab,
      accentColor,
      totalCheckedIn,
      firstTimeCount,
      childrenCount,
      generating,
      togglingId,
      togglingChildId,
      togglingFirstTimerId,
      isCheckinWindowOpen,
      presentAttendances,
      loadDetail,
      toggleIsChild,
      toggleFirstTimer,
      handleGenerateCheckinList,
      toggleAttendance,
      swipeCardStyle,
      onSwipeTouchStart,
      onSwipeTouchMove,
      onSwipeTouchEnd,
      closeSwipe,
      callAttendee,
      formatDay,
      formatMonth,
      formatTime,
      statusLabel,
      methodLabel,
      attendanceStatusLabel,
      initials,
    };
  },
};
</script>

<style lang="scss">
.cp-event-detail-page {
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
  .page-content { background: var(--cp-bg) !important; padding-bottom: 32px; }

  /* ── States ── */
  .cp-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 56px 24px;
    color: var(--cp-muted);
    font-size: 14px;
    text-align: center;

    i.f7-icons { font-size: 48px; opacity: 0.4; }

    &--loading {}
    &--error {}
    &--empty { padding: 40px 24px; }
  }

  .cp-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(145, 132, 217, 0.15);
    border-top-color: var(--cp-purple);
    border-radius: 50%;
    animation: cpDetailSpin 0.72s linear infinite;
  }

  @keyframes cpDetailSpin { to { transform: rotate(360deg); } }

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

  /* ── Hero header ── */
  .cp-detail-hero {
    margin: 8px 16px 0;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    overflow: hidden;

    &__accent {
      height: 4px;
    }

    &__body {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 14px 16px 16px;
    }

    &__date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(145, 132, 217, 0.1);
      border-radius: 10px;
      padding: 8px 12px;
      flex-shrink: 0;
    }

    &__day {
      font-size: 26px;
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
      min-width: 0;
    }

    &__title {
      font-size: 17px;
      font-weight: 700;
      color: var(--cp-text);
      line-height: 1.3;
      margin-bottom: 4px;
    }

    &__time {
      font-size: 13px;
      color: var(--cp-muted);
      margin-bottom: 8px;
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  /* ── Status badge ── */
  .cp-status-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 3px 9px;
    border-radius: 999px;
    text-transform: uppercase;

    &.cp-status--scheduled { background: rgba(16, 185, 129, 0.1); color: #059669; }
    &.cp-status--completed { background: rgba(99, 102, 241, 0.1); color: #4F46E5; }
    &.cp-status--cancelled { background: rgba(107, 114, 128, 0.1); color: #4B5563; }
  }

  /* ── Service type badge ── */
  .cp-type-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    background: rgba(145, 132, 217, 0.1);
    color: var(--cp-purple-l);
  }

  /* ── Tab bar ── */
  .cp-tab-bar {
    display: flex;
    gap: 0;
    padding: 12px 16px 0;
    border-bottom: 1px solid var(--cp-border);
    transition: opacity 0.15s;

    &--refreshing { opacity: 0.6; pointer-events: none; }
  }

  .cp-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Outfit', -apple-system, sans-serif;
    color: var(--cp-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;

    &--active {
      color: var(--cp-purple-l);
      border-bottom-color: var(--cp-purple);
    }
  }

  .cp-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: rgba(145, 132, 217, 0.15);
    color: var(--cp-purple-l);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }

  /* ── Tab content ── */
  .cp-tab-content {
    padding-top: 4px;
  }

  /* ── Details section ── */
  .cp-detail-section {
    margin: 12px 16px 0;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    overflow: hidden;
  }

  .cp-detail-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--cp-border);

    &:last-child { border-bottom: none; }

    &__icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(145, 132, 217, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;

      i.f7-icons { font-size: 15px; color: var(--cp-purple); }
    }

    &__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    &__label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--cp-muted);
      text-transform: uppercase;
    }

    &__value {
      font-size: 15px;
      font-weight: 600;
      color: var(--cp-text);
    }

    &__sub {
      font-size: 12px;
      color: var(--cp-muted);
    }
  }

  /* ── Description block ── */
  .cp-detail-description {
    margin: 12px 16px 0;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    padding: 14px 16px;

    &__label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--cp-muted);
      margin-bottom: 8px;
    }

    &__text {
      font-size: 14px;
      color: var(--cp-text);
      line-height: 1.6;
      margin: 0;
    }
  }

  /* ── Check-in stats ── */
  .cp-checkin-stats {
    display: flex;
    gap: 8px;
    padding: 12px 16px 0;
  }

  .cp-checkin-stat {
    flex: 1;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 12px;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    &__num {
      font-size: 22px;
      font-weight: 800;
      color: var(--cp-text);
      line-height: 1;
    }

    &__lbl {
      font-size: 11px;
      font-weight: 600;
      color: var(--cp-muted);
      text-align: center;
    }
  }

  /* ── Check-in list ── */
  .cp-checkin-list {
    padding: 10px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cp-checkin-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--cp-surface);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    padding: 12px 14px;
    position: relative;
    z-index: 1;

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

      &--child {
        background: rgba(245, 158, 11, 0.12);
        color: #B45309;
      }
    }

    &__body {
      flex: 1;
      min-width: 0;
    }

    &__name {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 15px;
      font-weight: 600;
      color: var(--cp-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      font-size: 12px;
      color: var(--cp-muted);
      margin-top: 2px;
    }

    &__status {
      flex-shrink: 0;
    }
  }

  /* ── First-time dot ── */
  .cp-first-time-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #9184D9;
    flex-shrink: 0;
  }

  /* ── Attendance status badge ── */
  .cp-attendance-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;

    &.cp-attendance--present { background: rgba(16, 185, 129, 0.1); color: #059669; }
    &.cp-attendance--absent  { background: rgba(107, 114, 128, 0.1); color: #4B5563; }
    &.cp-attendance--late    { background: rgba(245, 158, 11, 0.1); color: #B45309; }
    &.cp-attendance--excused { background: rgba(99, 102, 241, 0.1); color: #4F46E5; }
  }

  /* ── Generate bar ── */
  .cp-generate-bar {
    padding: 12px 16px 0;
  }

  .cp-generate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 12px 20px;
    background: var(--cp-purple);
    color: #fff;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s;

    i.f7-icons { font-size: 16px; }

    &:disabled { opacity: 0.6; cursor: default; }

    &__spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: cpDetailSpin 0.72s linear infinite;
      flex-shrink: 0;
    }
  }

  /* ── Child toggle ── */
  .cp-child-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
    background: rgba(107, 114, 128, 0.08);
    flex-shrink: 0;

    i.f7-icons { font-size: 16px; color: #9CA3AF; transition: color 0.15s; }

    &--active {
      background: rgba(245, 158, 11, 0.14);
      i.f7-icons { color: #B45309; }
    }

    &:disabled { opacity: 0.45; cursor: default; }
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

  /* ── First-timer toggle ── */
  .cp-first-timer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
    background: rgba(107, 114, 128, 0.08);
    flex-shrink: 0;

    i.f7-icons { font-size: 15px; color: #9CA3AF; transition: color 0.15s; }

    &--active {
      background: rgba(145, 132, 217, 0.16);
      i.f7-icons { color: var(--cp-purple); }
    }

    &:disabled { opacity: 0.45; cursor: default; }
  }

  /* ── Toggle button ── */
  .cp-checkin-card__action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .cp-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 11px;
    font-family: 'Outfit', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 700;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;

    i.f7-icons { font-size: 14px; }

    &--present {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    &--absent {
      background: rgba(107, 114, 128, 0.1);
      color: #4B5563;
    }

    &:disabled { opacity: 0.5; cursor: default; }

    &__spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: cpDetailSpin 0.72s linear infinite;
    }
  }
}
</style>
