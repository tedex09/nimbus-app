'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Tv, Film, User, Settings, List, Calendar } from 'lucide-react';

const iconMap = { tv: Tv, movie: Film, film: Film, series: Tv, live: Tv, vod: Film };

export default function HomePage() {
  const router = useRouter();
  const { session, layout, initializeApp, loadLayout, getExpirationDate, getConn } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');

  // Container principal focável
  const { ref: containerRef } = useFocusable({ focusKey: 'main-container', isFocusBoundary: true });

  // Inicializações
  useEffect(() => { initializeApp(); }, [initializeApp]);
  useEffect(() => { if (!session) router.push('/login'); else if (session.serverCode && !layout) loadLayout(session.serverCode); }, [session, layout, router, loadLayout]);
  useEffect(() => () => useAppStore.getState().stopDeviceCodePolling(), []);

  // Relógio
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = useCallback((path: string) => router.push(path), [router]);

  if (!session) return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <motion.div className="text-[5vh] text-white"
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
      >
        Carregando...
      </motion.div>
    </div>
  );

  // Cores e estilo de fundo
  const primaryColor = layout?.colors?.primary || '#ff2d55';
  const secondaryColor = layout?.colors?.secondary || '#5ac8fa';
  const backgroundColor = layout?.colors?.background || '#0f0e1a';
  const backgroundImage = layout?.backgroundImageUrl;
  const logoUrl = layout?.logoUrl;
  const serverName = layout?.serverName || 'Nimbus';
  const expirationDate = getExpirationDate();
  const maxConns = getConn();

  const backgroundStyle = backgroundImage
    ? { background: `linear-gradient(rgba(15,14,26,0.7), rgba(15,14,26,0.7)), url(${backgroundImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : { backgroundColor, background: `linear-gradient(45deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)` };

  // Menu
  const menuItems = [
    ...(layout?.menuSections?.map((section, index) => ({
      id: `menu-${section.type}-${section.id}`,
      title: section.name,
      path: `/${section.type}/${section.categoryId}`,
      focusKey: `menu-item-${index}`,
      icon: iconMap[section.icon as keyof typeof iconMap] || iconMap[section.type] || Tv,
    })) || []),
    { id: 'menu-lists', title: 'Listas', path: '/lists', focusKey: `menu-item-${layout?.menuSections?.length || 0}`, icon: List },
  ];

  return (
    <motion.div ref={containerRef} className="w-screen h-screen relative overflow-hidden" style={backgroundStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />

      {/* Header */}
      <Header logoUrl={logoUrl} serverName={serverName} currentTime={currentTime} onNavigate={handleNavigation} />

      {/* Menu */}
      <main className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] flex justify-center">
        <div className="flex gap-[2vw]">
          {menuItems.map((item, index) => (
            <MenuItem key={item.id} item={item} primaryColor={primaryColor} secondaryColor={secondaryColor} onNavigate={handleNavigation} />
          ))}
        </div>
      </main>

      {/* Footer */}
      {expirationDate && maxConns && (
        <div className="absolute bottom-[2vh] left-[2vw] text-[2.5vh] text-white/40 flex flex-col items-start z-20">
          <span>Conexões: {maxConns}</span>
          <span>Vencimento: {expirationDate}</span>
        </div>
      )}
    </motion.div>
  );
}

// Header focável
function Header({ logoUrl, serverName, currentTime, onNavigate }: { logoUrl?: string; serverName: string; currentTime: string; onNavigate: (path: string) => void }) {
  return (
    <motion.header className="relative z-10 flex justify-between items-center p-[2vh_4vw]" initial={{ y: '-5vh', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
      
      {/* Logo */}
      <div className="flex items-center space-x-[2vw]">
        <AnimatePresence>
          {logoUrl ? (
            <motion.img src={logoUrl} alt="Logo" className="h-[8vh] w-auto" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.6, delay: 0.3 }} />
          ) : (
            <motion.h1 className="text-[5vh] font-bold text-white drop-shadow-2xl" initial={{ x: '-5vw', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              {serverName}
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Relógio + Botões */}
      <div className="flex items-center gap-[1.2vw] bg-black/30 rounded-[3vw] py-[0.5vw] px-[2vw]">
        <div className="text-[3.5vh] font-bold text-white/50 drop-shadow-lg">{currentTime}</div>
        <div className="flex flex-row gap-[0.5vw] -mr-[1.4vw]">
          <FocusableButton focusKey="header-settings" onEnterPress={() => onNavigate('/settings')} icon={Settings} />
          <FocusableButton focusKey="header-user" onEnterPress={() => onNavigate('/profile')} icon={User} />
        </div>
      </div>
    </motion.header>
  );
}

// Componente botão focável genérico
function FocusableButton({ focusKey, onEnterPress, icon: Icon }: { focusKey: string; onEnterPress: () => void; icon: React.ComponentType<any> }) {
  const { ref, focused } = useFocusable({ focusKey, onEnterPress });
  return (
    <button ref={ref} className={`w-[6vh] h-[6vh] flex items-center justify-center rounded-full shadow-lg transition-transform ${focused ? 'bg-white scale-[1.05]' : 'bg-white/30'}`}>
      <Icon className="w-[3vh] h-[3vh] text-black" />
    </button>
  );
}

// Item de menu focável
function MenuItem({
  item,
  primaryColor,
  secondaryColor,
  onNavigate,
}: {
  item: { path: string; icon: React.ComponentType<any>; title: string; focusKey: string };
  primaryColor: string;
  secondaryColor: string;
  onNavigate: (path: string) => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey: item.focusKey,
    onEnterPress: () => onNavigate(item.path),
  });
  const Icon = item.icon;

  return (
    <div className="flex flex-col items-center gap-[1vw]">
      {/* Botão focável */}
      <motion.div
        ref={ref}
        className={`relative w-[18vw] h-[12vw] rounded-[3vw] flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden
          ${focused ? 'scale-[1.05] shadow-2xl border-[0.4vw] border-white' : 'shadow-lg'}
        `}
        style={{
          background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
        }}
        onClick={() => onNavigate(item.path)}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.15) 100%)',
            mixBlendMode: 'overlay',
          }}
        />
        <Icon className="w-[4vw] h-[4vw] drop-shadow-lg" />
      </motion.div>

      {/* Título abaixo do botão */}
      <span
        className={`
          text-[1.3vw] font-bold drop-shadow-md
          ${focused ? 'text-white' : 'text-white/50'}
        `}
      >
        {item.title}
      </span>
    </div>
  );
}

