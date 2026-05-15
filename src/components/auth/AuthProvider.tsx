import * as React from "react";
import { useEffect } from "react";
import { supabase, getProfile } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { UserProfile } from "@/types";
import { trackEvent } from "@/lib/analytics";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setUser, setLoading } = useStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchAndSyncProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          if (event === 'SIGNED_IN') {
             trackEvent('login');
          }
          fetchAndSyncProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Listen for cross-window messages from AuthCallback
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        // Auth handled by supa listener, but we can use this for UI feedback
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  async function fetchAndSyncProfile(userId: string) {
    setLoading(true);
    const profile = await getProfile(userId);
    if (profile) {
      setUser(profile as UserProfile);
    } else {
      // If profile doesn't exist, create a default one
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const newProfile: Partial<UserProfile> = {
          id: userData.user.id,
          email: userData.user.email || "",
          full_name: userData.user.user_metadata.full_name || "New User",
          avatar_url: userData.user.user_metadata.avatar_url || "",
          role: 'member',
          created_at: new Date().toISOString(),
        };
        
        // Mocking profile creation for now, as real DB might not be ready
        setUser(newProfile as UserProfile);
      }
    }
    setLoading(false);
  }

  return <>{children}</>;
}
