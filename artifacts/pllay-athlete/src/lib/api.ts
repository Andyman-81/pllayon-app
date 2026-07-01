const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const BASE = API_ORIGIN || import.meta.env.BASE_URL.replace(/\/$/, '');

export const apiUrl = (path: string) => `${API_ORIGIN}${path}`;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...((init?.headers as Record<string, string>) ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
