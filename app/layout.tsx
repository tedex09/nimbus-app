'use client';

import './globals.css';
import { useEffect } from 'react';
import { SpatialNavigationProvider } from '@/components/SpatialNavigationProvider';
import { ShakaProvider } from '@/providers/ShakaProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register Service Worker
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch(err => console.error('Erro ao registrar SW', err));
    }
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nimbus</title>
        <meta name="description" content="" />
        <link
          href="https://fonts.cdnfonts.com/css/sf-pro-display"
          rel="stylesheet"
        />
      </head>
      <body>
        <SpatialNavigationProvider>
          <ShakaProvider>
            <div className="min-h-screen bg-[#0f0e1a] text-white">
              {children}
            </div>
          </ShakaProvider>
        </SpatialNavigationProvider>
      </body>
    </html>
  );
}
