'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { AuthUser, authStorage } from '@/lib/auth';

type LoginPayload = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (payload: LoginPayload) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = authStorage.getToken();
    const cachedUser = authStorage.getUser();

    if (!token || !cachedUser) {
      authStorage.clearSession();
      setIsLoading(false);
      return;
    }

    setUser(cachedUser);

    authApi.me()
      .then((response) => {
        setUser(response.data.data);
        authStorage.setSession(token, response.data.data);
      })
      .catch(() => {
        authStorage.clearSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = ({ token, user: nextUser }: LoginPayload) => {
    authStorage.setSession(token, nextUser);
    setUser(nextUser);
  };

  const logout = () => {
    authStorage.clearSession();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: Boolean(user),
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
