import { getSessionToken } from "./session-token";

/** Fetch wrapper for the local fanri API. Adds the session token to every request. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { "x-fanri-token": getSessionToken() } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
