import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  PlusCircle,
  Search,
  Share2,
  Trash2,
  Copy,
  Edit3,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  History,
  Compass,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  Tag,
  DollarSign,
  Activity as ActivityIcon,
} from 'lucide-react';
import { Trip } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { SafeImage } from '../components/SafeImage';

interface MyTripsViewProps {
  onNavigate: (screen: any, tripId?: string) => void;
  onSelectTrip: (tripId: string) => void;
  onOpenShareModal: (trip: Trip) => void;
  highlightedTripId?: string;
}

export const MyTripsView: React.FC<MyTripsViewProps> = ({
  onNavigate,
  onSelectTrip,
  onOpenShareModal,
  highlightedTripId,
}) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'budget_asc' | 'budget_desc' | 'name'>('date_asc');
  const [groupBy, setGroupBy] = useState<'status' | 'none'>('status');
  const [showSavedToast, setShowSavedToast] = useState(!!highlightedTripId);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const list = await tripService.getUserTrips(user?.id || 'demo-user-1');
      setTrips(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [user]);

  useEffect(() => {
    if (highlightedTripId) {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTripId]);

  const handleDelete = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip and its itinerary?')) {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    }
  };

  const handleDuplicate = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cloned = await tripService.cloneTrip(
        trip.id,
        user?.id || 'demo-user-1',
        user?.name || 'Elena Rostova'
      );
      setTrips((prev) => [cloned, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter & Search logic
  let processedTrips = trips.filter((trip) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = trip.name?.toLowerCase().includes(q);
      const matchDesc = trip.description?.toLowerCase().includes(q);
      const matchCity = trip.stops?.some(
        (s) => s.city_name.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q)
      );
      const matchTag = trip.tags?.some((t) => t.toLowerCase().includes(q));
      const matchActivity = trip.stops?.some((s) =>
        s.activities?.some((a) => a.name.toLowerCase().includes(q))
      );
      if (!matchName && !matchDesc && !matchCity && !matchTag && !matchActivity) return false;
    }

    // Category filter
    if (filterCategory !== 'All') {
      const matchTag = trip.tags?.some((t) => t.toLowerCase().includes(filterCategory.toLowerCase()));
      if (!matchTag) return false;
    }

    return true;
  });

  // Sorting
  processedTrips.sort((a, b) => {
    if (sortBy === 'date_asc') {
      return a.start_date.localeCompare(b.start_date);
    }
    if (sortBy === 'date_desc') {
      return b.start_date.localeCompare(a.start_date);
    }
    if (sortBy === 'budget_asc') {
      return (a.target_budget || a.budget_total || 0) - (b.target_budget || b.budget_total || 0);
    }
    if (sortBy === 'budget_desc') {
      return (b.target_budget || b.budget_total || 0) - (a.target_budget || a.budget_total || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Categorize trips into Ongoing, Up-coming, Completed
  const ongoingTrips = processedTrips.filter(
    (t) => t.start_date <= todayStr && t.end_date >= todayStr
  );
  const upcomingTrips = processedTrips.filter((t) => t.start_date > todayStr);
  const completedTrips = processedTrips.filter((t) => t.end_date < todayStr);

  const renderTripOverviewCard = (trip: Trip, statusBadge: 'Ongoing' | 'Up-coming' | 'Completed') => {
    const isHighlighted = highlightedTripId === trip.id;
    return (
      <div
        key={trip.id}
        id={`trip-card-${trip.id}`}
        onClick={() => {
          onSelectTrip(trip.id);
          onNavigate('itinerary-view', trip.id);
        }}
        className={`group bg-[#1a1a1a] rounded-xl border border-white/20 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col p-6 hover:border-white/50 ${
          isHighlighted ? 'ring-2 ring-amber-500' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-bold text-white leading-snug">
              {trip.name}
            </h3>
            <p className="text-sm text-white/60 line-clamp-3">
              {trip.description || 'Custom multi-city travel itinerary with scheduled daily activities and budget breakdown.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 items-end">
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTrip(trip.id);
                  onNavigate('itinerary-builder', trip.id);
                }}
                className="p-1.5 text-white/40 hover:text-white transition-colors"
                title="Edit Builder"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(trip.id, e)}
                className="p-1.5 text-white/40 hover:text-rose-500 transition-colors"
                title="Delete Trip"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-white/40 font-medium">
              {trip.start_date} – {trip.end_date}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16 bg-[#111111] min-h-[80vh] p-6 rounded-3xl border border-white/10 font-sans tracking-tight text-white">
      {/* Saved Toast Notification */}
      {showSavedToast && (
        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-100 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-50">Trip saved successfully to My Trips!</p>
              <p className="text-xs text-emerald-200">
                Your planned itinerary is stored, up-to-date, and ready for your travels.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-xs font-bold text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-emerald-800/60 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            User Trip Listing
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-0.5">
            Overview of your ongoing, upcoming, and completed travel itineraries with detailed route cards.
          </p>
        </div>

        <button
          id="mytrips-create-btn"
          onClick={() => onNavigate('create-trip')}
          className="px-5 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Plan New Trip</span>
        </button>
      </div>

      {/* Screen 6 Top Toolbar: [ Search bar ...... ] [ Group by ] [ Filter ] [ Sort by... ] */}
      <div className="bg-transparent rounded-2xl border border-white/20 p-2 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              id="trip-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bar ......"
              className="w-full rounded-full border border-white/40 pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/80 bg-transparent"
            />
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-2" />
          </div>

          {/* Group by */}
          <div className="flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-full border border-white/40">
            <Layers className="w-4 h-4 text-white/60 shrink-0 hidden sm:block" />
            <select
              id="trip-group-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer outline-none appearance-none pr-4"
            >
              <option value="status" className="bg-[#111111]">Group by Status</option>
              <option value="none" className="bg-[#111111]">Flat List (All)</option>
            </select>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-full border border-white/40">
            <SlidersHorizontal className="w-4 h-4 text-white/60 shrink-0 hidden sm:block" />
            <select
              id="trip-filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer outline-none appearance-none pr-4"
            >
              <option value="All" className="bg-[#111111]">Filter</option>
              <option value="Adventure" className="bg-[#111111]">Adventure Sports</option>
              <option value="Water Sports" className="bg-[#111111]">Water Sports</option>
              <option value="Mountains" className="bg-[#111111]">Mountains</option>
              <option value="Art" className="bg-[#111111]">Art & Culture</option>
              <option value="Culinary" className="bg-[#111111]">Food & Culinary</option>
            </select>
          </div>

          {/* Sort by */}
          <div className="flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-full border border-white/40">
            <ArrowUpDown className="w-4 h-4 text-white/60 shrink-0 hidden sm:block" />
            <select
              id="trip-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer outline-none appearance-none pr-4"
            >
              <option value="date_asc" className="bg-[#111111]">Sort by...</option>
              <option value="date_desc" className="bg-[#111111]">Latest First</option>
              <option value="budget_desc" className="bg-[#111111]">Budget High-Low</option>
              <option value="budget_asc" className="bg-[#111111]">Budget Low-High</option>
              <option value="name" className="bg-[#111111]">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trip Listing Stacked Sections */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-white/60">Loading your trip overview...</p>
        </div>
      ) : processedTrips.length === 0 ? (
        <div className="bg-transparent rounded-3xl border border-dashed border-white/20 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/5 text-white flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No journeys found</h3>
          <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No trips matched your search filter. Try clearing your query.'
              : 'You haven’t planned any itineraries yet.'}
          </p>
          <button
            onClick={() => onNavigate('create-trip')}
            className="mt-5 px-5 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Start Planning Now
          </button>
        </div>
      ) : groupBy === 'status' ? (
        <div className="space-y-10">
          {/* ================= 1. ONGOING ================= */}
          <section id="section-ongoing-trips" className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-xl font-extrabold text-white">
                  Ongoing
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {ongoingTrips.length}
                </span>
              </div>
            </div>

            {ongoingTrips.length === 0 ? (
              <div className="bg-transparent rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                No trip is currently ongoing today.
              </div>
            ) : (
              <div className="space-y-4">
                {ongoingTrips.map((trip) => renderTripOverviewCard(trip, 'Ongoing'))}
              </div>
            )}
          </section>

          {/* ================= 2. UP-COMING ================= */}
          <section id="section-upcoming-trips" className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <h2 className="text-xl font-extrabold text-white">
                  Up-coming
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  {upcomingTrips.length}
                </span>
              </div>
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="bg-transparent rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                No upcoming trips scheduled.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => renderTripOverviewCard(trip, 'Up-coming'))}
              </div>
            )}
          </section>

          {/* ================= 3. COMPLETED ================= */}
          <section id="section-completed-trips" className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <h2 className="text-xl font-extrabold text-white">
                  Completed
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-white/60">
                  {completedTrips.length}
                </span>
              </div>
            </div>

            {completedTrips.length === 0 ? (
              <div className="bg-transparent rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                No completed trips yet.
              </div>
            ) : (
              <div className="space-y-4">
                {completedTrips.map((trip) => renderTripOverviewCard(trip, 'Completed'))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          {processedTrips.map((trip) => {
            const status = trip.start_date <= todayStr && trip.end_date >= todayStr
              ? 'Ongoing'
              : trip.start_date > todayStr
              ? 'Up-coming'
              : 'Completed';
            return renderTripOverviewCard(trip, status as any);
          })}
        </div>
      )}
    </div>
  );
};
