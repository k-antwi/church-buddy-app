<template>
  <f7-page name="people" class="cp-people-page" @page:beforein="loadPeople">
    <ComingSoonOverlay />

    <f7-navbar large :sliding="false">
      <f7-nav-title sliding>People</f7-nav-title>
      <f7-nav-right>
        <f7-link class="cp-icon-btn cp-icon-btn--ghost">
          <i class="f7-icons">line_3_horizontal_decrease</i>
        </f7-link>
        <f7-link class="cp-icon-btn cp-icon-btn--primary">
          <i class="f7-icons">plus</i>
        </f7-link>
      </f7-nav-right>
      <f7-nav-title-large>People</f7-nav-title-large>
    </f7-navbar>

    <!-- Search -->
    <div class="cp-search-wrap">
      <div class="cp-search">
        <i class="f7-icons cp-search-icon">search</i>
        <input
          v-model="query"
          type="search"
          placeholder="Search people..."
          class="cp-search-input"
        />
      </div>
    </div>

    <!-- Filter chips -->
    <div class="cp-chips">
      <button
        v-for="f in filters"
        :key="f.id"
        :class="['cp-chip', { 'cp-chip--active': activeFilter === f.id }]"
        @click="activeFilter = f.id"
      >{{ f.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading-state">
      <div class="cp-spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-state">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadPeople">Try again</button>
    </div>

    <!-- People list -->
    <div v-else class="cp-list">
      <div
        v-for="(person, idx) in filteredPeople"
        :key="person.id"
        class="cp-person"
        :class="{ 'cp-person--last': idx === filteredPeople.length - 1 }"
      >
        <div class="cp-avatar" :style="{ background: avatarColor(person) }">
          {{ initials(person) }}
        </div>

        <div class="cp-person-info">
          <span class="cp-person-name">{{ person.first_name }} {{ person.last_name }}</span>
          <span class="cp-person-sub">{{ person.branch?.name ?? person.type ?? 'Member' }}</span>
        </div>

        <div class="cp-person-end">
          <span
            v-if="person.type"
            :class="['cp-badge', `cp-badge--${person.type}`]"
          >{{ typeLabel(person.type) }}</span>
          <i v-else class="f7-icons cp-chevron">chevron_right</i>
        </div>
      </div>

      <div v-if="filteredPeople.length === 0 && !loading" class="cp-empty">
        No people found.
      </div>
    </div>

  </f7-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import ComingSoonOverlay from '../../components/ComingSoonOverlay.vue';
import { fetchPeople, type MobilePerson } from '../../ts/api/people';

const query        = ref('');
const activeFilter = ref('all');
const people       = ref<MobilePerson[]>([]);
const loading      = ref(false);
const error        = ref('');

const filters = [
  { id: 'all',     label: 'All'     },
  { id: 'member',  label: 'Members' },
  { id: 'leader',  label: 'Leaders' },
  { id: 'visitor', label: 'Visitors' },
];

const AVATAR_COLORS = ['#9184D9', '#6366F1', '#10B981', '#F59E0B', '#14B8A6', '#F97168', '#E8A548'];

function initials(person: MobilePerson): string {
  return `${person.first_name[0] ?? ''}${person.last_name[0] ?? ''}`.toUpperCase();
}

function avatarColor(person: MobilePerson): string {
  const code = (person.first_name.charCodeAt(0) + person.last_name.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
}

function typeLabel(type: string): string {
  const map: Record<string, string> = { member: 'Member', leader: 'Leader', visitor: 'Visitor' };
  return map[type] ?? type;
}

const filteredPeople = computed(() => {
  let list = people.value;
  if (activeFilter.value !== 'all') {
    list = list.filter(p => p.type === activeFilter.value);
  }
  if (query.value.trim()) {
    const q = query.value.toLowerCase();
    list = list.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q),
    );
  }
  return list;
});

async function loadPeople(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    people.value = await fetchPeople();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load people.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadPeople);
</script>

<style lang="scss">
.cp-people-page {
  /* ── Search ── */
  .cp-search-wrap {
    padding: var(--m-sp-2) var(--m-sp-4) var(--m-sp-3);
  }

  .cp-search {
    display: flex;
    align-items: center;
    gap: var(--m-sp-2);
    background: var(--m-surface-2);
    border-radius: 12px;
    padding: 10px var(--m-sp-3);
  }

  .cp-search-icon {
    font-size: 17px;
    color: var(--m-text-3);
    flex-shrink: 0;
  }

  .cp-search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 15px;
    color: var(--m-text);
    line-height: 1.4;

    &::placeholder { color: var(--m-text-3); }
    &::-webkit-search-cancel-button { display: none; }
  }

  /* ── Filter chips ── */
  .cp-chips {
    display: flex;
    gap: var(--m-sp-2);
    padding: 0 var(--m-sp-4) var(--m-sp-3);
    overflow-x: auto;

    &::-webkit-scrollbar { display: none; }
  }

  .cp-chip {
    padding: 6px var(--m-sp-4);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    border: 1.5px solid transparent;
    background: transparent;
    color: var(--m-text-2);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &--active {
      background: var(--m-accent);
      color: #fff;
    }

    &:not(.cp-chip--active) {
      border-color: var(--m-border);
      background: var(--m-surface);
    }
  }

  /* ── Loading / error states ── */
  .cp-loading-state,
  .cp-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 260px;
    color: var(--m-text-3);
    font-size: 14px;
    text-align: center;
    padding: 24px;

    i.f7-icons { font-size: 40px; opacity: 0.4; }
  }

  .cp-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(145, 132, 217, 0.15);
    border-top-color: var(--m-accent, #9184D9);
    border-radius: 50%;
    animation: cpPeopleSpin 0.72s linear infinite;
  }

  @keyframes cpPeopleSpin { to { transform: rotate(360deg); } }

  .cp-retry-btn {
    background: rgba(145, 132, 217, 0.08);
    border: 1px solid rgba(145, 132, 217, 0.22);
    border-radius: 10px;
    color: var(--m-accent, #9184D9);
    font-size: 14px;
    font-weight: 600;
    padding: 10px 22px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Person list ── */
  .cp-list {
    background: var(--m-surface);
    border-radius: 16px;
    margin: 0 var(--m-sp-4);
    overflow: hidden;
  }

  .cp-person {
    display: flex;
    align-items: center;
    gap: var(--m-sp-3);
    padding: var(--m-sp-3) var(--m-sp-4);
    border-bottom: 1px solid var(--m-border);

    &--last { border-bottom: none; }
  }

  .cp-avatar {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .cp-person-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cp-person-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--m-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cp-person-sub {
    font-size: 13px;
    color: var(--m-text-2);
    text-transform: capitalize;
  }

  .cp-person-end {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .cp-chevron {
    font-size: 16px;
    color: var(--m-text-3);
  }

  /* ── Badges ── */
  .cp-badge {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;

    &--member {
      background: #E8F7EE;
      color: #27A155;
    }

    &--leader {
      background: #EDE9F9;
      color: #9184D9;
    }

    &--visitor {
      background: #FEF3E2;
      color: #D4880A;
    }
  }

  /* ── Navbar icon buttons ── */
  .cp-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;

    .f7-icons { font-size: 18px; }

    &--ghost {
      background: var(--m-surface-2);
      color: var(--m-text-2);
    }

    &--primary {
      background: var(--m-accent);
      color: #fff;
      margin-right: 0;
    }
  }

  /* ── Empty state ── */
  .cp-empty {
    padding: var(--m-sp-8) var(--m-sp-4);
    text-align: center;
    color: var(--m-text-3);
    font-size: 15px;
  }
}
</style>
