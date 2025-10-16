'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  className?: string;
}

interface ChannelItemProps {
  channel: Channel;
  index: number;
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
  focusKey,
  focusedIndex,
  onFocus,
  visibleCount,
  totalChannels,
  isSelected,
}: ChannelItemProps) {
  const { setLastFocusedChannelKey, setSelectedChannel, selectedChannel } = useFocusStore();
  const [pressCount, setPressCount] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {
      // Lógica de 2 enters
      const newCount = pressCount + 1;
      setPressCount(newCount);

      // Limpa timer anterior
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }

      if (newCount === 1) {
        // Primeiro Enter: Seleciona canal (abre preview)
        setSelectedChannel(channel);

        // Reset após 500ms
        pressTimerRef.current = setTimeout(() => {
          setPressCount(0);
        }, 500);
      } else if (newCount === 2) {
        // Segundo Enter: Ativa fullscreen (será tratado no ChannelDetail)
        setPressCount(0);
        pressTimerRef.current && clearTimeout(pressTimerRef.current);
      }
    },
    saveLastFocusedChild: false,
    trackChildren: false,
    onFocus: () => {
      if (focusedIndex !== index) onFocus(index);
      setLastFocusedChannelKey(focusKey);
    },
  });

  // Cleanup do timer
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

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
  const itemOpacity = focused ? 1 : onLastPage ? 0.7 : isAbove ? 0.4 : 0.7;

  return (
    <motion.div
      ref={ref}
      layout
      className={`
        relative w-full h-[6vw] flex items-center px-[1vw] transition-all duration-200 rounded-[1vw] gap-[1vw]
        ${focused
          ? 'scale-[1.08] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] bg-white'
          : 'opacity-70 bg-neutral-800'}
      `}
      style={{ opacity: itemOpacity }}
    >
      <div className="w-[4vw] h-[4vw] flex items-center justify-center flex-shrink-0 rounded-[0.5vw] overflow-hidden">
        {channel.stream_icon && (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            onError={handleImageError}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div ref={textRef} className="relative overflow-hidden">
          <motion.p
            className={`text-[1.8vw] font-medium whitespace-nowrap ${
              focused ? 'text-black' : 'text-neutral-300'
            }`}
            animate={
              shouldScroll && focused
                ? { x: ['0%', '-50%', '0%'] } // anima só enquanto focado
                : { x: '0%' } // volta imediato ao perder foco
            }
            transition={
              shouldScroll && focused
                ? {
                    duration: 6,
                    ease: 'linear',
                    repeat: Infinity,
                    repeatDelay: 3,
                  }
                : { duration: 0 } // sem delay, reset instantâneo
            }
            style={{ willChange: 'transform' }}
          >
            {channel.name}
          </motion.p>
        </div>



        {/* {channel.num && (
          <p className={`text-[1.2vw] ${focused ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Canal {channel.num}
          </p>
        )} */}
      </div>
    </motion.div>
  );
}

const ChannelItem = memo(ChannelItemInner);

/* =========================
   Loading/Error/Empty States
   ========================= */
function LoadingState() {
  return (
    <div className="flex items-center justify-center p-[4vh] text-white">
      <RefreshCw className="w-[4vh] h-[4vh] animate-spin mr-[2vh]" />
      <span className="text-[2vh]">Carregando canais...</span>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-[4vh] text-center">
      <AlertCircle className="w-[4vh] h-[4vh] text-red-400 mb-[2vh]" />
      <p className="text-red-400 text-[2vh]">{error}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-[4vh] text-center">
      <Tv className="w-[4vh] h-[4vh] text-neutral-400 mb-[2vh]" />
      <p className="text-neutral-400 text-[2vh]">Nenhum canal disponível</p>
    </div>
  );
}

/* =========================
   ChannelList Principal
   ========================= */
export function ChannelList({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  className = '',
}: ChannelListProps) {
  const { toggleFavoriteChannel, isFavoriteChannel } = useAppStore();
  const { lastFocusedChannelKey, selectedChannel } = useFocusStore();

  const [focusedChannelId, setFocusedChannelId] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasRestoredFocus = useRef(false);
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

  const { ref: containerFocusRef, focused: containerFocused } = useFocusable({
    focusKey: 'channel-list-container',
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'up', 'down'],
    preferredChildFocusKey: preferredChannelKey,
    saveLastFocusedChild: true,
    trackChildren: true
  });

  // Calcula quantos itens cabem visíveis
  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
      const gapPx = (GAP / 100) * window.innerWidth;
      const rowHeight = itemHeightPx + gapPx;
      setVisibleCount(Math.floor(containerHeight / rowHeight));
    }
  }, [channels.length]);

  // Inicialização
  useEffect(() => {
  if (!loading && !error && channels.length > 0 && !isInitialized) {
    setIsInitialized(true);

    setFocus('channel-list-container');
  }
}, [loading, error, channels.length, isInitialized]);


  // Reset ao mudar de categoria
  useEffect(() => {
    setIsInitialized(false);
    hasRestoredFocus.current = false;
  }, [categoryName]);

  // Reset flag ao perder foco
  useEffect(() => {
    if (!containerFocused) {
      hasRestoredFocus.current = false;
    }
  }, [containerFocused]);

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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          )}

          {error && !loading && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorState error={error} />
            </motion.div>
          )}

          {!loading && !error && channels.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                data-sn-nav-skip="true"
              >
                {channels.map((channel, index) => (
                  <div key={`${channel.stream_id}-${index}`} className="relative overflow-visible">
                    <ChannelItem
                      channel={channel}
                      index={index}
                      focusKey={`channel-item-${index}`}
                      focusedIndex={focusedIndex}
                      onFocus={setFocusedIndex}
                      visibleCount={visibleCount}
                      totalChannels={channels.length}
                      isSelected={selectedChannel?.stream_id === channel.stream_id}
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

/* =========================
   Favorite Button
   ========================= */
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
      whileFocus={{ scale: 1.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Star className={`w-[1.5vw] h-[1.5vw] ${isFavorite ? 'fill-current' : ''}`} />
    </motion.button>
  );
}
