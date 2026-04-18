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
// User cache — stores user object in localStorage for instant rehydration
// ---------------------------------------------------------------------------
const USER_CACHE_KEY = 'prithvi_user';
const userCache = {
  get: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  set: (u: User): void => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)); } catch { /* noop */ }
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_CACHE_KEY);
  },
};

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
  is_guest?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  startGuestSession: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(() => userCache.get());
  const [loading, setLoading] = useState(true);

  // Rehydrate & verify session on first mount (client-only)
  useEffect(() => {
    // We call /me regardless of cached user to ensure the session is still valid
    // via the httpOnly cookie.
    authAPI
      .me()
      .then((res) => {
        const freshUser = res.data.user as User;
        setUser(freshUser);
        userCache.set(freshUser);
      })
      .catch(() => {
        // Session is invalid / expired / missing
        userCache.remove();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ------------------------------------------------------------------
  const login = async (email: string, password: string): Promise<void> => {
    const res = await authAPI.login({ email, password });
    const { user: u } = res.data as { user: User };
    userCache.set(u);
    setUser(u);
  };

  const signup = async (data: SignupPayload): Promise<void> => {
    const res = await authAPI.signup(data);
    const { user: u } = res.data as { user: User };
    userCache.set(u);
    setUser(u);
  };

  const googleLogin = async (credential: string): Promise<void> => {
    const res = await authAPI.googleLogin(credential);
    const { user: u } = res.data as { user: User };
    userCache.set(u);
    setUser(u);
  };

  const startGuestSession = async (): Promise<void> => {
    const res = await authAPI.guestLogin();
    const { user: u } = res.data as { user: User };
    userCache.set(u);
    setUser(u);
  };

  const logout = () => {
    authAPI.logout().finally(() => {
      userCache.remove();
      setUser(null);
      // Hard redirect so all query caches and state are cleared
      window.location.href = '/login';
    });
  };

  const updateUser = (u: User): void => setUser(u);

  // ------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, googleLogin, startGuestSession, logout, updateUser }}
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

