import { create } from 'zustand';

interface FocusState {
  lastFocusedChannelKey: string | null;
  lastFocusedProgramKey: string | null;
  setLastFocusedChannelKey: (key: string) => void;
  setLastFocusedProgramKey: (key: string) => void;
  clearFocus: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  lastFocusedChannelKey: null,
  lastFocusedProgramKey: null,
  setLastFocusedChannelKey: (key: string) => set({ lastFocusedChannelKey: key }),
  setLastFocusedProgramKey: (key: string) => set({ lastFocusedProgramKey: key }),
  clearFocus: () => set({ lastFocusedChannelKey: null, lastFocusedProgramKey: null }),
}));
