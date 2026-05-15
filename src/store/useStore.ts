import { create } from 'zustand';
import { UserProfile } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AppState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, session: null }),
}));
