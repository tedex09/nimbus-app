'use client';

import { create } from 'zustand';

export interface Program {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category?: string;
  duration?: number;
  isLive?: boolean;
  progress?: number;
}

interface EpgState {
  currentProgram: Program | null;
  programs: Program[];
  setPrograms: (programs: Program[]) => void;
  updateCurrentProgram: () => void;
  reset: () => void;
}

export const useEpgStore = create<EpgState>((set, get) => ({
  currentProgram: null,
  programs: [],

  setPrograms: (programs) => {
    set({ programs });
    const now = new Date();
    const current = programs.find(
      (p) => new Date(p.startTime) <= now && new Date(p.endTime) > now
    );
    set({ currentProgram: current || null });
  },

  updateCurrentProgram: () => {
    const { programs } = get();
    const now = new Date();
    const current = programs.find(
      (p) => new Date(p.startTime) <= now && new Date(p.endTime) > now
    );
    set({ currentProgram: current || null });
  },

  reset: () => set({ currentProgram: null, programs: [] }),
}));
