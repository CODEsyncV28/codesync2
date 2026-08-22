import React, { useState } from 'react';
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
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  LogOut,
  Camera,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_CITIES } from '../data/seedData';
import { City } from '../types';

interface ProfileSettingsViewProps {
  onOpenCityDetail: (city: City) => void;
  onNavigate: (screen: any) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  onOpenCityDetail,
  onNavigate,
}) => {
  const { user, updateUserProfile, toggleSaveDestination, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || 'Elena');
  const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ').slice(1).join(' ') || 'Rostova');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'New York');
  const [country, setCountry] = useState(user?.country || 'United States');
  const [additionalInfo, setAdditionalInfo] = useState(user?.additional_info || user?.bio || '');
  const [currency, setCurrency] = useState(user?.preferred_currency || 'USD');
  const [homeAirport, setHomeAirport] = useState(user?.home_airport || 'JFK (John F. Kennedy Intl, New York)');
  const [travelInterests, setTravelInterests] = useState<string[]>(
    user?.travel_interests || ['Art & World Museums', 'Historic Landmarks & Castles', 'World Cuisines & Markets']
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const ALL_INTERESTS = [
    'Art & World Museums',
    'Historic Landmarks & Castles',
    'Sports Venues & Stadiums',
    'World Cuisines & Markets',
    'Botanical Gardens & Parks',
    'Alpine Treks & Mountains',
    'Beaches & Coastal Walks',
    'Scenic Train Routes',
    'Architecture & Cathedrals',
    'Nightlife & Rooftops',
  ];

  const handleInterestToggle = (interest: string) => {
    setTravelInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'Traveler';
    await updateUserProfile({
      name: fullName,
      display_name: fullName,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      additional_info: additionalInfo.trim(),
      bio: additionalInfo.trim(),
      preferred_currency: currency,
      home_airport: homeAirport,
      travel_interests: travelInterests,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Find saved destinations
  const savedCities = SEED_CITIES.filter((c) => user?.saved_destinations?.includes(c.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your traveler persona, registration info, currency settings, and wishlist destinations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 text-center h-fit">
          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-1 shadow-md">
            {user?.photo || user?.photo_url ? (
              <img
                src={user.photo || user.photo_url}
                alt={user.display_name || user.name || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-3xl">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.display_name || user?.name || 'Traveler'}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full mt-2 border border-amber-200/60">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{user?.role === 'admin' ? 'Platform Administrator' : 'Verified Traveler'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
            {user?.city && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-slate-800">
                  {user.city}{user.country ? `, ${user.country}` : ''}
                </span>
              </div>
            )}
            {user?.phone && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-800">{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Home Airport:</span>
              <span className="font-semibold text-slate-800">{user?.home_airport || 'JFK'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Saved Wishlist:</span>
              <span className="font-semibold text-slate-800">
                {user?.saved_destinations?.length || 0} Cities
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Currency:</span>
              <span className="font-bold text-emerald-700">
                {user?.preferred_currency || 'USD'} ($)
              </span>
            </div>
          </div>

          <button
            id="signout-profile-btn"
            onClick={() => logout()}
            className="w-full py-2.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            <span>Sign Out to Login (Screen 1)</span>
          </button>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Traveler Registration Details</h3>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Row 1: First Name | Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Phone Number | Home Airport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Home Departure Airport / Hub
                  </label>
                  <input
                    type="text"
                    value={homeAirport}
                    onChange={(e) => setHomeAirport(e.target.value)}
                    placeholder="e.g. JFK (New York), LHR (London), CDG (Paris)..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: City | Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 4: Additional Information ... */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Additional Information ...
                </label>
                <textarea
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Additional Information ... (e.g. travel preferences, bio, dietary preferences, bucket list destinations)"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Preferred Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 bg-white"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                  <option value="SGD">SGD ($) - Singapore Dollar</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </div>

              {/* Travel Interests Chips */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                  Travel Interests & Styles
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_INTERESTS.map((interest) => {
                    const isSelected = travelInterests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Profile & details saved!
                  </span>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Saved Destinations Wishlist */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-current" /> Saved Wishlist Destinations (
                {savedCities.length})
              </h3>
            </div>

            {savedCities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                You have not saved any cities yet. Click the heart icon on any city card to add it to your wishlist!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedCities.map((city) => (
                  <div
                    key={city.id}
                    onClick={() => onOpenCityDetail(city)}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={city.image_url}
                        alt={city.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{city.name}</h4>
                        <p className="text-xs text-slate-500">{city.country}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveDestination(city.id);
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
