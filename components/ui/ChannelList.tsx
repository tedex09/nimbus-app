'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { Channel } from '@/lib/api';
import SidebarHeader from '@/components/SidebarHeader';
import { Check } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  categoryName: string;
  onBack: () => void;
  onChannelSelect: (channel: Channel) => void;
  selectedChannelId?: number | null;
  className?: string;
}

export function ChannelList({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  onChannelSelect,
  selectedChannelId,
  className = '',
}: ChannelListProps) {
  const { ref: focusRootRef } = useFocusable({
    focusKey: 'channel-list-container',
    isFocusBoundary: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const ITEM_HEIGHT_VW = 6;
  const GAP_VW = 0.5;
  const HEADER_OFFSET_VW = 7; // espaço reservado para o header

  // foca no primeiro canal quando a lista carrega
  useEffect(() => {
    if (channels.length > 0 && !loading && !error) {
      setTimeout(() => setFocus('channel-0'), 100);
    }
  }, [channels, loading, error]);

  const getTranslateY = () => {
    if (!containerRef.current || channels.length === 0) return 0;

    const containerHeight = containerRef.current.offsetHeight;
    const vwToPx = (vw: number) => (vw / 100) * window.innerWidth;

    const itemHeightPx = vwToPx(ITEM_HEIGHT_VW);
    const gapPx = vwToPx(GAP_VW);
    const headerOffsetPx = vwToPx(HEADER_OFFSET_VW);

    const totalHeight = channels.length * itemHeightPx + (channels.length - 1) * gapPx;

    let desiredY = focusedIndex * (itemHeightPx + gapPx);
    const maxTranslate = totalHeight - (containerHeight - headerOffsetPx);

    if (desiredY > maxTranslate) desiredY = maxTranslate;

    return -(desiredY - headerOffsetPx);
  };

  if (loading) {
    return (
      <div ref={focusRootRef} className={`${className} flex flex-col`}>
        <div className="px-[1vw]">
          <SidebarHeader onBack={onBack} title={categoryName} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="text-[3vh] text-white/60"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Carregando canais...
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={focusRootRef} className={`${className} flex flex-col`}>
        <div className="px-[1vw]">
          <SidebarHeader onBack={onBack} title={categoryName} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[2.5vh] text-red-400 mb-[2vh]">{error}</p>
            <motion.button
              className="px-[2vw] py-[1vh] bg-red-600 text-white rounded-[1vh] text-[2vh] font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
            >
              Voltar
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Header fixo no topo */}
      <div className="top-0 px-[1vw] py-[2vw] relative z-20 bg-black">
        <SidebarHeader onBack={onBack} title={categoryName} />
      </div>
      <div className={`${className} flex flex-col h-full pb-[20vw]`}>
        {/* Lista ocupa só o espaço abaixo do header */}
        <div className="flex-1 relative px-[1vw]">
          <AnimatePresence>
            {channels.length > 0 && (
              <motion.div
                className="space-y-[0.5vw] pb-[1vw]"
                animate={{ y: getTranslateY() }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{ willChange: 'transform' }}
              >
                {channels.map((channel, i) => (
                  <ChannelItem
                    key={channel.stream_id}
                    channel={channel}
                    index={i}
                    focusedIndex={focusedIndex}
                    setFocusedIndex={setFocusedIndex}
                    onSelect={onChannelSelect}
                    isSelected={selectedChannelId === channel.stream_id}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );

}

interface ChannelItemProps {
  channel: Channel;
  index: number;
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  onSelect: (channel: Channel) => void;
  isSelected: boolean;
}

function ChannelItem({
  channel,
  index,
  focusedIndex,
  setFocusedIndex,
  onSelect,
  isSelected,
}: ChannelItemProps) {
  const { ref, focused } = useFocusable({
    focusKey: `channel-${index}`,
    onEnterPress: () => onSelect(channel),
    onFocus: () => setFocusedIndex(index),
  });

  return (
    <motion.div
      ref={ref}
      layout
      className={`
        relative w-full h-[6vw] flex items-center px-[1vw] transition-all duration-200 rounded-[1vw]
        ${focused
          ? 'scale-[1.08] z-20 shadow-[0_20px_40px_rgba(0,0,0,0.9)] border-2 border-white bg-white'
          : 'opacity-70 bg-neutral-800'}
        ${isSelected ? 'border-blue-500' : ''}
      `}
      style={{ overflow: 'visible' }} // garante que o foco ultrapasse o parent
    >
      {/* Ícone/Logo */}
      <div className="flex-shrink-0">
        {channel.stream_icon ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            className="w-[2.4vw] h-[2.4vw] rounded-[0.3vw] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`w-[3vw] h-[3vw] rounded-[0.3vw] flex items-center justify-center ${
            channel.stream_icon ? 'hidden' : ''
          }`}
        >
          <span className="text-[1.5vw] font-bold text-white/60">
            {channel.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0 ml-[1vw]">
        <div className="flex items-center gap-[1vw] mt-[0.2vw]">
          <span
            className={`
              text-[1vw] transition-colors duration-300
              ${focused ? 'text-black' : 'text-white/50'}
            `}
          >
            {channel.num}
          </span>

          <h3
            className={`
              text-[1.4vw] font-semibold truncate transition-colors duration-300
              ${focused ? 'text-black' : 'text-white'}
            `}
          >
            {channel.name}
          </h3>
        </div>
      </div>

      {isSelected && (
        <Check className="absolute right-[1vw] w-[1.5vw] h-[1.5vw] text-blue-400" />
      )}
    </motion.div>
  );
}