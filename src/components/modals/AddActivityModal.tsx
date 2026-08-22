import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Tag, Image as ImageIcon, Sparkles, Utensils, Flower2, CheckCircle2 } from 'lucide-react';
import { Activity, ActivityCategory, TripActivity, TripStop } from '../../types';
import { cityService } from '../../services/cityService';
import { useCurrency } from '../../context/CurrencyContext';
import { SafeImage } from '../SafeImage';

const CATEGORIES: ActivityCategory[] = [
  'Sightseeing',
  'Food & Dining',
  'Sports & Stadiums',
  'Nature & Outdoors',
  'Culture & Museum',
  'Adventure',
  'Shopping',
  'Relaxation',
];

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: Omit<TripActivity, 'id' | 'trip_stop_id' | 'trip_id'>) => void;
  stop: TripStop;
  editingActivity?: TripActivity;
  presetActivity?: Activity;
  initialDate?: string;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stop,
  editingActivity,
  presetActivity,
  initialDate,
}) => {
  const { currencySymbol, formatPrice } = useCurrency();
  const [tab, setTab] = useState<'catalog' | 'custom'>(presetActivity || editingActivity ? 'custom' : 'catalog');
  const [catalogActivities, setCatalogActivities] = useState<Activity[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');

  // Form fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ActivityCategory>('Sightseeing');
  const [cost, setCost] = useState<number>(0);
  const [duration, setDuration] = useState<number>(2);
  const [scheduledDate, setScheduledDate] = useState<string>(initialDate || stop.start_date);
  const [scheduledTime, setScheduledTime] = useState<string>('Morning (09:30 AM)');
  const [notes, setNotes] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    cityService.getActivitiesForCity(stop.city_id).then((acts) => {
      setCatalogActivities(acts);
      if (acts.length === 0 && !editingActivity && !presetActivity) {
        setTab('custom');
      }
    });
  }, [stop.city_id, editingActivity, presetActivity]);

  useEffect(() => {
    if (editingActivity) {
      setName(editingActivity.name);
      setCategory(editingActivity.category);
      setCost(editingActivity.cost);
      setDuration(editingActivity.duration);
      setScheduledDate(editingActivity.scheduled_date);
      setScheduledTime(editingActivity.scheduled_time || 'Morning (09:30 AM)');
      setNotes(editingActivity.notes || '');
      setImageUrl(editingActivity.image_url || '');
      setTab('custom');
    } else if (presetActivity) {
      setName(presetActivity.name);
      setCategory(presetActivity.category);
      setCost(presetActivity.cost);
      setDuration(presetActivity.duration);
      setScheduledDate(initialDate || stop.start_date);
      setScheduledTime('Morning (09:30 AM)');
      setNotes(presetActivity.description);
      setImageUrl(presetActivity.image_url);
      setTab('custom');
    } else {
      setScheduledDate(initialDate || stop.start_date);
    }
  }, [editingActivity, presetActivity, stop, initialDate]);

  if (!isOpen) return null;

  const handleSelectCatalog = (act: Activity) => {
    setSelectedCatalogId(act.id);
    setName(act.name);
    setCategory(act.category);
    setCost(act.cost);
    setDuration(act.duration);
    setImageUrl(act.image_url);
    setNotes(act.description);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      activity_id: selectedCatalogId || undefined,
      name: name.trim(),
      category,
      cost: Number(cost) || 0,
      duration: Number(duration) || 1,
      scheduled_date: scheduledDate || stop.start_date,
      scheduled_time: scheduledTime,
      notes,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
    });
    onClose();
  };

  const filteredCatalog = catalogActivities.filter((act) => {
    const matchesSearch =
      !searchQuery.trim() ||
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.location_name && act.location_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilterCategory === 'All') return true;
    if (selectedFilterCategory === 'Food & Dining') return act.is_food_spot || act.category === 'Food & Dining';
    if (selectedFilterCategory === 'Nature & Gardens') return act.is_garden || act.category === 'Nature & Outdoors';
    if (selectedFilterCategory === 'Sports & Stadiums') return act.is_sports_venue || act.category === 'Sports & Stadiums';
    if (selectedFilterCategory === 'Landmarks & Sights') return act.is_landmark || act.category === 'Sightseeing';
    if (selectedFilterCategory === 'Culture & Museum') return act.category === 'Culture & Museum';

    return act.category === selectedFilterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {editingActivity ? 'Edit Spot' : `Add Spot to ${stop.city_name} Timeline`}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Dates: {stop.start_date} to {stop.end_date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher if not editing */}
        {!editingActivity && !presetActivity && (
          <div className="flex border-b border-slate-200 px-6 pt-3 bg-white">
            <button
              type="button"
              onClick={() => setTab('catalog')}
              className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                tab === 'catalog'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Curated Spots in {stop.city_name} ({catalogActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('custom')}
              className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                tab === 'custom'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Spot
            </button>
          </div>
        )}

        {/* Content depending on tab */}
        {tab === 'catalog' && !editingActivity && !presetActivity ? (
          <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {/* Search and filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search restaurants, gardens, stadiums, landmarks in ${stop.city_name}...`}
                  className="w-full pl-3.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  { label: 'All', count: catalogActivities.length },
                  { label: 'Food & Dining', count: catalogActivities.filter((a) => a.is_food_spot || a.category === 'Food & Dining').length },
                  { label: 'Nature & Gardens', count: catalogActivities.filter((a) => a.is_garden || a.category === 'Nature & Outdoors').length },
                  { label: 'Sports & Stadiums', count: catalogActivities.filter((a) => a.is_sports_venue || a.category === 'Sports & Stadiums').length },
                  { label: 'Landmarks & Sights', count: catalogActivities.filter((a) => a.is_landmark || a.category === 'Sightseeing').length },
                  { label: 'Culture & Museum', count: catalogActivities.filter((a) => a.category === 'Culture & Museum').length },
                ]
                  .filter((f) => f.count > 0 || f.label === 'All')
                  .map((filter) => (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={() => setSelectedFilterCategory(filter.label)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        selectedFilterCategory === filter.label
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {filteredCatalog.map((act) => {
                const isSelected = selectedCatalogId === act.id;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectCatalog(act)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <SafeImage
                        src={act.image_url}
                        alt={act.name}
                        fallbackCategory={act.category}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          {act.is_food_spot && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Food
                            </span>
                          )}
                          {act.is_garden && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Garden
                            </span>
                          )}
                          {(act.is_sports_venue || act.category === 'Sports & Stadiums') && (
                            <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Sports
                            </span>
                          )}
                          <span className="text-[9px] font-medium text-slate-400">
                            ★ {act.rating}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs truncate mt-0.5" title={act.name}>{act.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{act.description}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{act.duration} hrs</span>
                      <span className="font-black text-slate-900">
                        {act.cost === 0 ? 'Free' : formatPrice(act.cost)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCatalog.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No spots found matching "{searchQuery}". Try a different search or add a custom spot.
              </div>
            )}

            {selectedCatalogId && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm">
                <span className="text-xs font-bold text-amber-700 truncate max-w-[240px]">Selected: {name}</span>
                <button
                  type="button"
                  onClick={() => setTab('custom')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  Configure Time & Add →
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Spot / Activity Name *
              </label>
              <input
                id="act-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Eiffel Tower Summit, Yankee Stadium Tour, Tsukiji Sushi..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <select
                  id="act-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Entry Cost ({currencySymbol})
                </label>
                <div className="relative">
                  <input
                    id="act-cost"
                    type="number"
                    min="0"
                    step="5"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-amber-700 font-extrabold text-xs absolute left-3 top-2">{currencySymbol}</span>
                </div>
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Scheduled Date *
                </label>
                <input
                  id="act-date"
                  type="date"
                  required
                  min={stop.start_date}
                  max={stop.end_date}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Time Slot
                </label>
                <select
                  id="act-time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Morning (08:30 AM)">Morning (08:30 AM)</option>
                  <option value="Mid-day (11:30 AM)">Mid-day (11:30 AM)</option>
                  <option value="Afternoon (02:30 PM)">Afternoon (02:30 PM)</option>
                  <option value="Evening (05:30 PM)">Evening (05:30 PM)</option>
                  <option value="Night (08:30 PM)">Night (08:30 PM)</option>
                </select>
              </div>
            </div>

            {/* Duration & Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Duration (hours)
                </label>
                <input
                  id="act-duration"
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  id="act-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Notes, Menu Picks & Tips
              </label>
              <textarea
                id="act-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pre-booked morning entry, stadium tour pass, scenic viewpoint, menu suggestions..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Form actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="act-save-btn"
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {editingActivity ? 'Save Changes' : 'Schedule to Timeline'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
