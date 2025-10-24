'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { Channel } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { CircleAlert as AlertCircle, RefreshCw, Tv, Star } from 'lucide-react';
import SidebarHeader from '@/components/SidebarHeader';
import { ChannelItem } from './ChannelItem';

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  categoryName: string;
  onBack: () => void;
  className?: string;
}

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
      {/* <Tv className="w-[4vh] h-[4vh] text-white mb-[2vh]" />
      <p className="text-white text-[2vh]">Nenhum canal disponível</p> */}
    </div>
  );
}

export function ChannelMenu({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  className = '',
}: ChannelListProps) {
  const { lastFocusedChannelKey, selectedChannel } = useFocusStore();
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

  const { ref, focusKey, focusSelf } = useFocusable({
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

    focusSelf();
  }
}, [loading, error, channels.length, isInitialized]);


  // Reset ao mudar de categoria
  useEffect(() => {
    setIsInitialized(false);
    hasRestoredFocus.current = false;
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

  return (
    <FocusContext.Provider value={focusKey}>
      <motion.div
        ref={ref}
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
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </FocusContext.Provider>
  );
}
