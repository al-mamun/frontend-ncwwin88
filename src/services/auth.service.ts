/**
 * Auth API service.
 * All endpoints use httpOnly cookies — no token is returned to JS.
 */

import { apiFetch, apiSend, API_BASE_URL, AUTH_SURFACE_HEADER } from '../lib/api';
import type { LoginInput, SafeUserProfile, RegisterInput } from '../types';

export interface AuthApi {
  login(input: LoginInput): Promise<SafeUserProfile>;
  register(input: RegisterInput): Promise<SafeUserProfile>;
  me(): Promise<SafeUserProfile | null>;
  refresh(): Promise<boolean>;
  logout(): Promise<void>;
  forgotPassword(identifier: string): Promise<void>;
  resetPassword(input: { identifier: string; code: string; newPassword: string }): Promise<void>;
}

export const authApi: AuthApi = {
  // /auth/login returns { user: profile }; unwrap so callers get the profile.
  async login({ identifier, password }) {
    const res = await apiFetch<{ user: SafeUserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, surface: 'public' }),
    });
    return res.user;
  },

  // /auth/register creates a player, auto-logs-in (sets cookies), returns { user }.
  async register(input) {
    const res = await apiFetch<{ user: SafeUserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.user;
  },

  // Request a password-reset code (sent to the account email/phone). Always 200.
  async forgotPassword(identifier) {
    await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) });
  },

  // Complete the reset with the code + a new password.
  async resetPassword({ identifier, code, newPassword }) {
    await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, code, newPassword }) });
  },

  // /auth/me returns { user, role, tenant, ... }; we only need the profile.
  async me() {
    try {
      const res = await apiFetch<{ user: SafeUserProfile }>('/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },

  async refresh() {
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
  },

  async logout() {
    await apiSend('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ surface: 'public' }),
    });
  },
};