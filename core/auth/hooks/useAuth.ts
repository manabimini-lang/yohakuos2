// ===================================================
// YOHAKU Auth Core — useAuth Hook
// ===================================================
//
// React hook for auth state management in client components.
// Subscribes to Supabase auth state changes.
// ===================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/infra/supabase/client";
import type { AuthSession, AuthState, AuthResult } from "../types";
import { authConfig } from "../config";
import { clientSignOut } from "../client";

/**
 * React hook that provides auth state and actions.
 *
 * Usage:
 * ```tsx
 * const { session, isLoading, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    session: null,
    error: null,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          session: {
            id: session.user.id,
            email: session.user.email ?? "",
            profile: null, // Profile loaded separately if needed
          },
          error: null,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          session: null,
          error: null,
        });
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          session: {
            id: session.user.id,
            email: session.user.email ?? "",
            profile: null,
          },
          error: null,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          session: null,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await clientSignOut();
    setState({
      isLoading: false,
      isAuthenticated: false,
      session: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    signOut,
  };
}