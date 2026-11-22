/* ==========================================================================
   Optional live market data (share price) via Finnhub.
   Finnhub's free tier supports browser requests (CORS) with a personal key.
   The key is stored only in this browser's localStorage. Without a key the
   app asks for the share price manually and computes everything else from
   SEC data.
   ========================================================================== */

const KEY_STORAGE = 'aura_finnhub_key';

export const getMarketKey = (): string => {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? (import.meta.env.VITE_FINNHUB_KEY as string | undefined) ?? '';
  } catch {
    return '';
  }
};

export const setMarketKey = (key: string) => {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable */
  }
};

export interface Quote {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  prevClose: number;
  asOf: Date;
  source: 'Finnhub' | 'Manual';
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  const key = getMarketKey();
  if (!key || !ticker) return null;
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(key)}`);
  if (res.status === 401 || res.status === 403) throw new Error('The market data key was rejected. Check it in Data sources.');
  if (res.status === 429) throw new Error('Market data rate limit reached. Try again in a minute.');
  if (!res.ok) throw new Error(`Market data request failed (${res.status}).`);
  const q = (await res.json()) as { c: number; d: number; dp: number; h: number; l: number; pc: number; t: number };
  if (!q || !q.c) return null;
  return { price: q.c, change: q.d, changePct: q.dp, high: q.h, low: q.l, prevClose: q.pc, asOf: new Date(q.t * 1000), source: 'Finnhub' };
}
