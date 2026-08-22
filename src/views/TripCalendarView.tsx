import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ArrowLeft,
  Edit3,
  DollarSign,
  Utensils,
  Flower2,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Compass,
  Layers,
  ListFilter,
  Eye,
  X,
  Sun,
  CloudSun,
  CloudRain,
  Snowflake,
  Wind,
  Navigation,
  Share2,
  Check,
  TrendingUp,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Trip, TripStop, TripActivity } from '../types';
import { tripService } from '../services/tripService';
import { SafeImage } from '../components/SafeImage';
import { SEED_ACTIVITIES } from '../data/seedData';

interface TripCalendarViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
}

const TIME_PRESETS = [
  '08:30 AM',
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '03:00 PM',
  '05:30 PM',
  '07:30 PM',
  '09:00 PM',
];

const CATEGORY_OPTIONS = [
  'All',
  'Sightseeing',
  'Culture & Museum',
  'Food & Dining',
  'Sports & Stadiums',
  'Nature & Outdoors',
];

const getMockWeather = (dateStr: string, cityId?: string) => {
  const hash = (dateStr + (cityId || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const month = parseInt(dateStr.split('-')[1] || '6', 10);
  let baseTemp = 20;
  if (month >= 6 && month <= 8) baseTemp = 28;
  if (month === 12 || month <= 2) baseTemp = 5;
  
  const temp = baseTemp + (hash % 15) - 5;

  let conditions = [];
  if (temp > 25) {
      conditions = [
        { type: 'Sunny', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
        { type: 'Clear', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
      ];
  } else if (temp > 15) {
      conditions = [
        { type: 'Partly Cloudy', icon: CloudSun, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
        { type: 'Sunny', icon: Sun, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
      ];
  } else if (temp > 5) {
      conditions = [
        { type: 'Rainy', icon: CloudRain, color: 'text-sky-600', bg: 'bg-sky-100', border: 'border-sky-200' },
        { type: 'Windy', icon: Wind, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' },
        { type: 'Partly Cloudy', icon: CloudSun, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
      ];
  } else {
      conditions = [
        { type: 'Snowy', icon: Snowflake, color: 'text-indigo-500', bg: 'bg-indigo-100', border: 'border-indigo-200' },
        { type: 'Windy', icon: Wind, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' },
      ];
  }
  
  const condition = conditions[hash % conditions.length];

  return { condition, temp };
};

export const TripCalendarView: React.FC<TripCalendarViewProps> = ({ tripId, onNavigate }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'timeline' | 'schedule'>('timeline');

  // Interactive Add Activity Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('Sightseeing');
  const [newSpotTime, setNewSpotTime] = useState('10:00 AM');
  const [newSpotDuration, setNewSpotDuration] = useState(2);
  const [newSpotCost, setNewSpotCost] = useState(20);
  const [newSpotNotes, setNewSpotNotes] = useState('');

  // Interactive Image Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; category: string } | null>(null);

  // In-line editing time state
  const [editingTimeActId, setEditingTimeActId] = useState<string | null>(null);

  useEffect(() => {
    tripService.getTripById(tripId).then((res) => {
      setTrip(res);
      if (res?.start_date) {
        setSelectedDate(res.start_date);
      }
      setLoading(false);
    });
  }, [tripId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-bold">Loading interactive timeline...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-slate-800">Trip plan not found</p>
        <button
          onClick={() => onNavigate('my-trips')}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  // Generate date range
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

  const days: { dateStr: string; dayIndex: number; stop?: TripStop; activities: TripActivity[] }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dStr = d.toISOString().split('T')[0];

    const matchedStop = (trip.stops || []).find((s) => dStr >= s.start_date && dStr <= s.end_date) || trip.stops?.[0];
    let dateActivities = (matchedStop?.activities || []).filter((a) => a.scheduled_date === dStr);

    // Fallback distribution if specific date has no assigned items
    if (dateActivities.length === 0 && matchedStop && (matchedStop.activities || []).length > 0) {
      const allStopActs = matchedStop.activities || [];
      const sliceIndex = i % allStopActs.length;
      dateActivities = [allStopActs[sliceIndex]];
      if (allStopActs.length > 1) {
        dateActivities.push(allStopActs[(sliceIndex + 1) % allStopActs.length]);
      }
    }

    days.push({
      dateStr: dStr,
      dayIndex: i + 1,
      stop: matchedStop,
      activities: dateActivities,
    });
  }

  const currentDayIndex = days.findIndex((d) => d.dateStr === selectedDate);
  const activeDayObj = days[currentDayIndex >= 0 ? currentDayIndex : 0];

  // Quick navigation between days
  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setSelectedDate(days[currentDayIndex - 1].dateStr);
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < days.length - 1) {
      setSelectedDate(days[currentDayIndex + 1].dateStr);
    }
  };

  // Toggle activity completion / visited state
  const handleToggleActivity = async (actId: string) => {
    if (!trip || !activeDayObj.stop) return;

    const stopId = activeDayObj.stop.id;
    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id !== stopId) return stop;
      const updatedActs = (stop.activities || []).map((act) => {
        if (act.id === actId) {
          return { ...act, completed: !act.completed };
        }
        return act;
      });
      return { ...stop, activities: updatedActs };
    });

    const updatedTrip = { ...trip, stops: updatedStops };
    setTrip(updatedTrip);
    await tripService.updateTrip(trip.id, { stops: updatedStops });
  };

  // Update activity scheduled time in-place
  const handleUpdateTime = async (actId: string, newTime: string) => {
    if (!trip || !activeDayObj.stop) return;

    const stopId = activeDayObj.stop.id;
    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id !== stopId) return stop;
      const updatedActs = (stop.activities || []).map((act) => {
        if (act.id === actId) {
          return { ...act, scheduled_time: newTime };
        }
        return act;
      });
      return { ...stop, activities: updatedActs };
    });

    const updatedTrip = { ...trip, stops: updatedStops };
    setTrip(updatedTrip);
    setEditingTimeActId(null);
    await tripService.updateTrip(trip.id, { stops: updatedStops });
  };

  // Remove activity from day
  const handleDeleteActivity = async (actId: string) => {
    if (!trip || !activeDayObj.stop) return;

    const stopId = activeDayObj.stop.id;
    const updatedStops = (trip.stops || []).map((stop) => {
      if (stop.id !== stopId) return stop;
      const updatedActs = (stop.activities || []).filter((act) => act.id !== actId);
      return { ...stop, activities: updatedActs };
    });

    const updatedTrip = { ...trip, stops: updatedStops };
    setTrip(updatedTrip);
    await tripService.updateTrip(trip.id, { stops: updatedStops });
  };

  // Add new custom activity to current selected day
  const handleAddSpotToDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !newSpotName.trim()) return;

    const currentStop = activeDayObj.stop || trip.stops?.[0];
    if (!currentStop) return;

    // Pick a relevant image from seeds if matches
    const matchedSeed = SEED_ACTIVITIES.find(
      (a) => a.name.toLowerCase().includes(newSpotName.toLowerCase()) || newSpotName.toLowerCase().includes(a.name.toLowerCase())
    );

    const newActivity: TripActivity = {
      id: `act-custom-${Date.now()}`,
      name: newSpotName.trim(),
      category: newSpotCategory as any,
      cost: Number(newSpotCost) || 0,
      duration: Number(newSpotDuration) || 2,
      scheduled_date: activeDayObj.dateStr,
      scheduled_time: newSpotTime,
      notes: newSpotNotes.trim() || undefined,
      image_url: matchedSeed?.image_url || undefined,
      completed: false,
    };

    const updatedStops = (trip.stops || []).map((s) => {
      if (s.id === currentStop.id) {
        return {
          ...s,
          activities: [...(s.activities || []), newActivity],
        };
      }
      return s;
    });

    const updatedTrip = { ...trip, stops: updatedStops };
    setTrip(updatedTrip);
    setIsAddModalOpen(false);
    setNewSpotName('');
    setNewSpotNotes('');
    await tripService.updateTrip(trip.id, { stops: updatedStops });
  };

  // Filter activities by category
  const filteredActivities = (activeDayObj.activities || []).filter((act) => {
    if (activeCategoryFilter === 'All') return true;
    return act.category === activeCategoryFilter;
  });

  const totalDayCost = (activeDayObj.activities || []).reduce((acc, act) => acc + Number(act.cost || 0), 0);
  const completedCount = (activeDayObj.activities || []).filter((act) => act.completed).length;
  const totalCount = activeDayObj.activities.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // City suggestions matching current stop
  const citySuggestions = SEED_ACTIVITIES.filter(
    (a) => a.city_name?.toLowerCase() === (activeDayObj.stop?.city_name?.toLowerCase() || 'paris')
  ).slice(0, 4);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            id="back-to-itinerary-btn"
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back to Itinerary Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Interactive Visual Timeline
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {trip.start_date} &rarr; {trip.end_date}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {trip.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="open-add-spot-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spot to Day {activeDayObj.dayIndex}</span>
          </button>

          <button
            id="edit-in-builder-btn"
            onClick={() => onNavigate('itinerary-builder', trip.id)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Itinerary Builder</span>
          </button>
        </div>
      </div>

      {/* Date Carousel Strip */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-amber-600" /> Select Day
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrevDay}
              disabled={currentDayIndex === 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-1">
              {activeDayObj.dayIndex} / {totalDays}
            </span>
            <button
              onClick={handleNextDay}
              disabled={currentDayIndex === days.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto pb-1">
          {days.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const dayCost = day.activities.reduce((a, b) => a + Number(b.cost || 0), 0);
            const visitedInDay = day.activities.filter((a) => a.completed).length;

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`p-3.5 rounded-2xl border text-left transition-all w-44 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/90 ring-2 ring-amber-600/30 shadow-md transform scale-102'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${isSelected ? 'text-amber-800' : 'text-slate-400'}`}>
                    Day {day.dayIndex}
                  </span>
                  {visitedInDay === day.activities.length && day.activities.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="All visited" />
                  )}
                </div>
                <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{day.dateStr}</p>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  {day.stop?.city_name || 'Destination'}
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-700">
                  <span className="text-amber-800">{day.activities.length} Spots</span>
                  <span className="text-slate-900 font-extrabold">${dayCost.toLocaleString('en-US')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Timeline Workspace */}
      {activeDayObj && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Day Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-200">
                  Day {activeDayObj.dayIndex} of {totalDays}
                </span>
                {activeDayObj.stop && (
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {activeDayObj.stop.city_name}, {activeDayObj.stop.country}
                  </span>
                )}
                {(() => {
                  const weather = getMockWeather(activeDayObj.dateStr, activeDayObj.stop?.city_id);
                  const WeatherIcon = weather.condition.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${weather.condition.bg} ${weather.condition.color} ${weather.condition.border}`}>
                      <WeatherIcon className="w-3.5 h-3.5" /> {weather.temp}°C {weather.condition.type}
                    </span>
                  );
                })()}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeDayObj.dateStr}
              </h2>
            </div>

            {/* Day Progress & Metrics */}
            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visited Progress</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-black text-slate-800">
                    {completedCount} / {totalCount} Spots
                  </span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Day Activity Cost</span>
                <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                  ${totalDayCost.toLocaleString('en-US')} USD
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Controls & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-1.5 shrink-0 flex items-center gap-1">
                <ListFilter className="w-3 h-3" /> Filter:
              </span>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'timeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Flow
              </button>
              <button
                onClick={() => setViewMode('schedule')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'schedule' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Hourly
              </button>
            </div>
          </div>

          {/* Timeline Body */}
          {filteredActivities.length === 0 ? (
            <div className="p-10 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {activeCategoryFilter === 'All'
                    ? 'No activities scheduled for this day yet.'
                    : `No "${activeCategoryFilter}" spots on this day.`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Add places from the curated suggestions or create your own custom spot.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Spot Now
              </button>
            </div>
          ) : viewMode === 'timeline' ? (
            /* Vertical Interactive Timeline Flow */
            <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-300 space-y-6">
              {filteredActivities.map((act, i) => {
                const isCompleted = !!act.completed;
                const isEditingTime = editingTimeActId === act.id;

                return (
                  <div key={act.id || i} className="relative group">
                    {/* Interactive Completion Node Dot */}
                    <button
                      onClick={() => handleToggleActivity(act.id)}
                      className={`absolute -left-[31px] sm:-left-[39px] top-4 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                          : 'bg-white border-amber-500 text-amber-500 hover:bg-amber-50 shadow-sm'
                      }`}
                      title={isCompleted ? 'Mark as pending' : 'Mark as visited'}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Circle className="w-3 h-3" />}
                    </button>

                    {/* Timeline Activity Card */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      {/* Top Meta Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Time Badge with Interactive Rescheduler */}
                          {isEditingTime ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={act.scheduled_time || '10:00 AM'}
                                onChange={(e) => handleUpdateTime(act.id, e.target.value)}
                                className="px-2 py-1 text-xs font-bold bg-white border border-amber-400 rounded-lg text-slate-800 focus:outline-none"
                              >
                                {TIME_PRESETS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setEditingTimeActId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingTimeActId(act.id)}
                              className="text-xs font-extrabold text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Click to change time"
                            >
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>{act.scheduled_time || (i === 0 ? '09:00 AM' : i === 1 ? '01:30 PM' : '05:30 PM')}</span>
                            </button>
                          )}

                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {act.category}
                          </span>

                          <span className="text-[11px] text-slate-400 font-medium">
                            Duration: {act.duration || 2} hrs
                          </span>
                        </div>

                        {/* Cost & Quick Actions */}
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm text-slate-900">
                            {act.cost === 0 ? 'Free' : `$${Number(act.cost).toLocaleString('en-US')}`}
                          </span>
                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                            title="Remove from day"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Area with Safe Image Thumbnail */}
                      <div className="flex items-start gap-4 pt-3">
                        <div
                          className="relative group/img cursor-pointer shrink-0"
                          onClick={() =>
                            setLightboxImage({
                              url: act.image_url || '',
                              title: act.name,
                              category: act.category,
                            })
                          }
                        >
                          <SafeImage
                            src={act.image_url}
                            alt={act.name}
                            fallbackCategory={act.category}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 group-hover/img:scale-103 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`font-black text-base text-slate-900 ${
                                isCompleted ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              {act.name}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {act.notes || 'Curated sight, architectural attraction, or food stop.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-medium text-slate-400">
                            <button
                              onClick={() => handleToggleActivity(act.id)}
                              className={`inline-flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                                isCompleted ? 'text-emerald-700' : 'text-slate-500 hover:text-emerald-600'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isCompleted ? 'Visited & Logged' : 'Mark as Visited'}</span>
                            </button>

                            <span>&bull;</span>

                            <button
                              onClick={() => setEditingTimeActId(act.id)}
                              className="text-amber-800 hover:underline cursor-pointer font-semibold"
                            >
                              Reschedule Time
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transit connector between sequential spots */}
                    {i < filteredActivities.length - 1 && (
                      <div className="py-2 pl-4 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                        <Navigation className="w-3 h-3 text-amber-500" />
                        <span>~15 min transit / walk to next stop</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Hourly Schedule Matrix View */
            <div className="space-y-3">
              {['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'].map((slotTime) => {
                const slotActivities = filteredActivities.filter((a) => {
                  const t = a.scheduled_time || '10:00 AM';
                  return t.includes(slotTime.slice(0, 2)) || (slotTime === '10:00 AM' && !a.scheduled_time);
                });

                return (
                  <div
                    key={slotTime}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80"
                  >
                    <span className="w-24 text-xs font-black text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-center shrink-0">
                      {slotTime}
                    </span>

                    <div className="flex-1">
                      {slotActivities.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Open slot - Free time / explore</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slotActivities.map((act) => (
                            <div
                              key={act.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs text-xs"
                            >
                              <SafeImage
                                src={act.image_url}
                                alt={act.name}
                                fallbackCategory={act.category}
                                className="w-6 h-6 rounded-md object-cover"
                              />
                              <span className="font-extrabold text-slate-800">{act.name}</span>
                              <span className="font-bold text-amber-800">${act.cost}</span>
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

      {/* ========================================================================= */}
      {/* MODAL: ADD SPOT TO DAY TIMELINE */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Add Spot to Day {activeDayObj.dayIndex}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeDayObj.dateStr} &bull; {activeDayObj.stop?.city_name || 'City'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* City Recommendation Chips */}
            {citySuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Landmark Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {citySuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        setNewSpotName(sug.name);
                        setNewSpotCategory(sug.category);
                        setNewSpotCost(sug.cost);
                        setNewSpotDuration(sug.duration);
                        setNewSpotNotes(sug.description);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors text-left"
                    >
                      + {sug.name} (${sug.cost})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddSpotToDay} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Spot / Activity Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  placeholder="e.g. Arc de Triomphe Observation Deck"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Category:
                  </label>
                  <select
                    value={newSpotCategory}
                    onChange={(e) => setNewSpotCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Culture & Museum">Culture &amp; Museum</option>
                    <option value="Food & Dining">Food &amp; Dining</option>
                    <option value="Sports & Stadiums">Sports &amp; Stadiums</option>
                    <option value="Nature & Outdoors">Nature &amp; Outdoors</option>
                    <option value="Shopping">Shopping</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Time:
                  </label>
                  <select
                    value={newSpotTime}
                    onChange={(e) => setNewSpotTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TIME_PRESETS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Duration (hours):
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newSpotDuration}
                    onChange={(e) => setNewSpotDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cost ($ USD):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newSpotCost}
                    onChange={(e) => setNewSpotCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notes / Tips:
                </label>
                <textarea
                  rows={2}
                  value={newSpotNotes}
                  onChange={(e) => setNewSpotNotes(e.target.value)}
                  placeholder="e.g. Pre-booked ticket at 10:15 AM, metro station nearby"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Add to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMAGE LIGHTBOX PREVIEW */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 space-y-4 p-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-slate-900">
              <SafeImage
                src={lightboxImage.url}
                alt={lightboxImage.title}
                fallbackCategory={lightboxImage.category}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-2 pb-2">
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {lightboxImage.category}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{lightboxImage.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
