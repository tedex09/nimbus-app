'use client';

import { useEffect } from 'react';
import { init } from '@noriginmedia/norigin-spatial-navigation';

interface SpatialNavigationProviderProps {
  children: React.ReactNode;
}

export function SpatialNavigationProvider({ children }: SpatialNavigationProviderProps) {
  useEffect(() => {
    init({
      debug: false,
      visualDebug: true,
      throttle: 0,
    });
  }, []);

  return <>{children}</>;
}
