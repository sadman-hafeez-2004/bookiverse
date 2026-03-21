import { create } from 'zustand';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

// ── Auth ─────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user:    null,
  token:   localStorage.getItem('bn_token') || null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('bn_token');
    if (!token) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, token, loading: false });
      connectSocket(token);
    } catch {
      localStorage.removeItem('bn_token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('bn_token', data.token);
    set({ user: data.user, token: data.token });
    connectSocket(data.token);
    return data.user;
  },

  register: async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('bn_token', data.token);
    set({ user: data.user, token: data.token });
    connectSocket(data.token);
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('bn_token');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

// ── Toast ─────────────────────────────────────────────────────
let tid = 0;
export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, type = 'success') => {
    const id = ++tid;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
}));

// ── Online users ──────────────────────────────────────────────
// FIX: expose as both "online" and "onlineUsers" for compatibility
export const useOnlineStore = create((set) => ({
  online: new Set(),
  // alias so components using either name work
  get onlineUsers() { return this.online; },
  setOnline:  (id)  => set((s) => { const n = new Set(s.online); n.add(id);    return { online: n }; }),
  setOffline: (id)  => set((s) => { const n = new Set(s.online); n.delete(id); return { online: n }; }),
  setAll:     (ids) => set({ online: new Set(ids) }),
}));
