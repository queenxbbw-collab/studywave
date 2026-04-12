import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  updateUser: (u: Partial<User> & { id?: number }) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getToken(): string | null {
  return localStorage.getItem("studywave_token");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMe(token: string): Promise<User | null> {
  try {
    const r = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("studywave_token");
    if (!t) return;
    const data = await fetchMe(t);
    if (data) setUser(data);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("studywave_token");
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken).then(data => {
        if (data) setUser(data);
        else localStorage.removeItem("studywave_token");
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Poll for real-time points every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshUser, 30_000);
    return () => clearInterval(interval);
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("studywave_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string, displayName: string, referralCode?: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, displayName, ...(referralCode ? { referralCode } : {}) }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("studywave_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("studywave_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (u: Partial<User> & { id?: number }) => {
    setUser(prev => prev ? { ...prev, ...u } : (u as User));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
