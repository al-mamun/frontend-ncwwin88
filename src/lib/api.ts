/**
 * Base API client.
 *
 * Typed fetch wrapper that understands the backend's standard response
 * envelope (`{success, message, data}` | `{success:false, message, errorCode}`).
 * Credentials are always included (httpOnly cookie auth).
 *
 * On 401, a single concurrent refresh attempt is made; if it succeeds the
 * original request is retried once. This keeps the player logged in without
 * ever storing JWTs in JavaScript.
 */

import type { ApiSuccess, ApiFailure } from '../types';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * The message to show for an error caught around a user-triggered request.
 *
 * `ApiRequestError` means the server answered and told us why, so its own
 * message is the truthful one. Anything else escaping a `fetch` is a transport
 * failure — nothing listening on the API host, the wrong port, or an origin the
 * backend's CORS allow-list rejects — and for security reasons the browser
 * hands JavaScript no detail beyond `TypeError: Failed to fetch`.
 *
 * Collapsing those two into one message is not cosmetic, and sign-in is where
 * it bites hardest: "Sign in failed. Please try again." reads as "wrong
 * password", so the user retypes credentials that were never transmitted
 * anywhere, while the real fault is that the request never left the browser.
 * Naming the transport case points at the one thing that can actually be fixed.
 */
export function requestErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof TypeError) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/**
 * Every request from the player site declares the PUBLIC surface. The player
 * site and the back-office dashboard share this API host, so the browser sends
 * cookies for BOTH surfaces on every request. This header pins the backend to
 * the player's own cookie (`sp_pub_*`) so a dashboard session can never be
 * mistaken for a player login (and vice-versa).
 */
export const AUTH_SURFACE_HEADER = { 'X-Auth-Surface': 'public' } as const;

// ─── Internal refresh singleton ────────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...AUTH_SURFACE_HEADER },
      body: JSON.stringify({ surface: 'public' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getRefresh(): Promise<boolean> | null {
  if (!refreshPromise) refreshPromise = refreshSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

// Allow tests / hooks to override refresh behaviour.
export const __setRefreshHandler = (fn: (() => Promise<boolean>) | null) => {
  if (fn) {
    (refreshSession as unknown as () => Promise<boolean>) = fn;
  }
};

// ─── Core fetch ────────────────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...AUTH_SURFACE_HEADER, ...(options.headers ?? {}) },
      credentials: 'include',
    });

  let res = await doFetch();

  // If unauthorized, try a single refresh + retry.
  if (res.status === 401 && !endpoint.startsWith('/auth/')) {
    const refreshed = await getRefresh();
    if (refreshed) res = await doFetch();
  }

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

/**
 * Multipart upload (player surface). Sends FormData WITHOUT a Content-Type header
 * so the browser sets the multipart boundary. Same cookie auth + single-refresh
 * retry as apiFetch. Returns the unwrapped `data`.
 */
export async function apiUpload<T>(endpoint: string, form: FormData): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: form,
      headers: { ...AUTH_SURFACE_HEADER },
      credentials: 'include',
    });

  let res = await doFetch();
  if (res.status === 401) {
    const refreshed = await getRefresh();
    if (refreshed) res = await doFetch();
  }

  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!res.ok || !body || body.success === false) {
    const err = body as ApiFailure | null;
    throw new ApiRequestError(err?.message ?? 'Upload failed', res.status, err?.errorCode ?? 'UPLOAD_FAILED', err?.details);
  }
  return body.data;
}

/** Fire-and-forget POST that ignores the response body (used for logout). */
export async function apiSend(
  endpoint: string,
  options: RequestInit = {},
): Promise<void> {
  await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...AUTH_SURFACE_HEADER, ...(options.headers ?? {}) },
    credentials: 'include',
  });
}
