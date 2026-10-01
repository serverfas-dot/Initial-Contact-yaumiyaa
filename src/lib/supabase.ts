import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 20000;

export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout as typeof fetch },
});

export async function fetchRestJson<T>(table: string, query: Record<string, string>): Promise<T> {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetchWithTimeout(url, {
    headers: {
      apikey: supabaseAnonKey,
    },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

const FALLBACK_ACCOUNTS: Record<string, { password: string; role: 'admin' | 'superadmin' }> = {
  admin: { password: 'admin123', role: 'admin' },
  superadmin: { password: 'super123', role: 'superadmin' },
};

export async function authenticateAdmin(username: string, password: string): Promise<'admin' | 'superadmin' | null> {
  const params = new URLSearchParams({
    select: 'role',
    username: `eq.${username}`,
    password: `eq.${password}`,
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/admin_users?${params.toString()}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (response.ok) {
      const rows: unknown = await response.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const role = (rows[0] as { role?: unknown }).role;
        return role === 'superadmin' ? 'superadmin' : 'admin';
      }
      return null;
    }
  } catch {
    // Database unreachable — fall through to fallback credentials
  }

  const account = FALLBACK_ACCOUNTS[username];
  if (account && account.password === password) {
    return account.role;
  }

  return null;
}

export interface Yaumiyya {
  id?: string;
  badhalu_vun_type: string;
  thaareekh: string;
  feshunu_gadi: string;
  nimunu_gadi: string;
  na: string;
  number: string;
  haaziru_vaanjehey_adadhu: number;
  haaziru_vi_adadhu: number;
  hulasa: string;
  hiyaalu_thah: string;
  nimunu_kanthaithah: string;
  ninmun: string;
  liunu_faraath: string;
  soi: string;
  created_at?: string;
}
