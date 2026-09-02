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
      setState((prev) => {
        // An involuntary sign-out — a rejected refresh token, a session expired
        // by the server's inactivity timeout, or a sign-out from another device.
        // `signOut()` below clears the cache on the path an agent takes
        // deliberately; this is the path they don't, and BRD `:476` does not
        // distinguish between them. Without it, an expired session returns the
        // agent to Login with the previous session's tickets and customers still
        // resident for whoever signs in next.
        //
        // Guarded on the TRANSITION, not on `!session`: this listener also fires
        // with a null session on first subscribe, and clearing an empty cache on
        // every cold start is wasted work that also races the first queries.
        if (prev.status === 'signedIn' && !session) {
          queryClient.clear();
        }

        return {
          status: session ? 'signedIn' : 'signedOut',
          session,
          profile: session ? prev.profile : null,
        };
      });
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
        try {
          await signOutAgent();
        } finally {
          // Clear regardless: a network failure must not leave the previous
          // agent's tickets and customers in the cache for the next sign-in.
          queryClient.clear();
        }
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
