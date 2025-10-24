import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
// @ts-ignore
import shaka from 'shaka-player';
import { Channel } from '@/lib/api';

interface PlayerContextType {
  videoRef: React.RefObject<HTMLVideoElement>;
  playerRef: React.RefObject<shaka.Player>;
  currentChannel: Channel | null;
  isFullscreen: boolean;
  isLoading: boolean;
  setChannel: (channel: Channel | null) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setChannel = useCallback((channel: Channel | null) => {
    setCurrentChannel(channel);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Inicializa o Shaka Player
    const player = new shaka.Player(videoElement);
    playerRef.current = player;

    player.addEventListener('error', (event: any) => {
      console.error('Shaka Player Error:', event.detail);
      setIsLoading(false);
    });

    player.getNetworkingEngine().registerRequestFilter((type: any, request: any) => {
      if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
        // Adicionar lógica de licença DRM se necessário no futuro
      }
    });

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    const videoElement = videoRef.current;

    if (!player || !videoElement) return;

    const loadStream = async () => {
      if (currentChannel?.url) {
        setIsLoading(true);
        try {
          await player.load(currentChannel.url);
          videoElement.muted = !isFullscreen; // Mudo no preview, som em fullscreen
          await videoElement.play();
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading stream:', error);
          setIsLoading(false);
        }
      } else {
        player.unload();
      }
    };

    loadStream();
  }, [currentChannel, isFullscreen]);

  // Controla o estado de mudo ao alternar fullscreen
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isFullscreen;
    }
  }, [isFullscreen]);

  const value = {
    videoRef,
    playerRef,
    currentChannel,
    isFullscreen,
    isLoading,
    setChannel,
    setIsFullscreen,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* O elemento de vídeo agora vive fora dos componentes, gerenciado pelo Provider */}
      <video
        ref={videoRef}
        className="fixed top-[-9999px] left-[-9999px]" // Escondido fora da tela por padrão
        autoPlay
        playsInline
      />
    </PlayerContext.Provider>
  );
};
