const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export interface Session {
  serverCode: string;
  username: string;
  password: string;
  userInfo?: UserInfo;
}

export interface UserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: number; // Unix timestamp
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface MenuSection {
  id: number;
  name: string;
  icon: string;
  type: 'live' | 'vod';
  categoryId: number;
  enabled?: boolean;
  order?: number;
}

export interface LayoutData {
  version: number;
  serverCode: string;
  serverName: string;
  colors: {
    primary: string;
    secondary: string;
    background?: string;
  };
  logoUrl?: string;
  backgroundImageUrl?: string;
  menuSections: MenuSection[];
  customization?: {
    showSearch?: boolean;
    showExpiry?: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: number;
}

// Device code types moved to utils/deviceCode.ts
// Keeping these for backward compatibility
export interface DeviceCodeRequest {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface DeviceCodeStatus {
  status: 'pending' | 'authenticated' | 'expired' | 'denied';
  userInfo?: UserInfo;
  serverCode?: string;
}


export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface Channel {
  url: any;
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  category_id: string;
}

export interface EpgListing {
  id: string;
  title: string;
  start: string;
  stop: string;
  description?: string;
}

export interface EpgResponse {
  epg_listings: EpgListing[];
}

export const api = {
  async authenticate(serverCode: string, username: string, password: string): Promise<Session> {
    
    try {
      const response = await fetch(`${API_BASE}/api/client-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverCode,
          username,
          password,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Usuário ou senha inválidos';
            break;
          case 429:
            errorMessage = 'Limite mensal de listas atingido';
            break;
          case 500:
            errorMessage = 'Erro interno, tente novamente';
            break;
          default:
            try {
              const errorData = await response.text();
              errorMessage = errorData || errorMessage;
            } catch {
              // Use default message
            }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const userInfo: UserInfo = data.userInfo;
      
      return { serverCode, username, password, userInfo };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
  },

  async getLayout(serverCode: string): Promise<LayoutData> {
    try {
      const response = await fetch(`${API_BASE}/api/layout?server_code=${serverCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch layout: ${response.status}`);
      }

      const layoutData = await response.json();

      console.log(layoutData);
      
      // Validate and normalize the layout data
      return {
        version: layoutData.version || Date.now(),
        serverCode: layoutData.serverCode || serverCode,
        serverName: layoutData.serverName,
        colors: {
          primary: layoutData.colors?.primary || '#3b82f6',
          secondary: layoutData.colors?.secondary || '#64748b',
          background: layoutData.colors?.background || '#0f0e1a',
        },
        logoUrl: layoutData.logoUrl,
        backgroundImageUrl: layoutData.backgroundImageUrl,
        menuSections: (layoutData.menuSections || [])
          .filter((section: MenuSection) => section.enabled !== false)
          .sort((a: MenuSection, b: MenuSection) => (a.order || 0) - (b.order || 0)),
        customization: layoutData.customization || {
          showSearch: true,
          showExpiry: true,
        },
      };
    } catch (error) {
      console.error('Failed to fetch layout:', error);
      
      // Return default layout if API fails
      return {
        version: Date.now(),
        serverCode,
        serverName: 'Nimbus',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#0f0e1a',
        },
        menuSections: [
          { id: 1, name: 'TV', icon: 'tv', type: 'live', categoryId: 1 },
          { id: 2, name: 'Filmes', icon: 'movie', type: 'vod', categoryId: 2 },
          { id: 3, name: 'Séries', icon: 'tv', type: 'vod', categoryId: 3 },
        ],
        customization: {
          showSearch: true,
          showExpiry: true,
        },
      };
    }
  },


  async getCategories(serverCode: string, username: string, password: string): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/api/channels/categories?server_code=${serverCode}&username=${username}&password=${password}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao carregar categorias: ${response.status} - ${text}`);
      }

      const data = await response.json();

      // Normaliza caso seja array direto ou objeto com categories
      if (Array.isArray(data)) return data as Category[];
      if (data.categories && Array.isArray(data.categories)) return data.categories as Category[];
      return [];
    } catch (error) {
      console.error('Falha ao buscar categorias:', error);
      if (error instanceof Error) throw error;
      throw new Error('Erro desconhecido ao buscar categorias');
    }
  },

  async getChannels(serverCode: string, username: string, password: string, categoryId: string, format: string = 'ts'): Promise<Channel[]> {
    try {
      const response = await fetch(`${API_BASE}/api/channels/categories/${categoryId}?server_code=${serverCode}&username=${username}&password=${password}&format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao carregar canais: ${response.status} - ${text}`);
      }

      const data = await response.json();

      // Normaliza caso seja array direto ou objeto com channels
      if (Array.isArray(data)) return data as Channel[];
      if (data.channels && Array.isArray(data.channels)) return data.channels as Channel[];
      return [];
    } catch (error) {
      console.error('Falha ao buscar canais:', error);
      if (error instanceof Error) throw error;
      throw new Error('Erro desconhecido ao buscar canais');
    }
  },



