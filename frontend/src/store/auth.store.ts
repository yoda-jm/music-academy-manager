import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';
import { tokenStorage } from '@/api/client';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: (tokens: AuthTokens, user: User) => {
        tokenStorage.setTokens(tokens);
        set({ user, tokens, isAuthenticated: true });
      },

      logout: () => {
        tokenStorage.clearTokens();
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-sync tokens to localStorage when store rehydrates
        if (state?.tokens) {
          tokenStorage.setTokens(state.tokens);
        }
      },
    }
  )
);
