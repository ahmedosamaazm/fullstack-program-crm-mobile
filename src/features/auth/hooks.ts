import { useMutation, useQuery } from '@tanstack/react-query';

import type { AppError } from '@/core/utils';

import { fetchAgentProfileWithOrg, fetchDepartmentAgents, signIn } from './api';
import { useAuth } from './session-context';
import type { AgentProfile, SignInInput } from './types';

export function useSignIn() {
  const { setProfile } = useAuth();
  return useMutation<AgentProfile, AppError, SignInInput>({
    mutationFn: signIn,
    onSuccess: (profile) => setProfile(profile),
  });
}

/**
 * The signed-in agent's profile, joined with department/branch names, for the
 * Home greeting. Keyed separately from `['tickets', ...]` — claiming a ticket
 * cannot change the agent's name or org, so it must not be refetched on a
 * claim invalidation.
 */
export function useAgentProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchAgentProfileWithOrg(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export const agentKeys = {
  all: ['agents'] as const,
  list: (departmentId: string) => ['agents', 'list', departmentId] as const,
};

/**
 * Agents in the signed-in agent's department, for the assign sheet (story 08).
 * Keyed under `['agents', …]` — NOT under `['profile', …]` (a peer list is not
 * my identity) and NOT under `['tickets', …]` (Home's every-refresh
 * invalidation must not refetch it). `useAssignTicket` invalidates this key
 * explicitly, because assigning does change the workload numbers it renders.
 */
export function useDepartmentAgents(enabled = true) {
  const profile = useAgentProfile();
  const departmentId = profile.data?.departmentId;
  return useQuery({
    queryKey: agentKeys.list(departmentId ?? ''),
    queryFn: () => fetchDepartmentAgents(departmentId as string),
    enabled: enabled && Boolean(departmentId),
    staleTime: 60_000,
  });
}
