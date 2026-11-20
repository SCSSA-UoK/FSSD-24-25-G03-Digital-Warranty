import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, AlertCircle, Loader2 } from 'lucide-react';
import { getAccessibleImageUrl } from '../utils/imageUrl';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = 'Image Preview',
  title,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });

  const resolvedUrl = getAccessibleImageUrl(imageUrl);

  // Reset scale, position, and loading states when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageLoading(true);
      setImageError(false);
    }
  }, [isOpen, imageUrl, retryCount]);

  // Handle ESC key to close and +/- keys to zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.15, 0.5);
        if (next <= 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      posStartRef.current = { ...position };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPosition({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar with Title & Close button */}
      <div
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate max-w-[70%]">
          <span className="text-sm font-semibold text-slate-100 truncate block">
            {title || imageAlt}
          </span>
          <span className="text-[11px] text-slate-400">
            Scroll or controls to zoom • Click and drag to pan • ESC to exit
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 pointer-events-none">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Loading high-resolution image...</span>
          </div>
        )}

        {/* Error Fallback */}
        {imageError ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center justify-center text-center p-6 bg-slate-900/90 border border-white/10 rounded-2xl max-w-sm cursor-default"
          >
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-sm font-bold text-white">Image Preview Unavailable</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              The uploaded image file could not be displayed. It may still be syncing or requires reloading.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Loading
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/20 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <img
            src={resolvedUrl}
            alt={imageAlt}
            draggable={false}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
            className={`max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      {!imageError && (
        <div
          className="relative z-10 flex items-center justify-center pb-4 pt-2 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl text-white">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5 || imageLoading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer flex items-center gap-1"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom Level Indicator */}
            <span className="text-xs font-mono font-medium px-2 min-w-[56px] text-center text-slate-200">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4 || imageLoading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer flex items-center gap-1"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            {/* Reset Zoom */}
            <button
              type="button"
              onClick={handleReset}
              disabled={imageLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/15 disabled:opacity-30 transition cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
