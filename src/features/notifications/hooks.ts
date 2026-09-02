import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';

/**
 * One `'notifications'` root, so a single
 * `invalidateQueries({ queryKey: notificationKeys.all })` after either
 * mutation refetches the list AND the Home badge together — same reasoning as
 * `ticketKeys` (tickets/hooks.ts). Both keys carry the user id: an involuntary
 * sign-out that leaves the previous agent's cache resident is the exact
 * defect story 18 (session persistence) was written to close.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => ['notifications', 'list', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'count', 'unread', userId] as const,
};

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: notificationKeys.list(userId ?? ''),
    queryFn: () => fetchNotifications(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUnreadNotificationCount() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: () => fetchUnreadNotificationCount(userId as string),
    enabled: Boolean(userId),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