    async getEpg(serverCode: string, username: string, password: string, channelId: string): Promise<EpgResponse[]> {
    try {

      const response = await fetch(`${API_BASE}/api/epg/${channelId}?server_code=${serverCode}&username=${username}&password=${password}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao carregar EPG: ${response.status} - ${text}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) return data as EpgResponse[];
      if (data.epg_listings && Array.isArray(data.epg_listings)) return data.epg_listings as EpgResponse[];
      return [];
    } catch (error) {
      console.error('Falha ao buscar EPG:', error);
      if (error instanceof Error) throw error;
      throw new Error('Erro desconhecido ao buscar EPG');
    }
  },

  async getEpgByChannel(serverCode: string, username: string, password: string, channelId: string, date?: string, limit?: number): Promise<EpgResponse> {
    try {
      const params = new URLSearchParams({
        server_code: serverCode,
        username,
        password,
      });
      
      if (date) params.append('date', date);
      if (limit) params.append('limit', limit.toString());

      // codificar channelId incluindo pontos
      const safeChannelId = encodeURIComponent(channelId).replace(/\./g, '%2E');
      
      const response = await fetch(`${API_BASE}/api/epg/${safeChannelId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao carregar EPG: ${response.status} - ${text}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) return { epg_listings: data as EpgListing[] };
      if (data.epg_listings && Array.isArray(data.epg_listings)) return data as EpgResponse;
      return { epg_listings: [] };
    } catch (error) {
      console.error('Falha ao buscar EPG:', error);
      if (error instanceof Error) throw error;
      throw new Error('Erro desconhecido ao buscar EPG');
    }
  },


  async requestDeviceCode(tvId: string): Promise<DeviceCodeRequest> {
    // This method is deprecated - use utils/deviceCode.ts instead
    console.warn('api.requestDeviceCode is deprecated, use utils/deviceCode.ts instead');
    
    // For backward compatibility, convert new format to old format
    const { requestDeviceCode: newRequestDeviceCode } = await import('@/utils/deviceCode');
    const result = await newRequestDeviceCode(tvId);
    
    return {
      device_code: result.code,
      user_code: result.code,
      verification_uri: 'https://meusite.com/tv',
      expires_in: result.expiresIn,
      interval: 5
    };
  },

  async checkDeviceCodeStatus(deviceCode: string): Promise<DeviceCodeStatus> {
    // This method is deprecated - use utils/deviceCode.ts instead
    console.warn('api.checkDeviceCodeStatus is deprecated, use utils/deviceCode.ts instead');
    
    const { checkDeviceCodeStatus: newCheckDeviceCodeStatus } = await import('@/utils/deviceCode');
    const result = await newCheckDeviceCodeStatus(deviceCode);
    
    // Convert new format to old format
    let status: 'pending' | 'authenticated' | 'expired' | 'denied' = 'pending';
    if (result.status === 'authenticated') status = 'authenticated';
    else if (result.status === 'expired') status = 'expired';
    else if (result.status === 'used') status = 'denied';
    
    return {
      status,
      userInfo: result.userInfo,
      serverCode: result.serverCode
    };
  },
};