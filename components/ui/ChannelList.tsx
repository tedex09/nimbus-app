'use client';

import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Tv } from 'lucide-react';
import { Channel } from '@/lib/api';

interface ChannelListProps {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  categoryName: string;
  onBack: () => void;
  onChannelSelect: (channel: Channel) => void;
  className?: string;
}

export function ChannelList({
  channels,
  loading,
  error,
  categoryName,
  onBack,
  onChannelSelect,
  className = ''
}: ChannelListProps) {
  const { ref: containerRef } = useFocusable({
    focusKey: 'channel-list-container',
    isFocusBoundary: true,
  });

  if (loading) {
    return (
      <div className={`${className} flex flex-col`}>
        <div className="mb-[2vh]">
          <BackButton onBack={onBack} />
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
      <div className={`${className} flex flex-col`}>
        <div className="mb-[2vh]">
          <BackButton onBack={onBack} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center space-y-[2vh]">
          <div className="text-[3vh] text-red-400 text-center">{error}</div>
          <RetryButton onRetry={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} flex flex-col`}>
      {/* Header com botão voltar */}
      <div className="mb-[2vh]">
        <div className="flex items-center gap-[1vw] mb-[1vh]">
          <BackButton onBack={onBack} />
        </div>
        <h2 className="text-[2.5vh] font-bold text-white/80 ml-[1vw]">
          {categoryName} ({channels.length} canais)
        </h2>
      </div>

      {/* Lista de canais */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <div className="space-y-[1vh] pr-[1vw]">
            {channels.map((channel, index) => (
              <ChannelItem
                key={channel.stream_id}
                channel={channel}
                focusKey={`channel-${index}`}
                onSelect={() => onChannelSelect(channel)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'back-button',
    onEnterPress: onBack,
  });

  return (
    <motion.button
      ref={ref}
      onClick={onBack}
      className={`
        flex items-center gap-[0.5vw] px-[1.5vw] py-[0.8vh] rounded-[1.5vw]
        bg-neutral-800/60 backdrop-blur-sm border-2 transition-all duration-200
        ${focused ? 'border-white bg-neutral-700/80 scale-105' : 'border-transparent'}
      `}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <ArrowLeft className="w-[2vh] h-[2vh] text-white" />
      <span className="text-[1.8vh] font-medium text-white">Voltar</span>
    </motion.button>
  );
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'retry-button',
    onEnterPress: onRetry,
  });

  return (
    <motion.button
      ref={ref}
      onClick={onRetry}
      className={`
        px-[2vw] py-[1vh] rounded-[1.5vw] text-[2vh] font-medium
        bg-blue-600 text-white border-2 transition-all duration-200
        ${focused ? 'border-white bg-blue-500 scale-105' : 'border-transparent'}
      `}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      Tentar Novamente
    </motion.button>
  );
}

function ChannelItem({ 
  channel, 
  focusKey, 
  onSelect 
}: { 
  channel: Channel; 
  focusKey: string; 
  onSelect: () => void; 
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  return (
    <motion.div
      ref={ref}
      onClick={onSelect}
      className={`
        flex items-center gap-[1vw] p-[1vh_1.5vw] rounded-[1.5vw] cursor-pointer
        bg-neutral-800/40 backdrop-blur-sm border-2 transition-all duration-200
        ${focused ? 'border-white bg-neutral-700/60 scale-[1.02]' : 'border-transparent'}
      `}
      whileFocus={{ scale: 1.02 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Ícone do canal */}
      <div className="w-[4vh] h-[4vh] rounded-[0.8vh] overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0">
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
                parent.innerHTML = '<div class="w-[2vh] h-[2vh] text-white/40"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2l-1.27-1.27c-.4-.4-.94-.73-1.73-.73H8c-.79 0-1.33.33-1.73.73L5 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg></div>';
              }
            }}
          />
        ) : (
          <Tv className="w-[2vh] h-[2vh] text-white/40" />
        )}
      </div>

      {/* Informações do canal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[1.2vh] font-medium text-white/60 bg-neutral-700/60 px-[0.5vw] py-[0.2vh] rounded-[0.5vh]">
            {channel.num}
          </span>
          <h3 className={`text-[1.8vh] font-medium truncate ${focused ? 'text-white' : 'text-white/80'}`}>
            {channel.name}
          </h3>
        </div>
      </div>

      {/* Indicador de foco */}
      {focused && (
        <motion.div
          className="w-[0.5vw] h-[3vh] bg-white rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}