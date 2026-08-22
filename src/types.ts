export type AppScreen =
  | 'auth'
  | 'dashboard'
  | 'my-trips'
  | 'create-trip'
  | 'itinerary-builder'
  | 'itinerary-view'
  | 'city-search'
  | 'activity-search'
  | 'trip-budget'
  | 'trip-calendar'
  | 'shared-itinerary'
  | 'profile-settings'
  | 'admin-dashboard';

export type Continent =
  | 'All'
  | 'Europe'
  | 'Asia'
  | 'North America'
  | 'South America'
  | 'Middle East'
  | 'Africa'
  | 'Oceania';

export type ActivityCategory =
  | 'Sightseeing'
  | 'Food & Dining'
  | 'Culture & Museum'
  | 'Adventure'
  | 'Nature & Outdoors'
  | 'Sports & Stadiums'
  | 'Relaxation'
  | 'Nightlife'
  | 'Shopping'
  | 'Culture';

export type ExpenseCategory =
  | 'transport'
  | 'stay'
  | 'activities'
  | 'meals'
  | 'sightseeing'
  | 'shopping'
  | 'other'
  | 'Food & Dining'
  | 'Transportation'
  | 'Accommodation'
  | 'Activities & Tours'
  | 'Shopping & Souvenirs'
  | 'Miscellaneous';

export interface User {
  id?: string;
  uid?: string;
  name?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  additional_info?: string;
  photo?: string;
  photo_url?: string;
  language_preference?: string;
  home_currency?: string;
  preferred_currency?: string;
  currency_preference?: string;
  home_airport?: string;
  travel_interests?: string[];
  role?: 'user' | 'traveler' | 'admin';
  is_admin?: boolean;
  saved_destinations?: string[]; // City IDs
  created_at: string;
  bio?: string;
}

export type AppUser = User;

export interface City {
  id: string;
  name: string;
  country: string;
  continent?: string;
  region: string;
  cost_index: 1 | 2 | 3 | 4 | 5; // 1 = Budget, 5 = High Luxury
  popularity_score: number; // 1 - 100
  image_url: string;
  description: string;
  currency: string;
  currency_symbol?: string;
  avg_daily_cost: number; // in USD standard
  best_season: string;
  tagline?: string;
  country_code?: string;
  flag_emoji?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  language?: string;
  tags?: string[];
}

export interface Activity {
  id: string;
  city_id: string;
  city_name?: string;
  name: string;
  category: ActivityCategory;
  cost: number; // in USD standard
  duration: number; // in hours
  description: string;
  image_url: string;
  rating?: number;
  location_name?: string;
  address?: string;
  is_food_spot?: boolean;
  is_garden?: boolean;
  is_landmark?: boolean;
  is_sports_venue?: boolean;
  best_time_of_day?: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Lunch' | 'Dinner' | 'Sunset' | 'Anytime';
  booking_required?: boolean;
}

export interface TripActivity {
  id: string;
  trip_stop_id?: string;
  trip_id?: string;
  activity_id?: string;
  name: string;
  category: ActivityCategory;
  cost: number;
  duration: number; // in hours
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // e.g. "09:30 AM" or "Morning" | "Afternoon" | "Evening"
  completed?: boolean;
  is_completed?: boolean;
  notes?: string;
  image_url?: string;
}

export interface TripStop {
  id: string;
  trip_id?: string;
  city_id: string;
  city_name: string;
  country?: string;
  city_photo?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  arrival_date?: string;
  departure_date?: string;
  order_index?: number;
  order?: number;
  nights?: number;
  accommodation_name?: string;
  accommodation_cost_per_night?: number;
  accommodation?: {
    name?: string;
    address?: string;
    cost_per_night?: number;
    notes?: string;
  };
  transport_cost_to_stop?: number;
  transport_mode?: string;
  transit?: {
    mode?: string;
    cost?: number;
    departure_time?: string;
    arrival_time?: string;
    carrier?: string;
  };
  notes?: string;
  activities?: TripActivity[];
}

export interface TripExpense {
  id: string;
  trip_id: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  description: string;
  date: string;
  notes?: string;
}

export type Expense = TripExpense;

export interface TripCollaborator {
  user_id: string;
  email?: string;
  name?: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export interface Trip {
  id: string;
  user_id: string;
  user_name?: string;
  user_photo?: string;
  name?: string;
  title?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  description: string;
  cover_photo?: string;
  cover_image_url?: string;
  is_public?: boolean;
  visibility?: 'public' | 'private' | 'unlisted';
  is_template?: boolean;
  tags?: string[];
  target_budget?: number;
  budget_total?: number;
  created_at: string;
  updated_at?: string;
  stops?: TripStop[];
  expenses?: TripExpense[];
  views_count?: number;
  cloned_from_id?: string;
  status?: string;
  currency?: string;
  currency_symbol?: string;
  collaborators?: TripCollaborator[];
}

export interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  totalLoggedExpenses: number;
  targetBudget: number;
  variance: number;
  categoryBreakdown: Record<string, number>;
  categories: {
    transport: number;
    stay: number;
    activities: number;
    meals: number;
    other: number;
  };
  dailyAverage: number;
  totalDays: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
}
