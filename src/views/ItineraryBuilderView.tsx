import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  PlusCircle,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  CheckCircle,
  Circle,
  Eye,
  Share2,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Layers,
  Utensils,
  Flower2,
  Compass,
  Save,
  Check,
  BookmarkCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Trip, TripStop, TripActivity } from '../types';
import { tripService } from '../services/tripService';
import { AddStopModal } from '../components/modals/AddStopModal';
import { AddActivityModal } from '../components/modals/AddActivityModal';

interface ItineraryBuilderViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenShareModal: (trip: Trip) => void;
}

export const ItineraryBuilderView: React.FC<ItineraryBuilderViewProps> = ({
  tripId,
  onNavigate,
  onOpenShareModal,
}) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [builderTab, setBuilderTab] = useState<'daywise' | 'stops'>('daywise');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stop modal state
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<TripStop | undefined>(undefined);

  // Activity modal state
  const [activeStopForActivity, setActiveStopForActivity] = useState<TripStop | null>(null);
  const [editingActivity, setEditingActivity] = useState<TripActivity | undefined>(undefined);
  const [targetActivityDate, setTargetActivityDate] = useState<string | undefined>(undefined);

  const loadTrip = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const handleSaveTripToMyTrips = async () => {
    if (!trip) return;
    setIsSaving(true);
    try {
      const updated = await tripService.updateTrip(trip.id, {
        ...trip,
        updated_at: new Date().toISOString(),
      });
      setTrip(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        onNavigate('my-trips', trip.id);
      }, 600);
    } catch (err) {
      console.error('Save trip note:', err);
      onNavigate('my-trips', trip.id);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading trip builder...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
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
  const totalActivitiesCount = (trip.stops || []).reduce(
    (acc, s) => acc + (s.activities?.length || 0),
    0
  );

  // Stop handlers
  const handleSaveStop = async (stopData: Omit<TripStop, 'id' | 'trip_id' | 'order_index'>) => {
    if (editingStop) {
      const updated = await tripService.updateStop(trip.id, editingStop.id, stopData);
      setTrip(updated);
      setEditingStop(undefined);
    } else {
      const updated = await tripService.addStop(trip.id, stopData);
      setTrip(updated);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    if (confirm('Delete this destination stop and all its scheduled activities?')) {
      const updated = await tripService.deleteStop(trip.id, stopId);
      setTrip(updated);
    }
  };

  const handleMoveStop = async (index: number, direction: 'up' | 'down') => {
    const stops = [...(trip.stops || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stops.length) return;

    const temp = stops[index];
    stops[index] = stops[targetIdx];
    stops[targetIdx] = temp;

    const updated = await tripService.reorderStops(trip.id, stops);
    setTrip(updated);
  };

  // Activity handlers
  const handleSaveActivity = async (
    activityData: Omit<TripActivity, 'id' | 'trip_stop_id' | 'trip_id'>
  ) => {
    if (!activeStopForActivity) return;

    if (editingActivity) {
      const updated = await tripService.updateActivity(
        trip.id,
        activeStopForActivity.id,
        editingActivity.id,
        activityData
      );
      setTrip(updated);
      setEditingActivity(undefined);
    } else {
      const updated = await tripService.addActivityToStop(
        trip.id,
        activeStopForActivity.id,
        activityData
      );
      setTrip(updated);
    }
    setActiveStopForActivity(null);
  };

  const handleDeleteActivity = async (stopId: string, activityId: string) => {
    const updated = await tripService.deleteActivity(trip.id, stopId, activityId);
    setTrip(updated);
  };

  const handleToggleActivity = async (stopId: string, activityId: string) => {
    const updated = await tripService.toggleActivityCompleted(trip.id, stopId, activityId);
    setTrip(updated);
  };

  const getTransportIcon = (mode?: string) => {
    switch (mode) {
      case 'Train':
        return <Train className="w-4 h-4" />;
      case 'Bus':
        return <Bus className="w-4 h-4" />;
      case 'Rental Car':
      case 'Drive':
        return <Car className="w-4 h-4" />;
      default:
        return <Plane className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Breadcrumb / Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to View"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
                Itinerary Builder
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{budgetSummary.totalDays} Days</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {trip.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <button
            id="builder-save-to-mytrips-btn"
            onClick={handleSaveTripToMyTrips}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Save Trip to My Trips"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-100" />
            ) : (
              <BookmarkCheck className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Saved to My Trips!' : 'Save to My Trips'}</span>
          </button>

          <button
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Read View</span>
          </button>

          <button
            onClick={() => onNavigate('trip-budget', trip.id)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Budget</span>
          </button>

          <button
            onClick={() => onOpenShareModal(trip)}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Financial & Route Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg">
        <div>
          <p className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">Total Planned</p>
          <p className="text-xl font-extrabold mt-0.5">${budgetSummary.totalPlanned.toLocaleString('en-US')}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Target Budget</p>
          <p className="text-xl font-bold mt-0.5">${budgetSummary.targetBudget.toLocaleString('en-US')}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Stops / Cities</p>
          <p className="text-xl font-bold mt-0.5">{trip.stops?.length || 0} Destinations</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Daily Average</p>
          <p className="text-xl font-bold mt-0.5">${budgetSummary.dailyAverage.toLocaleString('en-US')} / day</p>
        </div>
      </div>

      {/* View Switchers: Day-by-Day Timeline vs City Stops View */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          <button
            id="builder-tab-daywise"
            onClick={() => setBuilderTab('daywise')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              builderTab === 'daywise'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Day-by-Day Timeline (Day 1, 2, 3...)</span>
          </button>
          <button
            id="builder-tab-stops"
            onClick={() => setBuilderTab('stops')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              builderTab === 'stops'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>City Stops & Transit</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="builder-add-stop-btn"
            onClick={() => {
              setEditingStop(undefined);
              setIsAddStopOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Destination Stop</span>
          </button>
        </div>
      </div>

      {/* Main Builder Content: Day-by-Day Timeline View */}
      {builderTab === 'daywise' ? (
        <div className="space-y-6">
          {(!trip.stops || trip.stops.length === 0) ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
              <MapPin className="w-12 h-12 text-sky-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No destinations or days configured yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add your first Indian destination stop to generate day-by-day itineraries and schedules.
              </p>
              <button
                onClick={() => setIsAddStopOpen(true)}
                className="mt-4 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add First City Stop
              </button>
            </div>
          ) : (
            (() => {
              // Generate day list
              const startDate = new Date(trip.start_date);
              const endDate = new Date(trip.end_date);
              const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

              const allDates: string[] = [];
              for (let i = 0; i < totalDays; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                allDates.push(d.toISOString().split('T')[0]);
              }

              return allDates.map((dateStr, idx) => {
                const dayNum = idx + 1;
                const isCollapsed = expandedDays[dateStr] === true;
                
                // Match stop for this date
                const matchedStop = (trip.stops || []).find((s) => dateStr >= s.start_date && dateStr <= s.end_date) || trip.stops?.[0];
                const dayActivities = (matchedStop?.activities || []).filter((a) => a.scheduled_date === dateStr);
                const dayCost = dayActivities.reduce((acc, a) => acc + (a.cost || 0), 0);

                const dateObj = new Date(dateStr);
                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div
                    key={dateStr}
                    id={`builder-day-${dayNum}`}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    {/* Day Banner Header */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-md">
                          <span className="text-[10px] font-bold text-sky-300 uppercase leading-none">DAY</span>
                          <span className="text-base leading-tight">{dayNum}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {dayOfWeek}, {formattedDate}
                            </h3>
                            {matchedStop && (
                              <span className="text-xs font-bold text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-sky-600" />
                                {matchedStop.city_name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {dayActivities.length} Scheduled Events • Day Spend: {dayCost === 0 ? 'Free' : `$${dayCost.toLocaleString('en-US')}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                        {matchedStop && (
                          <button
                            id={`add-act-day-${dayNum}`}
                            onClick={() => {
                              setActiveStopForActivity(matchedStop);
                              setEditingActivity(undefined);
                              setTargetActivityDate(dateStr);
                            }}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add to Day {dayNum}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedDays((prev) => ({ ...prev, [dateStr]: !isCollapsed }))}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
                          title={isCollapsed ? 'Expand Day' : 'Collapse Day'}
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Day Activities Content */}
                    {!isCollapsed && (
                      <div className="p-5 sm:p-6 space-y-4">
                        {dayActivities.length === 0 ? (
                          <div className="text-center py-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No activities scheduled for Day {dayNum} yet</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Add morning sightseeing walks, local cafe tastings, or evening landmark tours.
                            </p>
                            {matchedStop && (
                              <button
                                onClick={() => {
                                  setActiveStopForActivity(matchedStop);
                                  setEditingActivity(undefined);
                                  setTargetActivityDate(dateStr);
                                }}
                                className="mt-3 px-3.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add Activity for Day {dayNum}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {dayActivities.map((act) => (
                              <div
                                key={act.id}
                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                                  act.completed
                                    ? 'bg-slate-50 border-slate-200 opacity-75'
                                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <button
                                    onClick={() => matchedStop && handleToggleActivity(matchedStop.id, act.id)}
                                    className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                                    title="Mark completed"
                                  >
                                    {act.completed ? (
                                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </button>

                                  {act.image_url && (
                                    <img
                                      src={act.image_url}
                                      alt={act.name}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                                    />
                                  )}

                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-bold text-slate-900 truncate ${
                                        act.completed ? 'line-through text-slate-500' : ''
                                      }`}
                                    >
                                      {act.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                      <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                                        {act.scheduled_time || 'Morning'}
                                      </span>
                                      <span>• {act.duration}h</span>
                                      <span className="text-slate-400">•</span>
                                      <span className="truncate text-slate-600">{act.category}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0 pl-2">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {act.cost === 0 ? 'Free' : `$${act.cost.toLocaleString('en-US')}`}
                                  </span>
                                  {matchedStop && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setActiveStopForActivity(matchedStop);
                                          setEditingActivity(act);
                                          setTargetActivityDate(act.scheduled_date);
                                        }}
                                        className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                                        title="Edit Activity"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteActivity(matchedStop.id, act.id)}
                                        className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                                        title="Delete Activity"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()
          )}
        </div>
      ) : (
        /* Multi-City Stops List */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Destination Stops & Inter-City Transit</h2>
              <p className="text-xs text-slate-500">
                Reorder stops, adjust hotel stays, and edit transit logistics.
              </p>
            </div>
          </div>

        {(!trip.stops || trip.stops.length === 0) ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <MapPin className="w-12 h-12 text-sky-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No destination stops added yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start building your multi-city route by adding your first city, arrival dates, and transport info.
            </p>
            <button
              onClick={() => setIsAddStopOpen(true)}
              className="mt-4 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add First City Stop
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {trip.stops.map((stop, index) => {
              const start = new Date(stop.start_date);
              const end = new Date(stop.end_date);
              const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
              const stayTotal = nights * (stop.accommodation_cost_per_night || 0);
              const transportCost = Number(stop.transport_cost_to_stop || 0);
              const activitiesTotal = (stop.activities || []).reduce((a, b) => a + (b.cost || 0), 0);
              const stopTotal = stayTotal + transportCost + activitiesTotal;

              return (
                <div
                  key={stop.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Stop Header Banner */}
                  <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      {/* Order index badge */}
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                        {index + 1}
                      </div>

                      {/* Photo thumbnail */}
                      {stop.city_photo && (
                        <img
                          src={stop.city_photo}
                          alt={stop.city_name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{stop.city_name}</h3>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            {stop.country}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          {stop.start_date} → {stop.end_date} ({nights} Nights)
                        </p>
                      </div>
                    </div>

                    {/* Controls & Financials */}
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Stop Total
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ${stopTotal.toLocaleString('en-US')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => handleMoveStop(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-200"
                          title="Move Stop Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveStop(index, 'down')}
                          disabled={index === (trip.stops?.length || 0) - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-200"
                          title="Move Stop Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStop(stop);
                            setIsAddStopOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-sky-50"
                          title="Edit Stop Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStop(stop.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stop Logistics Metadata Strip */}
                  <div className="px-6 py-3 bg-sky-50/50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                    <span className="flex items-center gap-1 font-semibold text-sky-800">
                      {getTransportIcon(stop.transport_mode)} {stop.transport_mode || 'Train'}: {transportCost === 0 ? 'Free' : `$${transportCost.toLocaleString('en-US')}`}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      Stay: {stop.accommodation_cost_per_night ? `$${stop.accommodation_cost_per_night.toLocaleString('en-US')}/night` : 'Included'} (${stayTotal.toLocaleString('en-US')} total)
                    </span>
                    {stop.notes && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500 italic truncate max-w-sm" title={stop.notes}>
                          Note: {stop.notes}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Activities List under Stop */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Scheduled Activities ({stop.activities?.length || 0})
                      </h4>
                      <button
                        onClick={() => {
                          setActiveStopForActivity(stop);
                          setEditingActivity(undefined);
                        }}
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Activity</span>
                      </button>
                    </div>

                    {(!stop.activities || stop.activities.length === 0) ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No activities scheduled for {stop.city_name} yet. Click "Add Activity" to populate this city.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stop.activities.map((act) => (
                          <div
                            key={act.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                              act.completed
                                ? 'bg-slate-50 border-slate-200 opacity-75'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <button
                                onClick={() => handleToggleActivity(stop.id, act.id)}
                                className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                              >
                                {act.completed ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              {act.image_url && (
                                <img
                                  src={act.image_url}
                                  alt={act.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              )}

                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-bold text-slate-900 truncate ${
                                    act.completed ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {act.name}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="font-semibold text-slate-700">
                                    {act.scheduled_date}
                                  </span>
                                  <span>• {act.scheduled_time || 'Morning'}</span>
                                  <span>• {act.duration}h</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 pl-2">
                              <span className="text-xs font-extrabold text-slate-900">
                                {act.cost === 0 ? 'Free' : `$${act.cost.toLocaleString('en-US')}`}
                              </span>
                              <button
                                onClick={() => {
                                  setActiveStopForActivity(stop);
                                  setEditingActivity(act);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded"
                                title="Edit Activity"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(stop.id, act.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded"
                                title="Delete Activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* End-of-Planning Completion & Save to My Trips Card */}
      <div className="mt-10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Itinerary Ready
              </span>
              <span className="text-xs text-slate-400 font-semibold">•</span>
              <span className="text-xs text-slate-300 font-medium">
                {trip.start_date} to {trip.end_date}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Trip Planning Complete!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your {budgetSummary.totalDays}-day journey across {trip.stops?.length || 0} destination{(trip.stops?.length || 0) === 1 ? '' : 's'} with {totalActivitiesCount} scheduled spot{totalActivitiesCount === 1 ? '' : 's'} is organized. Save your finished trip now to keep it in <strong className="text-emerald-400">My Trips</strong>, track expenses, export PDF, and share with travel companions.
            </p>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <span className="text-sm sm:text-base font-extrabold text-white">{budgetSummary.totalDays} Days</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Spots & Sights</span>
                <span className="text-sm sm:text-base font-extrabold text-white">{totalActivitiesCount} Spots</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Est.</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-300">${budgetSummary.totalPlanned.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              id="save-trip-complete-btn"
              onClick={handleSaveTripToMyTrips}
              disabled={isSaving}
              className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookmarkCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              <span>{saveSuccess ? 'Saved! Opening My Trips...' : 'Save Trip to My Trips'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('itinerary-view', trip.id)}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read View</span>
              </button>
              <button
                onClick={() => onOpenShareModal(trip)}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Action Bar */}
      <div className="fixed bottom-5 right-5 sm:right-8 z-40">
        <button
          id="floating-save-trip-btn"
          onClick={handleSaveTripToMyTrips}
          disabled={isSaving}
          className="px-4 sm:px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs shadow-2xl border border-slate-700 backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 group"
          title="Save changes and view in My Trips"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <BookmarkCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span>{saveSuccess ? 'Saved!' : 'Save Trip'}</span>
        </button>
      </div>

      {/* Add / Edit Stop Modal */}
      {isAddStopOpen && (
        <AddStopModal
          isOpen={isAddStopOpen}
          onClose={() => {
            setIsAddStopOpen(false);
            setEditingStop(undefined);
          }}
          onSave={handleSaveStop}
          editingStop={editingStop}
          defaultStartDate={trip.start_date}
          defaultEndDate={trip.end_date}
        />
      )}

      {/* Add / Edit Activity Modal */}
      {activeStopForActivity && (
        <AddActivityModal
          isOpen={!!activeStopForActivity}
          onClose={() => {
            setActiveStopForActivity(null);
            setEditingActivity(undefined);
            setTargetActivityDate(undefined);
          }}
          onSave={handleSaveActivity}
          stop={activeStopForActivity}
          editingActivity={editingActivity}
          initialDate={targetActivityDate}
        />
      )}
    </div>
  );
};
