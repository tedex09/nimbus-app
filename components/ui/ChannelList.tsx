'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { Channel } from '@/lib/api';
import { ArrowLeft, Tv, AlertCircle, RefreshCw } from 'lucide-react';
import SidebarHeader from '@/components/SidebarHeader';

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  categoryName: string;
  onBack: () => void;
  onChannelSelect: (channel: Channel) => void;
  className?: string;
}

interface ChannelItemProps {
  channel: Channel;
  index: number;
  onSelect: (channel: Channel) => void;
  focusKey: string;
  focusedIndex: number;
  onFocus: (index: number) => void;
}

function ChannelItem({ channel, index, onSelect, focusKey, focusedIndex, onFocus }: ChannelItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => onSelect(channel),
    // Previne erros de navegação ao definir limites explícitos
    onArrowPress: (direction) => {
      // Permite navegação normal, mas evita loops infinitos
      return true;
    },
    // Configurações para evitar stack overflow
    saveLastFocusedChild: false,
    onFocus: () => onFocus(index),
    trackChildren: false,
  });

  return (
    <motion.div
      ref={ref}
      className={`
        flex items-center gap-[1vw] p-[1vw] rounded-[1.5vw] cursor-pointer
        transition-all duration-200 border-[0.2vw]
        ${focused 
          ? 'bg-white/10 border-white shadow-[0_0_2vw_rgba(255,255,255,0.3)]' 
          : 'bg-neutral-800/40 border-transparent hover:bg-neutral-700/40'
        }
      `}
      onClick={() => onSelect(channel)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileFocus={{ scale: 1.02 }}
    >
      {/* Ícone do canal */}
      <div className="flex items-center gap-[1vw] p-[1vw] rounded-[1vw] cursor-pointer h-[4vw]">
        {channel.stream_icon ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="text-neutral-400"><svg class="w-[1.5vw] h-[1.5vw]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 6h-2l-2-2H7L5 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 13l-4-3 1.41-1.41L10 16.17l6.59-6.59L18 11l-7 8z"/></svg></div>';
              }
            }}
          />
        ) : (
          <Tv className="w-[1.5vw] h-[1.5vw] text-neutral-400" />
        )}
      </div>

      {/* Informações do canal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[0.5vw] mb-[0.2vw]">
          <span className="text-[1.2vw] font-bold text-white truncate">
            {channel.name}
          </span>
          {channel.num && (
            <span className="text-[1vw] text-neutral-400 flex-shrink-0">
              #{channel.num}
            </span>
          )}
        </div>
        {channel.epg_channel_id && (
          <span className="text-[0.9vw] text-neutral-500 truncate block">
            EPG: {channel.epg_channel_id}
          </span>
        )}
      </div>

      {/* Indicador de foco */}
      {focused && (
        <motion.div
          className="flex-shrink-0 w-[0.3vw] h-[2vw] bg-white rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-[4vw] text-neutral-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw className="w-[3vw] h-[3vw] mb-[1vw]" />
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
            bg-red-600 text-white border-[0.2vw] transition-all duration-200
            ${focused ? 'border-white shadow-lg' : 'border-transparent'}
          `}
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
      <Tv className="w-[3vw] h-[3vw] mb-[1vw] opacity-50" />
      <p className="text-[1.4vw]">Nenhum canal encontrado</p>
      <p className="text-[1vw] text-neutral-500 mt-[0.5vw]">
        Esta categoria não possui canais disponíveis
      </p>
    </div>
  );
}

export function ChannelList({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  onChannelSelect,
  className = '',
}: ChannelListProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 4; // 4vw height per item
  const visibleItems = 12; // Number of visible items
  const maxTranslateY = Math.max(0, (channels.length - visibleItems) * itemHeight);

  const [isInitialized, setIsInitialized] = useState(false);

  // Container focusable com configurações para evitar erros de navegação
  const { ref: containerFocusRef } = useFocusable({
    focusKey: 'channel-list-container',
    isFocusBoundary: true,
    // Configurações para prevenir stack overflow
    saveLastFocusedChild: true,
    trackChildren: true,
    onArrowPress: (direction, props) => {
      // Permite navegação normal mas previne loops infinitos
      return false; // Deixa o spatial navigation lidar com a navegação
    },
  });

  // Update scroll position based on focused index
  useEffect(() => {
    if (focusedIndex < 6) {
      setTranslateY(0);
    } else if (focusedIndex >= channels.length - 6) {
      setTranslateY(-maxTranslateY);
    } else {
      const newTranslateY = -(focusedIndex - 6) * itemHeight;
      setTranslateY(Math.max(-maxTranslateY, Math.min(0, newTranslateY)));
    }
  }, [focusedIndex, maxTranslateY, channels.length]);

  // Foca o primeiro item quando a lista carrega
  useEffect(() => {
    if (!loading && !error && channels.length > 0 && !isInitialized) {
      // Pequeno delay para garantir que os elementos estejam renderizados
      const timer = setTimeout(() => {
        setFocus('channel-item-0');
        setIsInitialized(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, channels.length, isInitialized]);

  // Reset quando a categoria muda
  useEffect(() => {
    setIsInitialized(false);
  }, [categoryName]);

  const handleChannelSelect = useCallback((channel: Channel) => {
    onChannelSelect(channel);
  }, [onChannelSelect]);


  const ITEM_HEIGHT = 4; // em vw
  const GAP = 0.5; // espaçamento entre itens, em vw

  const getTranslateY = () => {
    if (!containerRef.current || channels.length === 0) return 0;
    const containerHeightPx = containerRef.current.offsetHeight;
    const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
    const gapPx = (GAP / 100) * window.innerWidth;
    const totalHeight = channels.length * itemHeightPx + (channels.length - 1) * gapPx;

    let desiredY = focusedIndex * (itemHeightPx + gapPx);
    const maxTranslate = totalHeight - containerHeightPx;
    if (desiredY > maxTranslate) desiredY = maxTranslate;
    return -desiredY;
  };


  return (
    <motion.div
      className={`flex flex-col ${className}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-[2vw] pb-[1vw]">
        <SidebarHeader
          onBack={onBack}
          title={categoryName}
          icon="/icons/tv.png"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingState />
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorState error={error} />
            </motion.div>
          )}

          {!loading && !error && channels.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState />
            </motion.div>
          )}

          {!loading && !error && channels.length > 0 && (
            <div ref={containerRef} className="relative h-full overflow-visible px-[2vw]">
              <motion.div
                className="absolute top-0 left-0 w-full space-y-[0.5vw]"
                animate={{ y: `${getTranslateY()}px` }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{ willChange: 'transform' }}
              >
                {channels.map((channel, index) => (
                  <ChannelItem
                    key={`${channel.stream_id}-${index}`}
                    channel={channel}
                    index={index}
                    onSelect={handleChannelSelect}
                    focusKey={`channel-item-${index}`}
                    focusedIndex={focusedIndex}
                    onFocus={setFocusedIndex}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      {!loading && !error && channels.length > 0 && (
        <motion.div
          className="flex-shrink-0 p-[2vw] pt-[1vw] text-center text-[1vw] text-neutral-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {channels.length} {channels.length === 1 ? 'canal disponível' : 'canais disponíveis'}
        </motion.div>
      )}
    </motion.div>
  );
}