import { AppUser } from '../types';
export { SEED_CITIES } from './citiesData';
export { SEED_ACTIVITIES } from './activitiesData';
export { SEED_TRIPS } from './tripsData';

export const INITIAL_USERS: AppUser[] = [
  {
    uid: 'user-aarav-1',
    email: 'elena.travels@globetrotter.io',
    display_name: 'Elena Rostova',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    home_airport: 'JFK (John F. Kennedy Intl, New York)',
    currency_preference: 'USD',
    role: 'user',
    created_at: '2026-08-01T12:00:00Z',
    bio: 'World traveler, culture enthusiast & food hunter exploring global destinations.',
  },
  {
    uid: 'user-priya-2',
    email: 'priya.patel@globetrotter.io',
    display_name: 'Priya Patel',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    home_airport: 'LHR (London Heathrow, London)',
    currency_preference: 'USD',
    role: 'user',
    created_at: '2026-08-05T15:30:00Z',
    bio: 'Botanical garden lover, coastal backpacker, and slow coffee enthusiast.',
  },
  {
    uid: 'user-admin',
    email: 'admin@globetrotter.io',
    display_name: 'Marcus Vance',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    home_airport: 'SFO (San Francisco Intl, California)',
    currency_preference: 'USD',
    role: 'admin',
    created_at: '2026-07-20T08:00:00Z',
    bio: 'GlobeTrotter Lead Curator & Worldwide Destination Architect.',
  },
];
