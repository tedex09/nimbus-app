/**
 * Device Code Authentication Utility for Smart TV App
 * Compatible with Next.js App Router (client-side only)
 * 
 * Implements complete device code flow with proper error handling and logging
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

// Type definitions
export interface DeviceCodeRequest {
  code: string;
  expiresIn: number;
  tvId: string;
}

export interface DeviceCodeStatus {
  status: 'pending' | 'authenticated' | 'expired' | 'used';
  tvId: string;
  serverCode?: string;
  username?: string;
  userInfo?: any;
  authenticatedAt?: string;
}

export interface DeviceCodeConfirmation {
  serverCode: string;
  username: string;
  userInfo: any;
  authenticatedAt: string;
}

export interface DeviceCodeConsumption {
  serverCode: string;
  username: string;
  password: string;
  userInfo: any;
  authenticatedAt: string;
}

/**
 * Gets or generates a unique device ID for this TV
 * Stores in localStorage with key "tvId"
 * @returns {string} Device ID (max 100 characters)
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    console.warn('getDeviceId called on server-side, returning temporary ID:', tempId);
    return tempId;
  }

  try {
    let tvId = localStorage.getItem('tvId');
    
    if (!tvId) {
      tvId = 'tv-' + crypto.randomUUID().replace(/-/g, '').substring(0, 32);
      if (tvId.length > 100) tvId = tvId.substring(0, 100);
      localStorage.setItem('tvId', tvId);
      console.log('Generated new TV ID:', tvId);
    }
    
    return tvId;
  } catch (error) {
    console.error('Error accessing localStorage for TV ID:', error);
    const fallbackId = 'fallback-' + Date.now().toString(36);
    console.warn('Using fallback TV ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * Clears the stored device ID from localStorage
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('tvId');
    console.log('Device ID cleared from localStorage');
  } catch (error) {
    console.error('Error clearing device ID from localStorage:', error);
  }
}

/**
 * Validates that a code is exactly 8 alphanumeric uppercase characters
 */
function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Validates that a tvId doesn't exceed 100 characters
 */
function isValidTvId(tvId: string): boolean {
  return typeof tvId === 'string' && tvId.length > 0 && tvId.length <= 100;
}

/**
 * Requests a new device code from the backend
 */
export async function requestDeviceCode(tvId: string): Promise<DeviceCodeRequest> {
  if (!isValidTvId(tvId)) {
    throw new Error(`ID do dispositivo inválido: "${tvId}"`);
  }

  try {
    console.log('Requesting device code for TV ID:', tvId);
    
    const response = await fetch(`${API_BASE}/api/device-code/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tvId }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao solicitar código: ${response.status}`);
    }

    const data = await response.json();
    if (!data.code || !data.expiresIn) {
      throw new Error('Resposta inválida do servidor');
    }

    const result: DeviceCodeRequest = {
      code: data.code,
      expiresIn: data.expiresIn,
      tvId,
    };

    console.log('Device code requested successfully:', result);
    return result;
  } catch (error) {
    console.error('DeviceCode Request Error:', error);
    throw error;
  }
}

/**
 * Checks the current status of a device code
 */
export async function checkDeviceCodeStatus(code: string): Promise<DeviceCodeStatus> {
  if (!isValidCode(code)) {
    throw new Error(`Formato de código inválido: "${code}"`);
  }

  try {
    const response = await fetch(`${API_BASE}/api/device-code/status?code=${code}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Device code status checked:', { code, status: data.status });
    return data;
  } catch (error) {
    console.error('DeviceCode Status Error:', error);
    throw error;
  }
}

/**
 * Polls device code status until terminal state
 */
export async function pollDeviceCodeStatus(
  code: string,
  intervalMs: number,
  onUpdate: (status: DeviceCodeStatus) => void
): Promise<void> {


  if (!isValidCode(code)) {
    throw new Error(`Formato de código inválido para polling: "${code}"`);
  }
  if (intervalMs < 1000) intervalMs = 1000;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await checkDeviceCodeStatus(code);
        onUpdate(status);
        if (['authenticated', 'expired', 'used'].includes(status.status)) {
          resolve();
          return;
        }
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('DeviceCode Polling Error:', error);
        reject(error);
      }
    };
    poll();
  });
}

/**
 * Consumes an authenticated device code to get user data
 */
export async function consumeDeviceCode(
  code: string,
  tvId: string
): Promise<DeviceCodeConsumption> {
  if (!isValidCode(code)) {
    throw new Error(`Formato de código inválido: "${code}"`);
  }
  if (!isValidTvId(tvId)) {
    throw new Error(`ID do dispositivo inválido: "${tvId}"`);
  }

  try {
    console.log('Consuming device code:', { code, tvId });
    
    const response = await fetch(`${API_BASE}/api/device-code/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tvId }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao consumir código: ${response.status}`);
    }

    const data = await response.json();
    console.log('Device code consumed successfully');
    return data;
  } catch (error) {
    console.error('DeviceCode Consumption Error:', error);
    throw error;
  }
}

/**
 * Complete device code authentication flow
 */
export async function authenticateWithDeviceCode(
  onCodeGenerated: (codeData: DeviceCodeRequest) => void,
  onStatusUpdate: (status: DeviceCodeStatus) => void
): Promise<DeviceCodeConsumption> {
  const tvId = getDeviceId();
  try {
    const codeData = await requestDeviceCode(tvId);
    onCodeGenerated(codeData);

    await pollDeviceCodeStatus(codeData.code, 5000, onStatusUpdate);

    const authData = await consumeDeviceCode(codeData.code, tvId);
    return authData;
  } catch (error) {
    console.error('Complete device code authentication failed:', error);
    throw error;
  }
}
