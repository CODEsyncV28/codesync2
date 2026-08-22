import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Train, Plane, Bus, Car } from 'lucide-react';
import { City, TripStop } from '../../types';
import { cityService } from '../../services/cityService';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stopData: Omit<TripStop, 'id' | 'trip_id' | 'order_index'>) => void;
  initialCityId?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  editingStop?: TripStop;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCityId,
  defaultStartDate = '',
  defaultEndDate = '',
  editingStop,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>(initialCityId || '');
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [accommodationCost, setAccommodationCost] = useState<number>(150);
  const [transportCost, setTransportCost] = useState<number>(80);
  const [transportMode, setTransportMode] = useState<TripStop['transport_mode']>('Train');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    cityService.getAllCities().then(setCities);
  }, []);

  useEffect(() => {
    if (editingStop) {
      setSelectedCityId(editingStop.city_id);
      setStartDate(editingStop.start_date);
      setEndDate(editingStop.end_date);
      setAccommodationCost(editingStop.accommodation_cost_per_night);
      setTransportCost(editingStop.transport_cost_to_stop);
      setTransportMode(editingStop.transport_mode || 'Train');
      setNotes(editingStop.notes || '');
    } else if (initialCityId) {
      setSelectedCityId(initialCityId);
      const matchedCity = cities.find((c) => c.id === initialCityId);
      if (matchedCity) {
        setAccommodationCost(matchedCity.avg_daily_cost || 150);
      }
    }
  }, [editingStop, initialCityId, cities]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const city = cities.find((c) => c.id === selectedCityId);
    if (!city) return;

    onSave({
      city_id: city.id,
      city_name: city.name,
      country: city.country,
      city_photo: city.image_url,
      start_date: startDate,
      end_date: endDate,
      accommodation_cost_per_night: Number(accommodationCost) || 0,
      transport_cost_to_stop: Number(transportCost) || 0,
      transport_mode: transportMode,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {editingStop ? 'Edit Destination Stop' : 'Add Destination Stop (Auto-Adds 10+ Spots)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* City Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select City Destination *
            </label>
            <select
              id="stop-city-select"
              required
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                const city = cities.find((c) => c.id === e.target.value);
                if (city) {
                  setAccommodationCost(city.avg_daily_cost);
                }
              }}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">-- Choose Destination --</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.country} • 10+ Spots • Avg ${city.avg_daily_cost}/day
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Arrival Date *
              </label>
              <div className="relative">
                <input
                  id="stop-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Departure Date *
              </label>
              <div className="relative">
                <input
                  id="stop-end-date"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Transport Mode & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Transit Mode
              </label>
              <select
                id="stop-transport-mode"
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Train">Train (High-Speed / Regional Rail)</option>
                <option value="Flight">Flight (International / Domestic)</option>
                <option value="Private Taxi">Private Taxi / Ride-Hail</option>
                <option value="Bus">Intercity Express Bus</option>
                <option value="Drive">Rental Car / Road Trip</option>
                <option value="Ferry">Ferry / Harbor Cruise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Transport Cost ($ USD)
              </label>
              <div className="relative">
                <input
                  id="stop-transport-cost"
                  type="number"
                  min="0"
                  step="10"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-amber-700 font-extrabold text-xs absolute left-3 top-2">$</span>
              </div>
            </div>
          </div>

          {/* Accommodation Cost */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Est. Hotel / Accommodation per Night ($ USD)
            </label>
            <div className="relative">
              <input
                id="stop-accommodation-cost"
                type="number"
                min="0"
                step="10"
                value={accommodationCost}
                onChange={(e) => setAccommodationCost(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-amber-700 font-extrabold text-sm absolute left-3 top-2">$</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes & Hotel Booking Details
            </label>
            <textarea
              id="stop-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Downtown hotel near transit station, pre-booked airport express, late check-in..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="stop-save-btn"
              type="submit"
              disabled={!selectedCityId || !startDate || !endDate}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {editingStop ? 'Save Changes' : 'Add Stop & Auto-Populate Spots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
