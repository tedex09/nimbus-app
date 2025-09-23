'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Clock, Tv, AlertCircle, Loader2 
} from 'lucide-react';
import { Channel } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';

interface ChannelDetailProps {
  channel: Channel | null;
  serverCode: string;
  username: string;
  password: string;
  className?: string;
}

type StreamFormat = 'hls' | 'ts';
type AspectRatio = '16:9' | '4:3' | 'zoom' | 'stretch';

interface Program {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  category: string;
  duration: number;
  isLive: boolean;
  progress?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export function ChannelDetail({ channel, serverCode, username, password, className = '' }: ChannelDetailProps) {
  const { toggleFavoriteChannel } = useAppStore();
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentProgramIndex, setCurrentProgramIndex] = useState(0);

  const { ref: containerRef } = useFocusable({ focusKey: 'channel-detail-container', isFocusBoundary: true });
  const { ref: previewRef, focused: previewFocused } = useFocusable({
    focusKey: 'channel-preview',
    onEnterPress: () => setIsFullscreen(prev => !prev),
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Atualiza horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch EPG real
  useEffect(() => {
    if (!channel) return;
    const fetchEPG = async () => {
      try {
        const today = new Date();
        today.setDate(today.getDate() + selectedDay);
        const dateStr = today.toISOString().split('T')[0];

        const res = await fetch(`${API_BASE}/api/epg/${channel.stream_id}?server_code=${serverCode}&username=${username}&password=${password}`);
        const data = await res.json();
        if (!data?.epg_listings) return;

        const mappedPrograms: Program[] = data.epg_listings.map((p: any) => {
          const startTime = new Date(p.start_timestamp * 1000).toISOString();
          const endTime = new Date(p.stop_timestamp * 1000).toISOString();
          const now = Math.floor(Date.now() / 1000);
          const isLive = p.start_timestamp <= now && p.stop_timestamp >= now;
          const progress = isLive ? ((now - p.start_timestamp) / (p.stop_timestamp - p.start_timestamp)) * 100 : undefined;

          return {
            id: p.id,
            title: p.title,
            description: p.description,
            startTime,
            endTime,
            category: p.category || '',
            duration: (p.stop_timestamp - p.start_timestamp) / 60,
            isLive,
            progress,
          };
        });

        setPrograms(mappedPrograms);

        // Atualiza index do programa atual para auto-scroll
        const currentIndex = mappedPrograms.findIndex(p => p.isLive);
        setCurrentProgramIndex(currentIndex >= 0 ? currentIndex : 0);

        // Auto-scroll para o programa atual
        setTimeout(() => {
          if (scrollContainerRef.current && currentIndex >= 0) {
            const child = scrollContainerRef.current.children[currentIndex] as HTMLElement;
            child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
          }
        }, 100);
      } catch (err) {
        console.error('Erro ao buscar EPG:', err);
      }
    };

    fetchEPG();
  }, [channel, serverCode, username, password, selectedDay]);

  const filteredPrograms = useMemo(() => {
    if (selectedDay === 0) return programs.filter(p => new Date(p.endTime) > currentTime);
    return programs;
  }, [programs, currentTime, selectedDay]);

  const dayOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { value: i, label };
    });
  }, []);

  const getStreamUrl = useCallback(() => {
    if (!channel || !serverCode || !username || !password) return '';
    return `${API_BASE}/api/stream/${serverCode}/${username}/${password}/${channel.stream_id}.m3u8`;
  }, [channel, serverCode, username, password]);

  // Configuração do vídeo HLS
  useEffect(() => {
    if (!videoRef.current || !channel?.url) return;
    const video = videoRef.current;
    setIsLoading(true);
    setHasError(false);

    const setupVideo = async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported() && channel.url.endsWith('.m3u8')) {
          hlsRef.current?.destroy();
          const hls = new Hls({ enableWorker: false, lowLatencyMode: true, backBufferLength: 90 });
          hlsRef.current = hls;
          hls.loadSource(channel.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => { setIsLoading(false); video.muted = true; video.play().catch(console.error); });
          hls.on(Hls.Events.ERROR, (_, data) => { console.error('HLS Error:', data); setHasError(true); setIsLoading(false); });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = channel.url; video.muted = true; await video.play().catch(() => setHasError(true)); setIsLoading(false);
        } else { console.error('HLS not supported'); setHasError(true); setIsLoading(false); }
      } catch (err) { console.error('Video setup error:', err); setHasError(true); setIsLoading(false); }
    };

    setupVideo();
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [channel]);

  const togglePlayPause = useCallback(() => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(console.error); setIsPlaying(!isPlaying); } }, [isPlaying]);
  const toggleMute = useCallback(() => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }, [isMuted]);
  const getAspectRatioClass = useCallback(() => { switch (aspectRatio) { case '4:3': return 'aspect-[4/3]'; case 'zoom': return 'object-cover scale-110'; case 'stretch': return 'object-fill'; default: return 'aspect-video'; } }, [aspectRatio]);

  if (!channel) return (
    <div ref={containerRef} className={`flex flex-col items-center justify-center text-neutral-400 ${className}`}>
      <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
      <p className="text-[3vh]">Selecione um canal</p>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Preview */}
      <div className="flex justify-center mb-6">
        <motion.div
          ref={previewRef}
          className={`relative w-[45vw] bg-black rounded-[1vw] overflow-hidden border-[0.3vw] transition-all duration-300 ${previewFocused ? 'border-white shadow-[0_0_3vw_rgba(255,255,255,0.5)]' : 'border-neutral-700'}`}
          whileFocus={{ scale: 1.02 }}
        >
          <div className={`relative ${getAspectRatioClass()}`}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              controls={false}
              onError={() => setHasError(true)}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
            />
            {isLoading && <OverlayLoading />}
            {hasError && <OverlayError />}
            <ChannelInfoOverlay channel={channel} />
          </div>
        </motion.div>
      </div>

      {/* Day Menu */}
      <div className="flex justify-center mb-6">
        <div className="flex justify-center items-center bg-black/40 w-[45vw] p-[0.6vw] rounded-[2vw] gap-2">
        {dayOptions.map(opt => (
          <DayButton key={opt.value} option={opt} isSelected={selectedDay === opt.value} onSelect={() => setSelectedDay(opt.value)} />
        ))}
        </div>
      </div>

      {/* Programação Horizontal */}
      <div className="flex-1 overflow-hidden">
        <h3 className="text-[1.8vw] font-bold text-white mb-2">Programação</h3>
        <div className="relative">
          <div className="absolute right-0 top-0 bottom-0 w-[4vw] bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <div
            ref={scrollContainerRef}
            className="flex w-[65vw] gap-2 overflow-x-auto scrollbar-hide pl-1"
            style={{ scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
          >
            {filteredPrograms.map((p, i) => (
              <ProgramCardHorizontal
                key={p.id}
                program={p}
                isSelected={i === currentProgramIndex}
                isCurrent={p.isLive}
                onSelect={() => setCurrentProgramIndex(i)}
                focusKey={`program-${i}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTES AUXILIARES */
function OverlayLoading() { return (<div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-12 h-12 text-white animate-spin" /></div>); }
function OverlayError() { return (<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white"><AlertCircle className="w-12 h-12 text-red-400 mb-2" /><p className="text-lg">Erro ao carregar stream</p></div>); }
function ChannelInfoOverlay({ channel }: { channel: Channel }) { return (<div className="absolute top-2 left-2 bg-black/70 rounded p-2 backdrop-blur-sm flex items-center gap-2">{channel.stream_icon && <img src={channel.stream_icon} alt={channel.name} className="w-6 h-6 rounded" />}<div><h3 className="text-white font-bold text-sm">{channel.name}</h3></div></div>); }
function DayButton({ option, isSelected, onSelect }: { option: { value: number; label: string; date?: Date }; isSelected: boolean; onSelect: () => void }) {
  const { ref, focused } = useFocusable({ focusKey: `day-${option.value}`, onEnterPress: onSelect });
  return (<motion.button ref={ref} onClick={onSelect} className={`flex-shrink-0 px-[1.2vw] py-[0.5vw] rounded-[2vw] text-[1.2vw] transition-all duration-200 min-w-fit whitespace-nowrap ${isSelected ? 'bg-white/40 text-black font-bold' : 'text-white font-light'} ${focused ? '!bg-white !text-black' : ''}`} whileFocus={{ scale: 1.05 }}>{option.label}</motion.button>);
}
function ProgramCardHorizontal({ program, isSelected, isCurrent, onSelect, focusKey }: { program: Program; isSelected: boolean; isCurrent?: boolean; onSelect: () => void; focusKey: string }) {
  const { ref, focused } = useFocusable({ focusKey, onEnterPress: onSelect });
  const time = new Date(program.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const end = new Date(program.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (<motion.div ref={ref} onClick={onSelect} className={`flex-shrink-0 w-[30vw] p-[1vw] rounded-[1vw] transition-all ${isCurrent ? 'bg-white/90 text-black' : isSelected ? 'bg-black/50 text-white' : 'bg-black/30 text-white'} ${focused ? 'bg-white !text-black' : ''}`} style={{ scrollSnapAlign: 'start' }} whileFocus={{ scale: focused ? 1.1 : 1 }}><div className="flex justify-between mb-2"><span className='text-[1vw] font-thin'>{time} - {end}</span>{isCurrent && <div className="bg-red-600 text-white rounded-full text-xs font-bold">LIVE</div>}</div><h4 className="font-bold mb-1 line-clamp-2 text-[1.3vw]">{program.title}</h4></motion.div>);
}
