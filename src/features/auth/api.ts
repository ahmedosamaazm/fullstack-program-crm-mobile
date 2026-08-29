import { supabase } from '@/core/lib/supabase';
import { toAppError, type AppError } from '@/core/utils';

import type { AgentProfile, SignInInput } from './types';

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
