import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text, type IconName } from '@/core/components';
import { useTheme, type ColorToken } from '@/core/lib/theme';
import { formatRelativeShort } from '@/core/utils';

import { isNotificationType, type NotificationItem, type NotificationType } from '../types';

type TypeStyle = { icon: IconName; tint: ColorToken; ink: ColorToken };

/**
 * The five types from `docs/phase1_backend_plan.md:273-277` and `:316-321`.
 * `unassigned` and `rating` cannot fire yet (no `pg_cron`, no CSAT flow) and
 * are built blind against Figma `129:1131` / `129:1149`.
 *
 * This map IS acceptance criterion `:853` — "the alert row accommodates a
 * severity indicator for future SLA alerts". Adding one is an entry here,
 * never a change to the layout below.
 *
 * Three of these token choices are open questions raised back to design (plan
 * `23-story-in-app-notification-centre-SCRUM-45.md` open question 2):
 * `bgTabActive`/`statusWarning` are the nearest repo tokens to Figma's
 * `palette.blue100`/`palette.amber500`, not exact matches, and
 * `bgInternalSubtle`/`textInternal` are exact matches under a name that says
 * "internal notes only" (`colors.ts:56`).
 */
const TYPE_STYLE: Record<NotificationType, TypeStyle> = {
  assigned: { icon: 'user', tint: 'bgTabActive', ink: 'statusInfo' },
  reply: { icon: 'message', tint: 'bgSuccessSubtle', ink: 'statusSuccess' },
  status: { icon: 'clock', tint: 'bgInternalSubtle', ink: 'textInternal' },
  // `alert`, not `clock`, deliberately diverges from Figma (which draws the
  // same clock glyph as `status`, differing only by hue) — see open question 3.
  // A severity indicator distinguished by colour alone repeats the exact
  // failure `TicketRow.tsx` already documents for ticket priority.
  unassigned: { icon: 'alert', tint: 'bgWarningSubtle', ink: 'statusWarning' },
  rating: { icon: 'star', tint: 'bgWarningSubtle', ink: 'statusWarning' },
};

/** An unrecognised `type` — the column is `text` with no CHECK. Never crash on one. */
const FALLBACK_STYLE: TypeStyle = { icon: 'bell', tint: 'bgSurfaceSunken', ink: 'iconDefault' };

function styleFor(type: string): TypeStyle {
  return isNotificationType(type) ? TYPE_STYLE[type] : FALLBACK_STYLE;
}

export type NotificationRowProps = {
  item: NotificationItem;
  /** Called with the row's own item — the screen decides both the read-mark and the navigation. */
  onPress: (item: NotificationItem) => void;
};

/**
 * ONE component, five type values, one `unread` boolean — not ten variants.
 * Unread is signalled by row tint AND title weight together, plus a trailing
 * dot — never colour alone, since `bgPrimarySubtle` against `bgSurface` is a
 * near-invisible difference for a meaningful fraction of readers.
 */
export function NotificationRow({ item, onPress }: NotificationRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const { icon, tint, ink } = styleFor(item.type);
  const unread = !item.isRead;

  const accessibilityLabel = t('notifications.rowLabel', {
    title: item.title,
    body: item.body ?? '',
    age: formatRelativeShort(item.createdAt),
    state: t(unread ? 'notifications.state.unread' : 'notifications.state.read'),
  });

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
          backgroundColor: unread ? theme.colors.bgPrimarySubtle : theme.colors.bgSurface,
        },
      ]}
    >
      <View
        style={[
          styles.chip,
          {
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors[tint],
          },
        ]}
      >
        <Icon name={icon} size={18} color={theme.colors[ink]} />
      </View>

      <View style={[styles.content, { minWidth: 0 }]}>
        <View style={styles.titleRow}>
          <Text
            variant="body"
            weight={unread ? 'semibold' : 'medium'}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {item.title}
          </Text>
          <View style={[styles.trailing, { gap: theme.spacing.xs }]}>
            <Text variant="caption" tone="muted">
              {formatRelativeShort(item.createdAt)}
            </Text>
            {unread ? (
              <View
                style={[
                  styles.dot,
                  { borderRadius: theme.radius.full, backgroundColor: theme.colors.bgPrimary },
                ]}
              />
            ) : null}
          </View>
        </View>
        {item.body ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start' },
  chip: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trailing: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8 },
});
