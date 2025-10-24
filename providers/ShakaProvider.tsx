'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
//@ts-ignore
import shaka from 'shaka-player';

type ShakaContextValue = {
  shaka: typeof shaka;
  createPlayerInstance: () => shaka.Player;
};

const ShakaContext = createContext<ShakaContextValue | null>(null);

export const ShakaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (!shaka || !shaka.Player) {
      console.error('Shaka Player não carregado.');
      return;
    }
    // instala polyfills (safe)
    try {
      shaka.polyfill.installAll();
      console.log('✅ Shaka polyfills instalados (v4.16.6 compat).');
    } catch (err) {
      console.warn('Falha ao instalar Shaka polyfills:', err);
    }
  }, []);

  const value = useMemo(() => {
    return {
      shaka,
      createPlayerInstance: () => new shaka.Player(),
    };
  }, []);

  return <ShakaContext.Provider value={value}>{children}</ShakaContext.Provider>;
};

export const useShakaContext = () => {
  const ctx = useContext(ShakaContext);
  if (!ctx) throw new Error('useShakaContext must be used inside ShakaProvider');
  return ctx;
};
