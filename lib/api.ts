const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export interface Session {
  serverCode: string;
  username: string;
  password: string;
}

export interface LayoutData {
  version: string;
  serverName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  logoUrl?: string;
  backgroundImageUrl?: string;
  menuSections: Array<{
    id: string;
    name: string;
    type: 'tv' | 'movies' | 'series';
  }>;
}

export const api = {
  async authenticate(serverCode: string, username: string, password: string): Promise<Session> {
    console.log(`Dados: ${serverCode}, ${username}, ${password}`);
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
      const error = await response.text();
      throw new Error(error || 'Authentication failed');
    }

    return { serverCode, username, password };
  },

  async getLayout(serverCode: string): Promise<LayoutData> {
    const response = await fetch(`${API_BASE}/api/layout?server_code=${serverCode}`, {
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch layout');
    }

    return response.json();
  },
};