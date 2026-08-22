import { City, Activity, ActivityCategory, Continent } from '../types';
import { SEED_CITIES, SEED_ACTIVITIES } from '../data/seedData';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const LOCAL_CITIES_KEY = 'globetrotter_world_cities_v8';
const LOCAL_ACTIVITIES_KEY = 'globetrotter_world_activities_v8';

// Purge legacy storage keys from previous iterations
try {
  ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'].forEach((v) => {
    localStorage.removeItem(`globetrotter_world_cities_${v}`);
    localStorage.removeItem(`globetrotter_world_activities_${v}`);
  });
  localStorage.removeItem('yatracraft_bharat_cities_v4');
  localStorage.removeItem('yatracraft_bharat_activities_v4');
  localStorage.removeItem('yatracraft_trips_store_v2');
  localStorage.removeItem('globetrotter_cities_store');
} catch (e) {
  // ignore
}

function getLocalCities(): City[] {
  try {
    const raw = localStorage.getItem(LOCAL_CITIES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CITIES_KEY, JSON.stringify(SEED_CITIES));
      return SEED_CITIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= SEED_CITIES.length) {
      return parsed;
    }
    localStorage.setItem(LOCAL_CITIES_KEY, JSON.stringify(SEED_CITIES));
    return SEED_CITIES;
  } catch {
    return SEED_CITIES;
  }
}

function saveLocalCities(cities: City[]) {
  localStorage.setItem(LOCAL_CITIES_KEY, JSON.stringify(cities));
}

function getLocalActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(SEED_ACTIVITIES));
      return SEED_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= SEED_ACTIVITIES.length) {
      return parsed;
    }
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(SEED_ACTIVITIES));
    return SEED_ACTIVITIES;
  } catch {
    return SEED_ACTIVITIES;
  }
}

function saveLocalActivities(activities: Activity[]) {
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(activities));
}

