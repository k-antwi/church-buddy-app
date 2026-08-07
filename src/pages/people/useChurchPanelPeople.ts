import { ref, computed } from 'vue';
import { fetchPeople, fetchContacts, type MobilePerson, type MobileContact } from '../../ts/api/people';
import { fetchEvContacts, type MobileEvContact } from '../../ts/api/evangelism-sessions';

export type TabId = 'all' | 'members' | 'contacts' | 'ev_contacts';

export interface UnifiedItem {
  uid: string;
  first_name: string;
  last_name: string;
  sub: string;
  kind: 'member' | 'contact' | 'ev_contact';
}

const AVATAR_COLORS = ['#9184D9', '#6366F1', '#10B981', '#F59E0B', '#14B8A6', '#F97168', '#E8A548'];

export function useChurchPanelPeople() {
  const query      = ref('');
  const activeTab  = ref<TabId>('all');
  const loading    = ref(false);
  const error      = ref('');

  const people     = ref<MobilePerson[]>([]);
  const contacts   = ref<MobileContact[]>([]);
  const evContacts = ref<MobileEvContact[]>([]);

  function initials(firstName: string, lastName: string): string {
    return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  }

  function avatarColor(firstName: string, lastName: string): string {
    const code = ((firstName.charCodeAt(0) || 0) + (lastName.charCodeAt(0) || 0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[code];
  }

  function typeLabel(type: string): string {
    const map: Record<string, string> = { member: 'Member', leader: 'Leader', visitor: 'Visitor' };
    return map[type] ?? type;
  }

  function stageLabel(stage: string): string {
    const map: Record<string, string> = {
      new: 'New',
      following_up: 'Following Up',
      graduated: 'Graduated',
    };
    return map[stage] ?? stage;
  }

  function outcomeLabel(outcome: string): string {
    const map: Record<string, string> = {
      interested: 'Interested',
      prayed: 'Prayed',
      declined: 'Declined',
      follow_up_requested: 'Follow-up',
      saved: 'Saved',
    };
    return map[outcome] ?? outcome;
  }

  function kindLabel(kind: UnifiedItem['kind']): string {
    return kind === 'member' ? 'Member' : kind === 'contact' ? 'Contact' : 'Ev Contact';
  }

  function matchesQuery(firstName: string, lastName: string): boolean {
    if (!query.value.trim()) return true;
    const q = query.value.toLowerCase();
    return `${firstName} ${lastName}`.toLowerCase().includes(q);
  }

  const filteredPeople = computed(() =>
    people.value.filter(p => matchesQuery(p.first_name, p.last_name)),
  );

  const filteredContacts = computed(() =>
    contacts.value.filter(c => matchesQuery(c.first_name, c.last_name)),
  );

  const filteredEvContacts = computed(() =>
    evContacts.value.filter(ec => matchesQuery(ec.first_name, ec.last_name)),
  );

  const allItems = computed((): UnifiedItem[] => {
    const items: UnifiedItem[] = [
      ...filteredPeople.value.map(p => ({
        uid: `p-${p.id}`,
        first_name: p.first_name,
        last_name: p.last_name,
        sub: p.branch?.name ?? p.type ?? 'Member',
        kind: 'member' as const,
      })),
      ...filteredContacts.value.map(c => ({
        uid: `c-${c.id}`,
        first_name: c.first_name,
        last_name: c.last_name,
        sub: c.branch?.name ?? c.contact_source ?? 'Contact',
        kind: 'contact' as const,
      })),
      ...filteredEvContacts.value.map(ec => ({
        uid: `ev-${ec.id}`,
        first_name: ec.first_name,
        last_name: ec.last_name,
        sub: ec.session?.location ?? 'Evangelism',
        kind: 'ev_contact' as const,
      })),
    ];
    return items.sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    );
  });

  const tabs = computed(() => [
    { id: 'all' as TabId,         label: 'All',         count: allItems.value.length },
    { id: 'members' as TabId,     label: 'Members',     count: filteredPeople.value.length },
    { id: 'contacts' as TabId,    label: 'Contacts',    count: filteredContacts.value.length },
    { id: 'ev_contacts' as TabId, label: 'Ev Contacts', count: filteredEvContacts.value.length },
  ]);

  async function loadAll(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      [people.value, contacts.value, evContacts.value] = await Promise.all([
        fetchPeople(),
        fetchContacts(),
        fetchEvContacts(),
      ]);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load people.';
    } finally {
      loading.value = false;
    }
  }

  function clearQuery(): void {
    query.value = '';
  }

  return {
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
  };
}
