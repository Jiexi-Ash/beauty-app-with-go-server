"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type AuthUser = { id: string; email: string } | null;

type AuthContextValue = {
  user: AuthUser;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJsonOrThrow(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return body;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  // Tracked separately from `user`: a returning visitor's session cookie can
  // be valid even though we don't know their email until they next log in
  // (the access token itself carries no email — see jwt.go).
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setIsSignedIn(Boolean(data.authenticated)))
      .finally(() => setIsLoaded(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await parseJsonOrThrow(response);
    setUser({ id: body.id, email: body.email });
    setIsSignedIn(true);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await parseJsonOrThrow(response);
    setUser({ id: body.id, email: body.email });
    setIsSignedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsSignedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded, isSignedIn, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
