'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { Channel } from '@/lib/api';
import { backHandlerManager } from '@/lib/backHandler';
import { PlayerOverlay } from './PlayerOverlay';
import { PlayerLoading } from './PlayerLoading';
import { useEpgStore } from '@/stores/useEpgStore';
import { PlayerError } from './PlayerError';

interface FullScreenPlayerProps {
  channel: Channel;
  videoRef: React.RefObject<HTMLVideoElement>;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function FullScreenPlayer({
  channel,
  videoRef,
  onClose,
  isLoading = false,
  error
}: FullScreenPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalParentRef = useRef<HTMLElement | null>(null);
  const originalStylesRef = useRef({ className: '', style: '' });
  const [showInfo, setShowInfo] = useState(true);
  const { currentProgram } = useEpgStore();

  // foco isolado
  const { ref, focusKey, focusSelf } = useFocusable({
    isFocusBoundary: true,
    trackChildren: true,
    focusable: true,
  });

  // garante foco inicial
  useEffect(() => {
    focusSelf({ skipRestoreFocus: true });
  }, [focusSelf]);

  // move vídeo pro container de fullscreen
  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) return;

    originalParentRef.current = videoEl.parentElement;
    originalStylesRef.current = {
      className: videoEl.className,
      style: videoEl.style.cssText,
    };

    containerEl.appendChild(videoEl);

    // força preencher tela sem bordas pretas
    videoEl.className = 'w-full h-full object-fill transition-all duration-300';
    videoEl.style.cssText = `
      display: block;
      object-position: center center;
      background-color: black;
    `;

    const unmuteVideo = async () => {
      try {
        if (videoEl.muted) videoEl.muted = false;
        await videoEl.play();
      } catch {
        console.warn('Autoplay bloqueado. Usuário precisa interagir.');
      }
    };
    unmuteVideo();

    return () => {
      const originalParent = originalParentRef.current;
      if (originalParent && !originalParent.contains(videoEl)) {
        originalParent.appendChild(videoEl);
      }
      videoEl.className = originalStylesRef.current.className;
      videoEl.style.cssText = originalStylesRef.current.style;
      videoEl.muted = true;
    };
  }, [videoRef]);

  // controle de overlay -> aparece em qualquer tecla
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetOverlay = () => {
      setShowInfo(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowInfo(false), 5000);
    };

    window.addEventListener('keydown', resetOverlay);
    resetOverlay();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', resetOverlay);
    };
  }, []);

  // back handler
  useEffect(() => {
    const removeHandler = backHandlerManager.addHandler(() => onClose());
    return () => removeHandler();
  }, [onClose]);

  return (
    <FocusContext.Provider value={focusKey}>
      <motion.div
        ref={ref}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* vídeo */}
        <div
          ref={containerRef}
          className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden"
        />

        {/* overlay (mostra canal + programa) */}
        <PlayerOverlay channel={channel} currentProgram={currentProgram} show={showInfo} />

        {/* loading (quando bufferizando) */}
        {isLoading && <PlayerLoading />}

        {error && <PlayerError message={error} />}
      </motion.div>
    </FocusContext.Provider>
  );
}
