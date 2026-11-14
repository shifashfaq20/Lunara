import type {
  BuildingId,
  CrewRole,
  DecisionRating,
  EmergencyId,
  GameState,
  ModifierKind,
  Resources,
} from '../types/game';
import { getPowerCapacity } from '../game/buildingManager';

export interface ChoiceEffect {
  resources?: Partial<Resources>; // deltas, clamped at 0
  crewHealth?: number; // applied to every living crew member
  crewMorale?: number;
  injureOne?: number; // health delta to one random crew member
  exposure?: number; // simulated exposure points added
  buildingCondition?: { target: BuildingId | 'target'; delta: number };
  modifiers?: { kind: ModifierKind; value: number; days: number; label: string }[];
  research?: number;
  delivery?: { inDays: number; resources: Partial<Resources>; label: string };
}

export interface EmergencyChoice {
  id: string;
  label: string;
  description: string;
  rating: DecisionRating;
  /** Paid up front; the choice is unavailable if the base cannot afford it. */
  cost?: Partial<Resources>;
  /** Repair work is cheaper with a living engineer. */
  isRepair?: boolean;
  requires?: { building?: { id: BuildingId; level: number }; role?: CrewRole; notModifier?: ModifierKind };
  effect: ChoiceEffect;
  risk?: { chance: number; effect: ChoiceEffect; message: string };
  outcome: string;
}

export interface EmergencyDefinition {
  id: EmergencyId;
  title: string;
  severity: 'warning' | 'critical';
  summary: string;
  /** Plain-language science behind the event. */
  science: string;
  /** Relative likelihood given the current state. 0 = cannot happen now. */
  weight: (state: GameState) => number;
  /** Whether the event picks one built building as its target. */
  targetsBuilding?: boolean;
  /** Applied the moment the emergency appears (before the player decides). */
  onTrigger?: ChoiceEffect;
  choices: EmergencyChoice[];
}

const built = (s: GameState, id: BuildingId) => s.buildings[id].level > 0;
const anyBuilt = (s: GameState) => Object.values(s.buildings).some((b) => b.level > 0);
const hasModifier = (s: GameState, kind: ModifierKind) => s.modifiers.some((m) => m.kind === kind);
const dailyFood = (s: GameState) => s.crew.filter((c) => c.alive).length * 1.8;

