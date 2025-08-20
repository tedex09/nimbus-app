'use client';

import { create } from 'zustand';
import { persistentStorage } from '@/lib/storage';
import { api, Session, LayoutData, UserInfo } from '@/lib/api';
import { 
  getDeviceId, 
  requestDeviceCode, 
  checkDeviceCodeStatus as utilCheckDeviceCodeStatus, 
  pollDeviceCodeStatus,
  consumeDeviceCode,
  type DeviceCodeRequest as DeviceCodeRequestType,
  type DeviceCodeStatus as DeviceCodeStatusType
} from '@/utils/deviceCode';

interface AppState {
  session: Session | null;
  layout: LayoutData | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  deviceCode: DeviceCodeRequestType | null;
  deviceCodePolling: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setLayout: (layout: LayoutData | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDeviceCode: (deviceCode: DeviceCodeRequestType | null) => void;
  setDeviceCodePolling: (polling: boolean) => void;
  
  // Async actions
  login: (serverCode: string, username: string, password: string) => Promise<void>;
  loginWithDeviceCode: () => Promise<DeviceCodeRequestType>;
  checkDeviceCodeStatus: (deviceCode: string) => Promise<DeviceCodeStatusType>;
  startDeviceCodePolling: (deviceCode: DeviceCodeRequestType) => void;
  stopDeviceCodePolling: () => void;
  logout: () => Promise<void>;
  loadLayout: (serverCode: string) => Promise<void>;
  initializeApp: () => Promise<void>;
  
  // Computed values
  getExpirationDate: () => string | null;
  getConn: () => string | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  layout: null,
  userInfo: null,
  isLoading: false,
  error: null,
  deviceCode: null,
  deviceCodePolling: false,

  setSession: (session) => set({ session }),
  setLayout: (layout) => set({ layout }),
  setUserInfo: (userInfo) => set({ userInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDeviceCode: (deviceCode) => set({ deviceCode }),
  setDeviceCodePolling: (deviceCodePolling) => set({ deviceCodePolling }),

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

  loginWithDeviceCode: async () => {
    set({ isLoading: true, error: null });
    try {
      const tvId = getDeviceId();
      const deviceCodeData = await requestDeviceCode(tvId);
      set({ 
        deviceCode: deviceCodeData,
        isLoading: false 
      });
      return deviceCodeData;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Falha ao gerar código',
        isLoading: false 
      });
      throw error;
    }
  },

  checkDeviceCodeStatus: async (deviceCode: string) => {
    try {
      const status = await utilCheckDeviceCodeStatus(deviceCode); 
      return status;
    } catch (error) {
      console.error('Failed to check device code status:', error);
      throw error;
    }
  },

  startDeviceCodePolling: (deviceCode) => {
    if (!deviceCode) return;

    const { stopDeviceCodePolling } = get();
    set({ deviceCodePolling: true });

    pollDeviceCodeStatus(deviceCode.code, 5000, async (status) => {
      if (status.status === 'authenticated') {
        try {
          // Criar session direto com os dados recebidos da API
          const session: Session = {
            serverCode: status.serverCode!,
            username: status.username!,
            password: status.password!,
            userInfo: status.userInfo || null,
          };

          await persistentStorage.setSession(session);
          set({
            session,
            userInfo: session.userInfo,
            deviceCode: null,
            error: null
          });

          stopDeviceCodePolling();
          await get().loadLayout(session.serverCode);

        } catch (error) {
          console.error('Failed to consume device code:', error);
          set({ 
            error: 'Erro ao finalizar autenticação',
            deviceCode: null
          });
          stopDeviceCodePolling();
        }
      } else if (status.status === 'expired') {
        set({ 
          error: 'Código expirado. Gere um novo código.',
          deviceCode: null
        });
        stopDeviceCodePolling();
      } else if (status.status === 'used') {
        set({ 
          error: 'Código já foi utilizado. Gere um novo código.',
          deviceCode: null
        });
        stopDeviceCodePolling();
      }
    }).catch((error) => {
      console.error('Device code polling failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro no polling do código',
        deviceCode: null
      });
      stopDeviceCodePolling();
    });
  },

  stopDeviceCodePolling: () => {
    set({ deviceCodePolling: false });
  },

  logout: async () => {
    get().stopDeviceCodePolling();
    await persistentStorage.removeSession();
    set({ 
      session: null, 
      layout: null, 
      userInfo: null, 
      deviceCode: null,
      error: null
    });
  },

  loadLayout: async (serverCode) => {
    try {
      const cachedLayout = await persistentStorage.getLayout();
      if (cachedLayout) set({ layout: cachedLayout });

      try {
        const freshLayout = await api.getLayout(serverCode);
        if (!cachedLayout || cachedLayout.version !== freshLayout.version) {
          await persistentStorage.setLayout(freshLayout);
          set({ layout: freshLayout });
        }
      } catch (error) {
        console.warn('Failed to fetch fresh layout, using cached version:', error);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
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
      const date = new Date(userInfo.exp_date * 1000);
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

  getConn: () => {
    const { userInfo } = get();
    if (!userInfo?.max_connections) return null;
    return userInfo?.max_connections;
  },
}));
