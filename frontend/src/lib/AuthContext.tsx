'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { authAPI, tokenHelpers, type SignupPayload } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  _id: string;
  name: string;
  email: string;
  farm_location?: {
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  phone?: string;
  farm_size_acres?: number;
  crop_types?: string[];
  plan: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from localStorage on first mount (client-only)
  useEffect(() => {
    const saved = tokenHelpers.get();
    if (!saved) {
      setLoading(false);
      return;
    }

    setToken(saved);
    authAPI
      .me()
      .then((res) => setUser(res.data.user as User))
      .catch(() => {
        // Token is invalid / expired — clean up
        tokenHelpers.remove();
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ------------------------------------------------------------------
  const login = async (email: string, password: string): Promise<void> => {
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data as { token: string; user: User };
    tokenHelpers.set(t);
    setToken(t);
    setUser(u);
  };

  const signup = async (data: SignupPayload): Promise<void> => {
    const res = await authAPI.signup(data);
    const { token: t, user: u } = res.data as { token: string; user: User };
    tokenHelpers.set(t);
    setToken(t);
    setUser(u);
  };

  const logout = (): void => {
    tokenHelpers.remove();
    setToken(null);
    setUser(null);
    // Hard redirect so all query caches and state are cleared
    window.location.href = '/login';
  };

  const updateUser = (u: User): void => setUser(u);

  // ------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook — throws if used outside provider
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