export const EMERGENCIES: Record<EmergencyId, EmergencyDefinition> = {
  solarStorm: {
    id: 'solarStorm',
    title: 'Solar storm detected',
    severity: 'critical',
    summary:
      'Forecasters on Earth report a burst of energetic particles from the Sun heading for the Moon. The base radiation index will spike today.',
    science:
      'Solar particle events are bursts of high-energy protons linked to solar flares and coronal mass ejections. With no thick atmosphere or global magnetic field, the lunar surface gets no natural protection, so crews rely on forecasts and dense shielding.',
    weight: () => 1.2,
    onTrigger: {
      modifiers: [{ kind: 'radiationSpike', value: 85, days: 1, label: 'Solar particle event' }],
    },
    choices: [
      {
        id: 'shelter',
        label: 'Move the crew into the radiation shelter',
        description: 'Everyone spends the day in the regolith-covered core. Science and surface work stop.',
        rating: 'optimal',
        requires: { building: { id: 'radiationShelter', level: 1 } },
        cost: { power: 5 },
        effect: {
          crewMorale: -4,
          modifiers: [
            { kind: 'exposureMult', value: 0.15, days: 1, label: 'Crew sheltered' },
            { kind: 'researchHalt', value: 0, days: 1, label: 'Science paused for storm' },
          ],
        },
        outcome: 'The crew waited out the storm in the shelter. Exposure stayed low.',
      },
      {
        id: 'suspend',
        label: 'Suspend outdoor activities',
        description: 'Cancel surface walks and stay deep inside the habitat, behind water tanks and supplies.',
        rating: 'acceptable',
        effect: {
          crewMorale: -2,
          modifiers: [
            { kind: 'exposureMult', value: 0.6, days: 1, label: 'Indoor operations' },
            { kind: 'researchHalt', value: 0, days: 1, label: 'Science paused for storm' },
          ],
        },
        outcome: 'Outdoor work was cancelled. The habitat walls blocked part of the storm.',
      },
      {
        id: 'continue',
        label: 'Continue normal operations',
        description: 'Keep the surface schedule to protect research progress. The crew takes the full dose.',
        rating: 'risky',
        effect: {
          research: 8,
          modifiers: [{ kind: 'exposureMult', value: 1.3, days: 1, label: 'Surface work during storm' }],
        },
        risk: {
          chance: 0.5,
          effect: { injureOne: -12, crewMorale: -5 },
          message: 'A crew member caught outside developed radiation sickness symptoms.',
        },
        outcome: 'Work continued through the storm and samples were collected.',
      },
    ],
  },

  oxygenMalfunction: {
    id: 'oxygenMalfunction',
    title: 'Oxygen generator malfunction',
    severity: 'critical',
    summary: 'An electrolysis cell stack has failed. Oxygen production is dropping.',
    science:
      'Oxygen generators split water into oxygen and hydrogen with electricity. Stations keep backups, such as stored oxygen and chemical oxygen candles, because breathing air cannot wait for a part from Earth.',
    weight: (s) => (built(s, 'oxygenGenerator') ? 1.1 : 0.5),
    choices: [
      {
        id: 'repair',
        label: 'Emergency repair of the cell stack',
        description: 'Pull the engineering team off other work and swap the failed stack now.',
        rating: 'optimal',
        isRepair: true,
        cost: { materials: 25, power: 8 },
        effect: {},
        outcome: 'The failed stack was replaced. Oxygen output is back to normal.',
      },
      {
        id: 'candles',
        label: 'Burn backup oxygen candles',
        description: 'Chemical candles release oxygen immediately, but the generator stays degraded until repaired.',
        rating: 'acceptable',
        cost: { materials: 8 },
        effect: {
          resources: { oxygen: 4 },
          buildingCondition: { target: 'oxygenGenerator', delta: -30 },
          modifiers: [{ kind: 'oxygenOutput', value: 0.6, days: 4, label: 'Generator degraded' }],
        },
        outcome: 'Oxygen candles bought time. The generator still needs a repair.',
      },
      {
        id: 'monitor',
        label: 'Reduce activity and monitor',
        description: 'Keep the crew resting to lower oxygen use and hope the stack recovers.',
        rating: 'risky',
        effect: {
          crewMorale: -6,
          modifiers: [{ kind: 'oxygenOutput', value: 0.4, days: 3, label: 'Generator failing' }],
        },
        risk: {
          chance: 0.35,
          effect: { crewHealth: -6 },
          message: 'Carbon dioxide crept up and the crew suffered headaches and fatigue.',
        },
        outcome: 'The crew rested while the generator limped along.',
      },
    ],
  },

  waterLeak: {
    id: 'waterLeak',
    title: 'Water line leaking',
    severity: 'warning',
    summary: 'A coolant-loop fitting has cracked and potable water is pooling in the utility bay.',
    science:
      'In a closed habitat every litre is precious. Leaks waste water and can damage electronics, so crews isolate and patch lines quickly.',
    weight: () => 1,
    choices: [
      {
        id: 'patch',
        label: 'Isolate and patch the line',
        description: 'Close the valves, replace the fitting and vacuum up the spill.',
        rating: 'optimal',
        isRepair: true,
        cost: { materials: 15 },
        effect: { resources: { water: -8 } },
        outcome: 'The line was patched quickly. Only a little water was lost.',
      },
      {
        id: 'divert',
        label: 'Divert flow through the recycler',
        description: 'Route the leaking loop into the recycler. Saves materials but strains the system.',
        rating: 'acceptable',
        cost: { power: 15 },
        effect: { resources: { water: -18 }, buildingCondition: { target: 'waterRecycler', delta: -10 } },
        outcome: 'Most of the water was recovered, but the recycler took some wear.',
      },
      {
        id: 'defer',
        label: 'Wait for scheduled maintenance',
        description: 'Put buckets under it and fix it later.',
        rating: 'risky',
        effect: { resources: { water: -45 }, crewMorale: -4 },
        risk: { chance: 0.4, effect: { resources: { water: -20 } }, message: 'The crack widened overnight.' },
        outcome: 'The leak was left running for a day.',
      },
    ],
  },

  powerShortage: {
    id: 'powerShortage',
    title: 'Power shortage',
    severity: 'critical',
    summary: 'Battery charge is falling faster than the arrays can recharge it.',
    science:
      'Near the lunar south pole the Sun skims the horizon, so panels can be shadowed by terrain. Bases need storage and backup power to cover dim periods.',
    weight: (s) => {
      const capacity = getPowerCapacity(s);
      return s.resources.power < capacity * 0.35 ? 2.5 : 0.4;
    },
    choices: [
      {
        id: 'fuelCells',
        label: 'Run fuel cells on reserve propellant',
        description: 'Burn reactants in the fuel cells to recharge the batteries.',
        rating: 'acceptable',
        cost: { fuel: 15 },
        effect: { resources: { power: 45 } },
        outcome: 'Fuel cells recharged the batteries.',
      },
      {
        id: 'shed',
        label: 'Shed non-critical loads',
        description: 'Switch off the lab and greenhouse lights for two days to protect life support.',
        rating: 'optimal',
        effect: {
          resources: { power: 20 },
          crewMorale: -3,
          modifiers: [
            { kind: 'researchHalt', value: 0, days: 2, label: 'Lab powered down' },
            { kind: 'greenhouseOffline', value: 0, days: 2, label: 'Greenhouse lights off' },
          ],
        },
        outcome: 'Non-essential systems were powered down. Life support is protected.',
      },
      {
        id: 'push',
        label: 'Keep all systems running',
        description: 'Accept the drain and hope sunlight improves.',
        rating: 'risky',
        effect: { resources: { power: -15 }, crewMorale: -4 },
        risk: {
          chance: 0.5,
          effect: { crewHealth: -6 },
          message: 'The habitat heaters browned out and the crew spent a cold night.',
        },
        outcome: 'Everything stayed on while the batteries drained.',
      },
    ],
  },

  foodShortage: {
    id: 'foodShortage',
    title: 'Food supplies running low',
    severity: 'warning',
    summary: 'Inventory shows less than six days of food at the current rate.',
    science:
      'Missions far from Earth cannot rely on quick resupply. Growing food and careful rationing are both part of long-duration planning.',
    weight: (s) => {
      const perDay = dailyFood(s);
      return perDay > 0 && s.resources.food < perDay * 6 ? 2.5 : 0;
    },
    choices: [
      {
        id: 'harvest',
        label: 'Emergency harvest from the greenhouse',
        description: 'Harvest every rack now. The greenhouse needs time to recover.',
        rating: 'optimal',
        requires: { building: { id: 'greenhouse', level: 1 } },
        effect: { resources: { food: 15 }, buildingCondition: { target: 'greenhouse', delta: -25 } },
        outcome: 'An early harvest topped up the pantry.',
      },
      {
        id: 'resupply',
        label: 'Request a priority cargo drop',
        description: 'Spend fuel on a landing beacon and ask Earth for a fast delivery in three days.',
        rating: 'acceptable',
        requires: { notModifier: 'commsDown' },
        cost: { fuel: 12 },
        effect: { delivery: { inDays: 3, resources: { food: 45 }, label: 'Priority food drop' } },
        outcome: 'Mission control approved a priority food drop.',
      },
      {
        id: 'ration',
        label: 'Start a ration plan',
        description: 'Cut portions by a quarter for five days.',
        rating: 'acceptable',
        effect: {
          crewMorale: -6,
          crewHealth: -2,
          modifiers: [{ kind: 'foodRation', value: 0.75, days: 5, label: 'Rationing' }],
        },
        outcome: 'Portions were reduced. The crew is hungry but supplies will last longer.',
      },
    ],
  },

  equipmentDamage: {
    id: 'equipmentDamage',
    title: 'Dust damage to equipment',
    severity: 'warning',
    summary: 'Abrasive lunar dust has worked its way into seals and moving parts.',
    science:
      'Lunar regolith is fine, sharp and clingy because it has never been smoothed by wind or water. Apollo crews found it scratched visors and jammed mechanisms.',
    weight: (s) => (anyBuilt(s) ? 1 : 0),
    targetsBuilding: true,
    choices: [
      {
        id: 'fullRepair',
        label: 'Strip down and fully repair',
        description: 'Replace the damaged seals and bearings properly.',
        rating: 'optimal',
        isRepair: true,
        cost: { materials: 25, fuel: 4 },
        effect: {},
        outcome: 'The damaged system was rebuilt with new seals.',
      },
      {
        id: 'patch',
        label: 'Field patch',
        description: 'Clean it out and tape the seals. Cheap, but some wear remains.',
        rating: 'acceptable',
        isRepair: true,
        cost: { materials: 10 },
        effect: { buildingCondition: { target: 'target', delta: -12 } },
        outcome: 'A quick patch kept the system running at reduced condition.',
      },
      {
        id: 'defer',
        label: 'Defer repairs',
        description: 'Keep operating and deal with it later.',
        rating: 'risky',
        effect: { buildingCondition: { target: 'target', delta: -35 }, crewMorale: -3 },
        outcome: 'The system kept running while the dust did its damage.',
      },
    ],
  },

  commsFailure: {
    id: 'commsFailure',
    title: 'Communication link lost',
    severity: 'warning',
    summary: 'The high-gain antenna has drifted off alignment. The link to Earth is down.',
    science:
      'Radio signals take about 1.3 seconds to travel between Earth and the Moon. Losing the link cuts off mission control support, family contact and cargo coordination.',
    weight: (s) => (hasModifier(s, 'commsDown') ? 0 : 0.9),
    choices: [
      {
        id: 'eva',
        label: 'Send a crew member out to realign it',
        description: 'A short surface walk to fix the antenna mount.',
        rating: 'optimal',
        cost: { fuel: 4 },
        effect: { exposure: 2 },
        risk: { chance: 0.2, effect: { injureOne: -8 }, message: 'The spacewalker twisted a knee on loose regolith.' },
        outcome: 'The antenna was realigned. The link is back.',
      },
      {
        id: 'backup',
        label: 'Switch to the low-bandwidth backup link',
        description: 'Uses extra power and restores a basic link after a day.',
        rating: 'acceptable',
        cost: { power: 12 },
        effect: {
          crewMorale: -2,
          modifiers: [{ kind: 'commsDown', value: 0, days: 1, label: 'Backup link only' }],
        },
        outcome: 'A slow backup link will be running by tomorrow.',
      },
      {
        id: 'wait',
        label: 'Wait for Earth to resend commands',
        description: 'No crew risk, but the base is out of contact for three days and cargo is held.',
        rating: 'risky',
        effect: { modifiers: [{ kind: 'commsDown', value: 0, days: 3, label: 'No contact with Earth' }] },
        outcome: 'The crew waited for ground control to recover the antenna remotely.',
      },
    ],
  },

  micrometeorite: {
    id: 'micrometeorite',
    title: 'Micrometeorite impact',
    severity: 'critical',
    summary: 'A tiny high-speed particle has punctured an outer module. Air is leaking slowly.',
    science:
      'Without an atmosphere to burn them up, dust-sized meteoroids hit the Moon at many kilometres per second. Habitats use layered shields that break up particles before they reach the pressure wall.',
    weight: () => 0.8,
    targetsBuilding: true,
    choices: [
      {
        id: 'seal',
        label: 'Seal the breach and inspect every module',
        description: 'Patch the hole and check the rest of the base for hidden damage.',
        rating: 'optimal',
        isRepair: true,
        cost: { materials: 30 },
        effect: { resources: { oxygen: -2 } },
        outcome: 'The breach was sealed and no other damage was found.',
      },
      {
        id: 'patch',
        label: 'Apply a temporary patch',
        description: 'Stops most of the leak. The damaged module loses some condition.',
        rating: 'acceptable',
        isRepair: true,
        cost: { materials: 10 },
        effect: { resources: { oxygen: -5 }, buildingCondition: { target: 'target', delta: -20 } },
        outcome: 'A temporary patch slowed the leak.',
      },
      {
        id: 'isolate',
        label: 'Close the hatch and abandon the module',
        description: 'No materials spent, but the module is badly degraded and the crew is shaken.',
        rating: 'risky',
        effect: {
          resources: { oxygen: -3 },
          buildingCondition: { target: 'target', delta: -45 },
          crewMorale: -8,
          injureOne: -10,
        },
        outcome: 'The module was sealed off. One crew member was hurt in the rush.',
      },
    ],
  },
};

export const EMERGENCY_ORDER: EmergencyId[] = [
  'solarStorm',
  'oxygenMalfunction',
  'waterLeak',
  'powerShortage',
  'foodShortage',
  'equipmentDamage',
  'commsFailure',
  'micrometeorite',
];
