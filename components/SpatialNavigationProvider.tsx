'use client';

import { useEffect } from 'react';
import { FocusContext, init } from '@noriginmedia/norigin-spatial-navigation';

interface SpatialNavigationProviderProps {
  children: React.ReactNode;
}

export function SpatialNavigationProvider({ children }: SpatialNavigationProviderProps) {
  useEffect(() => {
    // Initialize spatial navigation
    init({
      debug: false,
      visualDebug: false,
    });
  }, []);

  return (
    <FocusContext.Provider value="">
      {children}
    </FocusContext.Provider>
  );
}