import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

function getApiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (env) return env.replace(/\/$/, '') + '/api';
  return '/api';
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sahaayak_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setUser(JSON.parse(localStorage.getItem('sahaayak_user') || 'null'));
    }
    setLoading(false);
  }, [token]);

  const login = async (mobile, otp) => {
    const res = await fetch(`${getApiBase()}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('sahaayak_token', data.token);
    localStorage.setItem('sahaayak_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sahaayak_token');
    localStorage.removeItem('sahaayak_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfiles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const raw = data.profiles || [];
      const byId = new Map();
      (Array.isArray(raw) ? raw : []).forEach((p) => {
        if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
      });
      const profiles = Array.from(byId.values());
      setUser((prev) => (prev ? { ...prev, profiles } : null));
      const stored = JSON.parse(localStorage.getItem('sahaayak_user') || '{}');
      if (Object.keys(stored).length) {
        localStorage.setItem('sahaayak_user', JSON.stringify({ ...stored, profiles }));
      }
    } catch (err) {
      console.error('Failed to refresh profiles', err);
    }
  }, [token]);

  /** Update in-memory and localStorage profiles so all pages see the change immediately (e.g. after delete). REPLACES profiles. */
  const setUserProfiles = useCallback((profiles) => {
    const list = Array.isArray(profiles) ? profiles : [];
    setUser((u) => (u ? { ...u, profiles: list } : null));
    const stored = JSON.parse(localStorage.getItem('sahaayak_user') || '{}');
    if (Object.keys(stored).length) {
      localStorage.setItem('sahaayak_user', JSON.stringify({ ...stored, profiles: list }));
    }
  }, []);

  const authFetch = (url, options = {}) => {
    const base = getApiBase();
    const fullUrl = url.startsWith('http') ? url : base + (url.startsWith('/api') ? url.slice(4) : url.startsWith('/') ? url : '/' + url);
    return fetch(fullUrl, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfiles, setUserProfiles, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
