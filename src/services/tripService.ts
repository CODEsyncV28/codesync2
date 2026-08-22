import { Trip, TripStop, TripActivity, TripExpense, BudgetSummary } from '../types';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { SEED_TRIPS, SEED_ACTIVITIES } from '../data/seedData';

const LOCAL_STORAGE_TRIPS_KEY = 'globetrotter_trips_store_v5';

function getLocalTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(SEED_TRIPS));
      return SEED_TRIPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_TRIPS;
  } catch (err) {
    console.warn('Failed to parse local trips, falling back to seed:', err);
    return SEED_TRIPS;
  }
}

function saveLocalTrips(trips: Trip[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Failed to save trips locally:', err);
  }
}

// Helper to find default activities for a city so timeline is NEVER empty
function getDefaultActivitiesForCity(cityId: string, tripId: string, stopId: string, startDate?: string, endDate?: string): TripActivity[] {
  const matching = SEED_ACTIVITIES.filter((a) => a.city_id === cityId);
  const selected = matching.length > 0 ? matching.slice(0, 4) : [];
  const times = ['09:00 AM', '01:30 PM', '05:30 PM', '10:00 AM', '03:00 PM', '07:30 PM'];

  // Compute day dates
  const start = new Date(startDate || new Date().toISOString().split('T')[0]);
  const end = endDate ? new Date(endDate) : new Date(start);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  return selected.map((act, idx) => {
    // Distribute across days
    const dayOffset = Math.min(Math.floor(idx / 2), totalDays - 1);
    const actDate = new Date(start);
    actDate.setDate(start.getDate() + dayOffset);
    const dateStr = actDate.toISOString().split('T')[0];

    return {
      id: `ta-auto-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      trip_id: tripId,
      trip_stop_id: stopId,
      activity_id: act.id,
      name: act.name,
      category: act.category,
      cost: act.cost,
      duration: act.duration,
      scheduled_date: dateStr,
      scheduled_time: times[idx % times.length],
      notes: act.description,
      completed: false,
      image_url: act.image_url,
    };
  });
}

export const tripService = {
  async getAllPublicTrips(): Promise<Trip[]> {
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('is_public', '==', true));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreTrips = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
        const local = getLocalTrips().filter((t) => t.is_public);
        const map = new Map<string, Trip>();
        local.forEach((t) => map.set(t.id, t));
        firestoreTrips.forEach((t) => map.set(t.id, t));
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Firestore fetch public trips notice, using local cache:', err);
    }
    return getLocalTrips().filter((t) => t.is_public);
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    const currentUserId = userId || 'user-aarav-1';
    let firestoreTrips: Trip[] = [];
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('user_id', '==', currentUserId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        firestoreTrips = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
      }
    } catch (err) {
      console.warn('Firestore fetch user trips notice, using local cache:', err);
    }

    const local = getLocalTrips();
    const map = new Map<string, Trip>();

    // Put local trips in map
    local.forEach((t) => {
      // Include if owned by this user or created as custom/demo trip
      if (
        t.user_id === currentUserId ||
        !t.user_id ||
        t.user_id === 'user-aarav-1' ||
        t.user_id === 'demo-user-1' ||
        t.id.startsWith('trip-') ||
        currentUserId === 'user-aarav-1' ||
        currentUserId === 'demo-user-1'
      ) {
        map.set(t.id, t);
      }
    });

    // Merge in Firestore trips (overwriting local if fresher)
    firestoreTrips.forEach((t) => map.set(t.id, t));

    const result = Array.from(map.values());
    // Sort by created_at desc or start_date desc
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.start_date).getTime();
      const dateB = new Date(b.created_at || b.start_date).getTime();
      return dateB - dateA;
    });

    return result;
  },

  async getTripById(tripId: string): Promise<Trip | null> {
    try {
      const docRef = doc(db, 'trips', tripId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Trip;
      }
    } catch (err) {
      console.warn('Firestore get trip notice, using local cache:', err);
    }
    const local = getLocalTrips();
    return local.find((t) => t.id === tripId) || null;
  },

  async createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
    const newId = 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    
    // Ensure stops have non-empty activity timelines
    const stopsWithActivities = (tripData.stops || []).map((stop, sIdx) => {
      const stopId = stop.id || `stop-${Date.now()}-${sIdx}`;
      let activities = stop.activities || [];
      if (activities.length === 0 && stop.city_id) {
        activities = getDefaultActivitiesForCity(stop.city_id, newId, stopId, stop.start_date, stop.end_date);
      }
      return {
        ...stop,
        id: stopId,
        trip_id: newId,
        order_index: sIdx,
        activities,
      };
    });

    const newTrip: Trip = {
      ...tripData,
      id: newId,
      created_at: new Date().toISOString(),
      stops: stopsWithActivities,
      expenses: tripData.expenses || [],
      views_count: 0,
      currency: tripData.currency || 'USD',
      currency_symbol: tripData.currency_symbol || '$',
    };

    // Save locally
    const local = getLocalTrips();
    local.unshift(newTrip);
    saveLocalTrips(local);

    // Save to Firestore
    try {
      const docRef = doc(db, 'trips', newId);
      await setDoc(docRef, newTrip);
    } catch (err) {
      console.warn('Firestore trip save notice:', err);
    }

    return newTrip;
  },

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<Trip> {
    const local = getLocalTrips();
    const index = local.findIndex((t) => t.id === tripId);
    let updatedTrip: Trip;
    if (index !== -1) {
      updatedTrip = { ...local[index], ...updates, updated_at: new Date().toISOString() };
      local[index] = updatedTrip;
      saveLocalTrips(local);
    } else {
      throw new Error('Trip not found');
    }

    try {
      const docRef = doc(db, 'trips', tripId);
      await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore trip update notice:', err);
    }

    return updatedTrip;
  },

  async deleteTrip(tripId: string): Promise<void> {
    const local = getLocalTrips();
    const filtered = local.filter((t) => t.id !== tripId);
    saveLocalTrips(filtered);

    try {
      const docRef = doc(db, 'trips', tripId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore trip delete notice:', err);
    }
  },

  async cloneTrip(tripId: string, newUserId: string, newUserName: string): Promise<Trip> {
    const original = await this.getTripById(tripId);
    if (!original) throw new Error('Trip to clone not found');

    const clonedTripData: Omit<Trip, 'id' | 'created_at'> = {
      ...original,
      user_id: newUserId,
      user_name: newUserName,
      name: `${original.name} (My Plan)`,
      is_public: false,
      cloned_from_id: original.id,
      stops: (original.stops || []).map((stop, sIndex) => ({
        ...stop,
        id: `stop-cloned-${Date.now()}-${sIndex}`,
        trip_id: '',
        activities: (stop.activities || []).map((act, aIndex) => ({
          ...act,
          id: `act-cloned-${Date.now()}-${aIndex}`,
          trip_stop_id: '',
          trip_id: '',
          completed: false,
        })),
      })),
      expenses: (original.expenses || []).map((exp, eIndex) => ({
        ...exp,
        id: `exp-cloned-${Date.now()}-${eIndex}`,
        trip_id: '',
      })),
    };

    return this.createTrip(clonedTripData);
  },

  // Stop management
  async addStop(tripId: string, stopData: Omit<TripStop, 'id' | 'trip_id' | 'order_index'>): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const existingStops = trip.stops || [];
    const newStopId = `stop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Auto populate top spots for the city so timeline is NOT empty
    const activities = stopData.activities && stopData.activities.length > 0
      ? stopData.activities
      : getDefaultActivitiesForCity(stopData.city_id, tripId, newStopId, stopData.start_date, stopData.end_date);

    const newStop: TripStop = {
      ...stopData,
      id: newStopId,
      trip_id: tripId,
      order_index: existingStops.length,
      activities,
    };

    const updatedStops = [...existingStops, newStop];
    return this.updateTrip(tripId, { stops: updatedStops });
  },

  async updateStop(tripId: string, stopId: string, updates: Partial<TripStop>): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const updatedStops = (trip.stops || []).map((stop) =>
      stop.id === stopId ? { ...stop, ...updates } : stop
    );

    return this.updateTrip(tripId, { stops: updatedStops });
  },

  async deleteStop(tripId: string, stopId: string): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const remainingStops = (trip.stops || [])
      .filter((s) => s.id !== stopId)
      .map((s, idx) => ({ ...s, order_index: idx }));

    return this.updateTrip(tripId, { stops: remainingStops });
  },

  async reorderStops(tripId: string, reorderedStops: TripStop[]): Promise<Trip> {
    const stopsWithIndices = reorderedStops.map((s, idx) => ({
      ...s,
      order_index: idx,
    }));
    return this.updateTrip(tripId, { stops: stopsWithIndices });
  },

  // Activity management
  async addActivityToStop(
    tripId: string,
    stopId: string,
    activityData: Omit<TripActivity, 'id' | 'trip_stop_id' | 'trip_id'>
  ): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const newActivity: TripActivity = {
      ...activityData,
      id: `ta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trip_id: tripId,
      trip_stop_id: stopId,
      completed: false,
    };

    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id === stopId) {
        return {
          ...stop,
          activities: [...(stop.activities || []), newActivity],
        };
      }
      return stop;
    });

    return this.updateTrip(tripId, { stops: updatedStops });
  },

  async updateActivity(
    tripId: string,
    stopId: string,
    activityId: string,
    updates: Partial<TripActivity>
  ): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id === stopId) {
        return {
          ...stop,
          activities: (stop.activities || []).map((act) =>
            act.id === activityId ? { ...act, ...updates } : act
          ),
        };
      }
      return stop;
    });

    return this.updateTrip(tripId, { stops: updatedStops });
  },

  async deleteActivity(tripId: string, stopId: string, activityId: string): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id === stopId) {
        return {
          ...stop,
          activities: (stop.activities || []).filter((act) => act.id !== activityId),
        };
      }
      return stop;
    });

    return this.updateTrip(tripId, { stops: updatedStops });
  },

  async toggleActivityCompleted(tripId: string, stopId: string, activityId: string): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id === stopId) {
        return {
          ...stop,
          activities: (stop.activities || []).map((act) =>
            act.id === activityId ? { ...act, completed: !act.completed } : act
          ),
        };
      }
      return stop;
    });

    return this.updateTrip(tripId, { stops: updatedStops });
  },

  // Expense management
  async addExpense(tripId: string, expenseData: Omit<TripExpense, 'id' | 'trip_id'>): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const newExpense: TripExpense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trip_id: tripId,
    };

    const updatedExpenses = [...(trip.expenses || []), newExpense];
    return this.updateTrip(tripId, { expenses: updatedExpenses });
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<Trip> {
    const trip = await this.getTripById(tripId);
    if (!trip) throw new Error('Trip not found');

    const updatedExpenses = (trip.expenses || []).filter((e) => e.id !== expenseId);
    return this.updateTrip(tripId, { expenses: updatedExpenses });
  },

  // Budget calculations
  calculateBudgetSummary(trip: Trip): BudgetSummary {
    let transportPlanned = 0;
    let stayPlanned = 0;
    let activitiesPlanned = 0;

    (trip.stops || []).forEach((stop) => {
      transportPlanned += Number(stop.transport_cost_to_stop || 0);

      if (stop.start_date && stop.end_date) {
        const start = new Date(stop.start_date);
        const end = new Date(stop.end_date);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
        stayPlanned += diffDays * Number(stop.accommodation_cost_per_night || 0);
      }

      (stop.activities || []).forEach((act) => {
        activitiesPlanned += Number(act.cost || 0);
      });
    });

    // Actual expenses
    const actualByCategory = {
      transport: 0,
      stay: 0,
      activities: 0,
      meals: 0,
      other: 0,
    };

    (trip.expenses || []).forEach((exp) => {
      const cat = exp.category as keyof typeof actualByCategory;
      if (actualByCategory[cat] !== undefined) {
        actualByCategory[cat] += Number(exp.amount || 0);
      } else {
        actualByCategory.other += Number(exp.amount || 0);
      }
    });

    const totalActual = Object.values(actualByCategory).reduce((a, b) => a + b, 0);

    const plannedCategories = {
      transport: Math.max(transportPlanned, actualByCategory.transport),
      stay: Math.max(stayPlanned, actualByCategory.stay),
      activities: Math.max(activitiesPlanned, actualByCategory.activities),
      meals: actualByCategory.meals || 45 * ((trip.stops || []).length * 2 || 1),
      other: actualByCategory.other,
    };

    const totalPlanned = Object.values(plannedCategories).reduce((a, b) => a + b, 0);

    // Calculate total days
    let totalDays = 1;
    if (trip.start_date && trip.end_date) {
      const s = new Date(trip.start_date);
      const e = new Date(trip.end_date);
      totalDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
    }

    const targetBudget = Number(trip.target_budget || 0);
    const effectiveTotal = Math.max(totalPlanned, totalActual);
    const isOverBudget = targetBudget > 0 && effectiveTotal > targetBudget;
    const overBudgetAmount = isOverBudget ? effectiveTotal - targetBudget : 0;
    const dailyAverage = Math.round(effectiveTotal / totalDays);
    const variance = targetBudget - effectiveTotal;

    const categoryBreakdown: Record<string, number> = {
      'Accommodations': plannedCategories.stay,
      'Transportation': plannedCategories.transport,
      'Activities & Tours': plannedCategories.activities,
      'Food & Dining': plannedCategories.meals,
      'Miscellaneous': plannedCategories.other,
    };

    return {
      totalPlanned,
      totalActual,
      totalLoggedExpenses: totalActual,
      targetBudget,
      variance,
      categoryBreakdown,
      categories: plannedCategories,
      dailyAverage,
      totalDays,
      isOverBudget,
      overBudgetAmount,
    };
  },
};
