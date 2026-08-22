import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Plane,
  Building2,
  Compass,
  Utensils,
  Share2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Save,
  Check,
  X,
  FileText,
  Copy,
  Printer,
  ChevronRight,
  Landmark,
  Trees,
  ShoppingBag,
  Eye,
  CheckSquare,
  Square,
  Search,
  Camera,
  Info,
  PartyPopper,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Trip, TripSection, SectionPlaceSpot, TripStop, TripActivity } from '../types';
import { tripService } from '../services/tripService';
import { useCurrency } from '../context/CurrencyContext';
import { SEED_ACTIVITIES } from '../data/seedData';

interface ItineraryBuilderViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
  onOpenShareModal: (trip: Trip) => void;
}

export const ItineraryBuilderView: React.FC<ItineraryBuilderViewProps> = ({
  tripId,
  onNavigate,
  onOpenShareModal,
}) => {
  const { currencySymbol, formatPrice } = useCurrency();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmedSuccessModalOpen, setIsConfirmedSuccessModalOpen] = useState(false);

  // Edit / Add section modal state
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TripSection | null>(null);

  // Form states for Section Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBudget, setFormBudget] = useState<number>(500);
  const [formType, setFormType] = useState<'travel' | 'stay' | 'activity' | 'dining' | 'general'>('activity');
  const [formLocation, setFormLocation] = useState('');

  // States for Add / Edit Place & Spot Modal in a Day Section
  const [isAddSpotModalOpen, setIsAddSpotModalOpen] = useState(false);
  const [targetSectionIdForSpot, setTargetSectionIdForSpot] = useState<string | null>(null);
  const [editingSpot, setEditingSpot] = useState<SectionPlaceSpot | null>(null);

  // Place & Spot Form fields
  const [spotName, setSpotName] = useState('');
  const [spotCategory, setSpotCategory] = useState<SectionPlaceSpot['category']>('landmark');
  const [spotTime, setSpotTime] = useState('10:00 AM');
  const [spotDuration, setSpotDuration] = useState<number>(2);
  const [spotCost, setSpotCost] = useState<number>(25);
  const [spotLocation, setSpotLocation] = useState('');
  const [spotNotes, setSpotNotes] = useState('');
  const [spotSearchQuery, setSpotSearchQuery] = useState('');

  const loadTrip = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTripById(tripId);
      if (data) {
        setTrip(data);
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
        } else {
          // Initialize default 3 sections with places
          const start = data.start_date || new Date().toISOString().split('T')[0];
          const end = data.end_date || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
          const cityName = data.stops && data.stops[0] ? data.stops[0].city_name : 'Global Destination';

          const initialSections: TripSection[] = [
            {
              id: `sec-${Date.now()}-1`,
              trip_id: data.id,
              title: `Section 1: Travel & Accommodation (${cityName})`,
              type: 'travel',
              description:
                'All the necessary information about this section. Travel arrival, check-in at central accommodation, and neighborhood orientation.',
              start_date: start,
              end_date: start,
              budget: 650,
              location: cityName,
              status: 'planned',
              places: [
                {
                  id: `spot-${Date.now()}-1`,
                  name: `Check-in & Neighborhood Welcome Walk`,
                  category: 'landmark',
                  time: '02:00 PM',
                  duration: 2,
                  cost: 50,
                  location: `${cityName} Center`,
                  notes: 'Settle luggage, exchange local currency, and stroll through the main square.',
                  visited: false,
                },
              ],
            },
            {
              id: `sec-${Date.now()}-2`,
              trip_id: data.id,
              title: `Section 2: Cultural Exploration & City Sights`,
              type: 'activity',
              description:
                'All the necessary information about this section. Exploring iconic highlights, guided walking tours, and cultural treasures.',
              start_date: start,
              end_date: end,
              budget: 450,
              location: `${cityName} Center`,
              status: 'planned',
              places: [
                {
                  id: `spot-${Date.now()}-2`,
                  name: `${cityName} Historic Old Town & Landmark Tour`,
                  category: 'landmark',
                  time: '10:00 AM',
                  duration: 3,
                  cost: 25,
                  location: `${cityName} Heritage District`,
                  notes: 'Guided audio walk covering the main historic architecture and towers.',
                  visited: false,
                },
                {
                  id: `spot-${Date.now()}-3`,
                  name: `National Art & Cultural Museum`,
                  category: 'museum',
                  time: '02:30 PM',
                  duration: 2.5,
                  cost: 20,
                  location: `${cityName} Cultural Quarter`,
                  notes: 'Fast-track entry to classical collections and rotating exhibitions.',
                  visited: false,
                },
              ],
            },
            {
              id: `sec-${Date.now()}-3`,
              trip_id: data.id,
              title: `Section 3: Dining Experiences & Regional Highlights`,
              type: 'dining',
              description:
                'All the necessary information about this section. Local gastronomy, authentic food markets, and evening scenic viewpoints.',
              start_date: end,
              end_date: end,
              budget: 500,
              location: `${cityName} District`,
              status: 'planned',
              places: [
                {
                  id: `spot-${Date.now()}-4`,
                  name: `Traditional Culinary Tasting & Night Market`,
                  category: 'restaurant',
                  time: '07:00 PM',
                  duration: 2,
                  cost: 45,
                  location: `${cityName} Market Area`,
                  notes: 'Taste 5 distinct authentic regional delicacies paired with local wine.',
                  visited: false,
                },
              ],
            },
          ];
          setSections(initialSections);
          tripService.updateTrip(data.id, { sections: initialSections });
        }
      }
    } catch (err) {
      console.error('Error loading trip in builder:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  // Section Management
  const handleOpenAddSection = () => {
    setEditingSection(null);
    setFormTitle(`Section ${sections.length + 1}: `);
    setFormDescription(
      'All the necessary information about this section. This can be anything like travel section, hotel or any other activity.'
    );
    setFormStartDate(trip?.start_date || new Date().toISOString().split('T')[0]);
    setFormEndDate(trip?.end_date || new Date().toISOString().split('T')[0]);
    setFormBudget(400);
    setFormType('activity');
    setFormLocation(trip?.stops?.[0]?.city_name || 'City Center');
    setIsAddSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: TripSection) => {
    setEditingSection(sec);
    setFormTitle(sec.title);
    setFormDescription(sec.description);
    setFormStartDate(sec.start_date);
    setFormEndDate(sec.end_date);
    setFormBudget(sec.budget);
    setFormType(sec.type || 'general');
    setFormLocation(sec.location || '');
    setIsAddSectionModalOpen(true);
  };

  const handleSaveSectionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !formTitle.trim()) return;

    let updatedSections: TripSection[] = [];
    if (editingSection) {
      updatedSections = sections.map((s) =>
        s.id === editingSection.id
          ? {
              ...s,
              title: formTitle.trim(),
              description: formDescription.trim(),
              start_date: formStartDate,
              end_date: formEndDate,
              budget: Number(formBudget) || 0,
              type: formType,
              location: formLocation.trim(),
            }
          : s
      );
    } else {
      const newSec: TripSection = {
        id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trip_id: trip.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        start_date: formStartDate,
        end_date: formEndDate,
        budget: Number(formBudget) || 0,
        type: formType,
        location: formLocation.trim(),
        status: 'planned',
        places: [],
      };
      updatedSections = [...sections, newSec];
    }

    setSections(updatedSections);
    setIsAddSectionModalOpen(false);

    try {
      await tripService.updateTrip(trip.id, { sections: updatedSections });
    } catch (err) {
      console.error('Failed to update trip sections:', err);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!trip) return;
    const updated = sections.filter((s) => s.id !== sectionId);
    setSections(updated);
    try {
      await tripService.updateTrip(trip.id, { sections: updated });
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (!trip) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    setSections(newSections);
    try {
      await tripService.updateTrip(trip.id, { sections: newSections });
    } catch (err) {
      console.error('Failed to reorder sections:', err);
    }
  };

  // Spot / Place Management within a specific Day Section
  const handleOpenAddSpot = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    setTargetSectionIdForSpot(sectionId);
    setEditingSpot(null);
    setSpotName('');
    setSpotCategory(sec?.type === 'dining' ? 'restaurant' : sec?.type === 'travel' ? 'landmark' : 'landmark');
    setSpotTime('10:00 AM');
    setSpotDuration(2);
    setSpotCost(25);
    setSpotLocation(sec?.location || trip?.stops?.[0]?.city_name || '');
    setSpotNotes('');
    setSpotSearchQuery('');
    setIsAddSpotModalOpen(true);
  };

  const handleOpenEditSpot = (sectionId: string, spot: SectionPlaceSpot) => {
    setTargetSectionIdForSpot(sectionId);
    setEditingSpot(spot);
    setSpotName(spot.name);
    setSpotCategory(spot.category || 'landmark');
    setSpotTime(spot.time || '10:00 AM');
    setSpotDuration(spot.duration || 2);
    setSpotCost(spot.cost || 0);
    setSpotLocation(spot.location || '');
    setSpotNotes(spot.notes || '');
    setSpotSearchQuery('');
    setIsAddSpotModalOpen(true);
  };

  const handleSaveSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !targetSectionIdForSpot || !spotName.trim()) return;

    const updatedSections = sections.map((sec) => {
      if (sec.id !== targetSectionIdForSpot) return sec;

      const currentPlaces = sec.places || [];
      let nextPlaces: SectionPlaceSpot[] = [];

      if (editingSpot) {
        nextPlaces = currentPlaces.map((p) =>
          p.id === editingSpot.id
            ? {
                ...p,
                name: spotName.trim(),
                category: spotCategory,
                time: spotTime.trim(),
                duration: Number(spotDuration) || 1,
                cost: Number(spotCost) || 0,
                location: spotLocation.trim(),
                notes: spotNotes.trim(),
              }
            : p
        );
      } else {
        const newSpot: SectionPlaceSpot = {
          id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: spotName.trim(),
          category: spotCategory,
          time: spotTime.trim(),
          duration: Number(spotDuration) || 1,
          cost: Number(spotCost) || 0,
          location: spotLocation.trim(),
          notes: spotNotes.trim(),
          visited: false,
        };
        nextPlaces = [...currentPlaces, newSpot];
      }

      return {
        ...sec,
        places: nextPlaces,
      };
    });

    setSections(updatedSections);
    setIsAddSpotModalOpen(false);

    try {
      await tripService.updateTrip(trip.id, { sections: updatedSections });
    } catch (err) {
      console.error('Failed to save spot:', err);
    }
  };

  const handleDeleteSpot = async (sectionId: string, spotId: string) => {
    if (!trip) return;
    const updatedSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        places: (sec.places || []).filter((p) => p.id !== spotId),
      };
    });

    setSections(updatedSections);
    try {
      await tripService.updateTrip(trip.id, { sections: updatedSections });
    } catch (err) {
      console.error('Failed to delete spot:', err);
    }
  };

  const handleToggleSpotVisited = async (sectionId: string, spotId: string) => {
    if (!trip) return;
    const updatedSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        places: (sec.places || []).map((p) =>
          p.id === spotId ? { ...p, visited: !p.visited } : p
        ),
      };
    });

    setSections(updatedSections);
    try {
      await tripService.updateTrip(trip.id, { sections: updatedSections });
    } catch (err) {
      console.error('Failed to toggle spot:', err);
    }
  };

  // Filter curated suggestions for the active place search
  const spotSuggestions = useMemo(() => {
    const cityName = trip?.stops?.[0]?.city_name || '';
    const relevant = SEED_ACTIVITIES.filter(
      (a) =>
        a.city_name?.toLowerCase().includes(cityName.toLowerCase()) ||
        a.name.toLowerCase().includes(cityName.toLowerCase())
    );
    const pool = relevant.length >= 4 ? relevant : SEED_ACTIVITIES;

    if (!spotSearchQuery.trim()) return pool.slice(0, 6);
    return pool
      .filter(
        (a) =>
          a.name.toLowerCase().includes(spotSearchQuery.toLowerCase()) ||
          a.description?.toLowerCase().includes(spotSearchQuery.toLowerCase())
      )
      .slice(0, 6);
  }, [trip, spotSearchQuery]);

  const handleSelectSuggestedSpot = (act: (typeof SEED_ACTIVITIES)[0]) => {
    setSpotName(act.name);
    setSpotCategory(
      act.category === 'Food & Dining'
        ? 'restaurant'
        : act.category === 'Culture & Museum'
        ? 'museum'
        : act.category === 'Nature & Outdoors'
        ? 'park'
        : act.category === 'Shopping'
        ? 'shopping'
        : 'landmark'
    );
    setSpotCost(act.cost || 25);
    setSpotDuration(act.duration || 2);
    setSpotLocation(act.city_name ? `${act.name}, ${act.city_name}` : act.name);
    setSpotNotes(act.description || '');
  };

  // Helper for Category Badge Styling
  const getCategoryBadge = (category?: SectionPlaceSpot['category']) => {
    switch (category) {
      case 'museum':
        return {
          icon: <Landmark className="w-3 h-3 text-indigo-600" />,
          label: 'Museum',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'restaurant':
        return {
          icon: <Utensils className="w-3 h-3 text-orange-600" />,
          label: 'Dining & Cafe',
          className: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'viewpoint':
        return {
          icon: <Eye className="w-3 h-3 text-amber-600" />,
          label: 'Viewpoint',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'park':
        return {
          icon: <Trees className="w-3 h-3 text-emerald-600" />,
          label: 'Park / Nature',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'shopping':
        return {
          icon: <ShoppingBag className="w-3 h-3 text-rose-600" />,
          label: 'Shopping',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          icon: <Compass className="w-3 h-3 text-sky-600" />,
          label: 'Landmark & Sight',
          className: 'bg-sky-50 text-sky-700 border-sky-200',
        };
    }
  };

  // Save full trip
  const handleSaveFullTrip = async () => {
    if (!trip) return;
    setIsSaving(true);
    try {
      const totalBudgetFromSections = sections.reduce((acc, s) => acc + (s.budget || 0), 0);
      await tripService.updateTrip(trip.id, {
        sections,
        target_budget: totalBudgetFromSections > 0 ? totalBudgetFromSections : trip.target_budget,
        updated_at: new Date().toISOString(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Trip and lock in the full itinerary
  const handleConfirmTrip = async () => {
    if (!trip) return;
    setIsConfirming(true);
    try {
      const totalBudgetFromSections = sections.reduce((acc, s) => acc + (s.budget || 0), 0);
      const updatedData: Partial<Trip> = {
        sections,
        status: 'confirmed',
        target_budget: totalBudgetFromSections > 0 ? totalBudgetFromSections : trip.target_budget,
        updated_at: new Date().toISOString(),
      };
      await tripService.updateTrip(trip.id, updatedData);
      setTrip((prev) => (prev ? { ...prev, ...updatedData, status: 'confirmed' } : null));
      setIsConfirmedSuccessModalOpen(true);
    } catch (err) {
      console.error('Failed to confirm trip:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading Itinerary...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <p className="text-base font-bold text-slate-800">Trip not found</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const totalSectionsBudget = sections.reduce((acc, s) => acc + (s.budget || 0), 0);
  const totalPlacesCount = sections.reduce((acc, s) => acc + (s.places?.length || 0), 0);

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Build Itinerary
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {trip.name} &bull; {sections.length} Day Sections &bull; {totalPlacesCount} Places to Visit
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            id="builder-save-btn"
            onClick={handleSaveFullTrip}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save Itinerary'}</span>
          </button>

          <button
            onClick={() => onOpenShareModal(trip)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="space-y-1">
          <p className="text-[11px] uppercase font-black text-amber-400 tracking-wider">
            Active Multi-Section Plan
          </p>
          <h2 className="text-base sm:text-lg font-extrabold text-white">{trip.name}</h2>
          <p className="text-xs text-slate-300">
            {sections.length} Modular Sections &bull; Dates: {trip.start_date} to {trip.end_date}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Section Budget</p>
            <p className="text-xl font-black text-emerald-400">
              {formatPrice(totalSectionsBudget)}
            </p>
          </div>
        </div>
      </div>

      {/* Section Cards List with Places & Spots to Visit Option in each day section */}
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const sectionPlaces = section.places || [];
          const sectionPlacesCost = sectionPlaces.reduce((sum, p) => sum + (p.cost || 0), 0);

          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 hover:border-amber-400 hover:shadow-md transition-all space-y-5 group"
            >
              {/* Header: Section 1 / 2 / 3 Title & Action Controls */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      Section {idx + 1}
                    </span>
                    {section.type && (
                      <span className="text-[11px] font-bold text-slate-500 capitalize">
                        &bull; {section.type}
                      </span>
                    )}
                    {section.location && (
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" /> {section.location}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {section.title}
                  </h3>
                </div>

                {/* Reorder and Edit / Delete actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveSection(idx, 'up')}
                    disabled={idx === 0}
                    title="Move section up"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    title="Move section down"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    title="Edit section"
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    title="Delete section"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description Text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                {section.description ||
                  'All the necessary information about this section. This can be anything like travel section, hotel or any other activity.'}
              </p>

              {/* ========================================================================= */}
              {/* PLACES & SPOTS TO VISIT ON THIS DAY (Requested Feature) */}
              {/* ========================================================================= */}
              <div className="pt-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      Places & Spots to Visit on this Day ({sectionPlaces.length})
                    </span>
                  </div>

                  {/* Add Place / Spot Button inside this section */}
                  <button
                    id={`add-spot-btn-${section.id}`}
                    onClick={() => handleOpenAddSpot(section.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Add Place or Spot</span>
                  </button>
                </div>

                {/* List of Places/Spots added to this day section */}
                {sectionPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {sectionPlaces.map((spot) => {
                      const badge = getCategoryBadge(spot.category);
                      return (
                        <div
                          key={spot.id}
                          className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            spot.visited
                              ? 'bg-slate-50/90 border-slate-200 text-slate-400'
                              : 'bg-white border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox toggle visited status */}
                            <button
                              type="button"
                              onClick={() => handleToggleSpotVisited(section.id, spot.id)}
                              title={spot.visited ? 'Mark as pending' : 'Mark as visited'}
                              className="mt-0.5 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                            >
                              {spot.visited ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`text-xs sm:text-sm font-extrabold ${
                                    spot.visited ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {spot.name}
                                </h4>

                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.className}`}
                                >
                                  {badge.icon}
                                  {badge.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                                {spot.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    {spot.time}
                                    {spot.duration ? ` (${spot.duration} hrs)` : ''}
                                  </span>
                                )}

                                {spot.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {spot.location}
                                  </span>
                                )}

                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  {spot.cost && spot.cost > 0 ? formatPrice(spot.cost) : 'Free Entry'}
                                </span>
                              </div>

                              {spot.notes && (
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-100 max-w-xl">
                                  💡 {spot.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Spot action buttons (Edit, Delete) */}
                          <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSpot(section.id, spot)}
                              title="Edit spot"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpot(section.id, spot.id)}
                              title="Delete spot"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={() => handleOpenAddSpot(section.id)}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 text-center cursor-pointer transition-all space-y-1 group/empty"
                  >
                    <p className="text-xs font-bold text-slate-600 group-hover/empty:text-amber-900">
                      No places or spots added to this day section yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Click to add landmarks, museums, dining, viewpoints, and stops for this day
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Bar Pills: [ Date Range ] [ Budget of this section ] */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Date Range Pill */}
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-slate-200/80"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Date Range: {section.start_date || trip.start_date} to {section.end_date || trip.end_date}
                    </span>
                  </button>

                  {/* Budget of this section Pill */}
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      Budget: {formatPrice(section.budget || 0)}
                    </span>
                  </button>
                </div>

                {sectionPlacesCost > 0 && (
                  <span className="text-[11px] font-bold text-slate-500">
                    Spots Total: <strong className="text-slate-800">{formatPrice(sectionPlacesCost)}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Button: [ + Add another Section ] */}
      <div className="flex justify-center pt-6 pb-2">
        <button
          id="add-another-section-btn"
          onClick={handleOpenAddSection}
          className="px-8 py-3.5 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 hover:text-amber-900 border-2 border-slate-300 hover:border-amber-400 font-black text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-5 h-5 text-amber-600 stroke-[2.5]" />
          <span>+ Add another Section</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* END OF BUILD ITINERARY: CONFIRM TRIP ACTION CARD */}
      {/* ========================================================================= */}
      <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Finalize & Lock Itinerary</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ready to Confirm this Trip?
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Confirm your itinerary with <strong className="text-amber-300 font-bold">{sections.length} day sections</strong>, <strong className="text-amber-300 font-bold">{totalPlacesCount} places to visit</strong>, and a total planned budget of <strong className="text-emerald-400 font-bold">{formatPrice(totalSectionsBudget)}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {trip.start_date} &rarr; {trip.end_date}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {trip.stops?.[0]?.city_name || 'Multi-City'}
              </span>
              {trip.status === 'confirmed' && (
                <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Confirmed Itinerary
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              id="confirm-trip-btn"
              onClick={handleConfirmTrip}
              disabled={isConfirming}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              {isConfirming ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
              )}
              <span>{trip.status === 'confirmed' ? 'Update & Confirm Trip' : 'Confirm Trip'}</span>
            </button>

            <button
              id="view-timeline-btn"
              onClick={() => onNavigate('itinerary-view', trip.id)}
              className="px-5 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PLACE OR SPOT IN A SPECIFIC DAY SECTION */}
      {/* ========================================================================= */}
      {isAddSpotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingSpot ? 'Edit Place or Spot' : 'Add Place or Spot to this Day'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {sections.find((s) => s.id === targetSectionIdForSpot)?.title || 'Selected Section'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSpotModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pick Recommended Attractions & Spots */}
            {!editingSpot && spotSuggestions.length > 0 && (
              <div className="space-y-2 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Suggestions for this Destination
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">1-click select</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {spotSuggestions.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleSelectSuggestedSpot(act)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-500 hover:text-white border border-amber-200 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{act.name}</span>
                      <span className="text-[10px] opacity-75">({formatPrice(act.cost || 20)})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSpot} className="space-y-4">
              {/* Spot Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Place / Spot Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="spot-name-input"
                    type="text"
                    required
                    value={spotName}
                    onChange={(e) => setSpotName(e.target.value)}
                    placeholder="e.g. Louvre Museum, Eiffel Tower, Trastevere Food Tour..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Category & Scheduled Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={spotCategory}
                    onChange={(e) => setSpotCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="landmark">🏛️ Landmark & Historical Sight</option>
                    <option value="museum">🖼️ Museum & Art Gallery</option>
                    <option value="restaurant">🍽️ Restaurant, Cafe & Dining</option>
                    <option value="viewpoint">🌅 Scenic Viewpoint / Lookout</option>
                    <option value="park">🌲 Park, Beach & Nature</option>
                    <option value="shopping">🛍️ Shopping & Local Market</option>
                    <option value="attraction">🎡 Tour & Entertainment</option>
                    <option value="other">📍 Other Destination Spot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <input
                      type="text"
                      value={spotTime}
                      onChange={(e) => setSpotTime(e.target.value)}
                      placeholder="e.g. 10:00 AM or Sunset / 06:30 PM"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Duration & Estimated Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={spotDuration}
                    onChange={(e) => setSpotDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Estimated Cost ({currencySymbol})
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={spotCost}
                      onChange={(e) => setSpotCost(Number(e.target.value))}
                      placeholder="0 for free"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Location / Address / District
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={spotLocation}
                    onChange={(e) => setSpotLocation(e.target.value)}
                    placeholder="e.g. Champs-Élysées, Paris, France"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Notes / Tips */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Notes, Tips & Booking Details
                </label>
                <textarea
                  rows={2}
                  value={spotNotes}
                  onChange={(e) => setSpotNotes(e.target.value)}
                  placeholder="e.g. Pre-booked fast track pass, arrive 15 minutes before slot, best photos at sunset..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSpotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-spot-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSpot ? 'Save Spot Changes' : 'Add Spot to Day'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD OR EDIT AN ENTIRE SECTION */}
      {/* ========================================================================= */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingSection ? 'Edit Section Details' : 'Add New Itinerary Section'}
              </h3>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSectionForm} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Section Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Section 4: High-Speed Train & Venice Hotel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Type & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Section Category
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="travel">Travel / Transport</option>
                    <option value="stay">Hotel / Accommodation</option>
                    <option value="activity">Activity / Sightseeing</option>
                    <option value="dining">Food & Dining</option>
                    <option value="general">General Section</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Location / Place
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Rome, Italy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Section Details / Information *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="All the necessary information about this section. This can be anything like travel section, hotel or any other activity."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formStartDate}
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Budget of this Section ({currencySymbol})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={25}
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingSection ? 'Save Section Changes' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRIP CONFIRMATION SUCCESS */}
      {/* ========================================================================= */}
      {isConfirmedSuccessModalOpen && trip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Trip Confirmed &amp; Itinerary Ready</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {trip.name || 'Your Trip'} is Confirmed!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Your travel itinerary has been locked in and saved to your account. You can now view the day-by-day interactive timeline, track daily costs, or share the plan with co-travelers.
              </p>
            </div>

            {/* Trip Stats Overview Grid */}
            <div className="grid grid-cols-3 gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Day Sections</span>
                <span className="text-sm font-black text-slate-800">{sections.length} Days</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Places to Visit</span>
                <span className="text-sm font-black text-amber-800">{totalPlacesCount} Sights</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Budget</span>
                <span className="text-sm font-black text-emerald-800">{formatPrice(totalSectionsBudget)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                id="modal-view-itinerary-btn"
                onClick={() => {
                  setIsConfirmedSuccessModalOpen(false);
                  onNavigate('itinerary-view', trip.id);
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Day-by-Day Timeline Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="modal-share-trip-btn"
                  onClick={() => {
                    setIsConfirmedSuccessModalOpen(false);
                    onOpenShareModal(trip);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Share Plan</span>
                </button>

                <button
                  id="modal-dashboard-btn"
                  onClick={() => {
                    setIsConfirmedSuccessModalOpen(false);
                    onNavigate('dashboard');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <span>Dashboard</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmedSuccessModalOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors pt-1 cursor-pointer"
              >
                Keep editing sections &amp; spots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
