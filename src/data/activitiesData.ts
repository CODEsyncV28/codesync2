import { Activity } from '../types';
import { ACTIVITIES_EUROPE } from './activitiesEurope';
import { ACTIVITIES_ASIA } from './activitiesAsia';
import { ACTIVITIES_AMERICAS } from './activitiesAmericas';
import { ACTIVITIES_ME_AFRICA_OCEANIA } from './activitiesMiddleEastAfricaOceania';

export const SEED_ACTIVITIES: Activity[] = [
  ...ACTIVITIES_EUROPE,
  ...ACTIVITIES_ASIA,
  ...ACTIVITIES_AMERICAS,
  ...ACTIVITIES_ME_AFRICA_OCEANIA,
];
