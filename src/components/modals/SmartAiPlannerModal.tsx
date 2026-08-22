import React, { useState } from 'react';
import { X, Sparkles, Compass, MapPin, Calendar, DollarSign, CheckCircle2, ArrowRight, Globe } from 'lucide-react';
import { Trip, TripStop } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import { SEED_CITIES, SEED_ACTIVITIES } from '../../data/seedData';

interface SmartAiPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripGenerated: (trip: Trip) => void;
}

export const SmartAiPlannerModal: React.FC<SmartAiPlannerModalProps> = ({
  isOpen,
  onClose,
  onTripGenerated,
}) => {
  const { user } = useAuth();
  const [vibe, setVibe] = useState<string>('Grand Western European Highlights');
  const [durationDays, setDurationDays] = useState<number>(10);
  const [travelStyle, setTravelStyle] = useState<'budget' | 'balanced' | 'luxury'>('balanced');
  const [travelerType, setTravelerType] = useState<string>('Couple / Duo');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);

    setTimeout(async () => {
      try {
        const today = new Date();
        const start = new Date(today.setDate(today.getDate() + 15));
        const end = new Date(new Date(start).setDate(start.getDate() + durationDays));

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        let selectedCities: typeof SEED_CITIES = [];
        let tripTitle = '';
        let tripDesc = '';
        let coverPhoto = '';

        if (vibe.includes('European') || vibe.includes('Western')) {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-paris') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-amsterdam') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-rome') || SEED_CITIES[2],
            SEED_CITIES.find((c) => c.id === 'city-barcelona') || SEED_CITIES[3],
          ].filter(Boolean);
          tripTitle = 'Grand Western European Highlights Tour';
          tripDesc = 'A world-class journey exploring the Louvre & Eiffel Tower in Paris, Amsterdam canals, Colosseum in Rome, and Sagrada Família in Barcelona.';
          coverPhoto = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80';
        } else if (vibe.includes('East Asian') || vibe.includes('Japan')) {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-tokyo') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-kyoto') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-seoul') || SEED_CITIES[2],
          ].filter(Boolean);
          tripTitle = 'East Asian Golden Circuit: Tokyo, Kyoto & Seoul';
          tripDesc = 'Neon Shibuya crossings, Tsukiji sushi, Kyoto torii gates and bamboo groves, plus Gyeongbokgung Palace in Seoul.';
          coverPhoto = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80';
        } else if (vibe.includes('Southeast Asia') || vibe.includes('Tropical')) {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-bangkok') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-singapore') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-bali') || SEED_CITIES[2],
          ].filter(Boolean);
          tripTitle = 'Southeast Asia Tropical Odyssey: Bangkok, Singapore & Bali';
          tripDesc = 'Bangkok night markets, Singapore futuristic Supertree Groves, and Bali emerald rice terraces & clifftop sea temples.';
          coverPhoto = 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80';
        } else if (vibe.includes('Americas') || vibe.includes('Pacific')) {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-nyc') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-sf') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-vancouver') || SEED_CITIES[2],
          ].filter(Boolean);
          tripTitle = 'Iconic North America: NYC, San Francisco & Vancouver';
          tripDesc = 'Broadway and Central Park, Golden Gate vistas and cable cars, paired with temperate rainforest suspension bridges.';
          coverPhoto = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80';
        } else if (vibe.includes('Ancient Wonders') || vibe.includes('Middle East')) {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-cairo') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-istanbul') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-dubai') || SEED_CITIES[2],
          ].filter(Boolean);
          tripTitle = 'Ancient Wonders & Middle East Crossroads';
          tripDesc = 'Giza Pyramids, Hagia Sophia and Bosphorus cruises, combined with Dubai Burj Khalifa and desert dunes.';
          coverPhoto = 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80';
        } else {
          selectedCities = [
            SEED_CITIES.find((c) => c.id === 'city-cusco') || SEED_CITIES[0],
            SEED_CITIES.find((c) => c.id === 'city-rio') || SEED_CITIES[1],
            SEED_CITIES.find((c) => c.id === 'city-buenosaires') || SEED_CITIES[2],
          ].filter(Boolean);
          tripTitle = 'South American Wonders: Machu Picchu, Rio & Buenos Aires';
          tripDesc = 'Inca ruins in the Andes, Christ the Redeemer & Copacabana, and passionate tango with traditional Argentine steak.';
          coverPhoto = 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80';
        }

        if (selectedCities.length === 0) {
          selectedCities = SEED_CITIES.slice(0, 3);
        }

        const daysPerCity = Math.max(1, Math.floor(durationDays / selectedCities.length));
        const stops: TripStop[] = [];

        let currentStopDate = new Date(start);

        for (let i = 0; i < selectedCities.length; i++) {
          const city = selectedCities[i];
          const stopStart = new Date(currentStopDate);
          const stopEnd = new Date(currentStopDate);
          const cityStayDuration = (i === selectedCities.length - 1) ? Math.max(1, durationDays - (daysPerCity * (selectedCities.length - 1))) : daysPerCity;
          stopEnd.setDate(stopStart.getDate() + cityStayDuration);
          currentStopDate = new Date(stopEnd);

          const cityActs = (SEED_ACTIVITIES || []).filter((a) => a.city_id === city.id);
          const scheduledActs = cityActs.slice(0, 4).map((act, actIdx) => ({
            id: `act-ai-${Date.now()}-${i}-${actIdx}`,
            trip_stop_id: `stop-ai-${Date.now()}-${i}`,
            trip_id: '',
            activity_id: act.id,
            name: act.name,
            category: act.category,
            cost: travelStyle === 'budget' ? Math.round(act.cost * 0.75) : travelStyle === 'luxury' ? Math.round(act.cost * 1.3) : act.cost,
            duration: act.duration || 2,
            scheduled_date: stopStart.toISOString().split('T')[0],
            scheduled_time: actIdx === 0 ? '09:00 AM' : actIdx === 1 ? '01:30 PM' : '05:30 PM',
            completed: false,
            notes: act.description,
            image_url: act.image_url,
          }));

          const nightCost =
            travelStyle === 'budget'
              ? Math.round(city.avg_daily_cost * 0.6)
              : travelStyle === 'luxury'
              ? Math.round(city.avg_daily_cost * 1.6)
              : city.avg_daily_cost;

          stops.push({
            id: `stop-ai-${Date.now()}-${i}`,
            trip_id: '',
            city_id: city.id,
            city_name: city.name,
            country: city.country,
            city_photo: city.image_url,
            start_date: stopStart.toISOString().split('T')[0],
            end_date: stopEnd.toISOString().split('T')[0],
            order_index: i,
            accommodation_cost_per_night: nightCost,
            transport_cost_to_stop: i === 0 ? 350 : 120,
            transport_mode: i === 0 ? 'International Flight' : 'High-Speed Rail / Regional Flight',
            notes: `Curated itinerary for ${travelStyle} travel style and ${travelerType}.`,
            activities: scheduledActs,
          });
        }

        const baseMultiplier = travelStyle === 'budget' ? 140 : travelStyle === 'luxury' ? 420 : 250;
        const targetBudget = durationDays * baseMultiplier;

        const newTrip = await tripService.createTrip({
          user_id: user?.id || 'user-aarav-1',
          user_name: user?.name || 'Elena Rostova',
          user_photo: user?.photo,
          name: tripTitle,
          start_date: startStr,
          end_date: endStr,
          description: tripDesc,
          cover_photo: coverPhoto,
          is_public: true,
          currency: 'USD',
          currency_symbol: '$',
          target_budget: targetBudget,
          stops,
        });

        setIsGenerating(false);
        onTripGenerated(newTrip);
        onClose();
      } catch (err) {
        console.error(err);
        setIsGenerating(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3">
            <Globe className="w-6 h-6 text-amber-200" />
          </div>
          <h3 className="text-xl font-black tracking-tight">AI Worldwide Trip Generator</h3>
          <p className="text-xs text-amber-100 mt-1 font-medium">
            Generate an end-to-end multi-city itinerary with stops, activities, and budget estimates.
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Vibe Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Trip Theme & Destination Region
            </label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="Grand Western European Highlights">Grand Western Europe (Paris, Amsterdam, Rome, Barcelona)</option>
              <option value="East Asian Golden Circuit">East Asian Golden Circuit (Tokyo, Kyoto, Seoul)</option>
              <option value="Southeast Asia Tropical Odyssey">Southeast Asia Odyssey (Bangkok, Singapore, Bali)</option>
              <option value="Iconic North America">Iconic North America (New York, San Francisco, Vancouver)</option>
              <option value="Ancient Wonders & Middle East">Ancient Wonders & Middle East (Cairo, Istanbul, Dubai)</option>
              <option value="South American Wonders">South American Wonders (Machu Picchu, Rio, Buenos Aires)</option>
            </select>
          </div>

          {/* Duration in Days */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Trip Duration
              </label>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {durationDays} Days Total
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="21"
              step="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 Days (Express)</span>
              <span>10 Days (Recommended)</span>
              <span>21 Days (Grand Tour)</span>
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Travel & Budget Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'budget', label: 'Backpacker', desc: 'Hostels & Street Eats' },
                { key: 'balanced', label: 'Balanced', desc: 'Boutique & Smart' },
                { key: 'luxury', label: 'Luxury', desc: '5-Star & Fine Dining' },
              ].map((style) => (
                <button
                  type="button"
                  key={style.key}
                  onClick={() => setTravelStyle(style.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    travelStyle === style.key
                      ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-xs font-bold ${travelStyle === style.key ? 'text-amber-800' : 'text-slate-800'}`}>
                    {style.label}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Traveler Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Travelers
            </label>
            <select
              value={travelerType}
              onChange={(e) => setTravelerType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="Solo Explorer">Solo Explorer</option>
              <option value="Couple / Romantic Duo">Couple / Romantic Duo</option>
              <option value="Group of Friends">Group of Friends</option>
              <option value="Family with Kids">Family with Kids</option>
            </select>
          </div>

          {/* CTA Generate */}
          <div className="pt-3 border-t border-slate-100">
            <button
              id="generate-ai-trip-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Global Multi-City Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Full Itinerary</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
