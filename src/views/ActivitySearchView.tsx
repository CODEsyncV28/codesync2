import React, { useState, useEffect } from 'react';
import {
  Search,
  Compass,
  Clock,
  PlusCircle,
  Star,
  MapPin,
  Sparkles,
  Utensils,
  Landmark,
  CheckCircle2,
  TreePine,
  Trophy,
} from 'lucide-react';
import { Activity, ActivityCategory, Trip, City } from '../types';
import { cityService } from '../services/cityService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { SafeImage } from '../components/SafeImage';

const CATEGORIES: (ActivityCategory | 'All')[] = [
  'All',
  'Sightseeing',
  'Food & Dining',
  'Sports & Stadiums',
  'Culture & Museum',
  'Nature & Outdoors',
  'Adventure',
  'Shopping',
  'Relaxation',
];

interface ActivitySearchViewProps {
  onScheduleActivityToTrip?: (activity: Activity) => void;
}

export const ActivitySearchView: React.FC<ActivitySearchViewProps> = ({
  onScheduleActivityToTrip,
}) => {
  const { user } = useAuth();
  const { formatPrice, currencySymbol } = useCurrency();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'All'>('All');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'landmarks' | 'gardens' | 'sports'>('all');
  const [maxCost, setMaxCost] = useState<number>(200);

  // Quick schedule state
  const [schedulingActivity, setSchedulingActivity] = useState<Activity | null>(null);
  const [targetTripId, setTargetTripId] = useState<string>('');
  const [targetStopId, setTargetStopId] = useState<string>('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allActs, allCities, trips] = await Promise.all([
        cityService.getAllActivities(),
        cityService.getAllCities(),
        tripService.getUserTrips(user?.id || 'user-aarav-1'),
      ]);
      setActivities(allActs);
      setCities(allCities);
      setUserTrips(trips);
      setLoading(false);
    }
    loadData();
  }, [user]);

  const filteredActivities = activities.filter((act) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchName = act.name.toLowerCase().includes(q);
      const matchDesc = act.description.toLowerCase().includes(q);
      const matchCity = act.city_name?.toLowerCase().includes(q);
      const matchLoc = act.location_name?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCity && !matchLoc) return false;
    }
    if (selectedCategory !== 'All' && act.category !== selectedCategory) {
      return false;
    }
    if (selectedCityId && act.city_id !== selectedCityId) {
      return false;
    }
    if (filterType === 'food' && !act.is_food_spot && act.category !== 'Food & Dining') {
      return false;
    }
    if (filterType === 'landmarks' && !act.is_landmark && act.category !== 'Sightseeing') {
      return false;
    }
    if (filterType === 'gardens' && !act.is_garden && act.category !== 'Nature & Outdoors') {
      return false;
    }
    if (filterType === 'sports' && !act.is_sports_venue && act.category !== 'Sports & Stadiums') {
      return false;
    }
    if (act.cost > maxCost) {
      return false;
    }
    return true;
  });

  const selectedTrip = userTrips.find((t) => t.id === targetTripId);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingActivity || !targetTripId || !targetStopId) return;

    const stop = selectedTrip?.stops?.find((s) => s.id === targetStopId);
    if (!stop) return;

    await tripService.addActivityToStop(targetTripId, targetStopId, {
      activity_id: schedulingActivity.id,
      name: schedulingActivity.name,
      category: schedulingActivity.category,
      cost: schedulingActivity.cost,
      duration: schedulingActivity.duration,
      scheduled_date: stop.start_date,
      scheduled_time: 'Morning (09:30 AM)',
      notes: schedulingActivity.description,
      image_url: schedulingActivity.image_url,
    });

    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
      setSchedulingActivity(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Global Spots & Experiences Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Browse world-famous monuments, iconic dining spots, botanical gardens, and museum treasures across 25 global destinations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Search Bar & City Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="act-search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spots (e.g. Eiffel Tower, Tsukiji Sushi, Colosseum, Central Park, Supertrees, Louvre)..."
              className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="w-full sm:w-72">
            <select
              id="act-city-filter-select"
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All 25 Global Destinations</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Highlights Toggle */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Experiences ({activities.length})
          </button>

          <button
            onClick={() => setFilterType('landmarks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'landmarks'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Landmarks & Monuments</span>
          </button>

          <button
            onClick={() => setFilterType('food')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'food'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>World Cuisines & Markets</span>
          </button>

          <button
            onClick={() => setFilterType('gardens')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'gardens'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span>Gardens & Outdoors</span>
          </button>

          <button
            onClick={() => setFilterType('sports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'sports'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Sports & Stadiums</span>
          </button>
        </div>

        {/* Category Pills & Price Slider */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-bold text-slate-500">Max Entry / Cost:</span>
            <span className="font-black text-amber-700">{formatPrice(maxCost)}</span>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={maxCost}
              onChange={(e) => setMaxCost(Number(e.target.value))}
              className="accent-amber-600 w-28 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading global spots...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No experiences found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting keywords or selecting another destination.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => {
            const city = cities.find((c) => c.id === act.city_id);

            return (
              <div
                key={act.id}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <SafeImage
                      src={act.image_url}
                      alt={act.name}
                      fallbackCategory={act.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {act.category}
                      </span>
                      {act.is_landmark && (
                        <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Landmark className="w-3 h-3" /> Landmark
                        </span>
                      )}
                      {act.is_food_spot && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> Dining Spot
                        </span>
                      )}
                      {(act.is_sports_venue || act.category === 'Sports & Stadiums') && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Sports & Stadium
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs text-amber-300 font-bold flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        {act.city_name || city?.name}
                        {act.location_name ? ` • ${act.location_name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
                      {act.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{act.duration} hours</span>
                      </div>
                      <div className="font-black text-emerald-700 text-sm">
                        {act.cost === 0 ? 'Free Entry' : formatPrice(act.cost)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Add Button */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-600 font-extrabold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{act.rating?.toFixed(1) || '4.9'} / 5.0</span>
                  </div>

                  <button
                    onClick={() => {
                      if (userTrips.length > 0) {
                        setSchedulingActivity(act);
                        setTargetTripId(userTrips[0].id);
                        if (userTrips[0].stops && userTrips[0].stops.length > 0) {
                          setTargetStopId(userTrips[0].stops[0].id);
                        }
                      } else {
                        alert('Create a trip first to schedule activities!');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add To Trip Modal */}
      {schedulingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Add Spot to Trip Timeline</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select which trip and city stop to attach <span className="font-bold text-slate-800">{schedulingActivity.name}</span>
            </p>

            <form onSubmit={handleQuickAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Trip</label>
                <select
                  value={targetTripId}
                  onChange={(e) => {
                    setTargetTripId(e.target.value);
                    const t = userTrips.find((x) => x.id === e.target.value);
                    if (t && t.stops && t.stops.length > 0) {
                      setTargetStopId(t.stops[0].id);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold bg-slate-50"
                  required
                >
                  {userTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.stops?.length || 0} stops)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City Stop</label>
                <select
                  value={targetStopId}
                  onChange={(e) => setTargetStopId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold bg-slate-50"
                  required
                >
                  {selectedTrip?.stops?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.city_name} ({s.start_date})
                    </option>
                  ))}
                </select>
              </div>

              {scheduleSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully added to itinerary!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSchedulingActivity(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSuccess}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
