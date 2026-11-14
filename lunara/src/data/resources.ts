import type { ResourceKey } from '../types/game';

export interface ResourceMeta {
  key: ResourceKey;
  label: string;
  unit: string;
  decimals: number;
  description: string;
  /** Whether "days of supply" is meaningful for this resource. */
  consumable: boolean;
}

export const RESOURCE_META: Record<ResourceKey, ResourceMeta> = {
  oxygen: {
    key: 'oxygen',
    label: 'Oxygen',
    unit: 'kg',
    decimals: 1,
    consumable: true,
    description: 'Breathable O₂ in storage tanks. Each crew member uses about 0.84 kg a day in this simulation.',
  },
  water: {
    key: 'water',
    label: 'Water',
    unit: 'L',
    decimals: 0,
    consumable: true,
    description: 'Potable water for drinking, food preparation and hygiene. Recycling recovers most of it.',
  },
  food: {
    key: 'food',
    label: 'Food',
    unit: 'kg',
    decimals: 0,
    consumable: true,
    description: 'Packaged meals plus anything grown in the greenhouse.',
  },
  power: {
    key: 'power',
    label: 'Electricity',
    unit: 'kWh',
    decimals: 0,
    consumable: false,
    description: 'Energy stored in batteries. Solar panels recharge them; every system draws from them.',
  },
  fuel: {
    key: 'fuel',
    label: 'Fuel',
    unit: 'kg',
    decimals: 0,
    consumable: false,
    description: 'Propellant and fuel-cell reactants for rovers, excavation and the crew return reserve.',
  },
  materials: {
    key: 'materials',
    label: 'Materials',
    unit: 'kg',
    decimals: 0,
    consumable: false,
    description: 'Construction supplies and spare parts delivered by cargo landers.',
  },
};

export const RESOURCE_ORDER: ResourceKey[] = ['oxygen', 'water', 'food', 'power', 'fuel', 'materials'];

export const emptyResources = () => ({ oxygen: 0, water: 0, food: 0, power: 0, fuel: 0, materials: 0 });
