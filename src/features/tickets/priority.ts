import type { Theme } from '@/core/lib/theme';

import type { TicketPriority } from './types';

export function priorityColor(priority: TicketPriority, theme: Theme): string {
  switch (priority) {
    case 'urgent':
      return theme.colors.statusDanger;
    case 'high':
      return theme.colors.statusWarning;
    case 'medium':
      return theme.colors.statusInfo;
    case 'low':
      // `borderDefault` measured 1.26 light / 1.84 dark against a card — the
      // rail was effectively not there. `borderInteractive` is 4.48 / 6.46
      // (story 26, SCRUM-13).
      return theme.colors.borderInteractive;
  }
}
