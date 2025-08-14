'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
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
        <title>ASSIST+</title>
        <meta name="description" content="Smart TV Application" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-[#0f0e1a] text-white">
          {children}
        </div>
      </body>
    </html>
  );
}