import type { CrewRole } from '../types/game';

export interface RoleDefinition {
  role: CrewRole;
  title: string;
  bonus: string;
}

/** Roles are assigned in this order as crew size grows. */
export const ROLE_ORDER: CrewRole[] = ['commander', 'engineer', 'scientist', 'medic', 'botanist', 'geologist'];

export const ROLES: Record<CrewRole, RoleDefinition> = {
  commander: { role: 'commander', title: 'Commander', bonus: 'Steadies crew morale every day.' },
  engineer: { role: 'engineer', title: 'Engineer', bonus: 'Builds 1 day faster and repairs for 25% fewer materials.' },
  scientist: { role: 'scientist', title: 'Scientist', bonus: 'Lab research +25%.' },
  medic: { role: 'medic', title: 'Flight Surgeon', bonus: 'Medical bay healing +40%.' },
  botanist: { role: 'botanist', title: 'Botanist', bonus: 'Greenhouse harvest +20%.' },
  geologist: { role: 'geologist', title: 'Geologist', bonus: 'Extra research during science pushes.' },
};

/** Fictional crew names. */
export const CREW_NAMES = [
  'Amara Okafor',
  'Lena Sorensen',
  'Rafael Ortega',
  'Mei Tanaka',
  'Arjun Mehta',
  'Sofia Haddad',
  'Noah Whitfield',
  'Ines Carvalho',
  'Kofi Mensah',
  'Hana Kowalski',
  'Yusuf Demir',
  'Clara Lindqvist',
];
