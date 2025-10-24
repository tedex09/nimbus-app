'use client';

import { create } from 'zustand';
import { persistentStorage } from '@/lib/storage';

type FavoriteType = 'channels' | 'movies' | 'series';

export interface StoredChannel {
  stream_id: number;
  name: string;
  stream_icon?: string;
}

interface FavoritesData {
  channels: StoredChannel[];
  movies: any[];
  series: any[];
}

interface FavoritesState {
  favorites: {
    [key: string]: FavoritesData; // key = serverCode:username
  };

  // Salva snapshot mínimo do canal
  toggleFavorite: (
    type: FavoriteType,
    serverCode: string,
    username: string,
    channel: StoredChannel
  ) => Promise<void>;

  isFavorite: (
    type: FavoriteType,
    serverCode: string,
    username: string,
    id: number
  ) => boolean;

  loadFavorites: () => Promise<void>;
  clearFavorites: (serverCode: string, username: string) => Promise<void>;

  // Retorna a lista de canais FAVORITOS (snapshot salvo)
  getFavoriteChannels: (serverCode: string, username: string) => StoredChannel[];
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: {},

  toggleFavorite: async (type, serverCode, username, channel) => {
    const key = `${serverCode}:${username}`;

    const current: FavoritesData =
      get().favorites[key] || { channels: [], movies: [], series: [] };

    const exists = current[type].some((c) => c.stream_id === channel.stream_id);
    const updatedList = exists
      ? current[type].filter((c) => c.stream_id !== channel.stream_id)
      : [...current[type], { stream_id: channel.stream_id, name: channel.name, stream_icon: channel.stream_icon }];

    const updatedData: FavoritesData = {
      ...current,
      [type]: updatedList,
    };

    const updatedFavorites = {
      ...get().favorites,
      [key]: updatedData,
    };

    set({ favorites: updatedFavorites });

    // Persistência (somente no client)
    try {
      if (typeof window !== 'undefined') {
        await persistentStorage.setItem('nimbus.favorites', JSON.stringify(updatedFavorites));
      }
    } catch (err) {
      console.error('Erro ao salvar favoritos:', err);
    }
  },

  isFavorite: (type, serverCode, username, id) => {
    const key = `${serverCode}:${username}`;
    const current: FavoritesData =
      get().favorites[key] || { channels: [], movies: [], series: [] };
    return current[type].some((c) => c.stream_id === id);
  },

  loadFavorites: async () => {
    // evita SSR (pode haver fallback a localStorage)
    if (typeof window === 'undefined') return;
    try {
      const data = await persistentStorage.getItem('nimbus.favorites');
      if (data) {
        set({ favorites: JSON.parse(data) });
      }
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
    }
  },

  clearFavorites: async (serverCode, username) => {
    const key = `${serverCode}:${username}`;
    const updated = { ...get().favorites };
    delete updated[key];

    set({ favorites: updated });

    try {
      if (typeof window !== 'undefined') {
        await persistentStorage.setItem('nimbus.favorites', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Erro ao limpar favoritos:', err);
    }
  },

  getFavoriteChannels: (serverCode, username) => {
    const key = `${serverCode}:${username}`;
    const current = get().favorites[key];
    if (!current) return [];
    return current.channels;
  },
}));
