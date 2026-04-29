import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      login: (user, token) => {
        try {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          console.warn('Storage write failed:', e);
        }
        set({ user, token, isLoggedIn: true });
        console.log('✅ 登录成功:', { user, isLoggedIn: true });
      },
      logout: () => {
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        } catch (e) {
          console.warn('Storage remove failed:', e);
        }
        set({ user: null, token: null, isLoggedIn: false });
        console.log('👋 已登出');
      },
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      initialize: () => {
        try {
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('access_token');
          if (storedUser && storedToken) {
            const user = JSON.parse(storedUser);
            set({ user, token: storedToken, isLoggedIn: true });
            console.log('🔄 恢复登录状态:', user);
          }
        } catch (e) {
          console.warn('Storage read failed:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
    }
  )
);

// 初始化
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
