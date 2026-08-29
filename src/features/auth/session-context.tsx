import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { queryClient } from '@/core/lib/query-client';
import { supabase } from '@/core/lib/supabase';

import { getCurrentSession, signOutAgent } from './api';
import type { AgentProfile, AuthState } from './types';

type AuthContextValue = AuthState & {
  setProfile: (profile: AgentProfile | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    profile: null,
  });

  useEffect(() => {
    let cancelled = false;

    // The listener below is the ongoing source of truth; this one-shot read
    // only resolves the very first frame and must never clobber a newer value.
    void getCurrentSession()
      .then((session) => {
        if (cancelled) return;
        setState((prev) =>
          prev.status === 'loading'
            ? { status: session ? 'signedIn' : 'signedOut', session, profile: null }
            : prev,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) =>
          prev.status === 'loading'
            ? { status: 'signedOut', session: null, profile: null }
            : prev,
        );
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        status: session ? 'signedIn' : 'signedOut',
        session,
        profile: session ? prev.profile : null,
      }));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setProfile: (profile) => setState((prev) => ({ ...prev, profile })),
      signOut: async () => {
        await signOutAgent();
        queryClient.clear();
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
