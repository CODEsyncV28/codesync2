import React, { useState, useEffect, useMemo } from 'react';
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
  Star,
  Award,
  Bookmark,
  Filter,
  Search,
  Tag,
  Eye,
  Check,
  X,
  Edit3,
  SlidersHorizontal,
  Utensils,
  Trees,
  Landmark,
  Camera,
  Heart,
  AlertCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { City, Activity, Trip, Continent, ActivityCategory } from '../types';
import { cityService } from '../services/cityService';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { SafeImage } from '../components/SafeImage';
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
  LineChart,
  Line,
} from 'recharts';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'curator' | 'analytics' | 'cities' | 'activities' | 'users' | 'trips'>('curator');

  // Curator Portal states
  const [curatorSearch, setCuratorSearch] = useState('');
  const [curatorCategoryFilter, setCuratorCategoryFilter] = useState<string>('All');
  const [curatorStatusFilter, setCuratorStatusFilter] = useState<'all' | 'spotlight' | 'verified'>('all');
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [curatorNotice, setCuratorNotice] = useState<string | null>(null);

  // Add Spot Form state
  const [spotName, setSpotName] = useState('');
  const [spotCityId, setSpotCityId] = useState('');
  const [spotCategory, setSpotCategory] = useState<ActivityCategory>('Sightseeing');
  const [spotDuration, setSpotDuration] = useState(2);
  const [spotCost, setSpotCost] = useState(25);
  const [spotImage, setSpotImage] = useState('');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotCuratorBadge, setSpotCuratorBadge] = useState('⭐ Must-Visit Landmark');
  const [spotCuratorScore, setSpotCuratorScore] = useState(95);
  const [spotCuratorNotes, setSpotCuratorNotes] = useState('');
  const [spotBestTime, setSpotBestTime] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Lunch' | 'Dinner' | 'Sunset' | 'Anytime'>('Morning');

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
    if (c.length > 0 && !spotCityId) {
      setSpotCityId(c[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const showToast = (msg: string) => {
    setCuratorNotice(msg);
    setTimeout(() => {
      setCuratorNotice(null);
    }, 4000);
  };

  const handleToggleCuratorSpotlight = async (act: Activity) => {
    const isNowCurated = !(act.is_curated || act.is_featured);
    const updated: Activity = {
      ...act,
      is_curated: isNowCurated,
      is_featured: isNowCurated,
      curator_verified: isNowCurated ? true : act.curator_verified,
      curator_score: act.curator_score || 92,
      curator_badge: act.curator_badge || (act.category === 'Food & Dining' ? '🍜 Michelin Street Food' : act.category === 'Nature & Outdoors' ? '🌿 Secret Botanical Gem' : '⭐ Must-Visit Landmark'),
    };
    await cityService.updateActivity(updated);
    setActivities((prev) => prev.map((a) => (a.id === act.id ? updated : a)));
    showToast(`${act.name} ${isNowCurated ? 'added to Curator Spotlight!' : 'removed from spotlight.'}`);
  };

  const handleToggleCuratorVerified = async (act: Activity) => {
    const isNowVerified = !act.curator_verified;
    const updated: Activity = {
      ...act,
      curator_verified: isNowVerified,
    };
    await cityService.updateActivity(updated);
    setActivities((prev) => prev.map((a) => (a.id === act.id ? updated : a)));
    showToast(`${act.name} marked as ${isNowVerified ? 'Curator Verified ✓' : 'Unverified'}`);
  };

  const handleUpdateCuratorBadge = async (act: Activity, badge: string) => {
    const updated: Activity = {
      ...act,
      curator_badge: badge,
      is_curated: true,
      curator_verified: true,
    };
    await cityService.updateActivity(updated);
    setActivities((prev) => prev.map((a) => (a.id === act.id ? updated : a)));
    showToast(`Badge updated for ${act.name}: ${badge}`);
  };

  const handleAddCuratedSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotName.trim() || !spotCityId) return;

    const matchedCity = cities.find((c) => c.id === spotCityId);
    const newSpotId = 'act-curated-' + Date.now();

    const newActivity: Activity = {
      id: newSpotId,
      city_id: spotCityId,
      city_name: matchedCity?.name || 'World City',
      name: spotName.trim(),
      category: spotCategory,
      duration: Number(spotDuration) || 2,
      cost: Number(spotCost) || 0,
      description: spotDesc.trim() || `Curated experience in ${matchedCity?.name || 'the city'}.`,
      image_url:
        spotImage.trim() ||
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      is_curated: true,
      is_featured: true,
      curator_verified: true,
      curator_badge: spotCuratorBadge,
      curator_score: Number(spotCuratorScore) || 95,
      curator_notes: spotCuratorNotes.trim() || 'Verified by GlobeTrotter Lead Editorial Curator.',
      best_time_of_day: spotBestTime,
      is_food_spot: spotCategory === 'Food & Dining',
      is_garden: spotCategory === 'Nature & Outdoors',
      is_landmark: spotCategory === 'Sightseeing',
      is_adventure: spotCategory === 'Adventure',
      is_sports_venue: spotCategory === 'Sports & Stadiums',
    };

    await cityService.addActivity(newActivity);
    setShowAddSpotModal(false);
    setSpotName('');
    setSpotDesc('');
    setSpotImage('');
    setSpotCuratorNotes('');
    showToast(`Successfully added curated spot: "${newActivity.name}"!`);
    loadAll();
  };

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
      is_curated: true,
      curator_score: 95,
      curator_notes: 'Editorial destination catalog approved.',
    });

    setShowAddCity(false);
    setCityName('');
    setCityCountry('');
    setCityDesc('');
    setCityImage('');
    showToast(`Published new destination: ${cityName.trim()}!`);
    loadAll();
  };

  // Filtered Curator spots
  const filteredCuratorActivities = useMemo(() => {
    return activities.filter((act) => {
      const q = curatorSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        act.name.toLowerCase().includes(q) ||
        (act.city_name && act.city_name.toLowerCase().includes(q)) ||
        act.category.toLowerCase().includes(q) ||
        (act.curator_badge && act.curator_badge.toLowerCase().includes(q));

      const matchCategory =
        curatorCategoryFilter === 'All' || act.category === curatorCategoryFilter;

      let matchStatus = true;
      if (curatorStatusFilter === 'spotlight') {
        matchStatus = !!act.is_curated || !!act.is_featured;
      } else if (curatorStatusFilter === 'verified') {
        matchStatus = !!act.curator_verified;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [activities, curatorSearch, curatorCategoryFilter, curatorStatusFilter]);

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

  const trendData = [
    { month: 'Jan', users: 1200, trips: 400 },
    { month: 'Feb', users: 1900, trips: 600 },
    { month: 'Mar', users: 2400, trips: 800 },
    { month: 'Apr', users: 3100, trips: 1100 },
    { month: 'May', users: 4000, trips: 1500 },
    { month: 'Jun', users: 4920, trips: 2100 },
  ];

  const totalCuratedCount = activities.filter((a) => a.is_curated || a.is_featured).length;
  const totalVerifiedCount = activities.filter((a) => a.curator_verified).length;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Curator Toast Notice */}
      {curatorNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-amber-300 border border-amber-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{curatorNotice}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-stone-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black mb-2 border border-amber-400/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Section &bull; Curator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            GlobeTrotter Curator &amp; Master Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Curate world destinations, verify landmark spots &amp; dining, build editorial collections, and oversee global analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddSpotModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Curated Spot</span>
          </button>

          <button
            onClick={loadAll}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Reload Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Indexed Cities</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{cities.length}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Across 6 Continents</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Curator Spotlight Picks</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalCuratedCount || 24}</p>
          <span className="text-[11px] text-amber-700 font-semibold">Featured on World Map</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Curator Verified Spots</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{totalVerifiedCount || activities.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Landmarks, Dining &amp; Parks</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Global Traveler Trips</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{trips.length + 18}</p>
          <span className="text-[11px] text-slate-500 font-semibold">4,920 Active Users</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'curator', label: '✨ Curator Portal & Spotlights', badge: `${totalCuratedCount || 24} Picks` },
          { id: 'analytics', label: 'Platform Analytics' },
          { id: 'cities', label: `World Cities (${cities.length})` },
          { id: 'activities', label: `Spot Catalog (${activities.length})` },
          { id: 'trips', label: `Trips Executed (${trips.length})` },
          { id: 'users', label: 'User Management' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: CURATOR PORTAL & SPOTLIGHT STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'curator' && (
        <div className="space-y-6">
          {/* Curator Control Center Banner */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 border border-amber-200/80 rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                  Curator Studio Active
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Curated Collections &amp; Verified Highlights
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl">
                  Toggle curator spotlights, assign editorial badges (e.g. Michelin Street Food, Botanical Sanctuaries), and inspect spot ratings across 25+ global cities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSpotModal(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Curate New Spot</span>
                </button>
                <button
                  onClick={() => setShowAddCity(true)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-amber-600" />
                  <span>+ Destination</span>
                </button>
              </div>
            </div>

            {/* Curated Spotlight Themes */}
            <div className="pt-2 border-t border-amber-200/60">
              <p className="text-[11px] font-black uppercase text-amber-900 mb-2.5 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                <span>Featured Editorial Tracks</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    title: '🏛️ Grand European Heritage',
                    spots: 'Paris, Rome, London, Prague',
                    badge: 'History & Art',
                    bg: 'bg-white',
                  },
                  {
                    title: '🍜 East Asia Night Markets & Tea',
                    spots: 'Tokyo, Kyoto, Seoul, Singapore',
                    badge: 'Culinary Masterpieces',
                    bg: 'bg-white',
                  },
                  {
                    title: '🌿 Secret Botanical Sanctuaries',
                    spots: 'Kyoto, London, Singapore, Munich',
                    badge: 'Nature & Parks',
                    bg: 'bg-white',
                  },
                  {
                    title: '⛰️ Alpine High-Altitude Summits',
                    spots: 'Interlaken, Banff, Queenstown',
                    badge: 'Adventure Treks',
                    bg: 'bg-white',
                  },
                ].map((track, i) => (
                  <div key={i} className={`${track.bg} p-3.5 rounded-2xl border border-amber-200/60 shadow-xs space-y-1`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {track.badge}
                      </span>
                      <Sparkles className="w-3 h-3 text-amber-600" />
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900">{track.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{track.spots}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search, Filter & Status Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={curatorSearch}
                  onChange={(e) => setCuratorSearch(e.target.value)}
                  placeholder="Search curated spots, cities, badges (e.g. 'Michelin', 'Landmark', 'Botanical')..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter Toggle (All / Spotlight / Verified) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold">
                <button
                  onClick={() => setCuratorStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    curatorStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({activities.length})
                </button>
                <button
                  onClick={() => setCuratorStatusFilter('spotlight')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    curatorStatusFilter === 'spotlight' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Spotlights Only</span>
                </button>
                <button
                  onClick={() => setCuratorStatusFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    curatorStatusFilter === 'verified' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', 'Sightseeing', 'Food & Dining', 'Nature & Outdoors', 'Culture & Museum', 'Adventure', 'Sports & Stadiums'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCuratorCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    curatorCategoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Spots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCuratorActivities.map((act) => {
              const isSpotlight = !!act.is_curated || !!act.is_featured;
              const isVerified = !!act.curator_verified;

              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-4 space-y-3.5 shadow-sm flex flex-col justify-between ${
                    isSpotlight
                      ? 'border-amber-400 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <SafeImage
                        src={act.image_url}
                        alt={act.name}
                        fallbackCategory={act.category}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {act.city_name || 'Destination'}
                        </span>
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {act.category}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                        <span className="font-extrabold">{act.cost === 0 ? 'Free' : `$${act.cost} USD`}</span>
                        <span className="text-[10px] font-bold text-amber-200">{act.duration} hrs &bull; {act.best_time_of_day || 'Anytime'}</span>
                      </div>
                    </div>

                    {/* Spot Title & Details */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-1">{act.name}</h4>
                        <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md shrink-0 border border-amber-200/60">
                          {act.curator_score || 94}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {act.description}
                      </p>
                    </div>

                    {/* Curator Badge & Notes */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Curator Tag</span>
                        <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          {act.curator_badge || (act.category === 'Food & Dining' ? '🍜 Michelin Street Food' : '⭐ Must-Visit Landmark')}
                        </span>
                      </div>

                      {act.curator_notes && (
                        <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg italic">
                          &ldquo;{act.curator_notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Curator Action Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                    <button
                      onClick={() => handleToggleCuratorSpotlight(act)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSpotlight
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isSpotlight ? 'fill-slate-950' : ''}`} />
                      <span>{isSpotlight ? 'Spotlighted' : 'Spotlight'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleCuratorVerified(act)}
                      className={`py-1.5 px-2.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={isVerified ? 'Verified by Curator' : 'Click to Verify'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{isVerified ? 'Verified' : 'Verify'}</span>
                    </button>

                    {/* Quick Badge changer dropdown */}
                    <select
                      value={act.curator_badge || '⭐ Must-Visit Landmark'}
                      onChange={(e) => handleUpdateCuratorBadge(act, e.target.value)}
                      className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none cursor-pointer max-w-[110px] truncate"
                    >
                      <option value="⭐ Must-Visit Landmark">⭐ Landmark</option>
                      <option value="🍜 Michelin Street Food">🍜 Dining</option>
                      <option value="🌿 Secret Botanical Gem">🌿 Garden</option>
                      <option value="🌅 Sunset Panorama">🌅 Sunset</option>
                      <option value="🎨 Masterpiece Art">🎨 Museum</option>
                      <option value="⛰️ Alpine Wonder">⛰️ Summit</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              App Adoption Trends
            </h3>
            <p className="text-xs text-slate-500 mb-4">Active users and executed trips over the last 6 months</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Active Users" />
                  <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#10b981" strokeWidth={3} name="Trips Executed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Catalog of Curated Spots</h3>
              <p className="text-xs text-slate-500">
                Verified global landmarks, street food spots, and botanical parks ({activities.length} indexed)
              </p>
            </div>
            <button
              onClick={() => setShowAddSpotModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>+ Curated Spot</span>
            </button>
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
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {act.name}
                      {(act.is_curated || act.is_featured) && (
                        <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                          Spotlight
                        </span>
                      )}
                    </h4>
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

      {/* Tab 4: Trips */}
      {activeTab === 'trips' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Itineraries</h3>
            <p className="text-xs text-slate-500">
              Overview of trips executed by users.
            </p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-2">
            {trips.length > 0 ? trips.map((trip) => (
              <div key={trip.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={trip.cover_photo || trip.cover_image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=150&q=80'}
                    alt={trip.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{trip.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {trip.start_date} to {trip.end_date} • {trip.stops?.length || 0} stops
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trip.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {trip.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-500 py-4">No trips found.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Users */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">User Management</h3>
            <p className="text-xs text-slate-500">
              Manage platform users and view their adoption status.
            </p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-2">
            {[
              { id: 'u1', name: 'Elena Rostova', email: 'elena@example.com', role: 'user', trips: 4, joined: '2023-11-15' },
              { id: 'u2', name: 'Priya Patel', email: 'priya.patel@globetrotter.io', role: 'user', trips: 12, joined: '2023-09-02' },
              { id: 'u3', name: 'Marcus Vance', email: 'admin@globetrotter.io', role: 'admin', trips: 0, joined: '2023-08-01' },
              { id: 'u4', name: 'John Doe', email: 'john@example.com', role: 'user', trips: 2, joined: '2024-01-10' },
              { id: 'u5', name: 'Sarah Smith', email: 'sarah@example.com', role: 'user', trips: 1, joined: '2024-02-22' },
            ].map((usr) => (
              <div key={usr.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {usr.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {usr.name}
                      {usr.role === 'admin' && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] uppercase px-1.5 rounded-sm">Admin</span>
                      )}
                    </h4>
                    <p className="text-slate-500 text-[11px]">{usr.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{usr.trips} Trips</p>
                  <p className="text-[10px] text-slate-400">Joined {usr.joined}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Curated Spot */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Add Curated Spot to Catalog</h3>
              </div>
              <button
                onClick={() => setShowAddSpotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCuratedSpot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Spot / Experience Name *
                </label>
                <input
                  type="text"
                  required
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  placeholder="e.g. Kyoto Bamboo Grove & Secret Tea House, Seine Sunset Cruise..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Destination City *
                  </label>
                  <select
                    value={spotCityId}
                    onChange={(e) => setSpotCityId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}, {c.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={spotCategory}
                    onChange={(e) => setSpotCategory(e.target.value as ActivityCategory)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="Sightseeing">Sightseeing &amp; Landmarks</option>
                    <option value="Food & Dining">Food &amp; Dining (Michelin / Markets)</option>
                    <option value="Nature & Outdoors">Nature &amp; Botanical Gardens</option>
                    <option value="Culture & Museum">Culture &amp; Museums</option>
                    <option value="Adventure">Adventure &amp; High-Altitude</option>
                    <option value="Sports & Stadiums">Sports &amp; Stadiums</option>
                    <option value="Relaxation">Relaxation &amp; Wellness</option>
                    <option value="Nightlife">Nightlife &amp; Entertainment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={spotDuration}
                    onChange={(e) => setSpotDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={spotCost}
                    onChange={(e) => setSpotCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Best Time
                  </label>
                  <select
                    value={spotBestTime}
                    onChange={(e) => setSpotBestTime(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Sunset">Sunset</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Curator Badge Label
                  </label>
                  <select
                    value={spotCuratorBadge}
                    onChange={(e) => setSpotCuratorBadge(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                  >
                    <option value="⭐ Must-Visit Landmark">⭐ Must-Visit Landmark</option>
                    <option value="🍜 Michelin Street Food">🍜 Michelin Street Food</option>
                    <option value="🌿 Secret Botanical Gem">🌿 Secret Botanical Gem</option>
                    <option value="🌅 Sunset Panorama">🌅 Sunset Panorama</option>
                    <option value="🎨 Masterpiece Museum">🎨 Masterpiece Museum</option>
                    <option value="⛰️ High-Altitude Summit">⛰️ High-Altitude Summit</option>
                    <option value="🏰 Heritage Fortress">🏰 Heritage Fortress</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Curator Quality Score (1-100)
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={spotCuratorScore}
                    onChange={(e) => setSpotCuratorScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Spot Image URL
                </label>
                <input
                  type="url"
                  value={spotImage}
                  onChange={(e) => setSpotImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  value={spotDesc}
                  onChange={(e) => setSpotDesc(e.target.value)}
                  placeholder="Atmosphere, history, signature dishes or scenic photo points..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Curator Editorial Inspection Notes
                </label>
                <input
                  type="text"
                  value={spotCuratorNotes}
                  onChange={(e) => setSpotCuratorNotes(e.target.value)}
                  placeholder="e.g. Arrive before 9am for golden light and empty pavilions..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSpotModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Publish to Curator Spotlight
                </button>
              </div>
            </form>
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
