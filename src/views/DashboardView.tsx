import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Clock,
  Heart,
  ChevronRight,
  Plane,
  Globe,
  Utensils,
  Landmark,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { Trip, City } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { cityService } from '../services/cityService';

interface DashboardViewProps {
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenCityDetail: (city: City) => void;
  onOpenAiPlanner: () => void;
  onSelectTrip: (tripId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCityDetail,
  onOpenAiPlanner,
  onSelectTrip,
}) => {
  const { user, toggleSaveDestination } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userTrips, cities] = await Promise.all([
          tripService.getUserTrips(user?.id || 'user-aarav-1'),
          cityService.filterCities({ sortBy: 'popularity' }),
        ]);
        setTrips(userTrips);
        setPopularCities(cities.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Overall statistics
  const totalStops = trips.reduce((acc, t) => acc + (t.stops?.length || 0), 0);
  const totalActivities = trips.reduce(
    (acc, t) => acc + (t.stops?.reduce((sa, s) => sa + (s.activities?.length || 0), 0) || 0),
    0
  );
  const totalBudget = trips.reduce((acc, t) => acc + (t.target_budget || 0), 0);

  const featuredTrip = trips[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Banner with World Aesthetics */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80"
            alt="World Travel Architecture"
            className="w-full h-full object-cover opacity-30 filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 text-xs font-bold mb-4 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Welcome, {user?.name || 'Explorer'}! Where in the world next?</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            Plan Multi-City Itineraries Across Global Capitals & Wonders
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
            Curate day-by-day journeys spanning 25+ iconic destinations across Europe, Asia, Americas, Middle East, and Oceania—with pre-calculated budgets, transit routes, and verified spots.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              id="dash-plan-trip-btn"
              onClick={() => onNavigate('create-trip')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Global Trip</span>
            </button>

            <button
              id="dash-ai-spark-btn"
              onClick={onOpenAiPlanner}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/30 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Trip Generator</span>
            </button>

            {!user && (
              <button
                id="dash-login-hero-btn"
                onClick={() => onNavigate('auth')}
                className="px-4 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Demo Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Trips</p>
            <p className="text-2xl font-black text-slate-900">{trips.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">World Cities</p>
            <p className="text-2xl font-black text-slate-900">{totalStops} Stops</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline Spots</p>
            <p className="text-2xl font-black text-slate-900">{totalActivities} Planned</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 font-extrabold text-xl">
            $
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget</p>
            <p className="text-2xl font-black text-slate-900">${totalBudget.toLocaleString('en-US')}</p>
          </div>
        </div>
      </div>

      {/* Featured / Active Trip Highlight */}
      {featuredTrip && (
        <div className="bg-gradient-to-br from-slate-900 via-stone-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>Featured Multi-City Route</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {featuredTrip.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                {featuredTrip.description}
              </p>

              {/* Stop route preview */}
              <div className="flex items-center flex-wrap gap-2 pt-2">
                {featuredTrip.stops?.map((stop, i) => (
                  <span
                    key={stop.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-bold text-amber-200 border border-white/10"
                  >
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {stop.city_name} ({stop.country})
                    {i < (featuredTrip.stops?.length || 0) - 1 && (
                      <span className="text-slate-400 font-normal">→</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Spots preview count */}
              <div className="flex items-center gap-3 pt-1 text-xs text-emerald-300 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {featuredTrip.stops?.reduce((acc, s) => acc + (s.activities?.length || 0), 0) || 0} Curated Timeline Activities Populated
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
              <button
                id="dash-open-featured-btn"
                onClick={() => {
                  onSelectTrip(featuredTrip.id);
                  onNavigate('itinerary-view', featuredTrip.id);
                }}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Full Day-by-Day Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="dash-edit-featured-btn"
                onClick={() => {
                  onSelectTrip(featuredTrip.id);
                  onNavigate('itinerary-builder', featuredTrip.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Edit Route & Spots in Builder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trips Section Header & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Your Global Trip Plans</h2>
            <p className="text-xs text-slate-500">Structured multi-city timelines with international transit & budgets</p>
          </div>
          <button
            id="dash-view-all-trips-btn"
            onClick={() => onNavigate('my-trips')}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({trips.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.slice(0, 3).map((trip) => {
            const budget = tripService.calculateBudgetSummary(trip);
            const actCount = trip.stops?.reduce((acc, s) => acc + (s.activities?.length || 0), 0) || 0;
            return (
              <div
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip.id);
                  onNavigate('itinerary-view', trip.id);
                }}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={trip.cover_photo}
                    alt={trip.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                      {budget.totalDays} Days
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {actCount} Spots Set
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs text-amber-200 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {trip.start_date} to {trip.end_date}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {trip.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trip.description}</p>
                  </div>

                  {/* Route & Budget Footnotes */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {trip.stops?.length || 0} Cities
                    </span>
                    <span className="font-black text-emerald-800">
                      Est. ${budget.totalPlanned.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Destinations Showcase */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Iconic World Destinations
            </h2>
            <p className="text-xs text-slate-500">
              Explore 25+ curated global destinations with top attractions, local dining & cost indices
            </p>
          </div>
          <button
            id="dash-explore-cities-btn"
            onClick={() => onNavigate('city-search')}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All 25 Destinations</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCities.map((city) => {
            const isSaved = user?.saved_destinations?.includes(city.id);
            return (
              <div
                key={city.id}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer flex flex-col"
                onClick={() => onOpenCityDetail(city)}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <img
                    src={city.image_url}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-2 left-2 bg-slate-950/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {city.country}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveDestination(city.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                      isSaved
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-3">
                  <h4 className="font-extrabold text-slate-900 text-xs truncate">{city.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{city.region || city.continent}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-bold">${city.avg_daily_cost}/day</span>
                    <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[9px]">
                      {city.best_season?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
