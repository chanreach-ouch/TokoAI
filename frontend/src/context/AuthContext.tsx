"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  email: string;
  is_superadmin: boolean;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for token on mount
    const storedToken = localStorage.getItem('tokoai_token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        setUser(decoded);
      } catch (e) {
        localStorage.removeItem('tokoai_token');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Basic route protection
    if (!isLoading) {
      const isPublicPath = pathname === '/login' || pathname === '/register';
      if (!token && !isPublicPath && pathname !== '/') {
        router.push('/login');
      } else if (token && isPublicPath) {
        if (user?.is_superadmin) {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [token, user, isLoading, pathname, router]);

  const login = (newToken: string) => {
    localStorage.setItem('tokoai_token', newToken);
    setToken(newToken);
    const decoded = jwtDecode<JwtPayload>(newToken);
    setUser(decoded);
    
    if (decoded.is_superadmin) {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('tokoai_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
