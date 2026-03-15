import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/api/client';

export function useAuth() {
  const { user, tokens, isAuthenticated, login, logout, updateUser } = useAuthStore();

  const { data: meData, isLoading: isMeLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: !!tokenStorage.getAccessToken(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (meData) {
      updateUser(meData);
    }
  }, [meData, updateUser]);

  return {
    user,
    tokens,
    isAuthenticated,
    isMeLoading,
    login,
    logout,
    updateUser,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER',
    isStudent: user?.role === 'STUDENT',
    isParent: user?.role === 'PARENT',
  };
}
