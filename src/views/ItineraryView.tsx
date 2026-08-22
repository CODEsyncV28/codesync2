import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Share2,
  Edit3,
  CheckCircle,
  Circle,
  Printer,
  ChevronDown,
  ChevronUp,
  Tag,
  Compass,
  ArrowLeft,
  Sparkles,
  Plane,
  Train,
  ListFilter,
  Layers,
  BookmarkCheck,
  ArrowRight,
} from 'lucide-react';
import { Trip, TripStop, TripActivity } from '../types';
import { tripService } from '../services/tripService';

interface ItineraryViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenShareModal: (trip: Trip) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  tripId,
  onNavigate,
  onOpenShareModal,
}) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daywise' | 'cities'>('daywise');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    tripService.getTripById(tripId).then((res) => {
      setTrip(res);
      setLoading(false);
    });
  }, [tripId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading full itinerary...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-slate-800">Trip not found</p>
        <button
          onClick={() => onNavigate('my-trips')}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  const budgetSummary = tripService.calculateBudgetSummary(trip);

  const handleToggleActivity = async (stopId: string, activityId: string) => {
    const updated = await tripService.toggleActivityCompleted(trip.id, stopId, activityId);
    setTrip(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group all activities by scheduled date
  const dayMap = new Map<
    string,
    { stop: TripStop; activities: TripActivity[]; dateStr: string; dayNumber: number }
  >();

  // Generate list of dates between trip start and end
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

  const allTripDates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    allTripDates.push(d.toISOString().split('T')[0]);
  }

  // Map each date to corresponding city stop and activities
  const daysData = allTripDates.map((dateStr, idx) => {
    // Find which stop covers this date
    const matchedStop = (trip.stops || []).find((s) => dateStr >= s.start_date && dateStr <= s.end_date) || trip.stops?.[0];
    const dateActivities = (matchedStop?.activities || []).filter((a) => a.scheduled_date === dateStr);

    return {
      dayNumber: idx + 1,
      dateStr,
      stop: matchedStop,
      activities: dateActivities,
    };
  });

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src={trip.cover_photo}
            alt={trip.name}
            className="w-full h-full object-cover opacity-40 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={() => onNavigate('my-trips')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                id="itinerary-save-to-mytrips-btn"
                onClick={() => onNavigate('my-trips', trip.id)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="View in My Trips"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>My Trips</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
                title="Print or Export PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export / Print</span>
              </button>

              <button
                onClick={() => onOpenShareModal(trip)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => onNavigate('itinerary-builder', trip.id)}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Builder</span>
              </button>
            </div>
          </div>

          <div className="max-w-2xl">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-md">
              Complete Travel Itinerary
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">{trip.name}</h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">{trip.description}</p>

            {/* Stops Route Pill Strip */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {trip.start_date} – {trip.end_date} ({totalDays} Days)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-300">
                {trip.stops?.length || 0} Cities
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-bold text-emerald-300">
                ${budgetSummary.totalPlanned.toLocaleString('en-US')} Est. Budget
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switchers & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('daywise')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'daywise'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Day-by-Day Schedule
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cities'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            City Stop Summaries
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('trip-budget', trip.id)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
          >
            <DollarSign className="w-3.5 h-3.5" /> Budget Breakdown
          </button>
          <button
            onClick={() => onNavigate('trip-calendar', trip.id)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" /> Interactive Timeline
          </button>
        </div>
      </div>

      {/* Main Itinerary Content */}
      {activeTab === 'daywise' ? (
        <div className="space-y-6">
          {daysData.map((day) => {
            const isCollapsed = expandedDays[day.dateStr] === false;

            return (
              <div
                key={day.dateStr}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Day Header */}
                <div
                  onClick={() =>
                    setExpandedDays((prev) => ({
                      ...prev,
                      [day.dateStr]: !prev[day.dateStr],
                    }))
                  }
                  className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex flex-col items-center justify-center font-bold shadow-md shadow-sky-600/20">
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                        Day
                      </span>
                      <span className="text-base font-extrabold leading-none">{day.dayNumber}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{day.dateStr}</h3>
                        {day.stop && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3 text-sky-600" /> {day.stop.city_name},{' '}
                            {day.stop.country}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {day.activities.length === 0
                          ? 'Free exploration day or travel transition'
                          : `${day.activities.length} planned experiences`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-extrabold text-slate-900 hidden sm:block">
                      ${day.activities.reduce((acc, a) => acc + a.cost, 0).toLocaleString('en-US')} Total
                    </span>
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Day Activities */}
                {!isCollapsed && (
                  <div className="p-6">
                    {day.activities.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">
                          No specific scheduled activities on this date. Relax, explore neighborhood cafes, or walk the city streets.
                        </p>
                        <button
                          onClick={() => onNavigate('itinerary-builder', trip.id)}
                          className="mt-2 text-xs font-bold text-sky-600 hover:underline"
                        >
                          + Add activities in Builder
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {day.activities.map((act) => (
                          <div
                            key={act.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              act.completed
                                ? 'bg-slate-50/60 border-slate-200 opacity-70'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start sm:items-center space-x-3">
                              {day.stop && (
                                <button
                                  onClick={() => handleToggleActivity(day.stop!.id, act.id)}
                                  className="mt-1 sm:mt-0 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                                >
                                  {act.completed ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                              )}

                              {act.image_url && (
                                <img
                                  src={act.image_url}
                                  alt={act.name}
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                                    {act.category}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {act.scheduled_time || 'Morning'} ({act.duration} hrs)
                                  </span>
                                </div>
                                <h4
                                  className={`text-base font-bold text-slate-900 mt-1 ${
                                    act.completed ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {act.name}
                                </h4>
                                {act.notes && (
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                    {act.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <span className="text-sm font-extrabold text-slate-900 sm:text-right block">
                                {act.cost === 0 ? 'Free' : `$${act.cost.toLocaleString('en-US')}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* City Stop Summaries Tab */
        <div className="space-y-6">
          {trip.stops?.map((stop, idx) => (
            <div
              key={stop.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                {stop.city_photo && (
                  <img
                    src={stop.city_photo}
                    alt={stop.city_name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {stop.city_name}, {stop.country}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stop.start_date} to {stop.end_date} • Stay: {stop.accommodation_cost_per_night ? `$${stop.accommodation_cost_per_night.toLocaleString('en-US')}/night` : 'Included'} • Transport: {stop.transport_cost_to_stop ? `$${stop.transport_cost_to_stop.toLocaleString('en-US')}` : 'Included'} ({stop.transport_mode || 'Train'})
                  </p>
                </div>
              </div>

              {/* Activities for this stop */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Activities in {stop.city_name} ({stop.activities?.length || 0})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stop.activities?.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800 line-clamp-1">{a.name}</span>
                      <span className="font-bold text-slate-900">{a.cost === 0 ? 'Free' : `$${a.cost.toLocaleString('en-US')}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Summary & My Trips Navigation Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
            <CheckCircle className="w-4 h-4" /> Ready for Travel
          </span>
          <h3 className="text-xl font-extrabold text-white">Keep this Trip in My Trips</h3>
          <p className="text-xs text-slate-300 max-w-md">
            This itinerary is saved in your account. You can view it anytime under My Trips, edit activities, or share with companions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('itinerary-builder', trip.id)}
            className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-sky-400" />
            <span>Edit Stops</span>
          </button>

          <button
            onClick={() => onNavigate('my-trips', trip.id)}
            className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Open in My Trips</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
