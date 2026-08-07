<template>
  <f7-page name="people" class="cp-people-page" @page:beforein="loadAll">

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
        <button v-if="query" class="cp-search-clear" @click="clearQuery">
          <i class="f7-icons">xmark_circle_fill</i>
        </button>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="cp-tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['cp-tab-btn', { 'cp-tab-btn--active': activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="!loading && tab.count > 0" class="cp-tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cp-loading-state">
      <div class="cp-spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="cp-error-state">
      <i class="f7-icons">exclamationmark_triangle_fill</i>
      <p>{{ error }}</p>
      <button class="cp-retry-btn" @click="loadAll">Try again</button>
    </div>

    <template v-else>
      <!-- All tab -->
      <div v-show="activeTab === 'all'">
        <div v-if="allItems.length" class="cp-list">
          <div
            v-for="(item, idx) in allItems"
            :key="item.uid"
            class="cp-person"
            :class="{ 'cp-person--last': idx === allItems.length - 1 }"
          >
            <div class="cp-avatar" :style="{ background: avatarColor(item.first_name, item.last_name) }">
              {{ initials(item.first_name, item.last_name) }}
            </div>
            <div class="cp-person-info">
              <span class="cp-person-name">{{ item.first_name }} {{ item.last_name }}</span>
              <span class="cp-person-sub">{{ item.sub }}</span>
            </div>
            <div class="cp-person-end">
              <span :class="['cp-kind-badge', `cp-kind-badge--${item.kind}`]">{{ kindLabel(item.kind) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="cp-empty">No results found.</div>
      </div>

      <!-- Members tab -->
      <div v-show="activeTab === 'members'">
        <div v-if="filteredPeople.length" class="cp-list">
          <div
            v-for="(person, idx) in filteredPeople"
            :key="person.id"
            class="cp-person"
            :class="{ 'cp-person--last': idx === filteredPeople.length - 1 }"
          >
            <div class="cp-avatar" :style="{ background: avatarColor(person.first_name, person.last_name) }">
              {{ initials(person.first_name, person.last_name) }}
            </div>
            <div class="cp-person-info">
              <span class="cp-person-name">{{ person.first_name }} {{ person.last_name }}</span>
              <span class="cp-person-sub">{{ person.branch?.name ?? person.type ?? 'Member' }}</span>
            </div>
            <div class="cp-person-end">
              <span v-if="person.type" :class="['cp-badge', `cp-badge--${person.type}`]">
                {{ typeLabel(person.type) }}
              </span>
              <i v-else class="f7-icons cp-chevron">chevron_right</i>
            </div>
          </div>
        </div>
        <div v-else class="cp-empty">No members found.</div>
      </div>

      <!-- Contacts tab -->
      <div v-show="activeTab === 'contacts'">
        <div v-if="filteredContacts.length" class="cp-list">
          <div
            v-for="(contact, idx) in filteredContacts"
            :key="contact.id"
            class="cp-person"
            :class="{ 'cp-person--last': idx === filteredContacts.length - 1 }"
          >
            <div class="cp-avatar" :style="{ background: avatarColor(contact.first_name, contact.last_name) }">
              {{ initials(contact.first_name, contact.last_name) }}
            </div>
            <div class="cp-person-info">
              <span class="cp-person-name">{{ contact.first_name }} {{ contact.last_name }}</span>
              <span class="cp-person-sub">{{ contact.branch?.name ?? contact.contact_source ?? 'Contact' }}</span>
            </div>
            <div class="cp-person-end">
              <span v-if="contact.stage" :class="['cp-badge', `cp-badge--stage-${contact.stage}`]">
                {{ stageLabel(contact.stage) }}
              </span>
              <i v-else class="f7-icons cp-chevron">chevron_right</i>
            </div>
          </div>
        </div>
        <div v-else class="cp-empty">No contacts found.</div>
      </div>

      <!-- Ev Contacts tab -->
      <div v-show="activeTab === 'ev_contacts'">
        <div v-if="filteredEvContacts.length" class="cp-list">
          <div
            v-for="(ec, idx) in filteredEvContacts"
            :key="ec.id"
            class="cp-person"
            :class="{ 'cp-person--last': idx === filteredEvContacts.length - 1 }"
          >
            <div class="cp-avatar" :style="{ background: avatarColor(ec.first_name, ec.last_name) }">
              {{ initials(ec.first_name, ec.last_name) }}
            </div>
            <div class="cp-person-info">
              <span class="cp-person-name">{{ ec.first_name }} {{ ec.last_name }}</span>
              <span class="cp-person-sub">{{ ec.session?.location ?? 'Evangelism' }}</span>
            </div>
            <div class="cp-person-end">
              <span v-if="ec.outcome" :class="['cp-badge', `cp-badge--outcome-${ec.outcome}`]">
                {{ outcomeLabel(ec.outcome) }}
              </span>
              <i v-else class="f7-icons cp-chevron">chevron_right</i>
            </div>
          </div>
        </div>
        <div v-else class="cp-empty">No evangelism contacts found.</div>
      </div>
    </template>

  </f7-page>
</template>

<script lang="ts" setup>
import { useChurchPanelPeople } from './useChurchPanelPeople';

defineOptions({ name: 'PeoplePage' });

const {
  query,
  activeTab,
  loading,
  error,
  tabs,
  allItems,
  filteredPeople,
  filteredContacts,
  filteredEvContacts,
  initials,
  avatarColor,
  typeLabel,
  stageLabel,
  outcomeLabel,
  kindLabel,
  loadAll,
  clearQuery,
} = useChurchPanelPeople();
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

  .cp-search-clear {
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--m-text-3);

    .f7-icons { font-size: 17px; }
  }

  /* ── Tab bar ── */
  .cp-tab-bar {
    display: flex;
    gap: 4px;
    padding: 0 var(--m-sp-4) var(--m-sp-3);
    overflow-x: auto;

    &::-webkit-scrollbar { display: none; }
  }

  .cp-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px var(--m-sp-4);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    border: 1.5px solid var(--m-border);
    background: var(--m-surface);
    color: var(--m-text-2);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;

    &--active {
      background: var(--m-accent);
      color: #fff;
      border-color: var(--m-accent);

      .cp-tab-count {
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
      }
    }
  }

  .cp-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(145, 132, 217, 0.12);
    color: var(--m-accent);
    line-height: 1;
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
  .cp-badge,
  .cp-kind-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 9px;
    border-radius: 999px;
  }

  /* Member/person type badges */
  .cp-badge--member  { background: #E8F7EE; color: #27A155; }
  .cp-badge--leader  { background: #EDE9F9; color: #9184D9; }
  .cp-badge--visitor { background: #FEF3E2; color: #D4880A; }

  /* Contact stage badges */
  .cp-badge--stage-new          { background: #EFF6FF; color: #3B82F6; }
  .cp-badge--stage-following_up { background: #FEF3E2; color: #D4880A; }
  .cp-badge--stage-graduated    { background: #E8F7EE; color: #27A155; }

  /* Evangelism outcome badges */
  .cp-badge--outcome-interested          { background: #EFF6FF; color: #3B82F6; }
  .cp-badge--outcome-prayed              { background: #EDE9F9; color: #9184D9; }
  .cp-badge--outcome-declined            { background: #F3F4F6; color: #6B7280; }
  .cp-badge--outcome-follow_up_requested { background: #FEF3E2; color: #D4880A; }
  .cp-badge--outcome-saved               { background: #E8F7EE; color: #27A155; }

  /* Kind badges (All tab) */
  .cp-kind-badge--member     { background: #EDE9F9; color: #9184D9; }
  .cp-kind-badge--contact    { background: #EFF6FF; color: #3B82F6; }
  .cp-kind-badge--ev_contact { background: #FEF3E2; color: #D4880A; }

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
