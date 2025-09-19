'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { api, Channel } from '@/lib/api';
import { CategoryMenu } from '@/components/ui/CategoryMenu';
import { ChannelList } from '@/components/ui/ChannelList';
import { ChannelDetail } from '@/components/ui/ChannelDetail';
import { Tv } from 'lucide-react';

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export default function TVPage() {
  const router = useRouter();
  const { session, layout, initializeApp } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'channels'>('categories');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp().then(() => setIsInitialized(true));
  }, [initializeApp]);

  const fetchCategories = useCallback(async () => {
    if (!session) {
      setError('Sessão inválida');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { serverCode, username, password } = session;
      const data = await api.getCategories(serverCode, username, password);
      if (Array.isArray(data)) setCategories(data);
      else throw new Error('Formato de resposta inválido');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [session, router, fetchCategories, isInitialized]);

  const fetchChannels = useCallback(async (category: Category) => {
    if (!session) {
      setChannelsError('Sessão inválida');
      return;
    }

    try {
      setChannelsLoading(true);
      setChannelsError(null);
      const { serverCode, username, password } = session;
      const data = await api.getChannels(serverCode, username, password, category.category_id);
      setChannels(data);
      setSelectedCategory(category);
      setViewMode('channels');
    } catch (err) {
      setChannelsError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setChannelsLoading(false);
    }
  }, [session]);

  const handleCategorySelect = useCallback((categoryId: string, categoryName: string) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    if (category) {
      fetchChannels(category);
    }
  }, [categories, fetchChannels]);

  const handleBackToCategories = useCallback(() => {
    setViewMode('categories');
    setSelectedCategory(null);
    setChannels([]);
    setChannelsError(null);
  }, []);

  const handleChannelSelect = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
  }, []);

  if (!isInitialized) return <p>Carregando app...</p>;
  if (!session) return <p>Redirecionando...</p>;

  // Configurar background dinâmico baseado no layout
  const backgroundStyle = layout?.backgroundImageUrl
    ? {
        backgroundImage: `url(${layout.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }
    : {
        backgroundColor: layout?.colors?.background || '#000000'
      };

  return (
    <FocusContext.Provider value="">
      <motion.div 
        className="w-screen h-screen overflow-hidden flex"
        style={backgroundStyle}
      >
        {viewMode === 'categories' ? (
          <CategoryMenu
            categories={categories}
            loading={loading}
            error={error}
            onRetry={fetchCategories}
            selectedCategory={selectedCategory?.category_id || null}
            onSelect={handleCategorySelect}
            className="ml-[2vw] mt-[1vw] w-[30vw]"
          />
        ) : (
          <ChannelList
            channels={channels}
            loading={channelsLoading}
            error={channelsError}
            categoryName={selectedCategory?.category_name || 'Categoria'}
            onBack={handleBackToCategories}
            onChannelSelect={handleChannelSelect}
            className="ml-[2vw] mt-[1vw] w-[30vw]"
          />
        )}

        {/* Área principal - Detalhes do Canal */}
        <div className="flex-1 p-[2vw]">
          {viewMode === 'channels' && session ? (
            <ChannelDetail
              channel={selectedChannel}
              serverCode={session.serverCode}
              username={session.username}
              password={session.password}
              className="h-full"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-full">
              <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
              <p className="text-[3vh]">Selecione uma categoria</p>
            </div>
          )}
        </div>
      </motion.div>
    </FocusContext.Provider>
  );
}