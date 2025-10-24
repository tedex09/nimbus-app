'use client';

import { useEffect } from 'react';
import { init, setKeyMap } from '@noriginmedia/norigin-spatial-navigation';

interface SpatialNavigationProviderProps {
  children: React.ReactNode;
}

export function SpatialNavigationProvider({ children }: SpatialNavigationProviderProps) {

  // Efeito para inicializar o Norigin e seu KeyMap customizado
  useEffect(() => {
    init({
      debug: false,
      visualDebug: false,
      throttle: 0,
      distanceCalculationMethod: 'center',
    });
    // A linha 'back: 196' seria ignorada aqui, por isso a removemos.
  }, []);

  // Efeito SEPARADO para cuidar do botão "Voltar"
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verifica a sua tecla '196' e outras teclas "Voltar" comuns
      const isBackButton = 
        event.keyCode === 196 ||       // Sua tecla customizada
        event.key === 'Escape' ||      // Teclado
        event.keyCode === 10009 ||     // LG webOS
        event.keyCode === 461;         // Samsung Tizen

      if (isBackButton) {
        window.history.back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Array vazio, roda apenas uma vez

  return <>{children}</>;
}