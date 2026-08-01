<template>
  <f7-page name="people" class="cp-people-page">

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

    <!-- People list -->
    <div class="cp-list">
      <div
        v-for="(person, idx) in filteredPeople"
        :key="person.id"
        class="cp-person"
        :class="{ 'cp-person--last': idx === filteredPeople.length - 1 }"
      >
        <div class="cp-avatar" :style="{ background: person.color }">
          {{ person.initials }}
        </div>

        <div class="cp-person-info">
          <span class="cp-person-name">{{ person.name }}</span>
          <span class="cp-person-sub">{{ person.sub }}</span>
        </div>

        <div class="cp-person-end">
          <span
            v-if="person.badge"
            :class="['cp-badge', `cp-badge--${person.badge.type}`]"
          >{{ person.badge.label }}</span>
          <i v-else class="f7-icons cp-chevron">chevron_right</i>
        </div>
      </div>

      <div v-if="filteredPeople.length === 0" class="cp-empty">
        No people found.
      </div>
    </div>

  </f7-page>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const query       = ref('');
const activeFilter = ref('all');

const filters = [
  { id: 'all',     label: 'All'     },
  { id: 'members', label: 'Members' },
  { id: 'staff',   label: 'Staff'   },
];

const people = [
  {
    id: 1, initials: 'SC', name: 'Sarah Chen',   sub: 'Group Leader',  color: '#9184D9',
    badge: { label: 'Member', type: 'member' }, filter: 'members',
  },
  {
    id: 2, initials: 'JW', name: 'James Wilson', sub: 'Worship Team',  color: '#E8A548',
    badge: { label: 'Staff',  type: 'staff'  }, filter: 'staff',
  },
  {
    id: 3, initials: 'MP', name: 'Michael Park', sub: 'Alpha Group',   color: '#52A875',
    badge: null, filter: 'members',
  },
  {
    id: 4, initials: 'AK', name: 'Anna Kim',     sub: 'New visitor',   color: '#B07FCC',
    badge: { label: 'Guest',  type: 'guest'  }, filter: 'members',
  },
];

const filteredPeople = computed(() => {
  let list = people;
  if (activeFilter.value !== 'all') {
    list = list.filter(p => p.filter === activeFilter.value);
  }
  if (query.value.trim()) {
    const q = query.value.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));
  }
  return list;
});
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

    &--staff {
      background: #EDE9F9;
      color: var(--m-accent);
    }

    &--guest {
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
