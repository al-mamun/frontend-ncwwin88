/**
 * Affiliate-surface API client.
 *
 * Mirrors `lib/api.ts` but pins every request to the AFFILIATE auth surface
 * (`X-Auth-Surface: affiliate` + `surface:'affiliate'` on refresh), so the
 * dedicated affiliate portal (affiliate.<tenant>) never collides with a player
 * or dashboard session sharing the same API host. Cookie auth only — no JWT in
 * JS. Includes a multipart upload helper for KYC documents.
 */
import { ApiRequestError, API_BASE_URL } from './api';
import type { ApiSuccess, ApiFailure } from '../types';

export const AFFILIATE_SURFACE_HEADER = { 'X-Auth-Surface': 'affiliate' } as const;

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...AFFILIATE_SURFACE_HEADER },
      body: JSON.stringify({ surface: 'affiliate' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getRefresh(): Promise<boolean> {
  if (!refreshPromise) refreshPromise = refreshSession().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!res.ok || !body || body.success === false) {
    const err = body as ApiFailure | null;
    throw new ApiRequestError(
      err?.message ?? 'Request failed',
      res.status,
      err?.errorCode ?? 'REQUEST_FAILED',
      err?.details,
    );
  }
  return body.data;
}

/** JSON fetch against the affiliate surface (401 → one refresh + retry). */
export async function affiliateFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...AFFILIATE_SURFACE_HEADER, ...(options.headers ?? {}) },
      credentials: 'include',
    });
  let res = await doFetch();
  if (res.status === 401 && !endpoint.startsWith('/auth/')) {
    if (await getRefresh()) res = await doFetch();
  }
  return parse<T>(res);
}

/** Multipart upload (KYC). No Content-Type header → browser sets the boundary. */
export async function affiliateUpload<T>(endpoint: string, form: FormData): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: form,
      headers: { ...AFFILIATE_SURFACE_HEADER },
      credentials: 'include',
    });
  let res = await doFetch();
  if (res.status === 401) {
    if (await getRefresh()) res = await doFetch();
  }
  return parse<T>(res);
}

/** Fire-and-forget POST on the affiliate surface (logout). */
export async function affiliateSend(endpoint: string, options: RequestInit = {}): Promise<void> {
  await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...AFFILIATE_SURFACE_HEADER, ...(options.headers ?? {}) },
    credentials: 'include',
  });
}
