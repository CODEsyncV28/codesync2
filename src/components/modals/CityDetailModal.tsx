import React, { useState, useEffect } from 'react';
import { X, MapPin, Heart, Sparkles, PlusCircle, Compass, Star, DollarSign, Calendar } from 'lucide-react';
import { City, Activity, Trip } from '../../types';
import { cityService } from '../../services/cityService';
import { tripService } from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';

interface CityDetailModalProps {
  city: City | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip: (city: City, tripId?: string) => void;
  userTrips?: Trip[];
}

export const CityDetailModal: React.FC<CityDetailModalProps> = ({
  city,
  isOpen,
  onClose,
  onAddToTrip,
  userTrips,
}) => {
  const { user, toggleSaveDestination } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tripsList, setTripsList] = useState<Trip[]>(userTrips || []);
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  useEffect(() => {
    if (city) {
      cityService.getActivitiesForCity(city.id).then(setActivities);
    }
  }, [city]);

  useEffect(() => {
    if (userTrips && userTrips.length > 0) {
      setTripsList(userTrips);
    } else if (user) {
      tripService.getUserTrips(user.id || 'user-aarav-1').then((res) => {
        setTripsList(res || []);
      });
    }
  }, [userTrips, user]);

  if (!isOpen || !city) return null;

  const isSaved = user?.saved_destinations?.includes(city.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cover Photo Header */}
        <div className="relative h-64 w-full">
          <img
            src={city.image_url}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {/* Close & Favorite Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => toggleSaveDestination(city.id)}
              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* City Badge & Title */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-sky-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {city.region}
              </span>
              <span className="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> {city.popularity_score} Popularity
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">{city.name}</h2>
            <p className="text-slate-200 text-sm flex items-center gap-1 font-medium">
              <MapPin className="w-4 h-4 text-sky-400" /> {city.country}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Cost Index
              </p>
              <div className="flex justify-center items-center gap-0.5 mt-1 text-emerald-600 font-bold text-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < city.cost_index ? 'opacity-100' : 'opacity-20'}>
                    $
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Avg Daily Spend
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-0.5">
                <span className="text-sm font-black text-emerald-600">$</span>
                {city.avg_daily_cost.toLocaleString('en-US')} / day
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Best Season
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={city.best_season}>
                {city.best_season}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              About the Destination
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{city.description}</p>
          </div>

          {/* Top Activities in this city */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-600" /> Top Activities & Experiences ({activities.length})
              </h4>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No curated activities yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={act.image_url}
                        alt={act.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{act.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded font-medium">
                            {act.category}
                          </span>
                          <span>{act.duration} hrs</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{act.cost === 0 ? 'Free' : `$${act.cost.toLocaleString('en-US')}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to Trip Action Bar */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-amber-600" /> Plan a Trip with {city.name}
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full sm:w-2/3 rounded-xl border border-amber-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Create a new trip with this city --</option>
                {(tripsList || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    Add to "{t.name || t.title}"
                  </option>
                ))}
              </select>
              <button
                id="add-city-confirm-btn"
                onClick={() => {
                  onAddToTrip(city, selectedTripId || undefined);
                  onClose();
                }}
                className="w-full sm:w-1/3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{selectedTripId ? 'Append Stop' : 'Start New Trip'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
