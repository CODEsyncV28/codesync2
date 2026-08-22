import React, { useState, useEffect } from 'react';
import { Calendar, Image as ImageIcon, MapPin, Globe, Lock, Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { City, Trip } from '../types';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { cityService } from '../services/cityService';

const SAMPLE_COVERS = [
  { label: 'Eiffel Tower Paris', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tokyo Skyline & Fuji', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Rome Colosseum', url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'New York Manhattan', url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Giza Pyramids Cairo', url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Bali Clifftop Temples', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80' },
];

interface CreateTripViewProps {
  onBack: () => void;
  onTripCreated: (trip: Trip) => void;
  initialCityId?: string;
}

export const CreateTripView: React.FC<CreateTripViewProps> = ({
  onBack,
  onTripCreated,
  initialCityId,
}) => {
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [description, setDescription] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(SAMPLE_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [targetBudget, setTargetBudget] = useState<number>(2400);
  const [isPublic, setIsPublic] = useState(true);
  const [startingCityId, setStartingCityId] = useState(initialCityId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cityService.getAllCities().then((res) => {
      setCities(res);
      if (initialCityId) {
        const found = res.find((c) => c.id === initialCityId);
        if (found) {
          setName(`${found.name} & Global Highlights Tour`);
          setDescription(`Exploring ${found.name}, ${found.country} iconic landmarks, world food markets, and cultural spots.`);
          setCoverPhoto(found.image_url);
        }
      }
    });
  }, [initialCityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const selectedCover = customCoverUrl.trim() || coverPhoto;
      const initialStops = [];

      if (startingCityId) {
        const startCity = cities.find((c) => c.id === startingCityId);
        if (startCity) {
          initialStops.push({
            id: `stop-${Date.now()}-0`,
            trip_id: '',
            city_id: startCity.id,
            city_name: startCity.name,
            country: startCity.country,
            city_photo: startCity.image_url,
            start_date: startDate,
            end_date: endDate,
            order_index: 0,
            accommodation_cost_per_night: startCity.avg_daily_cost || 150,
            transport_cost_to_stop: 250,
            transport_mode: 'Flight' as const,
            activities: [],
          });
        }
      }

      const newTrip = await tripService.createTrip({
        user_id: user?.id || 'user-aarav-1',
        user_name: user?.name || 'Elena Rostova',
        user_photo: user?.photo,
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || 'A curated global journey featuring world wonders, street cuisine, and cultural treasures.',
        cover_photo: selectedCover,
        is_public: isPublic,
        currency: 'USD',
        currency_symbol: '$',
        target_budget: Number(targetBudget) || 2400,
        stops: initialStops,
      });

      setLoading(false);
      onTripCreated(newTrip);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Plan a New Global Itinerary</h1>
          <p className="text-xs text-slate-500">
            Set your travel dates, starting worldwide destination, and budget in USD ($).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Trip Title / Journey Name *
            </label>
            <input
              id="create-trip-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Western European Highlights, East Asian Circuit, Southeast Asia Odyssey..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Trip Start Date *
              </label>
              <div className="relative">
                <input
                  id="create-trip-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Trip End Date *
              </label>
              <div className="relative">
                <input
                  id="create-trip-end-date"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Starting City */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Starting Destination
            </label>
            <div className="relative">
              <select
                id="create-trip-starting-city"
                value={startingCityId}
                onChange={(e) => setStartingCityId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">-- Add stops later in builder --</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.country}) • {city.continent}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Trip Overview & Highlights
            </label>
            <textarea
              id="create-trip-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What experiences are you seeking? Famous monuments, museums, street markets, botanical gardens..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Target Budget & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Budget ($ USD)
              </label>
              <div className="relative">
                <input
                  id="create-trip-budget"
                  type="number"
                  min="200"
                  step="100"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-extrabold text-amber-700 text-sm absolute left-3 top-2">$</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Privacy / Share Setting
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isPublic
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/20'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Public Trip
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isPublic
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/20'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Private
                </button>
              </div>
            </div>
          </div>

          {/* Cover Photo Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Choose Worldwide Cover Image
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {SAMPLE_COVERS.map((sample) => (
                <div
                  key={sample.url}
                  onClick={() => {
                    setCoverPhoto(sample.url);
                    setCustomCoverUrl('');
                  }}
                  className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    coverPhoto === sample.url && !customCoverUrl
                      ? 'border-amber-600 ring-2 ring-amber-600/30 scale-105'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                id="create-trip-custom-cover"
                type="url"
                value={customCoverUrl}
                onChange={(e) => setCustomCoverUrl(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="create-trip-submit-btn"
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Launch Itinerary Builder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
