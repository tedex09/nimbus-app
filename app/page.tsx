'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Tv, Film, Clock, Settings, List, Wifi, WifiOff, Calendar } from 'lucide-react';

const iconMap = {
  tv: Tv,
  movie: Film,
  film: Film,
  series: Tv,
  live: Tv,
  vod: Film,
};

export default function HomePage() {
  const router = useRouter();
  const { session, layout, userInfo, initializeApp, loadLayout, getExpirationDate } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      const { stopDeviceCodePolling } = useAppStore.getState();
      stopDeviceCodePolling();
    };
  }, []);

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
    if (typeof window !== 'undefined') {
      init({
        debug: false,
        visualDebug: false,
      });
      
      setTimeout(() => {
        setFocus('menu-item-0');
      }, 100);
    }
  }, [layout]);

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
        <motion.div 
          className="text-4xl text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  // Apply theme from layout
  const primaryColor = layout?.colors?.primary || '#3b82f6';
  const secondaryColor = layout?.colors?.secondary || '#64748b';
  const backgroundColor = layout?.colors?.background || '#0f0e1a';
  const backgroundImage = layout?.backgroundImageUrl;
  const logoUrl = layout?.logoUrl;
  const serverName = layout?.serverName || 'Nimbus';
  const expirationDate = getExpirationDate();

  // Prepare menu items
  const menuItems = [
    ...(layout?.menuSections?.map((section, index) => ({
      id: `menu-${section.type}-${section.id}`,
      title: section.name,
      path: `/${section.type}/${section.categoryId}`,
      focusKey: `menu-item-${index}`,
      icon: iconMap[section.icon as keyof typeof iconMap] || iconMap[section.type] || Tv,
      type: section.type,
    })) || []),
    {
      id: 'menu-lists',
      title: 'Listas',
      path: '/lists',
      focusKey: `menu-item-${(layout?.menuSections?.length || 0)}`,
      icon: List,
      type: 'lists',
    },
    {
      id: 'menu-settings',
      title: 'Configurações',
      path: '/settings',
      focusKey: `menu-item-${(layout?.menuSections?.length || 0) + 1}`,
      icon: Settings,
      type: 'settings',
    },
  ];

  const backgroundStyle = backgroundImage
    ? {
        background: `linear-gradient(rgba(15, 14, 26, 0.7), rgba(15, 14, 26, 0.7)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {
        backgroundColor: backgroundColor,
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`,
      };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      style={backgroundStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
      
      {/* Header */}
      <motion.header 
        className="relative z-10 flex justify-between items-center p-12"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center space-x-6">
          <AnimatePresence>
            {logoUrl ? (
              <motion.img 
                src={logoUrl} 
                alt="Logo" 
                className="h-20 w-auto"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            ) : (
              <motion.h1 
                className="text-7xl font-bold text-white drop-shadow-2xl"
                style={{ color: 'white' }}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {serverName}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div 
          className="text-right"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
            {currentTime}
          </div>
          {expirationDate && (
            <motion.div 
              className="text-lg flex items-center gap-2 text-yellow-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Calendar className="w-5 h-5" />
              Vencimento: {expirationDate}
            </motion.div>
          )}
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 px-12 pb-12">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-7xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isFocused = focusedItem === item.focusKey;
            
            return (
              <motion.div
                key={item.id}
                data-focus-key={item.focusKey}
                className={`
                  w-[16vw] h-[14vw] rounded-[1vw] p-[4vw]
                  transition-all duration-300
                  focus:outline-none
                  backdrop-blur-sm relative overflow-hidden
                  ${isFocused ? 'border-white shadow-2xl shadow-white/30' : ''}
                `}
                style={{ 
                  backgroundColor: `${secondaryColor}cc`,
                  backdropFilter: 'blur(10px)',
                }}
                tabIndex={0}
                onClick={() => handleNavigation(item.path)}
                onKeyDown={(e) => handleKeyDown(e, item.path)}
                onFocus={() => setFocusedItem(item.focusKey)}
                onBlur={() => setFocusedItem(null)}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileFocus={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                {/* Background gradient overlay */}
                <div 
                  className="absolute inset-0 rounded-[1vw] opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="mb-6"
                    animate={isFocused ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.6, repeat: isFocused ? Infinity : 0 }}
                  >
                    <IconComponent 
                      className="w-16 h-16 text-white drop-shadow-lg" 
                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                    />
                  </motion.div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                    {item.title}
                  </h3>
                  
                  {/* Progress bar animation */}
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: primaryColor }}
                      initial={{ width: '0%' }}
                      animate={{ width: isFocused ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Focus ring */}
                <AnimatePresence>
                  {isFocused && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl border-4 border-white"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="absolute bottom-0 left-0 right-0 p-8 text-center relative z-10"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="text-gray-300 text-xl backdrop-blur-sm bg-black/20 rounded-2xl p-4 inline-block">
          Nimbus • Versão: 1.0.0
        </div>
      </motion.footer>

      {/* Loading overlay */}
      <AnimatePresence>
        {!layout && session && (
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="text-2xl text-white">Carregando layout...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}