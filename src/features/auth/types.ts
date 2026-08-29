import type { AuthSession } from '@supabase/supabase-js';

import type { Database } from '@/core/types/database';

export type UserRole = Database['public']['Enums']['user_role'];

/** The `profiles` row for the signed-in agent, camelCased at the boundary. */
export type AgentProfile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  departmentId: string;
  branchId: string;
};

export type SignInInput = { email: string; password: string };

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  profile: AgentProfile | null;
};
