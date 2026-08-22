import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Heart,
  PlusCircle,
  Star,
  Globe,
  Utensils,
  Landmark,
  Compass,
} from 'lucide-react';
import { City, Continent } from '../types';
import { cityService } from '../services/cityService';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { SafeImage } from '../components/SafeImage';

interface CitySearchViewProps {
  onOpenCityDetail: (city: City) => void;
  onAddToTrip: (city: City) => void;
}

export const CitySearchView: React.FC<CitySearchViewProps> = ({
  onOpenCityDetail,
  onAddToTrip,
}) => {
  const { user, toggleSaveDestination } = useAuth();
  const { currencySymbol, formatPrice } = useCurrency();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('All');
  const [maxCostIndex, setMaxCostIndex] = useState<number>(5);
  const [sortBy, setSortBy] = useState<'popularity' | 'cost_asc' | 'cost_desc' | 'name'>('popularity');

  const CONTINENTS = [
    'All',
    'Europe',
    'Asia',
    'North America',
    'South America',
    'Middle East',
    'Africa',
    'Oceania',
  ];

  const fetchCities = async () => {
    setLoading(true);
    try {
      const results = await cityService.filterCities({
        query,
        continent: selectedContinent,
        maxCostIndex,
        sortBy,
      });
      setCities(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, [query, selectedContinent, maxCostIndex, sortBy]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>Global Destinations & Highlights Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover 25+ iconic global cities across Europe, Asia, Americas, Middle East, Africa, and Oceania with curated attractions, world food spots, and travel intel.
          </p>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Search input & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="city-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city or country (e.g. Paris, Tokyo, Rome, New York, Cairo, Bali, Rio, Sydney)..."
              className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <select
              id="city-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="popularity">Most Popular First</option>
              <option value="cost_asc">Cost: Budget First ({currencySymbol})</option>
              <option value="cost_desc">Cost: Luxury First ({currencySymbol}{currencySymbol}{currencySymbol})</option>
              <option value="name">City Name (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Continent & Cost Index filter pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Continent Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {CONTINENTS.map((cont) => (
              <button
                key={cont}
                onClick={() => setSelectedContinent(cont)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  selectedContinent === cont
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cont}
              </button>
            ))}
          </div>

          {/* Cost Index Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Max Cost Index:</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setMaxCostIndex(idx)}
                  className={`px-2 py-1 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                    maxCostIndex === idx
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {currencySymbol.repeat(idx > 3 ? 3 : idx)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Discovering global destinations...</p>
        </div>
      ) : cities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No destinations matched</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords or resetting filters.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedContinent('All');
              setMaxCostIndex(5);
            }}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => {
            const isSaved = user?.saved_destinations?.includes(city.id);

            return (
              <div
                key={city.id}
                onClick={() => onOpenCityDetail(city)}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <SafeImage
                      src={city.image_url}
                      alt={city.name}
                      fallbackCategory="Sightseeing"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                        {city.continent || city.region}
                      </span>
                      <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {city.currency || 'USD'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveDestination(city.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                        isSaved
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-white/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="font-black text-xl leading-tight group-hover:text-amber-300 transition-colors">
                        {city.name}
                      </h3>
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> {city.country}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {city.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Avg Daily Cost
                        </span>
                        <span className="font-black text-emerald-800">
                          {formatPrice(city.avg_daily_cost)} / day
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Best Season
                        </span>
                        <span className="font-bold text-slate-800 truncate block" title={city.best_season}>
                          {city.best_season}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-600 font-extrabold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{city.popularity_score}/100 Rating</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToTrip(city);
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Trip</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
