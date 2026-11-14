/** Shapes of the NASA data LUNARA displays. Only fields the app uses are typed. */

export interface SolarFlare {
  id: string;
  classType: string;
  peakTime: string;
  sourceLocation?: string;
  activeRegion?: number;
  link?: string;
}

export interface CoronalMassEjection {
  id: string;
  startTime: string;
  speedKmS?: number;
  note?: string;
  link?: string;
}

export interface SolarParticleEvent {
  id: string;
  eventTime: string;
  link?: string;
}

export interface GeomagneticStorm {
  id: string;
  startTime: string;
  maxKp?: number;
  link?: string;
}

export interface SpaceWeatherSummary {
  rangeStart: string;
  rangeEnd: string;
  flares: SolarFlare[];
  cmes: CoronalMassEjection[];
  particleEvents: SolarParticleEvent[];
  storms: GeomagneticStorm[];
  /** Feeds that failed while others succeeded. */
  unavailable: string[];
}

export interface NasaImage {
  nasaId: string;
  title: string;
  description?: string;
  dateCreated?: string;
  center?: string;
  thumbUrl: string;
}

export interface NasaResult<T> {
  data: T;
  fetchedAt: string;
  source: string;
  fromCache: boolean;
}
