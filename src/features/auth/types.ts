import type { AuthSession } from '@supabase/supabase-js';

import type { Database } from '@/core/types/database';
import type { LocalisedName } from '@/core/utils';

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

/**
 * `AgentProfile` plus the agent's department and branch for the Home greeting.
 *
 * These are the raw `{ name_en, name_ar }` pairs, not resolved strings —
 * resolve them at render with `useLocalisedName()`.
 */
export type AgentProfileWithOrg = AgentProfile & {
  department: LocalisedName | null;
  branch: LocalisedName | null;
};

export type SignInInput = { email: string; password: string };

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  profile: AgentProfile | null;
};

/** One selectable agent in the assign sheet (story 08). Not an `AgentProfile` — this is a *peer*. */
export type DepartmentAgent = {
  id: string;
  fullName: string;
  /** Open tickets (`new`, `open`, `pending`) currently assigned to this agent. */
  openTicketCount: number;
};
