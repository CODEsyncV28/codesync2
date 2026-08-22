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
} from 'lucide-react';
import { Trip, TripStop, TripActivity } from '../types';
import { tripService } from '../services/tripService';

interface TripCalendarViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
}

export const TripCalendarView: React.FC<TripCalendarViewProps> = ({ tripId, onNavigate }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

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
        <p className="text-xs text-slate-500">Loading timeline...</p>
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

    // Fallback: If dateActivities is empty for this specific day, distribute stop activities so timeline is NEVER empty
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

  const activeDayObj = days.find((d) => d.dateStr === selectedDate) || days[0];

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full">
                Interactive Trip Timeline (Day-by-Day)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {trip.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('itinerary-builder', trip.id)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in Builder</span>
          </button>
        </div>
      </div>

      {/* Date Carousel Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <div className="flex items-center space-x-3 min-w-max">
          {days.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const dayCost = day.activities.reduce((a, b) => a + Number(b.cost || 0), 0);
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`p-3.5 rounded-2xl border text-left transition-all w-40 cursor-pointer ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/90 ring-2 ring-amber-600/30 shadow-md'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-amber-800' : 'text-slate-400'}`}>
                  Day {day.dayIndex}
                </span>
                <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{day.dateStr}</p>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  {day.stop?.city_name || 'Destination'}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-700">
                  <span className="text-amber-800">{day.activities.length} Spots</span>
                  <span className="text-slate-900 font-extrabold">${dayCost.toLocaleString('en-US')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Timeline Details */}
      {activeDayObj && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full">
                  Day {activeDayObj.dayIndex} of {totalDays}
                </span>
                {activeDayObj.stop && (
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {activeDayObj.stop.city_name}, {activeDayObj.stop.country}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{activeDayObj.dateStr}</h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Day's Activities Cost</span>
              <span className="text-lg font-black text-emerald-800">
                ${activeDayObj.activities.reduce((a, b) => a + Number(b.cost || 0), 0).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 border-l-2 border-amber-300 space-y-6">
            {activeDayObj.activities.map((act, i) => (
              <div key={act.id || i} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-amber-600 border-4 border-white shadow" />

                <div className="p-4 bg-slate-50 hover:bg-amber-50/30 transition-all rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {act.scheduled_time || (i === 0 ? '08:30 AM (Morning)' : i === 1 ? '01:00 PM (Afternoon)' : '05:30 PM (Evening)')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {act.category}
                      </span>
                    </div>
                    <span className="font-black text-xs text-slate-900">
                      ${Number(act.cost || 0).toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5 pt-1">
                    {act.image_url && (
                      <img
                        src={act.image_url}
                        alt={act.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{act.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.notes || 'Curated sightseeing, sports, or dining spot.'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mt-1.5">
                        <span>Duration: {act.duration || 2} hrs</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready in Timeline
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
