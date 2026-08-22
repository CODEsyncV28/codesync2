import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Globe,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Clock,
  DollarSign,
  Utensils,
  Landmark,
  Compass,
  Check,
  Search,
} from 'lucide-react';
import { City, Trip, Activity, TripActivity } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { cityService } from '../services/cityService';
import { SEED_ACTIVITIES } from '../data/seedData';
import { SafeImage } from '../components/SafeImage';

interface CreateTripViewProps {
  onBack: () => void;
  onTripCreated: (trip: Trip) => void;
  initialCityId?: string;
}

export const CreateTripView: React.FC<CreateTripViewProps> = ({
  onBack,
  onTripCreated,
  initialCityId,
}) => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Form Fields matching Screen 4 wireframe
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [tripTitle, setTripTitle] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialCityId || 'city-paris');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [targetBudget, setTargetBudget] = useState<number>(2500);
  const [tripDescription, setTripDescription] = useState('');

  // Selected Suggestions added to the trip
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [customSearchPlace, setCustomSearchPlace] = useState('');

  useEffect(() => {
    cityService.getAllCities().then((res) => {
      setCities(res);
      setLoadingCities(false);
      const chosenCityId = initialCityId || 'city-paris';
      const found = res.find((c) => c.id === chosenCityId) || res[0];
      if (found) {
        setSelectedPlaceId(found.id);
        setTripTitle(`${found.name} Exploration & Highlights`);
        setTripDescription(`Curated journey across ${found.name}, ${found.country} featuring top sights, dining, and landmarks.`);
      }
    });
  }, [initialCityId]);

  // When selected place changes, update default title and pre-select top activities
  const handlePlaceChange = (cityId: string) => {
    setSelectedPlaceId(cityId);
    const found = cities.find((c) => c.id === cityId);
    if (found) {
      setTripTitle(`${found.name} & Global Highlights`);
      setTripDescription(`Curated journey across ${found.name}, ${found.country} featuring iconic attractions.`);
      // Reset or auto-select top activities for this city
      const cityActs = SEED_ACTIVITIES.filter((a) => a.city_id === cityId);
      if (cityActs.length > 0) {
        setSelectedActivityIds(cityActs.slice(0, 3).map((a) => a.id));
      }
    }
  };

  // 6 Suggestion cards matching Screen 4 wireframe
  const suggestions: Activity[] = useMemo(() => {
    // First filter by selected place
    const forCity = SEED_ACTIVITIES.filter((a) => a.city_id === selectedPlaceId);
    if (forCity.length >= 6) {
      return forCity.slice(0, 6);
    }
    // If fewer than 6, append top worldwide iconic activities
    const others = SEED_ACTIVITIES.filter((a) => a.city_id !== selectedPlaceId);
    return [...forCity, ...others].slice(0, 6);
  }, [selectedPlaceId]);

  const toggleActivitySelection = (actId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  };

  const selectedCity = cities.find((c) => c.id === selectedPlaceId) || cities[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTitle.trim()) return;
    setSubmitting(true);

    try {
      const cityObj = selectedCity || {
        id: 'city-paris',
        name: 'Paris',
        country: 'France',
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
        avg_daily_cost: 180,
      };

      // Construct chosen activities
      const chosenActivities: TripActivity[] = selectedActivityIds
        .map((actId, idx) => {
          const raw = SEED_ACTIVITIES.find((a) => a.id === actId);
          if (!raw) return null;
          return {
            id: `ta-custom-${Date.now()}-${idx}`,
            trip_stop_id: `stop-${Date.now()}-0`,
            activity_id: raw.id,
            name: raw.name,
            category: raw.category,
            cost: raw.cost || 25,
            duration: raw.duration || 2,
            scheduled_date: startDate,
            scheduled_time: idx % 2 === 0 ? '10:00 AM' : '02:30 PM',
            completed: false,
            notes: raw.description,
            image_url: raw.image_url,
          };
        })
        .filter(Boolean) as TripActivity[];

      // Build 3 Default Sections for the Itinerary Screen
      const section2Places = chosenActivities.slice(0, 3).map((act) => ({
        id: `spot-${Date.now()}-${act.id}`,
        name: act.name,
        category: (act.category === 'Food & Dining' ? 'restaurant' : act.category === 'Culture & Museum' ? 'museum' : 'landmark') as any,
        time: act.scheduled_time || '10:00 AM',
        duration: act.duration || 2,
        cost: act.cost || 25,
        location: `${cityObj.name} Central`,
        notes: act.notes || '',
        image_url: act.image_url,
        visited: false,
      }));

      const section3Places = chosenActivities.slice(3).map((act) => ({
        id: `spot-${Date.now()}-${act.id}`,
        name: act.name,
        category: 'restaurant' as const,
        time: act.scheduled_time || '07:00 PM',
        duration: act.duration || 2,
        cost: act.cost || 45,
        location: `${cityObj.name} Gastronomy Area`,
        notes: act.notes || '',
        image_url: act.image_url,
        visited: false,
      }));

      const defaultSections = [
        {
          id: `sec-${Date.now()}-1`,
          title: `Section 1: Transit & Hotel in ${cityObj.name}`,
          type: 'stay' as const,
          description: `All the necessary information about this section. Travel arrival, check-in at central accommodation, and neighborhood orientation.`,
          start_date: startDate,
          end_date: startDate,
          budget: Math.round(Number(targetBudget) * 0.35) || 750,
          location: `${cityObj.name}, ${cityObj.country}`,
          status: 'planned' as const,
          places: [
            {
              id: `spot-${Date.now()}-hotel`,
              name: `Grand Hotel & Suites (${cityObj.name})`,
              category: 'landmark' as const,
              time: '02:00 PM Check-in',
              duration: 1,
              cost: cityObj.avg_daily_cost || 160,
              location: `${cityObj.name} Downtown`,
              notes: 'Check-in, settle luggage, and pick up local travel cards.',
              visited: false,
            },
          ],
        },
        {
          id: `sec-${Date.now()}-2`,
          title: `Section 2: Cultural Landmarks & Museum Tour`,
          type: 'activity' as const,
          description: `All the necessary information about this section. Exploring iconic highlights, guided walking tours, and cultural treasures.`,
          start_date: startDate,
          end_date: endDate,
          budget: Math.round(Number(targetBudget) * 0.4) || 850,
          location: `${cityObj.name} City Center`,
          status: 'planned' as const,
          places: section2Places.length > 0 ? section2Places : [
            {
              id: `spot-${Date.now()}-highlight-1`,
              name: `${cityObj.name} Historic Old Town & Central Square`,
              category: 'landmark' as const,
              time: '09:30 AM',
              duration: 2.5,
              cost: 15,
              location: `${cityObj.name} Center`,
              notes: 'Morning walking exploration of iconic streets and viewpoints.',
              visited: false,
            },
          ],
        },
        {
          id: `sec-${Date.now()}-3`,
          title: `Section 3: Culinary Tasting & Sunset Experiences`,
          type: 'dining' as const,
          description: `All the necessary information about this section. Local gastronomy, authentic food markets, and evening scenic viewpoints.`,
          start_date: endDate,
          end_date: endDate,
          budget: Math.round(Number(targetBudget) * 0.25) || 550,
          location: `${cityObj.name} District`,
          status: 'planned' as const,
          places: section3Places.length > 0 ? section3Places : [
            {
              id: `spot-${Date.now()}-sunset-1`,
              name: `${cityObj.name} Twilight Panoramic Lookout & Bistro`,
              category: 'viewpoint' as const,
              time: '06:30 PM',
              duration: 2,
              cost: 35,
              location: `${cityObj.name} Scenic Hilltop`,
              notes: 'Sunset viewing followed by local authentic specialties.',
              visited: false,
            },
          ],
        },
      ];

      const initialStops = [
        {
          id: `stop-${Date.now()}-0`,
          trip_id: '',
          city_id: cityObj.id,
          city_name: cityObj.name,
          country: cityObj.country,
          city_photo: cityObj.image_url,
          start_date: startDate,
          end_date: endDate,
          order_index: 0,
          accommodation_cost_per_night: cityObj.avg_daily_cost || 160,
          transport_cost_to_stop: 300,
          transport_mode: 'Flight' as const,
          activities: chosenActivities,
        },
      ];

      const created = await tripService.createTrip({
        user_id: user?.id || 'user-aarav-1',
        user_name: user?.name || 'Elena Rostova',
        user_photo: user?.photo,
        name: tripTitle.trim(),
        start_date: startDate,
        end_date: endDate,
        description:
          tripDescription.trim() ||
          `Custom planned itinerary for ${cityObj.name}, ${cityObj.country} with structured day-by-day sections.`,
        cover_photo: cityObj.image_url,
        is_public: true,
        currency: 'USD',
        currency_symbol: '$',
        target_budget: Number(targetBudget) || 2500,
        stops: initialStops,
        sections: defaultSections,
      });

      setSubmitting(false);
      onTripCreated(created);
    } catch (err) {
      console.error('Failed to create trip:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 pb-20 space-y-8">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="create-trip-back-btn"
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create a new Trip
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Set trip details and select suggestions for places & activities
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300/40">
          <Globe className="w-3.5 h-3.5" />
          Step 1 of 2 &rarr; Itinerary Builder
        </span>
      </div>

      {/* Top Form Container: "Plan a new trip" (Screen 4 Wireframe) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Plan a new trip
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Fill out your trip title, place selection, and travel dates
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Row 1: Trip Name / Start Date title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Trip Title / Name : <span className="text-rose-500">*</span>
            </label>
            <input
              id="trip-title-input"
              type="text"
              required
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              placeholder="e.g. Paris & Western Europe Highlights"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Row 2: Select a Place : (Screen 4 wireframe) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select a Place : <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <select
                  id="select-place-dropdown"
                  value={selectedPlaceId}
                  onChange={(e) => handlePlaceChange(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.country} ({city.continent || city.region}) - ${city.avg_daily_cost}/day
                    </option>
                  ))}
                </select>
              </div>

              {/* Place quick preview badge */}
              {selectedCity && (
                <div className="flex items-center gap-3 p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <SafeImage
                    src={selectedCity.image_url}
                    alt={selectedCity.name}
                    fallbackCategory="Sightseeing"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="text-xs">
                    <p className="font-extrabold text-slate-900">{selectedCity.name}, {selectedCity.country}</p>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Est. ${selectedCity.avg_daily_cost}/day &bull; {selectedCity.best_season}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3 & 4: Start Date & End Date (Screen 4 Wireframe) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Start Date: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  id="trip-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                End Date: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  id="trip-end-date"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Budget row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Target Budget ($ USD):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  id="trip-budget-input"
                  type="number"
                  min={100}
                  step={50}
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(Number(e.target.value))}
                  placeholder="2500"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Trip Notes / Description:
              </label>
              <input
                id="trip-description-input"
                type="text"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
                placeholder="e.g. World architecture, food tours, and botanical strolls"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {selectedActivityIds.length} suggestions selected to include in trip
            </p>
            <button
              id="create-trip-submit-btn"
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Trip & Build Itinerary</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Section: "Suggestion for Places to Visit/Activites to preform" (Screen 4 Wireframe) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Suggestion for Places to Visit/Activites to preform
            </h2>
            <p className="text-xs text-slate-500">
              Select any of the 6 recommended attractions and experiences to add to your itinerary
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full self-start sm:self-auto border border-amber-200">
            {selectedActivityIds.length} Added
          </span>
        </div>

        {/* 6 Suggestion Cards in a 2x3 or 3x2 Grid matching Screen 4 wireframe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {suggestions.map((act) => {
            const isSelected = selectedActivityIds.includes(act.id);
            return (
              <div
                key={act.id}
                onClick={() => toggleActivitySelection(act.id)}
                className={`group rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <SafeImage
                    src={act.image_url}
                    alt={act.name}
                    fallbackCategory={act.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-700">
                    {act.category}
                  </span>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" /> {act.duration} hrs
                    </span>
                    <span className="bg-emerald-600/90 px-2 py-0.5 rounded-full text-white font-black">
                      ${act.cost} USD
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {act.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      {act.city_name || selectedCity?.name || 'World Spot'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivitySelection(act.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Trip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
