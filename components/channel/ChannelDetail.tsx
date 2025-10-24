'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { Tv } from 'lucide-react';
import { Channel, api } from '@/lib/api';
import { useFocusStore } from '@/stores/useFocusStore';
import { useEpgStore } from '@/stores/useEpgStore';
import { useShakaPlayer } from '@/hooks/useShakaPlayer';
import { ChannelPreview } from './ChannelPreview';
import { Epg } from './epg/Epg';
import { DaySelector } from './epg/DaySelector';
import { FullScreenPlayer } from '@/components/player/FullScreenPlayer';

interface ChannelDetailProps {
  channel: Channel | null;
  serverCode: string;
  username: string;
  password: string;
  className?: string;
}

export function ChannelDetail({
  channel,
  serverCode,
  username,
  password,
  className = '',
}: ChannelDetailProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);

  const { resetForChannelChange } = useFocusStore();
  const { setPrograms, updateCurrentProgram, reset, programs } = useEpgStore();
  const { ref, focusKey } = useFocusable({ trackChildren: true });

  const { isFullscreen, closeFullscreen, openFullscreen } = useFocusStore();

  const { isLoading, error } = useShakaPlayer(videoRef, channel?.url, 'live');

  useEffect(() => {
    if (channel) {
      resetForChannelChange();
      reset();
      setSelectedDay(0);
    }
  }, [channel?.stream_id, resetForChannelChange, reset]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateCurrentProgram();
    }, 60_000);
    return () => clearInterval(timer);
  }, [updateCurrentProgram]);

  useEffect(() => {
    if (!channel) {
      reset();
      return;
    }
    const fetchEpg = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setDate(today.getDate() + selectedDay);
        const dateStr = today.toISOString().split('T')[0];

        const epgData = await api.getEpgByChannel(
          serverCode,
          username,
          password,
          channel.stream_id.toString(),
          dateStr
        );

        if (!epgData?.epg_listings?.length) {
          setPrograms([]);
          return;
        }

        const now = new Date();
        const mapped = epgData.epg_listings.map((item: any) => {
          const startTime = new Date(Number(item.start_timestamp) * 1000);
          const endTime = new Date(Number(item.stop_timestamp) * 1000);
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return null;

          const isLive = selectedDay === 0 && now >= startTime && now < endTime;
          const progress = isLive
            ? ((now.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100
            : undefined;

          return {
            id: item.id ?? `${channel.stream_id}-${startTime.getTime()}`,
            title: item.title,
            description: item.description ?? '',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            category: '',
            duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
            isLive,
            progress,
          };
        }).filter(Boolean);

        setPrograms(mapped as any);
      } catch (err) {
        console.error('Erro ao buscar EPG:', err);
        setPrograms([]);
      }
    };
    fetchEpg();
  }, [channel, selectedDay, setPrograms, reset]);

  const dayOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { value: i, label, date };
    });
  }, []);

  const filteredPrograms = useMemo(() => {
    if (selectedDay === 0) return programs.filter(p => new Date(p.endTime) > currentTime);
    return programs;
  }, [programs, currentTime, selectedDay]);

  if (!channel) {
    return (
      <div className={`flex flex-col items-center justify-center text-neutral-400 ${className}`}>
        <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
        <p className="text-[3vh]">Selecione um canal</p>
      </div>
    );
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className={`relative ${className}`}>

        {isFullscreen && channel && (
          <FullScreenPlayer
            channel={channel}
            videoRef={videoRef}
            isLoading={isLoading}
            error={error}
            onClose={closeFullscreen}
          />
        )}

        <div className={isFullscreen ? 'invisible' : 'visible'}>
          <div className="flex justify-center mb-[2vw]">
            <ChannelPreview
              ref={videoRef}
              channel={channel}
              isLoading={isLoading}
              error={error} 
              onEnterPress={() => openFullscreen(channel, { source: 'preview' })}
            />
          </div>

          <div className="flex justify-center mb-[2vw]">
            <DaySelector
              options={dayOptions}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>

          <div className="flex flex-col pl-[2vw] overflow-hidden">
            <Epg filteredPrograms={filteredPrograms} />
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