export const cityService = {
  async getAllCities(): Promise<City[]> {
    const map = new Map<string, City>();
    SEED_CITIES.forEach((c) => map.set(c.id, c));

    try {
      const local = getLocalCities();
      local.forEach((c) => {
        if (!map.has(c.id) || c.id.startsWith('city-custom-')) {
          map.set(c.id, c);
        }
      });
    } catch (e) {
      // ignore
    }

    try {
      const snap = await getDocs(collection(db, 'cities'));
      if (!snap.empty) {
        snap.docs.forEach((d) => {
          const c = { id: d.id, ...d.data() } as City;
          if (!map.has(c.id) || c.id.startsWith('city-custom-')) {
            map.set(c.id, c);
          }
        });
      }
    } catch (err) {
      console.warn('Firestore fetch cities note:', err);
    }
    const all = Array.from(map.values());
    saveLocalCities(all);
    return all;
  },

  async getCityById(id: string): Promise<City | undefined> {
    const cities = await this.getAllCities();
    return cities.find((c) => c.id === id);
  },

  async filterCities(params: {
    query?: string;
    continent?: string;
    region?: string;
    maxCostIndex?: number;
    sortBy?: 'popularity' | 'cost_asc' | 'cost_desc' | 'name';
  }): Promise<City[]> {
    let cities = await this.getAllCities();
    const allActivities = await this.getAllActivities();

    if (params.query && params.query.trim()) {
      const rawQ = params.query.toLowerCase().trim();
      
      // Tokenize and clean query
      const cleanTokens = rawQ
        .replace(/[,&+/]/g, ' and ')
        .split(/\s+/)
        .filter((t) => !['in', 'at', 'the', 'of', 'for', 'to', 'on', 'with'].includes(t));

      // Check for compound places like "maldives and bali" or "mountains"
      const mentionsAdv = rawQ.includes('adv') || rawQ.includes('adventure') || rawQ.includes('sport');
      const mentionsMountain = rawQ.includes('mountain') || rawQ.includes('alps') || rawQ.includes('himalaya') || rawQ.includes('rockies') || rawQ.includes('peak');
      const mentionsWaterSports = rawQ.includes('water sport') || rawQ.includes('water') || rawQ.includes('scuba') || rawQ.includes('div') || rawQ.includes('surf') || rawQ.includes('ocean') || rawQ.includes('beach') || rawQ.includes('snorkel');
      const mentionsParagliding = rawQ.includes('paraglid') || rawQ.includes('hang glid');

      cities = cities.filter((c) => {
        const cityText = `${c.name} ${c.country} ${c.continent || ''} ${c.region || ''} ${c.tagline || ''} ${c.tags?.join(' ') || ''} ${c.description || ''}`.toLowerCase();
        
        // Direct full string match
        if (cityText.includes(rawQ)) return true;

        // Semantic mountain adventure matching
        if (mentionsMountain && mentionsAdv) {
          if (
            ['city-interlaken', 'city-queenstown', 'city-banff', 'city-pokhara', 'city-reykjavik', 'city-cusco', 'city-vancouver', 'city-munich'].includes(c.id) ||
            cityText.includes('mountain') ||
            cityText.includes('alps') ||
            cityText.includes('rockies') ||
            cityText.includes('himalaya')
          ) {
            return true;
          }
        }

        // Semantic water sports matching
        if (mentionsWaterSports) {
          const hasWaterTag = c.tags?.some((t) => ['Water Sports', 'Scuba Diving', 'Surfing', 'Beaches', 'Ocean', 'Snorkeling', 'Marine Life'].some((w) => t.toLowerCase().includes(w.toLowerCase())));
          const isTargetIsland = ['city-maldives', 'city-bali', 'city-sydney', 'city-rio', 'city-barcelona', 'city-capetown'].includes(c.id);
          
          // If query specifically mentions places (like "maldives and bali")
          const mentionsThisCity = rawQ.includes(c.name.toLowerCase().split(' ')[0]) || rawQ.includes(c.country.toLowerCase());
          if (mentionsThisCity && (hasWaterTag || isTargetIsland || cityText.includes('beach') || cityText.includes('ocean') || cityText.includes('lagoon') || cityText.includes('surf'))) {
            return true;
          }
          if (rawQ.includes('water') && (hasWaterTag || isTargetIsland)) {
            return true;
          }
        }

        // Semantic paragliding matching
        if (mentionsParagliding && (['city-pokhara', 'city-interlaken', 'city-queenstown', 'city-capetown'].includes(c.id) || cityText.includes('paraglid'))) {
          return true;
        }

        // Check if any token matches
        const tokenMatch = cleanTokens.some((token) => token.length > 2 && cityText.includes(token));
        if (tokenMatch) return true;

        // Check if city's activities match the query
        const cityActs = allActivities.filter((a) => a.city_id === c.id);
        const actMatch = cityActs.some((a) => {
          const actText = `${a.name} ${a.description} ${a.category} ${a.location_name || ''}`.toLowerCase();
          return actText.includes(rawQ) || cleanTokens.some((token) => token.length > 3 && actText.includes(token));
        });
        return actMatch;
      });
    }

    if (params.continent && params.continent !== 'All') {
      const cont = params.continent.toLowerCase();
      cities = cities.filter(
        (c) =>
          c.continent?.toLowerCase() === cont ||
          (cont === 'middle east' && (c.continent?.toLowerCase().includes('middle east') || c.region.toLowerCase().includes('gulf')))
      );
    }

    if (params.region && params.region !== 'All') {
      cities = cities.filter((c) => c.region.toLowerCase().includes(params.region!.toLowerCase()));
    }

    if (params.maxCostIndex) {
      cities = cities.filter((c) => c.cost_index <= params.maxCostIndex!);
    }

    if (params.sortBy) {
      switch (params.sortBy) {
        case 'popularity':
          cities.sort((a, b) => b.popularity_score - a.popularity_score);
          break;
        case 'cost_asc':
          cities.sort((a, b) => a.avg_daily_cost - b.avg_daily_cost);
          break;
        case 'cost_desc':
          cities.sort((a, b) => b.avg_daily_cost - a.avg_daily_cost);
          break;
        case 'name':
          cities.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    }

    return cities;
  },

  async getAllActivities(): Promise<Activity[]> {
    const map = new Map<string, Activity>();
    // 1. Always load the full master seed catalog of 370+ spots (gardens, restaurants, stadiums, sights)
    SEED_ACTIVITIES.forEach((a) => map.set(a.id, a));

    // 2. Overlay any custom user activities from local storage
    try {
      const local = getLocalActivities();
      local.forEach((a) => {
        if (!map.has(a.id) || a.id.startsWith('act-custom-') || a.id.startsWith('custom-')) {
          map.set(a.id, a);
        }
      });
    } catch (e) {
      // ignore
    }

    // 3. Overlay Firestore documents
    try {
      const snap = await getDocs(collection(db, 'activities'));
      if (!snap.empty) {
        snap.docs.forEach((d) => {
          const act = { id: d.id, ...d.data() } as Activity;
          if (!map.has(act.id) || act.id.startsWith('act-custom-') || act.id.startsWith('custom-')) {
            map.set(act.id, act);
          }
        });
      }
    } catch (err) {
      console.warn('Firestore fetch activities note:', err);
    }

    const all = Array.from(map.values());
    saveLocalActivities(all);
    return all;
  },

  async getActivitiesForCity(cityId: string): Promise<Activity[]> {
    const activities = await this.getAllActivities();
    return activities.filter((a) => a.city_id === cityId);
  },

  async filterActivities(params: {
    cityId?: string;
    category?: ActivityCategory | 'All';
    query?: string;
    maxCost?: number;
    isFoodSpot?: boolean;
    isGarden?: boolean;
    isLandmark?: boolean;
  }): Promise<Activity[]> {
    let activities = await this.getAllActivities();

    if (params.cityId && params.cityId !== 'all') {
      activities = activities.filter((a) => a.city_id === params.cityId);
    }

    if (params.category && params.category !== 'All') {
      activities = activities.filter((a) => a.category === params.category);
    }

    if (params.query && params.query.trim()) {
      const rawQ = params.query.toLowerCase().trim();
      const cleanTokens = rawQ
        .replace(/[,&+/]/g, ' and ')
        .split(/\s+/)
        .filter((t) => !['in', 'at', 'the', 'of', 'for', 'to', 'on', 'with'].includes(t));

      const mentionsAdv = rawQ.includes('adv') || rawQ.includes('adventure') || rawQ.includes('sport');
      const mentionsMountain = rawQ.includes('mountain') || rawQ.includes('alps') || rawQ.includes('himalaya') || rawQ.includes('rockies') || rawQ.includes('peak') || rawQ.includes('altitude');
      const mentionsWaterSports = rawQ.includes('water sport') || rawQ.includes('water') || rawQ.includes('scuba') || rawQ.includes('div') || rawQ.includes('surf') || rawQ.includes('ocean') || rawQ.includes('beach') || rawQ.includes('snorkel') || rawQ.includes('jet ski');
      const mentionsParagliding = rawQ.includes('paraglid') || rawQ.includes('hang glid');

      activities = activities.filter((a) => {
        const actText = `${a.name} ${a.description} ${a.category} ${a.city_name || ''} ${a.location_name || ''}`.toLowerCase();
        
        // Direct match
        if (actText.includes(rawQ)) return true;

        // Mountain adventure matching
        if (mentionsMountain && mentionsAdv) {
          if (
            (a.is_adventure || a.category === 'Adventure' || actText.includes('trek') || actText.includes('hike') || actText.includes('paraglid') || actText.includes('glacier') || actText.includes('ski') || actText.includes('skydiv') || actText.includes('bungee')) &&
            (['city-interlaken', 'city-queenstown', 'city-banff', 'city-pokhara', 'city-reykjavik', 'city-cusco', 'city-vancouver'].includes(a.city_id) || actText.includes('mountain') || actText.includes('alp') || actText.includes('glacier') || actText.includes('rockies') || actText.includes('himalaya'))
          ) {
            return true;
          }
        }

        // Water sports matching
        if (mentionsWaterSports) {
          const isWaterActivity = a.is_adventure || actText.includes('scuba') || actText.includes('div') || actText.includes('surf') || actText.includes('snorkel') || actText.includes('jet ski') || actText.includes('lagoon') || actText.includes('raft') || actText.includes('kayak') || actText.includes('boat') || actText.includes('sailing') || actText.includes('dolphin');
          
          if (rawQ.includes('maldives') && rawQ.includes('bali')) {
            if (['city-maldives', 'city-bali'].includes(a.city_id) && isWaterActivity) return true;
          } else if (rawQ.includes('maldives')) {
            if (a.city_id === 'city-maldives' && isWaterActivity) return true;
          } else if (rawQ.includes('bali')) {
            if (a.city_id === 'city-bali' && isWaterActivity) return true;
          } else if (isWaterActivity && (['city-maldives', 'city-bali', 'city-sydney', 'city-rio', 'city-barcelona', 'city-capetown'].includes(a.city_id) || actText.includes('water'))) {
            return true;
          }
        }

        // Paragliding matching
        if (mentionsParagliding && (actText.includes('paraglid') || actText.includes('glid') || ['act-pok-1', 'act-intl-1', 'act-qt-2'].includes(a.id))) {
          return true;
        }

        // Token match
        return cleanTokens.some((token) => token.length > 2 && actText.includes(token));
      });
    }

    if (params.maxCost !== undefined) {
      activities = activities.filter((a) => a.cost <= params.maxCost!);
    }

    if (params.isFoodSpot) {
      activities = activities.filter((a) => a.is_food_spot || a.category === 'Food & Dining');
    }

    if (params.isGarden) {
      activities = activities.filter((a) => a.is_garden || a.category === 'Nature & Outdoors');
    }

    if (params.isLandmark) {
      activities = activities.filter((a) => a.is_landmark || a.category === 'Sightseeing');
    }

    return activities;
  },

  async addCity(city: City): Promise<City> {
    const local = getLocalCities();
    const updated = [city, ...local.filter((c) => c.id !== city.id)];
    saveLocalCities(updated);

    try {
      await setDoc(doc(db, 'cities', city.id), city);
    } catch (err) {
      console.warn('Firestore set city error:', err);
    }
    return city;
  },

  async addActivity(activity: Activity): Promise<Activity> {
    const local = getLocalActivities();
    const updated = [activity, ...local.filter((a) => a.id !== activity.id)];
    saveLocalActivities(updated);

    try {
      await setDoc(doc(db, 'activities', activity.id), activity);
    } catch (err) {
      console.warn('Firestore set activity error:', err);
    }
    return activity;
  },
};
