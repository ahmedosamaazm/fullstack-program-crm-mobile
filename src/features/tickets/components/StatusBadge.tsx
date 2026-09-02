import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text, type TextTone } from '@/core/components';
import { useTheme, type Theme } from '@/core/lib/theme';

import type { TicketStatus } from '../types';

export type StatusBadgeProps = { status: TicketStatus };

/**
 * `pending` still has no colour token. Figma renders it lavender; the palette
 * does now carry a purple (`bgInternalSubtle`/`textInternal`, added in story
 * 07), but `colors.ts` reserves it in writing for internal notes — reusing it
 * here is a design decision, not an implementation shortcut. Until design
 * assigns `pending` a hue it ships on a neutral surface tone (story 26,
 * SCRUM-13, open question 1).
 *
 * `closed` used to share that exact surface, so the two badges were the same
 * rectangle — and in dark `bgSurfaceSunken` *is* `bgCanvas`, making both an
 * invisible 1.00-contrast shape on a screen background. `closed` is now
 * outlined instead, separating the two by shape rather than by colour.
 */
export function statusStyle(
  status: TicketStatus,
  theme: Theme,
): { bg: string; tone: TextTone; outlined?: boolean } {
  switch (status) {
    case 'new':
      return { bg: theme.colors.bgPrimarySubtle, tone: 'info' };
    case 'open':
      return { bg: theme.colors.bgWarningSubtle, tone: 'warning' };
    case 'pending':
      return { bg: theme.colors.bgSurfaceSunken, tone: 'secondary' };
    case 'resolved':
      return { bg: theme.colors.bgSuccessSubtle, tone: 'success' };
    case 'closed':
      // An outline separates `closed` from `pending` by shape, so the
      // distinction survives dark mode, greyscale and colour-blindness alike.
      // `textMuted` on `bgSurface` is 5.10 light / 6.46 dark — both pass.
      return { bg: theme.colors.bgSurface, tone: 'muted', outlined: true };
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { bg, tone, outlined } = statusStyle(status, theme);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: bg,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs,
        },
        outlined
          ? {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.borderInteractive,
            }
          : null,
      ]}
    >
      <Text variant="overline" weight="semibold" tone={tone}>
        {t(`ticket.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'flex-start' },
});
