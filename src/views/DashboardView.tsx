import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  Heart,
  ChevronRight,
  Plane,
  Globe,
  Utensils,
  Landmark,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  Check,
  CheckCircle2,
  DollarSign,
  User as UserIcon,
  Star,
  Tag,
  RefreshCw,
  FolderHeart,
  Eye,
} from 'lucide-react';
import { Trip, City, Continent, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { cityService } from '../services/cityService';
import { SafeImage } from '../components/SafeImage';
import { SEED_ACTIVITIES } from '../data/seedData';

interface DashboardViewProps {
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenCityDetail: (city: City) => void;
  onOpenAiPlanner: () => void;
  onSelectTrip: (tripId: string) => void;
}

// Top regional selection presets matching Screen 3 wireframe
const REGIONAL_SELECTIONS = [
  {
    id: 'reg-europe',
    title: 'Western Europe',
    subtitle: 'Paris, Rome, Amsterdam, Barcelona',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    continent: 'Europe' as Continent,
    badge: 'Art & Heritage',
    avgBudget: '$2,800',
  },
  {
    id: 'reg-east-asia',
    title: 'East Asia',
    subtitle: 'Tokyo, Kyoto, Seoul, Singapore',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    continent: 'Asia' as Continent,
    badge: 'Neon & Culture',
    avgBudget: '$3,100',
  },
  {
    id: 'reg-mediterranean',
    title: 'Mediterranean',
    subtitle: 'Athens, Rome, Barcelona, Cairo',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
    continent: 'Europe' as Continent,
    badge: 'Sun & History',
    avgBudget: '$2,400',
  },
  {
    id: 'reg-north-america',
    title: 'North America',
    subtitle: 'New York, San Francisco, Vancouver',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80',
    continent: 'North America' as Continent,
    badge: 'Skylines & Parks',
    avgBudget: '$3,400',
  },
  {
    id: 'reg-middle-east',
    title: 'Middle East & Africa',
    subtitle: 'Dubai, Cairo, Istanbul, Cape Town',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    continent: 'Middle East' as Continent,
    badge: 'Wonders & Luxury',
    avgBudget: '$2,900',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCityDetail,
  onOpenAiPlanner,
  onSelectTrip,
}) => {
  const { user, toggleSaveDestination } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter toolbar states matching Screen 3 wireframe
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'continent' | 'budget' | 'popularity'>('none');
  const [selectedContinent, setSelectedContinent] = useState<string>('All');
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'cost-asc' | 'cost-desc' | 'name'>('popularity');

  // Menu toggles
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userTrips, allCities] = await Promise.all([
          tripService.getUserTrips(user?.id || 'user-aarav-1'),
          cityService.getAllCities(),
        ]);
        setTrips(userTrips);
        setCities(allCities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Click outside to close open menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setIsGroupMenuOpen(false);
        setIsFilterMenuOpen(false);
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered and Sorted Cities
  const filteredCities = useMemo(() => {
    return cities
      .filter((city) => {
        // Search query match
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
          !q ||
          city.name.toLowerCase().includes(q) ||
          city.country.toLowerCase().includes(q) ||
          city.region.toLowerCase().includes(q) ||
          city.continent.toLowerCase().includes(q) ||
          (city.tags && city.tags.some((t) => t.toLowerCase().includes(q))) ||
          (city.description && city.description.toLowerCase().includes(q));

        // Continent filter
        const matchContinent =
          selectedContinent === 'All' ||
          city.continent.toLowerCase() === selectedContinent.toLowerCase() ||
          city.region.toLowerCase().includes(selectedContinent.toLowerCase());

        // Budget tier filter
        let matchBudget = true;
        const cost = city.avg_daily_cost || 0;
        if (selectedBudgetTier === 'budget') matchBudget = cost < 120;
        else if (selectedBudgetTier === 'moderate') matchBudget = cost >= 120 && cost <= 200;
        else if (selectedBudgetTier === 'luxury') matchBudget = cost > 200;

        // Tag filter
        const matchTag =
          selectedTag === 'All' ||
          (city.tags && city.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())));

        // Saved favorites filter
        const isSaved = (user?.saved_destinations || []).includes(city.id);
        const matchSaved = !savedOnly || isSaved;

        return matchSearch && matchContinent && matchBudget && matchTag && matchSaved;
      })
      .sort((a, b) => {
        if (sortBy === 'popularity') return (b.popularity_score || 0) - (a.popularity_score || 0);
        if (sortBy === 'cost-asc') return (a.avg_daily_cost || 0) - (b.avg_daily_cost || 0);
        if (sortBy === 'cost-desc') return (b.avg_daily_cost || 0) - (a.avg_daily_cost || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [cities, searchQuery, selectedContinent, selectedBudgetTier, selectedTag, savedOnly, sortBy, user]);

  // Matching Activities for search query
  const matchedActivities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return SEED_ACTIVITIES.filter(
      (act) =>
        act.name.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q) ||
        act.city_name?.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  // Filtered Trips
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.stops && t.stops.some((s) => s.city_name.toLowerCase().includes(q)))
    );
  }, [trips, searchQuery]);

  // Check if any filter is active
  const isAnyFilterActive =
    selectedContinent !== 'All' ||
    selectedBudgetTier !== 'All' ||
    selectedTag !== 'All' ||
    savedOnly;

  // Reset all filters helper
  const handleResetFilters = () => {
    setSelectedContinent('All');
    setSelectedBudgetTier('All');
    setSelectedTag('All');
    setSavedOnly(false);
    setSearchQuery('');
  };

  // Grouping helper
  const groupedCitySections = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: 'All Destinations', subtitle: `${filteredCities.length} locations available`, cities: filteredCities }];
    }

    if (groupBy === 'continent') {
      const continents: Continent[] = ['Europe', 'Asia', 'North America', 'Middle East', 'Oceania', 'South America', 'Africa'];
      return continents
        .map((cont) => {
          const group = filteredCities.filter((c) => c.continent === cont);
          return {
            key: cont,
            title: `${cont}`,
            subtitle: `${group.length} world-class destinations`,
            cities: group,
          };
        })
        .filter((g) => g.cities.length > 0);
    }

    if (groupBy === 'budget') {
      return [
        {
          key: 'budget-friendly',
          title: 'Budget-Friendly ($ < $120/day)',
          subtitle: 'Great value stays, street dining, and rich cultural sights',
          cities: filteredCities.filter((c) => (c.avg_daily_cost || 0) < 120),
        },
        {
          key: 'moderate',
          title: 'Moderate ($120 - $200/day)',
          subtitle: 'Balanced comfort, central boutique hotels, and landmark passes',
          cities: filteredCities.filter((c) => (c.avg_daily_cost || 0) >= 120 && (c.avg_daily_cost || 0) <= 200),
        },
        {
          key: 'luxury',
          title: 'Premium & Luxury (> $200/day)',
          subtitle: 'High-end culinary capitals, skyline vistas, and luxury transport',
          cities: filteredCities.filter((c) => (c.avg_daily_cost || 0) > 200),
        },
      ].filter((g) => g.cities.length > 0);
    }

    if (groupBy === 'popularity') {
      return [
        {
          key: 'top-tier',
          title: 'Top Rated & Iconic (Score 95+)',
          subtitle: 'The highest visited capitals and bucket-list global landmarks',
          cities: filteredCities.filter((c) => (c.popularity_score || 0) >= 95),
        },
        {
          key: 'popular',
          title: 'Highly Recommended (Score 88 - 94)',
          subtitle: 'Vibrant cultural capitals and scenic worldwide favorites',
          cities: filteredCities.filter((c) => (c.popularity_score || 0) >= 88 && (c.popularity_score || 0) < 95),
        },
        {
          key: 'hidden-gems',
          title: 'Curated Gems (Score < 88)',
          subtitle: 'Distinct architectural gems and scenic coastal retreats',
          cities: filteredCities.filter((c) => (c.popularity_score || 0) < 88),
        },
      ].filter((g) => g.cities.length > 0);
    }

    return [{ key: 'all', title: 'All Destinations', subtitle: `${filteredCities.length} locations`, cities: filteredCities }];
  }, [groupBy, filteredCities]);

  return (
    <div className="space-y-8 pb-20 relative">
      {/* Top Banner Image Card (Screen 3 Wireframe) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800 group">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80"
            alt="GlobeTrotter Banner Image"
            className="w-full h-full object-cover opacity-40 group-hover:scale-102 transition-transform duration-700 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>GlobeTrotter World Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            Discover Your Next Journey
          </h1>
          <p className="text-sm sm:text-base text-slate-200 mt-2 font-medium">
            Explore 25+ iconic world destinations, multi-city journeys, and modular itinerary sections.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              id="dash-banner-plan-trip-btn"
              onClick={() => onNavigate('create-trip')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plan a New Trip</span>
            </button>

            <button
              id="dash-banner-ai-btn"
              onClick={onOpenAiPlanner}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/30 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Itinerary Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH & FILTER TOOLBAR: [ Search bar ..... ] [ Group by ] [ Filter ] [ Sort by... ] */}
      {/* ========================================================================= */}
      <div
        ref={toolbarRef}
        className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-30"
      >
        {/* Left: Search bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="dash-search-bar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations, cities, landmarks, museums, or trips..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              id="dash-search-clear-btn"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Action Buttons: [ Group by ] [ Filter ] [ Sort by... ] */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Group by Button & Dropdown */}
          <div className="relative">
            <button
              id="dash-groupby-btn"
              onClick={() => {
                setIsGroupMenuOpen(!isGroupMenuOpen);
                setIsFilterMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                groupBy !== 'none'
                  ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Group by</span>
              {groupBy !== 'none' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {isGroupMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2.5 py-1 font-black text-[10px] text-slate-400 uppercase tracking-wider">
                  Group Destinations By
                </p>
                {[
                  { id: 'none', label: 'Default (Grid View)' },
                  { id: 'continent', label: 'By Continent' },
                  { id: 'budget', label: 'By Budget Tier' },
                  { id: 'popularity', label: 'By Popularity & Rating' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGroupBy(item.id as any);
                      setIsGroupMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      groupBy === item.id
                        ? 'bg-amber-100 text-amber-900'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {groupBy === item.id && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button & Comprehensive Dropdown */}
          <div className="relative">
            <button
              id="dash-filter-btn"
              onClick={() => {
                setIsFilterMenuOpen(!isFilterMenuOpen);
                setIsGroupMenuOpen(false);
                setIsSortMenuOpen(false);
              }}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAnyFilterActive
                  ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-600" />
              <span>Filter</span>
              {isAnyFilterActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
              )}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute right-0 sm:right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-40 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" /> Filters
                  </span>
                  {isAnyFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Continent Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Continent
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['All', 'Europe', 'Asia', 'North America', 'Middle East', 'Oceania'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedContinent(c)}
                        className={`px-2.5 py-1.5 rounded-lg text-left font-bold text-xs truncate transition-colors cursor-pointer ${
                          selectedContinent === c
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Tier Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Daily Budget Tier
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'All', label: 'All Budgets' },
                      { id: 'budget', label: '< $120 / day' },
                      { id: 'moderate', label: '$120 - $200 / day' },
                      { id: 'luxury', label: '> $200 / day' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBudgetTier(b.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-left font-bold text-xs truncate transition-colors cursor-pointer ${
                          selectedBudgetTier === b.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Style / Tags */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Interest / Style
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Art', 'Food', 'Culture', 'History', 'Nature', 'Luxury', 'Beach'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                          selectedTag === t
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Saved Only Toggle */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Saved Favorites Only
                  </span>
                  <input
                    type="checkbox"
                    checked={savedOnly}
                    onChange={(e) => setSavedOnly(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Apply Filters ({filteredCities.length} matches)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort by... Button & Dropdown */}
          <div className="relative">
            <button
              id="dash-sortby-btn"
              onClick={() => {
                setIsSortMenuOpen(!isSortMenuOpen);
                setIsGroupMenuOpen(false);
                setIsFilterMenuOpen(false);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
              <span>Sort by...</span>
            </button>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2.5 py-1 font-black text-[10px] text-slate-400 uppercase tracking-wider">
                  Sort Destinations
                </p>
                {[
                  { id: 'popularity', label: 'Top Popularity (High to Low)' },
                  { id: 'cost-asc', label: 'Budget: Low to High ($)' },
                  { id: 'cost-desc', label: 'Budget: High to Low ($$$)' },
                  { id: 'name', label: 'Alphabetical (A - Z)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSortBy(item.id as any);
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      sortBy === item.id
                        ? 'bg-amber-100 text-amber-900'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.id && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators & Quick Reset Bar */}
      {(isAnyFilterActive || searchQuery || groupBy !== 'none') && (
        <div className="flex items-center justify-between gap-2 flex-wrap bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-amber-900">Active Criteria:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-bold border border-slate-200 shadow-2xs">
                Search: &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedContinent !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                {selectedContinent}
                <button onClick={() => setSelectedContinent('All')} className="hover:text-amber-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBudgetTier !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                Budget: {selectedBudgetTier}
                <button onClick={() => setSelectedBudgetTier('All')} className="hover:text-emerald-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold">
                Style: {selectedTag}
                <button onClick={() => setSelectedTag('All')} className="hover:text-indigo-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {savedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold">
                Saved Favorites
                <button onClick={() => setSavedOnly(false)} className="hover:text-rose-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {groupBy !== 'none' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
                Grouped: {groupBy}
                <button onClick={() => setGroupBy('none')} className="hover:text-slate-950 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MATCHING DESTINATIONS SECTION / GROUPED RESULTS */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : groupBy !== 'none'
                ? `Destinations Grouped by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`
                : 'Explore World Destinations'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {filteredCities.length} destinations ready to explore, customize, or add to your multi-city plans
            </p>
          </div>

          <button
            id="dash-view-all-destinations-btn"
            onClick={() => onNavigate('city-search')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Destination Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Empty state when no destinations match search / filter */}
        {filteredCities.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-800">
              No destinations match your search or filter criteria.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching with different keywords like &ldquo;Paris&rdquo;, &ldquo;Tokyo&rdquo;, &ldquo;Europe&rdquo;, or resetting active filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Reset Filters &amp; View All
            </button>
          </div>
        ) : (
          /* Render Grouped Sections or Default Grid */
          <div className="space-y-8">
            {groupedCitySections.map((group) => (
              <div key={group.key} className="space-y-4">
                {groupBy !== 'none' && (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{group.title}</h3>
                      <p className="text-xs text-slate-500">{group.subtitle}</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {group.cities.length} Places
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {group.cities.map((city) => {
                    const isSaved = (user?.saved_destinations || []).includes(city.id);

                    return (
                      <div
                        key={city.id}
                        onClick={() => onOpenCityDetail(city)}
                        className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Photo Header */}
                          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                            <SafeImage
                              src={city.image_url}
                              alt={city.name}
                              fallbackCategory="Sightseeing"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20">
                                {city.continent}
                              </span>
                            </div>

                            {/* Save/Favorite Heart Button */}
                            <button
                              id={`dash-save-city-${city.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveDestination(city.id);
                              }}
                              className="absolute top-2.5 right-2.5 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition-transform active:scale-90 cursor-pointer"
                              title={isSaved ? 'Remove from saved' : 'Save destination'}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 transition-colors ${
                                  isSaved ? 'text-rose-500 fill-rose-500' : 'text-white'
                                }`}
                              />
                            </button>

                            {/* Bottom City Name & Country */}
                            <div className="absolute bottom-2.5 left-3 right-3 text-white">
                              <h3 className="font-black text-lg leading-snug tracking-tight group-hover:text-amber-300 transition-colors drop-shadow-sm">
                                {city.name}
                              </h3>
                              <p className="text-xs text-slate-200 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {city.country} &bull; {city.region}
                              </p>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-2.5">
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                              {city.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {(city.tags || []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 pt-0">
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Avg. Daily Cost
                              </span>
                              <span className="font-black text-slate-900 text-sm">
                                ${city.avg_daily_cost || 150}{' '}
                                <span className="text-[10px] font-normal text-slate-500">/ day</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate('create-trip');
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                              >
                                + Plan Trip
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* MATCHED ACTIVITIES (WHEN USER SEARCHES FOR SPOTS / FOOD / SIGHTS) */}
      {/* ========================================================================= */}
      {searchQuery && matchedActivities.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Matching Attractions &amp; Highlights ({matchedActivities.length})
              </h2>
              <p className="text-xs text-slate-500">
                Landmarks, food stops, and cultural sights related to &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
            <button
              onClick={() => onNavigate('activity-search')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Activities</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5 hover:border-amber-400 transition-all"
              >
                <SafeImage
                  src={act.image_url}
                  alt={act.name}
                  fallbackCategory={act.category}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {act.category}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate mt-1">{act.name}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {act.city_name || 'Destination'} &bull; ${act.cost} &bull; {act.duration}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TOP REGIONAL SELECTIONS (SCREEN 3 WIREFRAME) */}
      {/* ========================================================================= */}
      {!searchQuery && groupBy === 'none' && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Top Regional Selections
              </h2>
              <p className="text-xs text-slate-500">
                Handcrafted destination clusters across major global regions
              </p>
            </div>
            <button
              onClick={() => onNavigate('city-search')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Destinations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 5 Regional Cards matching the wireframe */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {REGIONAL_SELECTIONS.map((reg) => (
              <div
                key={reg.id}
                onClick={() => {
                  setSelectedContinent(reg.continent);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                  <SafeImage
                    src={reg.image}
                    alt={reg.title}
                    fallbackCategory="Sightseeing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {reg.badge}
                  </span>
                  <span className="absolute bottom-2 right-2 text-white font-extrabold text-[10px] bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {reg.avgBudget}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-amber-600 transition-colors">
                      {reg.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{reg.subtitle}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-700">
                    <span>Filter Region</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* PREVIOUS TRIPS (SCREEN 3 WIREFRAME) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Previous Trips &amp; Itineraries
            </h2>
            <p className="text-xs text-slate-500">
              Your saved multi-city travel plans, itineraries, and sectional budgets
            </p>
          </div>
          <button
            onClick={() => onNavigate('my-trips')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Trips ({trips.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trip Cards matching the wireframe */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.slice(0, 3).map((trip) => {
            const budget = tripService.calculateBudgetSummary(trip);
            const actCount =
              trip.stops?.reduce((acc, s) => acc + (s.activities?.length || 0), 0) || 0;
            const sectionsCount = trip.sections?.length || (trip.stops?.length || 1) * 2;

            return (
              <div
                key={trip.id}
                onClick={() => {
                  onSelectTrip(trip.id);
                  onNavigate('itinerary-builder', trip.id);
                }}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <SafeImage
                    src={
                      trip.cover_photo ||
                      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={trip.name}
                    fallbackCategory="Sightseeing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                      {budget.totalDays} Days Journey
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {sectionsCount} Sections
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs text-amber-200 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {trip.start_date} &rarr; {trip.end_date}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {trip.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {trip.stops?.length || 0} World Stops
                    </span>
                    <span className="font-black text-emerald-800 text-sm">
                      ${budget.totalPlanned.toLocaleString('en-US')} USD
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrip(trip.id);
                        onNavigate('itinerary-builder', trip.id);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors text-center cursor-pointer"
                    >
                      Build Itinerary
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrip(trip.id);
                        onNavigate('itinerary-view', trip.id);
                      }}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Right Floating/Docked Button matching wireframe: [ + Plan a trip ] */}
        <div className="flex justify-end pt-4">
          <button
            id="dash-floating-plan-trip-btn"
            onClick={() => onNavigate('create-trip')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ Plan a trip</span>
          </button>
        </div>
      </section>
    </div>
  );
};
