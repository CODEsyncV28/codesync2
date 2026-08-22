import React from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  User as UserIcon,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  LogOut,
  FolderHeart,
  Globe,
  LogIn,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '../context/CurrencyContext';
import { AppScreen } from '../types';

interface NavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen, tripId?: string) => void;
  onOpenAiPlanner?: () => void;
  selectedTripId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  onOpenAiPlanner,
  selectedTripId,
}) => {
  const { user, logout, isAdmin, loginAsDemoUser } = useAuth();
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Globe<span className="text-amber-600">Trotter</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full tracking-wider border border-amber-300/40">
                  Global
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Multi-City Travel Planner Worldwide
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentScreen === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore World
            </button>

            <button
              id="nav-community-btn"
              onClick={() => onNavigate('community')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentScreen === 'community'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Community
            </button>

            <button
              id="nav-mytrips-btn"
              onClick={() => onNavigate('my-trips')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentScreen === 'my-trips'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              My Trips
            </button>

            {isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentScreen === 'admin-dashboard'
                    ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200'
                    : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Admin
              </button>
            )}

            <button
              id="nav-cities-btn"
              onClick={() => onNavigate('city-search')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentScreen === 'city-search'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Destinations
            </button>

            <button
              id="nav-activities-btn"
              onClick={() => onNavigate('activity-search')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentScreen === 'activity-search'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Highlights & Food
            </button>

            {selectedTripId && (
              <>
                <button
                  id="nav-itinerary-btn"
                  onClick={() => onNavigate('itinerary-view', selectedTripId)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentScreen === 'itinerary-view' || currentScreen === 'itinerary-builder'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  Itinerary
                </button>
                <button
                  id="nav-budget-btn"
                  onClick={() => onNavigate('trip-budget', selectedTripId)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentScreen === 'trip-budget'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Budget
                </button>
                <button
                  id="nav-calendar-btn"
                  onClick={() => onNavigate('trip-calendar', selectedTripId)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentScreen === 'trip-calendar'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Timeline
                </button>
              </>
            )}
          </nav>

          {/* Action Area */}
          <div className="flex items-center space-x-2">
            {/* Global Currency Selector */}
            <div className="relative">
              <select
                id="global-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                title="Change Global Currency"
                aria-label="Change Global Currency"
                className="h-9 pl-2.5 pr-7 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none transition-colors"
              >
                {supportedCurrencies.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white text-slate-900 font-medium">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500 text-[10px]">
                ▼
              </div>
            </div>

            {onOpenAiPlanner && (
              <button
                id="ai-planner-btn"
                onClick={onOpenAiPlanner}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                title="AI Worldwide Itinerary Generator"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Planner</span>
              </button>
            )}

            <button
              id="nav-create-trip-btn"
              onClick={() => onNavigate('create-trip')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Plan Trip</span>
            </button>

            {/* Circular Profile Avatar */}
            {user ? (
              <button
                id="user-profile-btn"
                onClick={() => onNavigate('profile-settings')}
                aria-label="User Profile"
                className="w-10 h-10 rounded-full border-2 border-slate-200 hover:border-amber-500 overflow-hidden shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center bg-slate-100 ring-2 ring-transparent hover:ring-amber-200"
              >
                <img
                  src={user.photo_url || user.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.display_name || user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={loginAsDemoUser}
                  className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white py-2 px-1 text-[11px] font-semibold text-slate-600">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            currentScreen === 'dashboard' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span>Explore</span>
        </button>
        <button
          onClick={() => onNavigate('community')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            currentScreen === 'community' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Community</span>
        </button>
        <button
          onClick={() => onNavigate('my-trips')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            currentScreen === 'my-trips' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Trips</span>
        </button>
        <button
          onClick={() => onNavigate('city-search')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            currentScreen === 'city-search' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span>Cities</span>
        </button>
        <button
          onClick={() => onNavigate('activity-search')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            currentScreen === 'activity-search' ? 'text-amber-600 font-bold' : ''
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>Spots</span>
        </button>
        {onOpenAiPlanner && (
          <button
            onClick={onOpenAiPlanner}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-orange-600 font-bold"
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>AI</span>
          </button>
        )}
      </div>
    </header>
  );
};
