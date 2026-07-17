import { env } from '../config/env';

export type NetworkCheckResult = 'online' | 'offline';

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function checkSupabaseConnectivity(timeoutMs = 2500): Promise<NetworkCheckResult> {
  if (!navigator.onLine || !env.supabaseUrl) {
    console.info('NETWORK_CHECK_OFFLINE');
    return 'offline';
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(`${env.supabaseUrl}/auth/v1/health`, {
      cache: 'no-store',
      method: 'GET',
      signal: controller.signal
    });
    console.info('NETWORK_CHECK_ONLINE');
    return 'online';
  } catch {
    console.info('NETWORK_CHECK_OFFLINE');
    return 'offline';
  } finally {
    window.clearTimeout(timeout);
  }
}
