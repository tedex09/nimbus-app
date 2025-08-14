'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';

export default function HomePage() {
  const router = useRouter();
  const { session, layout, initializeApp, loadLayout } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.serverCode && !layout) {
      loadLayout(session.serverCode);
    }
  }, [session, layout, router, loadLayout]);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      init({
        debug: false,
        visualDebug: false,
      });
      
      setTimeout(() => {
        setFocus('menu-item-0');
      }, 100);
    }
  }, []);

  const handleNavigation = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleNavigation(path);
    }
  }, [handleNavigation]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Redirecionando...</div>
      </div>
    );
  }

  // Apply theme from layout
  const primaryColor = layout?.colors?.primary || '#3b82f6';
  const secondaryColor = layout?.colors?.secondary || '#64748b';
  const background = layout?.backgroundImageUrl ? layout.backgroundImageUrl : layout?.colors.background;
  const logoUrl = layout?.logoUrl;
  const serverName = layout?.serverName;

  // Prepare menu items
  const menuItems = [
    ...(layout?.menuSections?.map((section, index) => ({
      id: `menu-${section.type}`,
      title: section.name,
      path: `/${section.type}`,
      focusKey: `menu-item-${index}`,
    })) || []),
    {
      id: 'menu-lists',
      title: 'Listas',
      path: '/lists',
      focusKey: `menu-item-${(layout?.menuSections?.length || 0)}`,
    },
    {
      id: 'menu-settings',
      title: 'Configurações',
      path: '/settings',
      focusKey: `menu-item-${(layout?.menuSections?.length || 0) + 1}`,
    },
  ];

  const backgroundStyle = layout?.backgroundImageUrl
  ? {
      background: `linear-gradient(rgba(15, 14, 26, 0.8), rgba(15, 14, 26, 0.8)), url(${layout.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  : {
      backgroundColor: layout?.colors?.background || '#000000',
    };

  return (
    <div 
      className="min-h-screen relative"
      style={backgroundStyle}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-8">
        <div className="flex items-center space-x-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-16 w-auto" />
          )}
          <h1 className="text-6xl font-bold" style={{ color: secondaryColor }}>
            {layout?.serverName}
          </h1>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-medium mb-2">{currentTime}</div>
          <div className={`text-lg ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? 'Servidor online' : 'Servidor offline'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {menuItems.map((item) => (
            <div
              key={item.id}
              data-focus-key={item.focusKey}
              className="w-64 h-56 rounded-2xl p-6 cursor-pointer transition-all duration-200
                       border-4 border-transparent
                       focus:border-white focus:outline-none focus:scale-105
                       hover:scale-105"
              style={{ backgroundColor: secondaryColor }}
              tabIndex={0}
              onClick={() => handleNavigation(item.path)}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
            >
              <div className="h-full flex flex-col items-center justify-center text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {item.title}
                </h3>
                <div className="w-full h-1 bg-white/20 rounded-full">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ backgroundColor: primaryColor, width: '0%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center">
        <div className="text-gray-400 text-lg">
          {layout?.serverName} v1.0.0 • Smart TV Application
        </div>
      </footer>
    </div>
  );
}