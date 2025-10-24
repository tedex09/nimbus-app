'use client';

import { useEffect, useRef, useState } from 'react';
//@ts-ignore
import type shakaType from 'shaka-player';
import { useShakaContext } from '@/providers/ShakaProvider';

type PlayerType = 'live' | 'vod';

interface UseShakaPlayerReturn {
  isLoading: boolean;
  error: string | null;
  load: (url?: string, type?: PlayerType) => Promise<void>;
  unload: () => Promise<void>;
}

export function useShakaPlayer(
  videoRef: React.RefObject<HTMLVideoElement>,
  initialUrl?: string,
  initialType: PlayerType = 'live'
): UseShakaPlayerReturn {
  const { createPlayerInstance } = useShakaContext();
  const playerRef = useRef<shakaType.Player | null>(null);
  const loadTokenRef = useRef(0);

  const [isLoading, setIsLoading] = useState<boolean>(!!initialUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      loadTokenRef.current++;
      if (playerRef.current) {
        playerRef.current.destroy().catch(() => {});
        playerRef.current = null;
      }
    };
  }, []);

  const configureFor = (player: shakaType.Player, type: PlayerType) => {
    const isLive = type === 'live';
    player.configure({
      streaming: {
        lowLatencyMode: !!isLive,
        bufferingGoal: isLive ? 4 : 20,
        rebufferingGoal: isLive ? 2 : 4,
        bufferBehind: isLive ? 10 : 30,
        retryParameters: { maxAttempts: 2, timeout: 8000 },
        startAtSegmentBoundary: true,
        stallThreshold: 1,
      },
      manifest: {
        retryParameters: { maxAttempts: 2, timeout: 8000 },
        dash: { ignoreMinBufferTime: true },
      },
      abr: {
        enabled: true,
        switchInterval: 2,
        defaultBandwidthEstimate: 5_000_000,
      },
      drm: { retryParameters: { maxAttempts: 2, timeout: 8000 } },
    });
  };

  const attachListeners = (player: shakaType.Player, token: number, url: string, type: PlayerType) => {
    const onError = (evt: any) => {
      if (token !== loadTokenRef.current) return;
      const detail = evt?.detail ?? evt;
      console.error('Shaka error:', detail);
      setError(detail?.message || 'Erro no player');
      // tenta recarregar se for live
      if (type === 'live') {
        console.log('Tentando recarregar stream após erro...');
        load(url, type).catch(() => {});
      }
    };

    const onBuffering = (evt: any) => {
      if (token !== loadTokenRef.current) return;
      setIsLoading(evt.buffering === true);
    };

    player.addEventListener('error', onError as any);
    player.addEventListener('buffering', onBuffering as any);

    return () => {
      player.removeEventListener('error', onError as any);
      player.removeEventListener('buffering', onBuffering as any);
    };
  };

  const load = async (url?: string, type: PlayerType = initialType) => {
    const video = videoRef.current;
    if (!video || !url) return;

    const myToken = ++loadTokenRef.current;
    setIsLoading(true);
    setError(null);

    if (!playerRef.current) {
      try {
        playerRef.current = createPlayerInstance();
        await playerRef.current.attach(video);
      } catch (err) {
        console.error('Erro ao criar/attach player:', err);
        if (myToken === loadTokenRef.current) {
          setError('Falha inicializando player');
          setIsLoading(false);
        }
        return;
      }
    }

    try {
      configureFor(playerRef.current, type);
    } catch (err) {
      console.warn('configure erro:', err);
    }

    const detach = attachListeners(playerRef.current, myToken, url, type);

    try {
      await playerRef.current.load(url);
      if (myToken !== loadTokenRef.current) {
        await playerRef.current.unload().catch(() => {});
        detach();
        return;
      }

      if (type === 'live' && playerRef.current.isLive && playerRef.current.isLive()) {
        const seekRange = playerRef.current.seekRange();
        if (seekRange && typeof seekRange.end === 'number' && !Number.isNaN(seekRange.end)) {
          video.currentTime = Math.max(0, seekRange.end - 0.3);
        }
      }

      await video.play().catch(() => {});
      if (myToken === loadTokenRef.current) {
        setIsLoading(false);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar stream:', err);
      setError(`Stream indisponível`);
      setIsLoading(false);
    }
  };

  const unload = async () => {
    loadTokenRef.current++;
    setIsLoading(false);
    setError(null);
    if (playerRef.current) {
      try {
        await playerRef.current.unload();
      } catch {}
      try {
        await playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
  };

  useEffect(() => {
    if (initialUrl) {
      load(initialUrl, initialType).catch(() => {});
    }
  }, [initialUrl]);

  return { isLoading, error, load, unload };
}
