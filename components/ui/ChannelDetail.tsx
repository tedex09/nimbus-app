'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Calendar, Clock, Tv, AlertCircle, Loader2 } from 'lucide-react';
import { Channel } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';

interface ChannelDetailProps {
  channel: Channel | null;
  serverCode: string;
  username: string;
  password: string;
  className?: string;
}

interface EPGProgram {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  category: string;
  isLive: boolean;
  progress?: number;
}

interface Program {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  category: string;
}

type StreamFormat = 'hls' | 'ts';
type AspectRatio = '16:9' | '4:3' | 'zoom' | 'stretch';

export function ChannelDetail({ channel, serverCode, username, password, className = '' }: ChannelDetailProps) {
  const { toggleFavoriteChannel, isFavoriteChannel } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [streamFormat, setStreamFormat] = useState<StreamFormat>('hls');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0);
  const [currentProgramIndex, setCurrentProgramIndex] = useState(0);

  // Container focusable
  const { ref: containerRef } = useFocusable({
    focusKey: 'channel-detail-container',
    isFocusBoundary: true,
  });

  // Preview focusable
  const { ref: previewRef, focused: previewFocused } = useFocusable({
    focusKey: 'channel-preview',
    onEnterPress: () => setIsFullscreen(!isFullscreen),
  });

  // Mock EPG data
  const generateEPGData = useCallback((dayOffset: number): EPGProgram[] => {
    const now = new Date();
    const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const programs: EPGProgram[] = [];
    
    const categories = ['Filme', 'Série', 'Notícias', 'Esporte', 'Documentário', 'Infantil'];
    const basePrograms = [
      'Jornal Nacional', 'Filme da Tarde', 'Novela das 8', 'Esporte Espetacular',
      'Fantástico', 'Globo Repórter', 'The Voice Brasil', 'Big Brother Brasil',
      'Caldeirão', 'Domingão', 'Mais Você', 'Encontro'
    ];

    for (let i = 0; i < 12; i++) {
      const startHour = 6 + i * 2;
      const start = new Date(targetDate);
      start.setHours(startHour, 0, 0, 0);
      
      const end = new Date(start);
      end.setHours(startHour + 2, 0, 0, 0);
      
      const isLive = dayOffset === 0 && now >= start && now <= end;
      let progress = 0;
      
      if (isLive) {
        const elapsed = now.getTime() - start.getTime();
        const total = end.getTime() - start.getTime();
        progress = Math.min(100, (elapsed / total) * 100);
      }

      programs.push({
        id: `${dayOffset}-${i}`,
        title: basePrograms[i % basePrograms.length],
        description: `Descrição do programa ${basePrograms[i % basePrograms.length]}`,
        start: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        end: end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: categories[i % categories.length],
        isLive,
        progress: isLive ? progress : undefined
      });
    }
    
    return programs;
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to focused program
  const scrollToProgram = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.offsetWidth * 0.25; // 25vw
      const scrollPosition = index * (cardWidth + container.offsetWidth * 0.01); // card width + 1vw gap
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const [epgData, setEpgData] = useState<EPGProgram[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    setEpgData(generateEPGData(selectedDay));
  }, [selectedDay, generateEPGData]);

  // Video setup
  useEffect(() => {
    if (!channel?.stream_id || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setHasError(false);

    const streamUrl = `http://${serverCode}:8080/live/${username}/${password}/${channel.stream_id}.${streamFormat}`;

    const setupVideo = async () => {
      try {
        if (streamFormat === 'hls' && streamUrl.includes('.m3u8')) {
          // Dynamic import for hls.js
          const { default: Hls } = await import('hls.js');
          
          if (Hls.isSupported()) {
            if (hlsRef.current) {
              hlsRef.current.destroy();
            }
            
            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: true,
              backBufferLength: 90,
            });
            
            hlsRef.current = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              if (isPlaying) video.play().catch(console.error);
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS Error:', data);
              setHasError(true);
              setIsLoading(false);
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        } else {
          video.src = streamUrl;
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Video setup error:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    setupVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, serverCode, username, password, streamFormat]);

  // Video controls
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '4:3': return 'aspect-[4/3]';
      case 'zoom': return 'object-cover scale-110';
      case 'stretch': return 'object-fill';
      default: return 'aspect-video';
    }
  };

  const days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: i
    };
  });

  if (!channel) {
    return (
      <div className={`flex flex-col items-center justify-center text-neutral-400 ${className}`}>
        <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
        <p className="text-[3vh]">Selecione um canal</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <AnimatePresence>
        {isFullscreen && (
          <FullscreenPlayer
            channel={channel}
            videoRef={videoRef}
            isPlaying={isPlaying}
            isMuted={isMuted}
            isLoading={isLoading}
            hasError={hasError}
            streamFormat={streamFormat}
            aspectRatio={aspectRatio}
            onClose={() => setIsFullscreen(false)}
            onTogglePlay={togglePlayPause}
            onToggleMute={toggleMute}
            onStreamFormatChange={setStreamFormat}
            onAspectRatioChange={setAspectRatio}
          />
        )}
      </AnimatePresence>

      {/* Preview Centralizado */}
      <div className="flex justify-center mb-[2vh]">
        <motion.div
          ref={previewRef}
          className={`
            relative w-[45vw] bg-black rounded-[1.5vw] overflow-hidden
            border-[0.3vw] transition-all duration-300
            ${previewFocused ? 'border-white shadow-[0_0_3vw_rgba(255,255,255,0.5)]' : 'border-neutral-700'}
          `}
          whileFocus={{ scale: 1.02 }}
          layout
        >
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${getAspectRatioStyle()}`}
              autoPlay
              muted={isMuted}
              playsInline
              controls={false}
              onError={() => setHasError(true)}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <Loader2 className="w-[4vw] h-[4vw] text-white animate-spin" />
              </div>
            )}

            {/* Error Overlay */}
            {hasError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-[4vw] h-[4vw] text-red-400 mb-[1vh]" />
                <p className="text-[2vh]">Erro ao carregar stream</p>
              </div>
            )}

            {/* Channel Info Overlay */}
            <div className="absolute top-[1vw] left-[1vw] bg-black/70 rounded-[1vw] p-[1vw] backdrop-blur-sm">
              <div className="flex items-center gap-[1vw]">
                {channel.stream_icon && (
                  <img src={channel.stream_icon} alt={channel.name} className="w-[3vw] h-[3vw] rounded-[0.5vw]" />
                )}
                <div>
                  <h3 className="text-[2vh] font-bold text-white">{channel.name}</h3>
                  <p className="text-[1.5vh] text-neutral-300">Canal {channel.num}</p>
                </div>
              </div>
            </div>

            {/* Focus Indicator */}
            {previewFocused && (
              <div className="absolute bottom-[1vw] right-[1vw] bg-white/20 rounded-[1vw] p-[0.5vw] backdrop-blur-sm">
                <div className="flex items-center gap-[0.5vw] text-white text-[1.5vh]">
                  <Maximize2 className="w-[2vh] h-[2vh]" />
                  <span>Enter para tela cheia</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-hidden">
        <h3 className="text-[2.2vw] font-bold text-white mb-[1vh]">Programação</h3>
        
        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-[4vw] bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          
          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-[4vw] bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-[1vw] overflow-x-auto scrollbar-hide pb-[1vh] transform-gpu"
            style={{
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory'
            }}
          >
            {programs.map((program, index) => (
              <ProgramCardHorizontal
                key={program.id}
                program={program}
                isSelected={index === currentProgramIndex}
                isCurrent={program.isLive}
                onSelect={() => {
                  setCurrentProgramIndex(index);
                  scrollToProgram(index);
                }}
                focusKey={`program-${index}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* EPG Horizontal */}
      <div className="flex justify-center">
        <div className="w-[65vw]">
          <div className="flex gap-[1vw] overflow-x-auto scrollbar-hide pb-[1vh]">
            {epgData.map((program, index) => (
              <EPGProgramCard
                key={program.id}
                program={program}
                isSelected={selectedProgramIndex === index}
                onSelect={() => setSelectedProgramIndex(index)}
                focusKey={`program-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Day Selector Component
function DaySelector({ 
  day, 
  isSelected, 
  onSelect, 
  focusKey 
}: { 
  day: { label: string; value: number }; 
  isSelected: boolean; 
  onSelect: () => void; 
  focusKey: string; 
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        px-[2vw] py-[1vh] rounded-[1vw] text-[1.8vh] font-medium transition-all duration-200
        border-[0.2vw] min-w-[8vw] text-center
        ${isSelected 
          ? 'bg-blue-600 text-white border-blue-400' 
          : 'bg-neutral-700/50 text-neutral-300 border-transparent hover:bg-neutral-600/50'}
        ${focused ? 'border-white shadow-[0_0_1vw_rgba(255,255,255,0.5)]' : ''}
      `}
      onClick={onSelect}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {day.label}
    </motion.button>
  );
}

// EPG Program Card Component
function EPGProgramCard({ 
  program, 
  isSelected, 
  onSelect, 
  focusKey 
}: { 
  program: EPGProgram; 
  isSelected: boolean; 
  onSelect: () => void; 
  focusKey: string; 
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Filme': 'bg-purple-600',
      'Série': 'bg-blue-600',
      'Notícias': 'bg-red-600',
      'Esporte': 'bg-green-600',
      'Documentário': 'bg-yellow-600',
      'Infantil': 'bg-pink-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  return (
    <motion.div
      ref={ref}
      className={`
        relative min-w-[20vw] bg-neutral-800/80 rounded-[1vw] p-[1.5vw] cursor-pointer
        border-[0.2vw] transition-all duration-200 backdrop-blur-sm
        ${program.isLive 
          ? 'bg-gradient-to-r from-red-900/50 to-red-700/50 border-red-500' 
          : 'border-transparent hover:border-neutral-600'}
        ${focused ? 'border-white shadow-[0_0_2vw_rgba(255,255,255,0.3)] scale-105' : ''}
        ${isSelected ? 'bg-blue-900/30 border-blue-500' : ''}
      `}
      onClick={onSelect}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Live Indicator */}
      {program.isLive && (
        <div className="absolute top-[0.5vw] right-[0.5vw] flex items-center gap-[0.3vw]">
          <motion.div
            className="w-[0.8vw] h-[0.8vw] bg-red-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[1.3vh] font-bold text-red-400">AO VIVO</span>
        </div>
      )}

      {/* Time */}
      <div className="flex items-center gap-[0.5vw] text-[1.5vh] text-neutral-300 mb-[0.5vh]">
        <Clock className="w-[1.5vh] h-[1.5vh]" />
        <span>{program.start} - {program.end}</span>
      </div>

      {/* Title */}
      <h4 className="text-[2vh] font-bold text-white mb-[0.5vh] line-clamp-2">
        {program.title}
      </h4>

      {/* Description */}
      <p className="text-[1.4vh] text-neutral-400 line-clamp-2 mb-[1vh]">
        {program.description}
      </p>

      {/* Progress Bar for Live Programs */}
      {program.isLive && program.progress !== undefined && (
        <div className="mt-[1vh]">
          <div className="flex justify-between text-[1.2vh] text-neutral-400 mb-[0.3vh]">
            <span>Progresso</span>
            <span>{Math.round(program.progress)}%</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-[0.4vh] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${program.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {program.progress > 80 && (
            <p className="text-[1.2vh] text-yellow-400 mt-[0.3vh]">⚠️ Terminando em breve</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Fullscreen Player Component
function FullscreenPlayer({
  channel,
  videoRef,
  isPlaying,
  isMuted,
  isLoading,
  hasError,
  streamFormat,
  aspectRatio,
  onClose,
  onTogglePlay,
  onToggleMute,
  onStreamFormatChange,
  onAspectRatioChange,
}: {
  channel: Channel;
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  hasError: boolean;
  streamFormat: StreamFormat;
  aspectRatio: AspectRatio;
  onClose: () => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onStreamFormatChange: (format: StreamFormat) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
}) {
  const { ref: fullscreenRef } = useFocusable({
    focusKey: 'fullscreen-container',
    isFocusBoundary: true,
  });

  const { ref: closeRef, focused: closeFocused } = useFocusable({
    focusKey: 'fullscreen-close',
    onEnterPress: onClose,
  });

  const { ref: playRef, focused: playFocused } = useFocusable({
    focusKey: 'fullscreen-play',
    onEnterPress: onTogglePlay,
  });

  const { ref: muteRef, focused: muteFocused } = useFocusable({
    focusKey: 'fullscreen-mute',
    onEnterPress: onToggleMute,
  });

  return (
    <motion.div
      ref={fullscreenRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          muted={isMuted}
          playsInline
          controls={false}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-2xl">Erro ao carregar stream</p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80">
          {/* Top Bar */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {channel.stream_icon && (
                <img src={channel.stream_icon} alt={channel.name} className="w-16 h-16 rounded-lg" />
              )}
              <div>
                <h2 className="text-3xl font-bold text-white">{channel.name}</h2>
                <p className="text-xl text-neutral-300">Canal {channel.num}</p>
              </div>
            </div>

            <motion.button
              ref={closeRef}
              className={`
                p-4 rounded-full bg-black/50 text-white border-2 transition-all duration-200
                ${closeFocused ? 'border-white scale-110' : 'border-transparent'}
              `}
              onClick={onClose}
              whileFocus={{ scale: 1.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Minimize2 className="w-8 h-8" />
            </motion.button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.button
                ref={playRef}
                className={`
                  p-4 rounded-full bg-black/50 text-white border-2 transition-all duration-200
                  ${playFocused ? 'border-white scale-110' : 'border-transparent'}
                `}
                onClick={onTogglePlay}
                whileFocus={{ scale: 1.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </motion.button>

              <motion.button
                ref={muteRef}
                className={`
                  p-4 rounded-full bg-black/50 text-white border-2 transition-all duration-200
                  ${muteFocused ? 'border-white scale-110' : 'border-transparent'}
                `}
                onClick={onToggleMute}
                whileFocus={{ scale: 1.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// New horizontal program card component
function ProgramCardHorizontal({ program, isSelected, isCurrent, onSelect, focusKey }: {
  program: Program;
  isSelected: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  focusKey: string;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  return (
    <motion.div
      ref={ref}
      className={`
        flex-shrink-0 w-[25vw] p-[1.5vw] rounded-[1.5vw] cursor-pointer
        transition-all duration-300 transform-gpu
        ${isCurrent 
          ? 'bg-white/90 text-black scale-105' 
          : isSelected 
            ? 'bg-neutral-800/80 text-white opacity-100' 
            : 'bg-neutral-800/60 text-white opacity-60'}
        ${focused ? 'ring-4 ring-white/50 scale-110' : ''}
      `}
      style={{
        scrollSnapAlign: 'start'
      }}
      onClick={onSelect}
      whileFocus={{ scale: focused ? 1.1 : (isCurrent ? 1.05 : 1) }}
      whileHover={{ scale: isCurrent ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-[1vh]">
        <div className="flex items-center gap-[0.8vw]">
          <span className={`text-[1.3vw] font-bold ${isCurrent ? 'text-black' : 'text-white'}`}>
            {program.startTime}
          </span>
          {isCurrent && (
            <div className="bg-red-600 text-white px-[0.8vw] py-[0.2vw] rounded-full text-[1vw] font-bold">
              LIVE
            </div>
          )}
        </div>
        <span className={`text-[1.1vw] ${isCurrent ? 'text-black/70' : 'text-neutral-400'}`}>
          {program.duration}min
        </span>
      </div>
      
      <h4 className={`text-[1.7vw] font-bold mb-[0.8vh] line-clamp-2 ${isCurrent ? 'text-black' : 'text-white'}`}>
        {program.title}
      </h4>
      
      <p className={`text-[1.3vw] line-clamp-3 mb-[1vh] ${isCurrent ? 'text-black/80' : 'text-neutral-300'}`}>
        {program.description}
      </p>
      
      <div className="flex items-center justify-between">
        <span className={`text-[1.1vw] ${isCurrent ? 'text-black/70' : 'text-neutral-400'}`}>
          {program.category}
        </span>
        <span className={`text-[1.1vw] ${isCurrent ? 'text-black/70' : 'text-neutral-400'}`}>
          {program.endTime}
        </span>
      </div>
    </motion.div>
  );
}