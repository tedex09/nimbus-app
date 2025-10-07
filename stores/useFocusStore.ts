import { create } from 'zustand';
import type { Channel } from '@/lib/api';

interface FocusState {
  // Estados de foco
  lastFocusedChannelKey: string | null;
  lastFocusedProgramKey: string | null;

  // Estados de seleção e visualização
  selectedChannel: Channel | null;
  isChannelDetailVisible: boolean;

  // Estado de categoria atual
  currentCategoryId: string | null;
  currentCategoryName: string | null;

  // Ações de foco
  setLastFocusedChannelKey: (key: string) => void;
  setLastFocusedProgramKey: (key: string) => void;

  // Ações de seleção
  setSelectedChannel: (channel: Channel | null) => void;
  setIsChannelDetailVisible: (visible: boolean) => void;

  // Ações de categoria
  setCurrentCategory: (id: string, name: string) => void;

  // Reset completo ao trocar de categoria
  resetForCategoryChange: () => void;

  // Reset completo ao trocar de canal
  resetForChannelChange: () => void;

  // Reset geral
  clearAll: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  // Estados iniciais
  lastFocusedChannelKey: null,
  lastFocusedProgramKey: null,
  selectedChannel: null,
  isChannelDetailVisible: false,
  currentCategoryId: null,
  currentCategoryName: null,

  // Ações de foco
  setLastFocusedChannelKey: (key: string) =>
    set({ lastFocusedChannelKey: key }),

  setLastFocusedProgramKey: (key: string) =>
    set({ lastFocusedProgramKey: key }),

  // Ações de seleção
  setSelectedChannel: (channel: Channel | null) =>
    set({
      selectedChannel: channel,
      isChannelDetailVisible: channel !== null,
    }),

  setIsChannelDetailVisible: (visible: boolean) =>
    set({ isChannelDetailVisible: visible }),

  // Ações de categoria
  setCurrentCategory: (id: string, name: string) =>
    set({
      currentCategoryId: id,
      currentCategoryName: name,
    }),

  // Reset ao trocar de categoria
  resetForCategoryChange: () =>
    set({
      lastFocusedChannelKey: null,
      lastFocusedProgramKey: null,
      selectedChannel: null,
      isChannelDetailVisible: false,
    }),

  // Reset ao trocar de canal (mantém foco do canal, reseta programa)
  resetForChannelChange: () =>
    set({
      lastFocusedProgramKey: null,
    }),

  // Reset geral
  clearAll: () =>
    set({
      lastFocusedChannelKey: null,
      lastFocusedProgramKey: null,
      selectedChannel: null,
      isChannelDetailVisible: false,
      currentCategoryId: null,
      currentCategoryName: null,
    }),
}));
