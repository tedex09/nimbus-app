'use client';

import { create } from 'zustand';
import { persistentStorage } from '@/lib/storage';
import { api, Session, LayoutData, UserInfo } from '@/lib/api';

interface AppState {
  session: Session | null;
  layout: LayoutData | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSession: (session: Session | null) => void;
  setLayout: (layout: LayoutData | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  login: (serverCode: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadLayout: (serverCode: string) => Promise<void>;
  initializeApp: () => Promise<void>;
  
  // Computed values
  getExpirationDate: () => string | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  layout: null,
  userInfo: null,
  isLoading: false,
  error: null,

  setSession: (session) => set({ session }),
  setLayout: (layout) => set({ layout }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (serverCode, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await api.authenticate(serverCode, username, password);
      await persistentStorage.setSession(session);
      set({ 
        session, 
        userInfo: session.userInfo || null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    await persistentStorage.removeSession();
    set({ session: null, layout: null, userInfo: null });
  },

  loadLayout: async (serverCode) => {
    try {
      // Load from cache first
      const cachedLayout = await persistentStorage.getLayout();
      if (cachedLayout) {
        set({ layout: cachedLayout });
      }

      // Try to fetch fresh data
      try {
        const freshLayout = await api.getLayout(serverCode);
        
        // Update if version changed or no cache
        if (!cachedLayout || cachedLayout.version !== freshLayout.version) {
          await persistentStorage.setLayout(freshLayout);
          set({ layout: freshLayout });
        }
      } catch (error) {
        // Silently fail on network error, use cached data
        console.warn('Failed to fetch fresh layout, using cached version:', error);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
      // Continue without layout, don't block the app
    }
  },

  initializeApp: async () => {
    set({ isLoading: true });
    try {
      const session = await persistentStorage.getSession();
      if (session) {
        set({ 
          session,
          userInfo: session.userInfo || null
        });
        await get().loadLayout(session.serverCode);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getExpirationDate: () => {
    const { userInfo } = get();
    if (!userInfo?.exp_date) return null;
    
    try {
      const date = new Date(userInfo.exp_date * 1000); // Convert Unix timestamp to milliseconds
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting expiration date:', error);
      return null;
    }
  },
}));