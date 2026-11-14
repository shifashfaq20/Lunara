import {
  BatteryCharging,
  Droplets,
  FlaskConical,
  Fuel,
  Orbit,
  Package,
  Radiation,
  Recycle,
  Satellite,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Sun,
  Wheat,
  Wind,
  Wrench,
  Zap,
  ZapOff,
  type LucideIcon,
} from 'lucide-react-native';
import type { BuildingId, EmergencyId, ResourceKey } from '@/types/game';

export type { LucideIcon };

export const RESOURCE_ICONS: Record<ResourceKey, LucideIcon> = {
  oxygen: Wind,
  water: Droplets,
  food: Wheat,
  power: Zap,
  fuel: Fuel,
  materials: Package,
};

export const BUILDING_ICONS: Record<BuildingId, LucideIcon> = {
  solarFarm: Sun,
  oxygenGenerator: Wind,
  waterRecycler: Recycle,
  greenhouse: Sprout,
  radiationShelter: ShieldCheck,
  batteryStorage: BatteryCharging,
  medicalBay: Stethoscope,
  researchLab: FlaskConical,
};

export const EMERGENCY_ICONS: Record<EmergencyId, LucideIcon> = {
  solarStorm: Radiation,
  oxygenMalfunction: Wind,
  waterLeak: Droplets,
  powerShortage: ZapOff,
  foodShortage: Wheat,
  equipmentDamage: Wrench,
  commsFailure: Satellite,
  micrometeorite: Orbit,
};
