'use client';

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { Channel, api } from '@/lib/api';
import { useFocusStore } from '@/stores/useFocusStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

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

function ChannelItemComponent({
  channel,
  index,
  focusKey,
  focusedIndex,
  onFocus,
  visibleCount,
  totalChannels,
  isSelected,
}: ChannelItemProps) {
  const { setLastFocusedChannelKey, setSelectedChannel, openFullscreen } = useFocusStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { session } = useAppStore();

  const serverCode = session?.serverCode ?? 'default';
  const username = session?.username ?? 'guest';

  const [pressCount, setPressCount] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // Duplo vs simples Enter
  const resetPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => setPressCount(0), 400);
  };

  // Resolve canal completo se vier da categoria Favoritos (url vazia)
  const resolveIfNeeded = useCallback(
    async (c: Channel): Promise<Channel> => {
      if (c.url || !session) return c;
      try {
        const { serverCode, username, password } = session;
        const all = await api.getChannels(serverCode, username, password, '0', 'm3u');
        const full = all.find((it) => it.stream_id === c.stream_id);
        return full ?? c;
      } catch (e) {
        console.error('Falha ao resolver canal:', e);
        return c;
      }
    },
    [session]
  );

  const handleEnterPress = useCallback(async () => {
    const count = pressCount + 1;
    setPressCount(count);

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    // Se já está selecionado -> 1 Enter abre fullscreen direto
    if (isSelected && count === 1) {
      const resolved = await resolveIfNeeded(channel);
      openFullscreen(resolved, { source: 'item', focusKey });
      setPressCount(0);
      return;
    }

    if (count === 1) {
      const resolved = await resolveIfNeeded(channel);
      setSelectedChannel(resolved);
      resetPress();
    } else if (count === 2) {
      setPressCount(0);
      clearTimeout(pressTimerRef.current || undefined);
      const resolved = await resolveIfNeeded(channel);
      openFullscreen(resolved, { source: 'item', focusKey });
    }
  }, [pressCount, channel, setSelectedChannel, openFullscreen, isSelected, focusKey, resolveIfNeeded]);

  const favoriteFocusKey = useMemo(() => `favorite-${channel.stream_id}`, [channel.stream_id]);

  const [buttonFocused, setButtonFocused] = useState(false);

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: handleEnterPress,
    trackChildren: true,
    saveLastFocusedChild: true,
    onArrowPress: (dir) => {
      if (dir === 'right') {
        setFocus(favoriteFocusKey);
        return false;
      }
      return true;
    },
    onFocus: () => {
      if (focusedIndex !== index) onFocus(index);
      setLastFocusedChannelKey(focusKey);
    },
  });

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if ((focused || buttonFocused) && textRef.current) {
      const { scrollWidth, clientWidth } = textRef.current;
      setShouldScroll(scrollWidth > clientWidth);
    } else {
      setShouldScroll(false);
    }
  }, [focused, buttonFocused, channel.name]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  }, []);

  const isAbove = index < focusedIndex;
  const startOfVisible = totalChannels - visibleCount;
  const onLastPage = focusedIndex >= startOfVisible;
  const opacity = (focused || buttonFocused) ? 1 : onLastPage ? 0.7 : isAbove ? 0.4 : 0.7;

  const bgClass = (focused || buttonFocused)
    ? 'bg-white scale-[1.08] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)]'
    : 'bg-black/70 opacity-70';

  const selectionClass = isSelected
    ? (focused || buttonFocused ? 'bg-white' : 'bg-white/40')
    : '';

  const textColor = (focused || buttonFocused || isSelected) ? 'text-black' : 'text-white/70';

  const favorite = isFavorite('channels', serverCode, username, channel.stream_id);

  return (
    <div
      ref={ref}
      className={`relative w-[29vw] h-[6vw] flex items-center px-[1vw] transition-all duration-200 rounded-[1vw] gap-[1vw] ${bgClass} ${selectionClass}`}
      style={{ opacity }}
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
        <div ref={textRef} className="overflow-hidden">
          <motion.p
            className={`text-[1.8vw] font-medium whitespace-nowrap ${textColor} ${isSelected ? 'font-bold' : ''}`}
            animate={
              shouldScroll && (focused || buttonFocused)
                ? { x: ['0%', '-50%', '0%'] }
                : { x: '0%' }
            }
            transition={
              shouldScroll && (focused || buttonFocused)
                ? { duration: 6, ease: 'linear', repeat: Infinity, repeatDelay: 3 }
                : { duration: 0 }
            }
          >
            {channel.name}
          </motion.p>
        </div>
      </div>

      {(focused || buttonFocused || (isSelected && favorite)) && (
        <FavoriteButton
          focusKey={favoriteFocusKey}
          parentFocusKey={focusKey}
          setButtonFocused={setButtonFocused}
          isFavorite={favorite}
          onToggle={() =>
            toggleFavorite('channels', serverCode, username, {
              stream_id: channel.stream_id,
              name: channel.name,
              stream_icon: channel.stream_icon,
            })
          }
        />
      )}
    </div>
  );
}

function FavoriteButton({
  focusKey,
  parentFocusKey,
  setButtonFocused,
  isFavorite,
  onToggle,
}: {
  focusKey: string;
  parentFocusKey: string;
  setButtonFocused: (v: boolean) => void;
  isFavorite: boolean;
  onToggle: () => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onToggle,
    onArrowPress: (dir) => {
      if (dir === 'left' || dir === 'up' || dir === 'down') {
        setFocus(parentFocusKey);
        return true;
      }
      return true;
    },
    onFocus: () => setButtonFocused(true),
    onBlur: () => setButtonFocused(false),
  });

  return (
    <motion.button
      ref={ref}
      className={`
        ml-[0.5vw]
        w-[2.6vw] h-[2.6vw] rounded-full
        flex items-center justify-center
        border-2 transition-all duration-150
        ${isFavorite ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-700 text-gray-200 border-gray-500'}
        ${focused ? 'scale-110 border-white' : ''}
      `}
      whileTap={{ scale: 0.94 }}
    >
      <Star
        className="w-[1.4vw] h-[1.4vw]"
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </motion.button>
  );
}

export const ChannelItem = memo(ChannelItemComponent);
