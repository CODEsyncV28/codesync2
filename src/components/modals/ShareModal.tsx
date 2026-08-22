import React, { useState } from 'react';
import { X, Copy, Check, Globe, Lock, Share2, Twitter, MessageCircle, QrCode } from 'lucide-react';
import { Trip } from '../../types';
import { tripService } from '../../services/tripService';

interface ShareModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated?: (updated: Trip) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  trip,
  isOpen,
  onClose,
  onTripUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(trip.is_public);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/#shared/${trip.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTogglePublic = async (newVal: boolean) => {
    setIsPublic(newVal);
    setLoading(true);
    try {
      const updated = await tripService.updateTrip(trip.id, { is_public: newVal });
      if (onTripUpdated) onTripUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Check out my travel itinerary for "${trip.name}" on GlobeTrotter! 🌍✈️`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleWhatsappShare = () => {
    const text = encodeURIComponent(`Take a look at my travel itinerary: "${trip.name}" - ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Share Itinerary</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Public / Private Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {isPublic ? 'Publicly Visible' : 'Private to You'}
                </p>
                <p className="text-xs text-slate-500">
                  {isPublic
                    ? 'Anyone with the link can view & clone this itinerary'
                    : 'Only you can view this trip'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleTogglePublic(!isPublic)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Copy URL Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Unique Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono text-slate-700 bg-slate-50 select-all"
              />
              <button
                id="copy-share-url-btn"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Share to Channels
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWhatsappShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp
              </button>
              <button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors"
              >
                <Twitter className="w-4 h-4 text-sky-500" />
                Twitter/X
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                QR Code
              </button>
            </div>
          </div>

          {/* QR Code view */}
          {showQr && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center animate-in fade-in">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
                alt="Trip QR Code"
                className="mx-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              />
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Scan with phone camera to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
