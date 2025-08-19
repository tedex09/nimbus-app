'use client';

import './globals.css';
import { useEffect } from 'react';
import { SpatialNavigationProvider } from '@/components/SpatialNavigationProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
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
          <div className="min-h-screen bg-[#0f0e1a] text-white">
            {children}
          </div>
        </SpatialNavigationProvider>
      </body>
    </html>
  );
}
