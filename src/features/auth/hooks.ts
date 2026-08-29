import { useMutation } from '@tanstack/react-query';

import type { AppError } from '@/core/utils';

import { signIn } from './api';
import { useAuth } from './session-context';
import type { AgentProfile, SignInInput } from './types';

export function useSignIn() {
  const { setProfile } = useAuth();
  return useMutation<AgentProfile, AppError, SignInInput>({
    mutationFn: signIn,
    onSuccess: (profile) => setProfile(profile),
  });
}
