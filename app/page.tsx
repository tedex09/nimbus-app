'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Tv, Film, User, Settings, List, Wifi, WifiOff, Calendar } from 'lucide-react';

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
  const { session, layout, initializeApp, loadLayout, getExpirationDate } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

  useEffect(() => { initializeApp(); }, [initializeApp]);

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (session.serverCode && !layout) { loadLayout(session.serverCode); }
  }, [session, layout, router, loadLayout]);

  useEffect(() => { return () => { const { stopDeviceCodePolling } = useAppStore.getState(); stopDeviceCodePolling(); }; }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      init({ debug: false, visualDebug: false });
      setTimeout(() => setFocus('menu-item-0'), 100);
    }
  }, [layout]);

  const handleNavigation = useCallback((path: string) => { router.push(path); }, [router]);
  const handleKeyDown = useCallback((event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter') { event.preventDefault(); handleNavigation(path); }
  }, [handleNavigation]);

  if (!session) {
    return (
      <div className="w-[100vw] h-[100vh] flex items-center justify-center bg-black">
        <motion.div className="text-[5vh] text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  const primaryColor = layout?.colors?.primary || '#ff2d55';
  const secondaryColor = layout?.colors?.secondary || '#5ac8fa';
  const backgroundColor = layout?.colors?.background || '#0f0e1a';
  const backgroundImage = layout?.backgroundImageUrl;
  const logoUrl = layout?.logoUrl;
  const serverName = layout?.serverName || 'Nimbus';
  const expirationDate = getExpirationDate();

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
    }
  ];

  const backgroundStyle = backgroundImage
    ? { background: `linear-gradient(rgba(15,14,26,0.7), rgba(15,14,26,0.7)), url(${backgroundImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : { backgroundColor, background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)` };

  return (
    <motion.div className="w-[100vw] h-[100vh] relative overflow-hidden" style={backgroundStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />

      {/* Header */}
      <motion.header
        className="relative z-10 flex justify-between items-center p-[2vh_4vw]"
        initial={{ y: -5 + 'vh', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Logo ou Nome do Servidor */}
        <div className="flex items-center space-x-[2vw]">
          <AnimatePresence>
            {logoUrl ? (
              <motion.img
                src={logoUrl}
                alt="Logo"
                className="h-[8vh] w-auto"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            ) : (
              <motion.h1
                className="text-[5vh] font-bold text-white drop-shadow-2xl"
                initial={{ x: -5 + 'vw', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {serverName}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Relógio + Botões */}
        <motion.div
          className="flex items-center gap-[1.2vw] bg-black/30 rounded-[3vw] py-[0.5vw] px-[2vw]"
          initial={{ x: 5 + 'vw', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-[3.5vh] font-bold text-white/50 drop-shadow-lg">
            {currentTime}
          </div>

          {/* Botão Configurações */}
          <div className="flex flex-row gap-[0.5vw] -mr-[1.4vw]">
            <button
              className="w-[6vh] h-[6vh] flex items-center justify-center rounded-full bg-white/30 hover:bg-white shadow-lg hover:scale-105 transition-transform"
              onClick={() => handleNavigation('/settings')}
            >
              <Settings className="w-[3vh] h-[3vh] text-black" />
            </button>

            {/* Botão Usuário */}
            <button
              className="w-[6vh] h-[6vh] flex items-center justify-center rounded-full bg-white/30 hover:bg-white shadow-lg hover:scale-105 transition-transform"
              onClick={() => handleNavigation('/profile')}
            >
              <User className="w-[3vh] h-[3vh] text-black" />
            </button>
          </div>
        </motion.div>
      </motion.header>


      {/* Menu horizontal centralizado */}
      <main className="absolute top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] w-[90vw] flex justify-center">
        <div className="flex gap-[2vw]">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isFocused = focusedItem === item.focusKey;
            return (
              <motion.div
                key={item.id}
                data-focus-key={item.focusKey}
                className={`
                  relative
                  w-[18vw] h-[12vw] rounded-[3vw] flex flex-col items-center justify-center
                  text-white font-bold text-[4vw] transition-all duration-300
                  focus:outline-none overflow-hidden
                  ${isFocused ? 'scale-[1.05] shadow-2xl' : 'shadow-lg'}
                `}
                style={{
                  background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: isFocused
                    ? '0 1vh 2vh rgba(0,0,0,0.6), inset 0 0.4vh 0.8vh rgba(255,255,255,0.15)'
                    : '0 0.5vh 1vh rgba(0,0,0,0.5), inset 0 0.3vh 0.6vh rgba(255,255,255,0.1)',
                }}
                tabIndex={0}
                onClick={() => handleNavigation(item.path)}
                onKeyDown={(e) => handleKeyDown(e, item.path)}
                onFocus={() => setFocusedItem(item.focusKey)}
                onBlur={() => setFocusedItem(null)}
              >
                {/* Overlay gradiente estilo Apple */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.15) 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />

                {/* Conteúdo */}
                <IconComponent className="w-[4vw] h-[4vw] mb-[1vh] drop-shadow-lg" />
                {/* {item.title} */}
              </motion.div>

            );
          })}
        </div>
      </main>

      {/* Footer / Vencimento */}
      {expirationDate && (
        <div className="absolute bottom-[2vh] left-[2vw] text-[2.5vh] text-yellow-400 flex items-center gap-[0.5vw] z-20">
          <Calendar className="w-[2.5vh] h-[2.5vh]" />
          Vencimento:  {expirationDate}
        </div>
      )}
    </motion.div>
  );
}
