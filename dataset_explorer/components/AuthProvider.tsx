"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";

type UserType = null | {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
  created_at?: string;
};

interface AuthContextValue {
  user: UserType;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
      } else {
        setUser(data.user ?? null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getUser();

    // Listen to auth state changes and update user
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_IN") {
          setUser(session?.user ?? null);
        }
        if (event === "SIGNED_OUT") {
          setUser(null);
        }
      },
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    refresh: async () => {
      setLoading(true);
      await getUser();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUser must be used within AuthProvider");
  return ctx;
}
