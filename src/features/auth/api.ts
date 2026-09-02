import { supabase } from '@/core/lib/supabase';
import { toAppError, type AppError, type LocalisedName } from '@/core/utils';

import type { AgentProfile, AgentProfileWithOrg, DepartmentAgent, SignInInput } from './types';

/** GoTrue error codes → i18n keys. Anything unlisted falls through to `unknown`. */
const AUTH_MESSAGE_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.invalidCredentials',
  validation_failed: 'auth.errors.invalidCredentials',
  user_not_found: 'auth.errors.invalidCredentials',
  user_banned: 'auth.errors.deactivated',
  over_request_rate_limit: 'auth.errors.rateLimited',
};

export function toAuthError(error: unknown): AppError {
  const base = toAppError(error);
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;

  const mapped = code ? AUTH_MESSAGE_KEYS[code] : undefined;
  if (mapped) return { ...base, kind: 'auth', messageKey: mapped };
  if (base.kind === 'network') return { ...base, messageKey: 'auth.errors.network' };
  return { ...base, messageKey: 'auth.errors.unknown' };
}

const DEACTIVATED: AppError = {
  kind: 'auth',
  message: 'Profile is inactive or not visible to this user',
  messageKey: 'auth.errors.deactivated',
};

export async function fetchAgentProfile(userId: string): Promise<AgentProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, department_id, branch_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw toAppError(error);
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    role: data.role,
    isActive: data.is_active,
    departmentId: data.department_id,
    branchId: data.branch_id,
  };
}

type ProfileWithOrgRow = {
  id: string;
  full_name: string;
  email: string;
  role: AgentProfile['role'];
  is_active: boolean;
  department_id: string;
  branch_id: string;
  departments: LocalisedName | null;
  branches: LocalisedName | null;
};

/** `fetchAgentProfile` plus the agent's department and branch names, for the Home greeting. */
export async function fetchAgentProfileWithOrg(userId: string): Promise<AgentProfileWithOrg | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, is_active, department_id, branch_id, departments(name_en, name_ar), branches(name_en, name_ar)',
    )
    .eq('id', userId)
    .maybeSingle<ProfileWithOrgRow>();

  if (error) throw toAppError(error);
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    role: data.role,
    isActive: data.is_active,
    departmentId: data.department_id,
    branchId: data.branch_id,
    // Raw pairs, not resolved names — see `core/utils/locale-name.ts`. The
    // cache must stay locale-independent so a language switch needs no refetch.
    department: data.departments,
    branch: data.branches,
  };
}

const AGENT_LIST_SELECT = 'id, full_name, tickets!tickets_assigned_to_fkey(count)';

const OPEN_STATUSES = ['new', 'open', 'pending'] as const; // API §4.4 — the set `fetchMyTickets` uses.

type DepartmentAgentRow = {
  id: string;
  full_name: string;
  /** PostgREST returns an aggregate embed as a one-element array. */
  tickets: { count: number }[] | null;
};

/**
 * Agents in `departmentId`, for the assign sheet (story 08). `tickets` references
 * `profiles` twice (assignee and creator), so the `!tickets_assigned_to_fkey`
 * hint is mandatory — an unhinted `tickets(count)` is a PostgREST ambiguity
 * error. The embed is deliberately an OUTER join (no `!inner`) so an agent with
 * zero open tickets still appears — the agent you most want to see here.
 */
export async function fetchDepartmentAgents(departmentId: string): Promise<DepartmentAgent[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(AGENT_LIST_SELECT)
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .in('tickets.status', OPEN_STATUSES)
    .order('full_name', { ascending: true })
    .returns<DepartmentAgentRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    openTicketCount: row.tickets?.[0]?.count ?? 0,
  }));
}

export async function signIn(input: SignInInput): Promise<AgentProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) throw toAuthError(error);

  const userId = data.user?.id;
  if (!userId) throw toAuthError(new Error('Sign-in returned no user'));

  const profile = await fetchAgentProfile(userId);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    throw DEACTIVATED;
  }
  return profile;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAuthError(error);
  return data.session;
}

export async function signOutAgent(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAuthError(error);
}
