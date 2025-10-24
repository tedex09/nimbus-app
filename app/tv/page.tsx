'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { api, Channel } from '@/lib/api';
import { useFavoritesStore, StoredChannel } from '@/stores/useFavoritesStore';
import { CategoryMenu } from '@/components/category/CategoryMenu';
import { ChannelMenu } from '@/components/channel/ChannelMenu';
import { ChannelDetail } from '@/components/channel/ChannelDetail';
import { Tv } from 'lucide-react';
import { backHandlerManager } from '@/lib/backHandler';

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export default function TVPage() {
  const router = useRouter();
  const { session, layout, initializeApp } = useAppStore();
  const {
    selectedChannel,
    currentCategoryId,
    setCurrentCategory,
    resetForCategoryChange,
    setSelectedChannel,
    openFullscreen,
  } = useFocusStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lista mostrada no ChannelMenu
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'categories' | 'channels'>('categories');
  const [isInitialized, setIsInitialized] = useState(false);

  const favoritesStore = useFavoritesStore();

  // Carrega favoritos do storage (somente client)
  useEffect(() => {
    favoritesStore.loadFavorites();
  }, [favoritesStore]);

  // Inicialização
  useEffect(() => {
    initializeApp().then(() => setIsInitialized(true));
  }, [initializeApp]);

  // Fetch categorias normais
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

  // Converte StoredChannel -> Channel *parcial* (suficiente para listar)
  const mapStoredToPartialChannel = useCallback((sc: StoredChannel): Channel => {
    return {
      // campos usados na lista/ChannelItem
      stream_id: sc.stream_id,
      name: sc.name,
      stream_icon: sc.stream_icon || '',

      // preenchimentos mínimos para bater com o tipo Channel
      num: 0,
      stream_type: 'live',
      url: '', // importante: vazio -> quando selecionar, vamos buscar o canal completo
      epg_channel_id: '',
      added: '',
      category_id: 'favorites',
    } as unknown as Channel;
  }, []);

  // Fetch canais de uma categoria normal
  const fetchChannels = useCallback(
    async (category: Category) => {
      if (!session) {
        setChannelsError('Sessão inválida');
        return;
      }

      try {
        setChannelsLoading(true);
        setChannelsError(null);

        resetForCategoryChange();

        const { serverCode, username, password } = session;
        const data = await api.getChannels(
          serverCode,
          username,
          password,
          category.category_id,
          'm3u'
        );

        setChannels(data);
        setCurrentCategory(category.category_id, category.category_name);
        setCategoryName(category.category_name);
        setViewMode('channels');
      } catch (err) {
        setChannelsError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setChannelsLoading(false);
      }
    },
    [session, setCurrentCategory, resetForCategoryChange]
  );

  // Seleção de categoria (inclui favoritos)
  const handleCategorySelect = useCallback(
    async (categoryId: string, categoryName: string) => {
      if (!session) return;

      // Categoria de favoritos: NÃO chama API para listar — usa snapshot salvo
      if (categoryId === 'favorites') {
        resetForCategoryChange();
        const favSnapshots = favoritesStore.getFavoriteChannels(session.serverCode, session.username);
        const favPartials = favSnapshots.map(mapStoredToPartialChannel);

        setChannels(favPartials);
        setCurrentCategory(categoryId, categoryName);
        setCategoryName(categoryName);
        setViewMode('channels');
        return;
      }

      // Categoria normal
      const category = categories.find((cat) => cat.category_id === categoryId);
      if (category) {
        fetchChannels(category);
      }
    },
    [categories, fetchChannels, session, favoritesStore, resetForCategoryChange, setCurrentCategory, mapStoredToPartialChannel]
  );

  // Voltar para categorias
  const handleBackToCategories = useCallback(() => {
    setViewMode('categories');
    setChannels([]);
    setChannelsError(null);
    resetForCategoryChange();
  }, [resetForCategoryChange]);

  // BackHandler
  useEffect(() => {
    const removeHandler = backHandlerManager.addHandler(() => {
      if (viewMode === 'channels') {
        handleBackToCategories();
      }
      return true;
    });
    return () => removeHandler();
  }, [viewMode, handleBackToCategories]);

  // 🔁 Reage a mudanças nos favoritos quando a categoria atual for "favorites"
  useEffect(() => {
    if (session && currentCategoryId === 'favorites') {
      const favSnapshots = favoritesStore.getFavoriteChannels(session.serverCode, session.username);
      const favPartials = favSnapshots.map(mapStoredToPartialChannel);
      setChannels(favPartials);
    }
  }, [favoritesStore.favorites, session, currentCategoryId, mapStoredToPartialChannel]);

  // =========================
  // Abrir canal favorito (snapshot) -> resolve canal completo antes de abrir
  // =========================
  const resolveAndOpenChannel = useCallback(
    async (partial: Channel, openFull: boolean) => {
      if (!session) return;

      // Se já tiver URL, segue fluxo normal
      if (partial.url) {
        setSelectedChannel(partial);
        if (openFull) openFullscreen(partial, { source: 'item', focusKey: `channel-item-${partial.stream_id}` });
        return;
      }

      // Buscar lista "0" e resolver por id (é uma chamada pontual, só no momento de abrir)
      try {
        const { serverCode, username, password } = session;
        const all = await api.getChannels(serverCode, username, password, '0', 'm3u');
        const full = all.find((c) => c.stream_id === partial.stream_id);
        if (full) {
          setSelectedChannel(full);
          if (openFull) openFullscreen(full, { source: 'item', focusKey: `channel-item-${full.stream_id}` });
        } else {
          // fallback: ainda assim seleciona o parcial (não tocará)
          setSelectedChannel(partial);
        }
      } catch (e) {
        console.error('Falha ao resolver canal favorito:', e);
        setSelectedChannel(partial);
      }
    },
    [session, setSelectedChannel, openFullscreen]
  );

  // Passa um handler opcional para ChannelMenu/ChannelItem via contexto? — simples:
  // Vamos monkey-patch temporariamente no window para evitar mexer na assinatura dos componentes.
  // (Opcional; se preferir, pode ignorar — o ChannelItem abaixo já trata localmente quando url está vazia.)
  // @ts-ignore
  if (typeof window !== 'undefined') window.__resolveAndOpenChannel = resolveAndOpenChannel;

  if (!isInitialized) return <p>Carregando app...</p>;
  if (!session) return <p>Redirecionando...</p>;

  const backgroundStyle = layout?.backgroundImageUrl
    ? {
        backgroundImage: `url(${layout.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {
        backgroundColor: layout?.colors?.background || '#000000',
      };

  return (
    <motion.div className="w-screen h-screen overflow-hidden flex" style={backgroundStyle}>
      <div className="w-[32vw] mt-[1vw] flex-shrink-0">
        {viewMode === 'categories' ? (
          <CategoryMenu
            categories={categories}
            loading={loading}
            error={error}
            onRetry={fetchCategories}
            onSelect={handleCategorySelect}
            className="ml-[2vw] mt-[1vw] w-[30vw]"
          />
        ) : (
          <ChannelMenu
            channels={channels}
            loading={channelsLoading}
            error={channelsError}
            categoryName={categoryName || 'Categoria'}
            onBack={handleBackToCategories}
            className="ml-[2vw] mt-[1vw] w-[30vw]"
          />
        )}
      </div>

      <div className="flex-1 h-full overflow-hidden pt-[2vw]">
        {viewMode === 'channels' && session ? (
          <ChannelDetail
            channel={selectedChannel}
            serverCode={session.serverCode}
            username={session.username}
            password={session.password}
            className="h-full w-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-400 h-full">
            <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
            <p className="text-[3vh]">Selecione uma categoria</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
