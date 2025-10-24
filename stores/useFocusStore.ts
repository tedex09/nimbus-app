import { create } from 'zustand';
import type { Channel } from '@/lib/api';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';

type FullscreenSource = 'preview' | 'item' | null;

interface FocusState {
  // Foco
  lastFocusedChannelKey: string | null;
  lastFocusedProgramKey: string | null;

  // Seleção e detalhe
  selectedChannel: Channel | null;
  isChannelDetailVisible: boolean;

  // Fullscreen
  isFullscreen: boolean;
  fullscreenSource: FullscreenSource;
  fullscreenItemKey: string | null;

  openFullscreen: (channel: Channel, opts: { source: FullscreenSource; focusKey?: string }) => void;
  closeFullscreen: () => void;

  // Categoria
  currentCategoryId: string | null;
  currentCategoryName: string | null;

  // Actions
  setLastFocusedChannelKey: (key: string) => void;
  setLastFocusedProgramKey: (key: string) => void;
  setSelectedChannel: (channel: Channel | null) => void;
  setIsChannelDetailVisible: (visible: boolean) => void;
  setCurrentCategory: (id: string, name: string) => void;

  // Reset
  resetForCategoryChange: () => void;
  resetForChannelChange: () => void;
  clearAll: () => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  // Estado inicial
  lastFocusedChannelKey: null,
  lastFocusedProgramKey: null,
  selectedChannel: null,
  isChannelDetailVisible: false,

  isFullscreen: false,
  fullscreenSource: null,
  fullscreenItemKey: null,

  currentCategoryId: null,
  currentCategoryName: null,

  // Ações foco
  setLastFocusedChannelKey: (key) => set({ lastFocusedChannelKey: key }),
  setLastFocusedProgramKey: (key) => set({ lastFocusedProgramKey: key }),

  // Seleção
  setSelectedChannel: (channel) =>
    set({
      selectedChannel: channel,
      isChannelDetailVisible: channel !== null,
    }),

  setIsChannelDetailVisible: (visible) => set({ isChannelDetailVisible: visible }),

  setCurrentCategory: (id, name) =>
    set({ currentCategoryId: id, currentCategoryName: name }),

  // Reset
  resetForCategoryChange: () =>
    set({
      lastFocusedChannelKey: null,
      lastFocusedProgramKey: null,
      selectedChannel: null,
      isChannelDetailVisible: false,
      isFullscreen: false,
      fullscreenSource: null,
      fullscreenItemKey: null,
    }),

  resetForChannelChange: () =>
    set({ lastFocusedProgramKey: null }),

  clearAll: () =>
    set({
      lastFocusedChannelKey: null,
      lastFocusedProgramKey: null,
      selectedChannel: null,
      isChannelDetailVisible: false,
      isFullscreen: false,
      fullscreenSource: null,
      fullscreenItemKey: null,
      currentCategoryId: null,
      currentCategoryName: null,
    }),

  // Fullscreen
  openFullscreen: (channel, { source, focusKey }) =>
    set({
      selectedChannel: channel,
      isChannelDetailVisible: true,
      isFullscreen: true,
      fullscreenSource: source,
      fullscreenItemKey: source === 'item' ? focusKey ?? null : null,
    }),

  closeFullscreen: () => {
    const { fullscreenSource, fullscreenItemKey } = get();

    if (fullscreenSource === 'item' && fullscreenItemKey) {
      setFocus(fullscreenItemKey);
    } else if (fullscreenSource === 'preview') {
      setFocus('channel-preview'); // 🔑 garante que preview recebe foco
    }

    set({
      isFullscreen: false,
      fullscreenSource: null,
      fullscreenItemKey: null,
    });
  },
}));
