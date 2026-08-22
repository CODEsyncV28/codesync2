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
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
  Compass,
  CheckCircle,
  Clock,
  History,
} from 'lucide-react';
import { Trip } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';

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
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'public'>('all');
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
        user?.name || 'Traveler'
      );
      setTrips((prev) => [cloned, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const searchFilteredTrips = trips.filter((trip) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = trip.name.toLowerCase().includes(q);
    const matchDesc = trip.description?.toLowerCase().includes(q);
    const matchCity = trip.stops?.some((s) => s.city_name.toLowerCase().includes(q));
    return matchName || matchDesc || matchCity;
  });

  const upcomingTrips = searchFilteredTrips.filter((t) => t.end_date >= todayStr);
  const completedTrips = searchFilteredTrips.filter((t) => t.end_date < todayStr);
  const publicTrips = searchFilteredTrips.filter((t) => t.is_public);

  const renderTripCard = (trip: Trip) => {
    const budget = tripService.calculateBudgetSummary(trip);
    const isCompleted = trip.end_date < todayStr;
    const isHighlighted = highlightedTripId === trip.id;

    return (
      <div
        key={trip.id}
        onClick={() => {
          onSelectTrip(trip.id);
          onNavigate('itinerary-view', trip.id);
        }}
        className={`group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
          isHighlighted
            ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/15 shadow-emerald-500/10'
            : 'border border-slate-200 hover:border-slate-300'
        }`}
      >
        <div>
          {/* Photo Header */}
          <div className="relative h-48 w-full overflow-hidden bg-slate-100">
            <img
              src={trip.cover_photo}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

            {/* Top status badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 ${
                    isCompleted
                      ? 'bg-slate-800/85 text-slate-300 border border-slate-700/50'
                      : 'bg-emerald-600/90 text-white shadow-sm'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-slate-300" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-emerald-200" />
                      Upcoming
                    </>
                  )}
                  <span>• {budget.totalDays} Days</span>
                </span>

                {isHighlighted && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" /> Saved Just Now
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`p-1.5 rounded-full backdrop-blur-md text-white text-[10px] ${
                    trip.is_public ? 'bg-sky-600/80' : 'bg-slate-700/80'
                  }`}
                  title={trip.is_public ? 'Public' : 'Private'}
                >
                  {trip.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>

            {/* Trip title on image */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h3 className="font-bold text-lg leading-snug line-clamp-1 group-hover:text-sky-300 transition-colors">
                {trip.name}
              </h3>
              <p className="text-xs text-sky-200 font-medium flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-sky-300" /> {trip.start_date} – {trip.end_date}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            {/* Cities pills */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Destinations ({trip.stops?.length || 0})
              </p>
              {trip.stops && trip.stops.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {trip.stops.map((stop) => (
                    <span
                      key={stop.id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-sky-500" />
                      {stop.city_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No stops added yet</p>
              )}
            </div>

            {/* Financial & Activities summary */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Planned Cost
                </span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ${budget.totalPlanned.toLocaleString('en-US')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Activities
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {trip.stops?.reduce((acc, s) => acc + (s.activities?.length || 0), 0) || 0} Scheduled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <button
              id={`trip-share-btn-${trip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenShareModal(trip);
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Share Itinerary"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              id={`trip-duplicate-btn-${trip.id}`}
              onClick={(e) => handleDuplicate(trip, e)}
              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
              title="Clone Itinerary"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              id={`trip-builder-btn-${trip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTrip(trip.id);
                onNavigate('itinerary-builder', trip.id);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Edit Builder"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`trip-delete-btn-${trip.id}`}
              onClick={(e) => handleDelete(trip.id, e)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onSelectTrip(trip.id);
              onNavigate('itinerary-view', trip.id);
            }}
            className="font-bold text-sky-600 group-hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Plan</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Saved Notification Banner */}
      {showSavedToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Trip saved successfully to My Trips!</p>
              <p className="text-xs text-emerald-700">
                Your planned itinerary is stored, up-to-date, and ready for your travels.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg hover:bg-emerald-100/60 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Travel Itineraries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize multi-city routes, track budgets, and browse upcoming vs completed journeys.
          </p>
        </div>

        <button
          id="mytrips-create-btn"
          onClick={() => onNavigate('create-trip')}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Plan New Trip</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: `All Trips (${trips.length})` },
            {
              id: 'upcoming',
              label: `Upcoming (${trips.filter((t) => t.end_date >= todayStr).length})`,
            },
            {
              id: 'completed',
              label: `Completed (${trips.filter((t) => t.end_date < todayStr).length})`,
            },
            {
              id: 'public',
              label: `Public (${trips.filter((t) => t.is_public).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            id="mytrips-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips or cities..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading your itineraries...</p>
        </div>
      ) : searchFilteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No journeys found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No trips matched your search filter. Try clearing your query.'
              : 'You haven’t created any itineraries yet.'}
          </p>
          <button
            onClick={() => onNavigate('create-trip')}
            className="mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Start Planning Now
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ================= SECTION 1: UPCOMING TRIPS ================= */}
          {(activeTab === 'all' || activeTab === 'upcoming') && (
            <section id="section-upcoming-trips" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      Upcoming & Active Trips
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {upcomingTrips.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Journeys planned for the future and currently ongoing routes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('create-trip')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Journey</span>
                </button>
              </div>

              {upcomingTrips.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700">No upcoming trips scheduled</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Plan your next vacation or weekend getaway to see it appear here.
                  </p>
                  <button
                    onClick={() => onNavigate('create-trip')}
                    className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Plan a Trip
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTrips.map(renderTripCard)}
                </div>
              )}
            </section>
          )}

          {/* ================= SECTION 2: COMPLETED TRIPS ================= */}
          {(activeTab === 'all' || activeTab === 'completed') && (
            <section id="section-completed-trips" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      Completed Trips & Past Travels
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {completedTrips.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Past routes, expenses logged, and visited sights archive
                    </p>
                  </div>
                </div>
              </div>

              {completedTrips.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700">No completed trips yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Trips whose end dates have passed will automatically archive here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedTrips.map(renderTripCard)}
                </div>
              )}
            </section>
          )}

          {/* Public Trips Tab view if selected */}
          {activeTab === 'public' && (
            <section id="section-public-trips" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      Public Shared Trips
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {publicTrips.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Trips shared with a public web link or published to community explorer
                    </p>
                  </div>
                </div>
              </div>

              {publicTrips.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-700">No public trips found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click the share icon on any trip card to generate a shareable link.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicTrips.map(renderTripCard)}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
