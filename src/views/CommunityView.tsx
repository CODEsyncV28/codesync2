import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  Copy,
  Users
} from 'lucide-react';
import { Trip, AppScreen } from '../types';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { SafeImage } from '../components/SafeImage';

interface CommunityViewProps {
  onNavigate: (screen: AppScreen, tripId?: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloningTripId, setCloningTripId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicTrips();
  }, []);

  const fetchPublicTrips = async () => {
    try {
      setLoading(true);
      const publicTrips = await tripService.getAllPublicTrips();
      // Exclude current user's trips from community feed, or keep them but distinguish
      // For now let's show all public trips
      setTrips(publicTrips.filter(t => t.is_public));
    } catch (err) {
      console.error('Failed to load community trips', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneTrip = async (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to clone trips");
      onNavigate('auth');
      return;
    }
    
    try {
      setCloningTripId(trip.id);
      const newUserId = user.id || user.uid || 'user-aarav-1';
      const newUserName = user.display_name || user.name || 'Aarav';
      
      const cloned = await tripService.cloneTrip(trip.id, newUserId, newUserName);
      // Navigate to the cloned trip
      onNavigate('itinerary-view', cloned.id);
    } catch (err) {
      console.error('Failed to clone trip:', err);
      alert('Failed to clone trip');
    } finally {
      setCloningTripId(null);
    }
  };

  const processedTrips = trips.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.name?.toLowerCase().includes(q) && !t.stops?.some(s => s.city_name.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const renderTripCard = (trip: Trip) => {
    const isOwner = user && (trip.user_id === user.id || trip.user_id === user.uid || trip.user_id === 'demo-user-1');
    const displayImage = trip.cover_photo || trip.cover_image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80';
    const dayCount = trip.start_date && trip.end_date 
      ? Math.max(1, Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 3600 * 24)))
      : 0;
    
    return (
      <div 
        key={trip.id} 
        onClick={() => onNavigate('shared-itinerary', trip.id)}
        className="group bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/30 transition-all duration-300 flex flex-col"
      >
        <div className="h-48 relative overflow-hidden">
          <SafeImage 
            src={displayImage} 
            alt={trip.name} 
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">{trip.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-white/80 font-medium">
                <Users className="w-3.5 h-3.5" />
                By {trip.user_name || 'Traveler'} {isOwner && '(You)'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <p className="text-sm text-white/60 line-clamp-2 mb-4 flex-1">
            {trip.description || 'No description provided.'}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="truncate">{trip.stops?.length || 0} Destinations</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{dayCount} Days</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>{trip.target_budget ? formatPrice(trip.target_budget) : 'Flexible'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button 
              onClick={(e) => handleCloneTrip(e, trip)}
              disabled={cloningTripId === trip.id}
              className="flex-1 py-2 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {cloningTripId === trip.id ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Trip
                </>
              )}
            </button>
            <button 
              className="w-10 h-10 flex items-center justify-center border border-white/20 hover:bg-white/10 text-white rounded-xl transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] bg-[#111111] text-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-white/10 font-sans tracking-tight">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3">
              <Globe className="w-3.5 h-3.5 text-sky-400" /> Community
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Discover Trips
            </h1>
            <p className="text-sm md:text-base text-white/60 max-w-xl">
              Explore itineraries created by other travelers. Copy any trip to your own dashboard to customize it for your next adventure.
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search community trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
              />
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">Loading community trips...</p>
          </div>
        ) : processedTrips.length === 0 ? (
          <div className="bg-white/5 rounded-3xl border border-dashed border-white/20 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">No Public Trips Yet</h3>
            <p className="text-sm text-white/60 mt-2 max-w-sm mx-auto">
              {searchQuery 
                ? 'No public trips match your search.'
                : 'Be the first to share an itinerary with the community! Change your trip visibility to public in the share settings.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedTrips.map(renderTripCard)}
          </div>
        )}
      </div>
    </div>
  );
};
