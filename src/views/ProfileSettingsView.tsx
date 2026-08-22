import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  MapPin,
  Globe,
  Phone,
  DollarSign,
  Heart,
  Save,
  Trash2,
  Sparkles,
  CheckCircle2,
  LogOut,
  Edit3,
  Wallet,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_CITIES } from '../data/seedData';
import { City, Trip } from '../types';
import { tripService } from '../services/tripService';

interface ProfileSettingsViewProps {
  onOpenCityDetail: (city: City) => void;
  onNavigate: (screen: any, tripId?: string) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  onOpenCityDetail,
  onNavigate,
}) => {
  const { user, updateUserProfile, toggleSaveDestination, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || 'Elena');
  const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ').slice(1).join(' ') || 'Rostova');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(user?.photo || user?.photo_url || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'New York');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [additionalInfo, setAdditionalInfo] = useState(user?.additional_info || user?.bio || '');
  const [currency, setCurrency] = useState(user?.preferred_currency || 'USD');
  const [homeAirport, setHomeAirport] = useState(user?.home_airport || 'JFK (John F. Kennedy Intl, New York)');
  
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      const list = await tripService.getUserTrips(user?.id || 'demo-user-1');
      setTrips(list);
    };
    loadTrips();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'Traveler';
    await updateUserProfile({
      name: fullName,
      display_name: fullName,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      photo: photo.trim(),
      photo_url: photo.trim(),
      phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      additional_info: additionalInfo.trim(),
      bio: additionalInfo.trim(),
      preferred_currency: currency,
      home_airport: homeAirport,
    });
    setSavedSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const preplannedTrips = trips.filter((t) => t.start_date >= todayStr);
  const previousTrips = trips.filter((t) => t.end_date < todayStr);

  const renderTripCard = (trip: Trip) => (
    <div key={trip.id} className="min-w-[180px] w-48 shrink-0 bg-transparent border border-white/30 rounded-xl overflow-hidden flex flex-col items-center justify-between p-3 relative group hover:border-white/60 transition-colors h-56">
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-full h-24 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden mb-3">
        {trip.cover_photo || trip.cover_image_url ? (
          <img src={trip.cover_photo || trip.cover_image_url} alt={trip.name} className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
        ) : (
          <span className="text-white/50 text-xl font-handwriting transform -rotate-12">{trip.name.substring(0, 8)}</span>
        )}
      </div>
      <div className="text-center w-full relative z-10 flex-1 flex flex-col justify-between">
        <h4 className="text-sm font-bold text-white truncate w-full">{trip.name}</h4>
        <button 
          onClick={() => onNavigate('itinerary-view', trip.id)}
          className="mt-2 w-full py-1.5 border border-white/50 rounded-lg text-xs font-semibold text-white hover:bg-white hover:text-slate-900 transition-colors">
          View
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] bg-[#111111] text-white p-6 rounded-3xl border border-white/10 font-sans tracking-tight">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header / Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pt-4">
          {/* Avatar Column */}
          <div className="flex justify-center md:justify-start pt-4">
            <div className="w-40 h-40 rounded-full border border-white/40 flex items-center justify-center overflow-hidden">
              {user?.photo || user?.photo_url ? (
                <img src={user.photo || user.photo_url} alt="Profile" className="w-full h-full object-cover grayscale opacity-90" />
              ) : (
                <span className="text-white/60 text-xs">Image of the User</span>
              )}
            </div>
          </div>
          
          {/* Details Column */}
          <div className="md:col-span-2 border border-white/30 rounded-xl p-6 min-h-[160px] relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => logout()} className="text-white/50 hover:text-white transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditing(!isEditing)} className="text-white/50 hover:text-white transition-colors" title="Edit Profile">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-4 pr-8">
                <div>
                  <h2 className="text-xl font-bold">{user?.display_name || user?.name || 'User Details'}</h2>
                  <p className="text-sm text-white/60">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs">Location</span>
                    <span>{city}{country ? `, ${country}` : ''}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs">Phone</span>
                    <span>{phone || 'Not set'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs">Home Airport</span>
                    <span>{homeAirport}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-xs">Currency</span>
                    <span>{currency}</span>
                  </div>
                </div>
                {additionalInfo && (
                  <div>
                    <span className="text-white/40 text-xs block mb-1">Additional Info</span>
                    <p className="text-sm text-white/80">{additionalInfo}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 pr-8">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="url" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="Photo URL" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60" />
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-[#111111] border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60 text-white">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Additional Info" className="bg-transparent border border-white/20 rounded-md px-3 py-1.5 text-sm w-full outline-none focus:border-white/60 h-20 resize-none" />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-1.5 bg-white text-black rounded-md text-sm font-bold">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-1.5 border border-white/20 rounded-md text-sm text-white/70">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Preplanned Trips Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2">Preplanned Trips</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {preplannedTrips.length > 0 ? (
              preplannedTrips.map(renderTripCard)
            ) : (
              <div className="text-white/40 text-sm py-8 px-4 border border-dashed border-white/20 rounded-xl w-full text-center">
                No preplanned trips found.
              </div>
            )}
          </div>
        </div>

        {/* Previous Trips Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2">Previous Trips</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {previousTrips.length > 0 ? (
              previousTrips.map(renderTripCard)
            ) : (
              <div className="text-white/40 text-sm py-8 px-4 border border-dashed border-white/20 rounded-xl w-full text-center">
                No previous trips found.
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Financial Summary & Cost Breakdown
          </h3>
          {trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map(trip => {
                const budget = tripService.calculateBudgetSummary(trip);
                const isOver = budget.isOverBudget;
                return (
                  <div key={`budget-${trip.id}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col space-y-3 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white truncate max-w-[200px]" title={trip.name}>{trip.name}</h4>
                        <p className="text-xs text-white/50">{trip.start_date} to {trip.end_date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black tracking-tight text-white">
                          ${budget.totalActual.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                          Total Cost
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="flex flex-col">
                        <span className="text-white/40 mb-0.5">Accommodation</span>
                        <span className="font-semibold text-white/90">${budget.categories.stay.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 mb-0.5">Transportation</span>
                        <span className="font-semibold text-white/90">${budget.categories.transport.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 mb-0.5">Activities & Tours</span>
                        <span className="font-semibold text-white/90">${budget.categories.activities.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 mb-0.5">Logged Expenses</span>
                        <span className="font-semibold text-white/90">${budget.totalLoggedExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {budget.targetBudget > 0 && (
                      <div className={`mt-2 p-2 rounded-lg text-xs font-bold flex items-center justify-between ${isOver ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        <div className="flex items-center gap-1.5">
                          {isOver ? <TrendingUp className="w-3.5 h-3.5" /> : <PieChart className="w-3.5 h-3.5" />}
                          <span>Target: ${budget.targetBudget.toLocaleString()}</span>
                        </div>
                        <span>
                          {isOver ? `+$${budget.overBudgetAmount.toLocaleString()} Over` : `-$${Math.abs(budget.variance).toLocaleString()} Under`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-white/40 text-sm py-8 px-4 border border-dashed border-white/20 rounded-xl w-full text-center">
              No trips available for financial summary.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

