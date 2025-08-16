import { get, set, del } from 'idb-keyval';

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class IndexedDBAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await get(key);
      return value || null;
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error);
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await set(key, value);
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error);
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.warn('IndexedDB failed, falling back to localStorage:', error);
      localStorage.removeItem(key);
    }
  }
}

class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

const storage: StorageAdapter = typeof window !== 'undefined' 
  ? new IndexedDBAdapter() 
  : new LocalStorageAdapter();

export const persistentStorage = {
  async getSession() {
    try {
      const data = await storage.getItem('nimbus.session');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setSession(session: any) {
    try {
      await storage.setItem('nimbus.session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  async removeSession() {
    try {
      await storage.removeItem('nimbus.session');
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  },

  async getLayout() {
    try {
      const data = await storage.getItem('nimbus.layout');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setLayout(layout: any) {
    try {
      await storage.setItem('nimbus.layout', JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  },

  async getUserInfo() {
    try {
      const data = await storage.getItem('nimbus.userInfo');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUserInfo(userInfo: any) {
    try {
      await storage.setItem('nimbus.userInfo', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  },

  async removeUserInfo() {
    try {
      await storage.removeItem('nimbus.userInfo');
    } catch (error) {
      console.error('Failed to remove user info:', error);
    }
  }
};