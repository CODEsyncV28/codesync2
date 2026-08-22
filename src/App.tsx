import React, { useState, useEffect } from 'react';
import { Compass, Globe } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { MyTripsView } from './views/MyTripsView';
import { CreateTripView } from './views/CreateTripView';
import { CommunityView } from './views/CommunityView';
import { ItineraryBuilderView } from './views/ItineraryBuilderView';
import { ItineraryView } from './views/ItineraryView';
import { CitySearchView } from './views/CitySearchView';
import { ActivitySearchView } from './views/ActivitySearchView';
import { TripBudgetView } from './views/TripBudgetView';
import { TripCalendarView } from './views/TripCalendarView';
import { SharedItineraryView } from './views/SharedItineraryView';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AuthView } from './views/AuthView';
import { CityDetailModal } from './components/modals/CityDetailModal';
import { ShareModal } from './components/modals/ShareModal';
import { SmartAiPlannerModal } from './components/modals/SmartAiPlannerModal';
import { City, Trip, AppScreen } from './types';

function MainApp() {
  const { user, loading: authLoading } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<string>('trip-grand-europe');
  const [initialCreateCityId, setInitialCreateCityId] = useState<string | undefined>(undefined);

  // Modals state
  const [selectedCityForModal, setSelectedCityForModal] = useState<City | null>(null);
  const [sharingTrip, setSharingTrip] = useState<Trip | null>(null);
  const [isAiPlannerOpen, setIsAiPlannerOpen] = useState<boolean>(false);

  // Check URL hash for direct links (e.g. #/shared/trip-grand-europe or #/trips)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/shared/')) {
        const id = hash.replace('#/shared/', '');
        if (id) {
          setSelectedTripId(id);
          setCurrentScreen('shared-itinerary');
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // If initial load is checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-amber-200 tracking-wide">Loading GlobeTrotter World Planner...</p>
        </div>
      </div>
    );
  }

  // Strict Authentication & Registration Gate:
  // After login it is compulsory to finish registration before opening the app
  if (!user || !user.registration_completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-600/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Globe<span className="text-amber-400">Trotter</span>
            </span>
          </div>
          <div className="text-xs text-amber-200/80 font-medium hidden sm:block">
            25+ World Capitals &bull; 6 Continents &bull; Multi-City Itinerary Planner
          </div>
        </header>

        <div className="w-full flex-1 flex items-center justify-center my-6">
          <AuthView onSuccess={() => setCurrentScreen('dashboard')} />
        </div>

        <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-500 py-3 border-t border-white/5">
          GlobeTrotter &copy; 2026 &bull; Personalized Multi-City Travel Planning Worldwide &bull; Secure Authentication
        </footer>
      </div>
    );
  }

  const handleNavigate = (screen: AppScreen, tripId?: string) => {
    if (tripId) {
      setSelectedTripId(tripId);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCityDetail = (city: City) => {
    setSelectedCityForModal(city);
  };

  const handleAddCityToTrip = (city: City) => {
    setInitialCreateCityId(city.id);
    setCurrentScreen('create-trip');
  };

  const handleTripCreated = (newTrip: Trip) => {
    setSelectedTripId(newTrip.id);
    setCurrentScreen('itinerary-builder');
  };

  const handleOpenShare = (trip: Trip) => {
    setSharingTrip(trip);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentScreen === 'auth' && (
          <AuthView onSuccess={() => setCurrentScreen('dashboard')} />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenCityDetail={handleOpenCityDetail}
            onOpenAiPlanner={() => setIsAiPlannerOpen(true)}
            onSelectTrip={(id) => setSelectedTripId(id)}
          />
        )}

        {currentScreen === 'create-trip' && (
          <CreateTripView
            onBack={() => setCurrentScreen('dashboard')}
            onTripCreated={handleTripCreated}
            initialCityId={initialCreateCityId}
          />
        )}

        {currentScreen === 'my-trips' && (
          <MyTripsView
            onNavigate={handleNavigate}
            onSelectTrip={(id) => setSelectedTripId(id)}
            onOpenShareModal={handleOpenShare}
            highlightedTripId={selectedTripId}
          />
        )}

        {currentScreen === 'community' && (
          <CommunityView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'itinerary-builder' && (
          <ItineraryBuilderView
            tripId={selectedTripId}
            onNavigate={handleNavigate}
            onOpenShareModal={handleOpenShare}
          />
        )}

        {currentScreen === 'itinerary-view' && (
          <ItineraryView
            tripId={selectedTripId}
            onNavigate={handleNavigate}
            onOpenShareModal={handleOpenShare}
          />
        )}

        {currentScreen === 'city-search' && (
          <CitySearchView
            onOpenCityDetail={handleOpenCityDetail}
            onAddToTrip={handleAddCityToTrip}
          />
        )}

        {currentScreen === 'activity-search' && <ActivitySearchView />}

        {currentScreen === 'trip-budget' && (
          <TripBudgetView tripId={selectedTripId} onNavigate={handleNavigate} />
        )}

        {currentScreen === 'trip-calendar' && (
          <TripCalendarView tripId={selectedTripId} onNavigate={handleNavigate} />
        )}

        {currentScreen === 'shared-itinerary' && (
          <SharedItineraryView
            tripId={selectedTripId}
            onNavigate={handleNavigate}
            onOpenShareModal={handleOpenShare}
          />
        )}

        {currentScreen === 'profile-settings' && (
          <ProfileSettingsView
            onOpenCityDetail={handleOpenCityDetail}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'admin-dashboard' && <AdminDashboardView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">GlobeTrotter</span>
            <span>— Personalized Global Multi-City Travel Planner & Budget Manager</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentScreen('city-search')}
              className="hover:text-slate-800 cursor-pointer"
            >
              World Cities (25)
            </button>
            <button
              onClick={() => setCurrentScreen('activity-search')}
              className="hover:text-slate-800 cursor-pointer"
            >
              Global Highlights
            </button>
            <button
              onClick={() => setCurrentScreen('admin-dashboard')}
              className="hover:text-slate-800 cursor-pointer"
            >
              Curator Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {selectedCityForModal && (
        <CityDetailModal
          city={selectedCityForModal}
          isOpen={!!selectedCityForModal}
          onClose={() => setSelectedCityForModal(null)}
          onAddToTrip={handleAddCityToTrip}
        />
      )}

      {sharingTrip && (
        <ShareModal
          isOpen={!!sharingTrip}
          onClose={() => setSharingTrip(null)}
          trip={sharingTrip}
        />
      )}

      {isAiPlannerOpen && (
        <SmartAiPlannerModal
          isOpen={isAiPlannerOpen}
          onClose={() => setIsAiPlannerOpen(false)}
          onTripGenerated={handleTripCreated}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <MainApp />
      </CurrencyProvider>
    </AuthProvider>
  );
}
