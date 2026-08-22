import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  MapPin,
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Compass,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { City, Activity, Trip, Continent } from '../types';
import { cityService } from '../services/cityService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'cities' | 'activities'>('analytics');

  // Add City form modal
  const [showAddCity, setShowAddCity] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityCountry, setCityCountry] = useState('');
  const [cityContinent, setCityContinent] = useState<Continent>('Europe');
  const [cityDailyCost, setCityDailyCost] = useState(150);
  const [cityImage, setCityImage] = useState('');
  const [cityDesc, setCityDesc] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [c, a, t] = await Promise.all([
      cityService.getAllCities(),
      cityService.getAllActivities(),
      tripService.getUserTrips(user?.id || 'demo-user-1'),
    ]);
    setCities(c);
    setActivities(a);
    setTrips(t);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || !cityCountry.trim()) return;

    const newCityId = 'city-' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '');

    await cityService.addCity({
      id: newCityId,
      name: cityName.trim(),
      country: cityCountry.trim(),
      continent: cityContinent,
      region: cityContinent,
      tagline: `Experience the finest landmarks & cuisine of ${cityName.trim()}`,
      description: cityDesc.trim() || `Beautiful worldwide destination in ${cityCountry}.`,
      image_url:
        cityImage.trim() ||
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      cost_index: (Math.min(5, Math.max(1, Math.round(cityDailyCost / 60))) as 1 | 2 | 3 | 4 | 5),
      avg_daily_cost: Number(cityDailyCost),
      popularity_score: 88,
      latitude: 48.8566,
      longitude: 2.3522,
      best_season: 'April – October',
      currency: 'USD',
      tags: ['Global', 'Landmarks', 'Culture'],
    });

    setShowAddCity(false);
    setCityName('');
    setCityCountry('');
    setCityDesc('');
    setCityImage('');
    loadAll();
  };

  // Analytics charts data
  const popularityData = (cities || []).slice(0, 8).map((c) => ({
    name: c?.name || 'City',
    score: c?.popularity_score || 80,
    cost: c?.avg_daily_cost || 100,
  }));

  const categoryCount = (activities || []).reduce((acc, a) => {
    if (a && a.category) {
      acc[a.category] = (acc[a.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryPieData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-stone-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Curator Portal & Global Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            GlobeTrotter Master Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage global destination catalogs across 6 continents, curated spots, traveler itineraries, and platform metrics.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Indexed Cities</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{cities.length}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Across 6 Continents</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Catalog Experiences</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{activities.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold">Curated Landmarks & Dining</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Platform Itineraries</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{trips.length + 18}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">+24% this month</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Active Global Travelers</p>
          <p className="text-2xl font-black text-amber-600 mt-1">4,920</p>
          <span className="text-[11px] text-slate-500 font-semibold">Worldwide Community</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
        {[
          { id: 'analytics', label: 'Platform Analytics' },
          { id: 'cities', label: `World Cities (${cities.length})` },
          { id: 'activities', label: `Spot Catalog (${activities.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Destination Popularity Index
            </h3>
            <p className="text-xs text-slate-500 mb-4">Traveler engagement and search score</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularityData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Activity Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of catalog spot categories</p>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cities */}
      {activeTab === 'cities' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">World Destination Catalog</h3>
              <p className="text-xs text-slate-500">25+ global cities available for itinerary building</p>
            </div>
            <button
              onClick={() => setShowAddCity(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Add Destination</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {cities.map((city) => (
              <div key={city.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={city.image_url}
                    alt={city.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {city.name}
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {city.continent || city.region}
                      </span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">{city.country} &bull; ${city.avg_daily_cost}/day &bull; {city.best_season}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    Score: {city.popularity_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Activities */}
      {activeTab === 'activities' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Catalog of Curated Spots</h3>
            <p className="text-xs text-slate-500">
              Verified global landmarks, street food spots, and botanical parks
            </p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-2">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={act.image_url}
                    alt={act.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{act.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {act.city_name} • {act.category} • {act.duration} hrs
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{act.cost === 0 ? 'Free' : `$${act.cost} USD`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Global Destination</h3>

            <form onSubmit={handleAddCity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Prague, Lisbon, Athens, Kyoto..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    placeholder="e.g. Czech Republic"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Continent
                  </label>
                  <select
                    value={cityContinent}
                    onChange={(e) => setCityContinent(e.target.value as Continent)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="North America">North America</option>
                    <option value="South America">South America</option>
                    <option value="Middle East">Middle East</option>
                    <option value="Africa">Africa</option>
                    <option value="Oceania">Oceania</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Avg Daily Cost ($ USD)
                </label>
                <input
                  type="number"
                  min="20"
                  step="10"
                  value={cityDailyCost}
                  onChange={(e) => setCityDailyCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={cityImage}
                  onChange={(e) => setCityImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCity(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Publish Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
