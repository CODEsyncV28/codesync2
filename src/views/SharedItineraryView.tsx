import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Copy,
  Share2,
  Globe,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Trip } from '../types';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';

interface SharedItineraryViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenShareModal: (trip: Trip) => void;
}

export const SharedItineraryView: React.FC<SharedItineraryViewProps> = ({
  tripId,
  onNavigate,
  onOpenShareModal,
}) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [clonedSuccess, setClonedSuccess] = useState(false);

  useEffect(() => {
    tripService.getTripById(tripId).then((res) => {
      setTrip(res);
      setLoading(false);
    });
  }, [tripId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading shared community itinerary...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <p className="text-base font-bold text-slate-800">Itinerary link unavailable or expired</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const budget = tripService.calculateBudgetSummary(trip);

  const handleClone = async () => {
    setCloning(true);
    try {
      const cloned = await tripService.cloneTrip(
        trip.id,
        user?.id || 'demo-user-1',
        user?.name || 'Traveler'
      );
      setClonedSuccess(true);
      setTimeout(() => {
        onNavigate('itinerary-builder', cloned.id);
      }, 1200);
    } catch (err) {
      console.error(err);
      setCloning(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore More Trips</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenShareModal(trip)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            id="shared-clone-trip-btn"
            onClick={handleClone}
            disabled={cloning || clonedSuccess}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {clonedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved to My Trips! Redirecting...</span>
              </>
            ) : cloning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Cloning Plan...</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Clone Itinerary to My Account</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Visual Card */}
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
          {/* Creator Attribution */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white shadow-md border-2 border-white/20">
              {trip.user_name?.charAt(0) || 'T'}
            </div>
            <div>
              <p className="text-xs text-sky-200 font-semibold">Shared Travel Plan by</p>
              <p className="text-sm font-bold text-white">{trip.user_name || 'GlobeTrotter Explorer'}</p>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{trip.name}</h1>
          <p className="text-sm text-slate-200 mt-2 max-w-2xl leading-relaxed">{trip.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold text-sky-200">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {trip.start_date} – {trip.end_date} ({budget.totalDays} Days)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {trip.stops?.length || 0} Cities
            </span>
            <span>•</span>
            <span className="text-emerald-300 font-bold">
              Est. ${budget.totalPlanned.toLocaleString('en-US')} Budget
            </span>
          </div>
        </div>
      </div>

      {/* Stops & Schedule */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Destination Route & Planned Activities</h2>

        {trip.stops?.map((stop, index) => (
          <div
            key={stop.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                {index + 1}
              </div>
              {stop.city_photo && (
                <img
                  src={stop.city_photo}
                  alt={stop.city_name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {stop.city_name}, {stop.country}
                </h3>
                <p className="text-xs text-slate-500">
                  {stop.start_date} to {stop.end_date} • Transport: {stop.transport_mode || 'Train'} ({stop.transport_cost_to_stop ? `$${stop.transport_cost_to_stop.toLocaleString('en-US')}` : 'Included'}) • Stay: {stop.accommodation_cost_per_night ? `$${stop.accommodation_cost_per_night.toLocaleString('en-US')}/night` : 'Included'}
                </p>
              </div>
            </div>

            {/* Activities in this Stop */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scheduled Experiences ({stop.activities?.length || 0})
              </p>
              {stop.activities?.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    {act.image_url && (
                      <img
                        src={act.image_url}
                        alt={act.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{act.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        {act.scheduled_date} • {act.scheduled_time || 'Morning'} ({act.duration}h) •{' '}
                        <span className="font-semibold text-slate-700">{act.category}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm">{act.cost === 0 ? 'Free' : `$${act.cost.toLocaleString('en-US')}`}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
