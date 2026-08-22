import React, { useState } from 'react';
import { MapPin, Compass } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackCategory?: string;
  className?: string;
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Sightseeing': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
  'Culture & Museum': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
  'Museum': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
  'Food & Dining': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  'Dining': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  'Nature & Outdoors': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'Nature': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'Sports & Stadiums': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=600&q=80',
  'Sports': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=600&q=80',
  'Shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
  'Relaxation & Spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
};

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackCategory,
  className = '',
  ...props
}) => {
  const [errorStage, setErrorStage] = useState<number>(0);

  const getFallbackSrc = () => {
    if (fallbackCategory && CATEGORY_FALLBACK_IMAGES[fallbackCategory]) {
      return CATEGORY_FALLBACK_IMAGES[fallbackCategory];
    }
    return CATEGORY_FALLBACK_IMAGES['default'];
  };

  const primarySrc = src && src.trim() !== '' ? src : getFallbackSrc();

  const handleError = () => {
    if (errorStage === 0) {
      // Stage 1: Try curated category fallback URL
      setErrorStage(1);
    } else {
      // Stage 2: Render styled placeholder UI
      setErrorStage(2);
    }
  };

  if (errorStage === 2) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-800 to-slate-900 text-amber-300 flex flex-col items-center justify-center p-2 text-center select-none ${className}`}
        title={alt}
      >
        <Compass className="w-5 h-5 mb-1 opacity-80" />
        <span className="text-[10px] font-bold text-slate-200 line-clamp-1 px-1">
          {alt || 'Sight'}
        </span>
      </div>
    );
  }

  const currentSrc = errorStage === 1 ? getFallbackSrc() : primarySrc;

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
