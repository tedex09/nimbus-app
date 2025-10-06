'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { Channel } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { CircleAlert as AlertCircle, RefreshCw, Tv, Star } from 'lucide-react';
import SidebarHeader from '@/components/SidebarHeader';

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  categoryName: string;
  onBack: () => void;
  onChannelSelect: (channel: Channel) => void;
  onChannelActivate?: (channel: Channel) => void;
  className?: string;
}

interface ChannelItemProps {
  channel: Channel;
  index: number;
  onSelect: (channel: Channel) => void;
  onActivate?: (channel: Channel) => void;
  focusKey: string;
  focusedIndex: number;
  onFocus: (index: number) => void;
  visibleCount: number;
  totalChannels: number;
  isSelected: boolean;
}

/* =========================
   Channel Item
   ========================= */
function ChannelItemInner({
  channel,
  index,
  onSelect,
  onActivate,
  focusKey,
  focusedIndex,
  onFocus,
  visibleCount,
  totalChannels,
  isSelected,
}: ChannelItemProps) {
  const { setLastFocusedChannelKey } = useFocusStore();

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {
      if (isSelected && onActivate) {
        onActivate(channel);
      } else {
        onSelect(channel);
      }
    },
    saveLastFocusedChild: false,
    trackChildren: false,
    onFocus: () => {
      if (focusedIndex !== index) onFocus(index);
      setLastFocusedChannelKey(focusKey);
    },
  });

  const textRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (focused && textRef.current) {
      const { scrollWidth, clientWidth } = textRef.current;
      setShouldScroll(scrollWidth > clientWidth);
    } else {
      setShouldScroll(false);
    }
  }, [focused, channel.name]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) parent.innerHTML = '<div class="text-neutral-400"></div>';
  }, []);

  // Controle de opacidade
  const isAbove = index < focusedIndex;
  const startIndexOfVisible = totalChannels - visibleCount;
  const onLastPage = focusedIndex >= startIndexOfVisible;
  const itemOpacity = focused ? 1 : onLastPage ? 1 : isAbove ? 0.4 : 1;

  return (
    <motion.div
      ref={ref}
      className={`
        relative w-full h-[6vw] flex items-center gap-[1vw] px-[1vw] rounded-[1vw] cursor-pointer
        ${focused ? 'scale-[1.04] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] bg-white' : 'bg-black/40'}
      `}
      onClick={() => onSelect(channel)}
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: itemOpacity,
        x: 0,
        scale: focused ? 1.04 : 1,
      }}
      transition={{ duration: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center w-[4vw] h-[4vw] min-w-[4vw] rounded-[0.3vw] overflow-hidden bg-neutral-900/10">
        {channel.stream_icon ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <div className="w-[2.2vw] h-[2.2vw]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-[0.5vw] mb-[0.2vw]">
          <div
            ref={textRef}
            className={`
              text-[1.6vw] font-bold whitespace-nowrap
              ${focused ? 'text-black' : 'text-white/80'}
              ${shouldScroll ? 'animate-marquee' : 'truncate'}
            `}
          >
            {channel.name}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const ChannelItem = React.memo(ChannelItemInner);

/* =========================
   States
   ========================= */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-[4vw] text-neutral-400">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <RefreshCw className="w-[3.2vw] h-[3.2vw] mb-[1vw]" />
      </motion.div>
      <p className="text-[1.4vw]">Carregando canais...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'error-retry-button',
    onEnterPress: onRetry,
  });

  return (
    <div className="flex flex-col items-center justify-center py-[4vw] text-center">
      <AlertCircle className="w-[3vw] h-[3vw] text-red-400 mb-[1vw]" />
      <p className="text-[1.4vw] text-red-400 mb-[2vw] max-w-[20vw]">{error}</p>
      {onRetry && (
        <motion.button
          ref={ref}
          className={`
            px-[2vw] py-[1vw] rounded-[1vw] text-[1.2vw] font-medium
            relative w-full p-[1vw] rounded-[1vw] transition-all duration-200
            ${focused ? 'border-white shadow-lg' : 'border-transparent'}
          `}
          style={{ zIndex: focused ? 10 : 1 }}
          onClick={onRetry}
          whileFocus={{ scale: 1.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Tentar Novamente
        </motion.button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[4vw] text-neutral-400">
      <Tv className="w-[3.2vw] h-[3.2vw] mb-[1vw] opacity-50" />
      <p className="text-[1.4vw]">Nenhum canal encontrado</p>
      <p className="text-[1vw] text-neutral-500 mt-[0.5vw]">
        Esta categoria não possui canais disponíveis
      </p>
    </div>
  );
}

/* =========================
   ChannelList principal
   ========================= */
export function ChannelList({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  onChannelSelect,
  onChannelActivate,
  className = '',
}: ChannelListProps) {
  const { toggleFavoriteChannel, isFavoriteChannel } = useAppStore();
  const { lastFocusedChannelKey } = useFocusStore();
  const [focusedChannelId, setFocusedChannelId] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // número de itens visíveis
  const [visibleCount, setVisibleCount] = useState(0);

  const ITEM_HEIGHT = 6; // vw
  const GAP = 0.5; // vw

  const preferredChannelKey = useMemo(() => {
    if (lastFocusedChannelKey && channels.length > 0) {
      const keyIndex = parseInt(lastFocusedChannelKey.split('-').pop() || '0');
      if (keyIndex < channels.length) {
        return lastFocusedChannelKey;
      }
    }
    return 'channel-item-0';
  }, [lastFocusedChannelKey, channels.length]);

  const { ref: containerFocusRef } = useFocusable({
    focusKey: 'channel-list-container',
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'up', 'down'],
    preferredChildFocusKey: preferredChannelKey,
    saveLastFocusedChild: true,
    trackChildren: true,
  });

  // calcula quantos itens cabem visíveis
  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
      const gapPx = (GAP / 100) * window.innerWidth;
      const rowHeight = itemHeightPx + gapPx;
      setVisibleCount(Math.floor(containerHeight / rowHeight));
    }
  }, [channels.length]);

  useEffect(() => {
    if (!loading && !error && channels.length > 0 && !isInitialized) {
      const timer = setTimeout(() => {
        setFocus(preferredChannelKey);
        setIsInitialized(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, channels.length, isInitialized, preferredChannelKey]);

  useEffect(() => {
    setIsInitialized(false);
    setSelectedChannelId(null);
  }, [categoryName]);

  const getTranslateY = useCallback(() => {
    if (!containerRef.current || channels.length === 0) return 0;
    const containerHeight = containerRef.current.offsetHeight;
    const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
    const gapPx = (GAP / 100) * window.innerWidth;
    const rowHeight = itemHeightPx + gapPx;
    const totalHeight = channels.length * rowHeight;

    let desiredY = focusedIndex * rowHeight;
    const maxTranslate = Math.max(totalHeight - containerHeight, 0);
    if (desiredY > maxTranslate) desiredY = maxTranslate;
    return -desiredY;
  }, [channels.length, focusedIndex]);

  const handleChannelSelect = useCallback(
    (channel: Channel) => {
      setSelectedChannelId(channel.stream_id);
      onChannelSelect(channel);
    },
    [onChannelSelect]
  );

  return (
    <motion.div
      ref={containerFocusRef}
      className={`flex flex-col overflow-visible ${className}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{ overflow: 'visible' }}
    >
      {/* Header */}
      <div className="pb-[1vw]">
        <SidebarHeader onBack={onBack} title={categoryName} icon="/icons/tv.png" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-visible">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LoadingState />
            </motion.div>
          )}

          {error && !loading && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ErrorState error={error} />
            </motion.div>
          )}

          {!loading && !error && channels.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <EmptyState />
            </motion.div>
          )}

          {!loading && !error && channels.length > 0 && (
            <div ref={containerRef} className="relative h-full overflow-visible px-[2vw]">
              <motion.div
                className="absolute top-0 left-0 w-full space-y-[0.5vw] overflow-visible"
                animate={{ y: getTranslateY() }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{ willChange: 'transform', overflow: 'visible' }}
              >
                {channels.map((channel, index) => (
                  <div key={`${channel.stream_id}-${index}`} className="relative overflow-visible">
                    <ChannelItem
                      channel={channel}
                      index={index}
                      onSelect={handleChannelSelect}
                      onActivate={onChannelActivate}
                      focusKey={`channel-item-${index}`}
                      focusedIndex={focusedIndex}
                      onFocus={setFocusedIndex}
                      visibleCount={visibleCount}
                      totalChannels={channels.length}
                      isSelected={channel.stream_id === selectedChannelId}
                    />

                    <AnimatePresence>
                      {focusedChannelId === channel.stream_id && (
                        <motion.div
                          className="absolute right-[1vw] top-1/2 transform -translate-y-1/2 z-30"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FavoriteButton
                            channelId={channel.stream_id}
                            isFavorite={isFavoriteChannel(channel.stream_id)}
                            onToggle={() => toggleFavoriteChannel(channel.stream_id)}
                            focusKey={`favorite-${index}`}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FavoriteButton({
  channelId,
  isFavorite,
  onToggle,
  focusKey,
}: {
  channelId: number;
  isFavorite: boolean;
  onToggle: () => void;
  focusKey: string;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onToggle,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        w-[3vw] h-[3vw] rounded-full flex items-center justify-center
        border-2 transition-all duration-200
        ${isFavorite ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-400'}
        ${focused ? 'border-white scale-110 z-30' : 'border-transparent'}
      `}
      onClick={onToggle}
      whileFocus={{ scale: 1.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Star className={`w-[1.5vw] h-[1.5vw] ${isFavorite ? 'fill-current' : ''}`} />
    </motion.button>
  );
}
