import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type SettingsRowBase = {
  icon?: IconName;
  label: string;
};

export type SettingsRowProps =
  | (SettingsRowBase & { type: 'static'; value?: string })
  | (SettingsRowBase & { type: 'link'; value?: string; onPress: () => void })
  | (SettingsRowBase & { type: 'destructive'; onPress: () => void });

const ROW_HEIGHT = 48;

export function SettingsRow(props: SettingsRowProps) {
  const theme = useTheme();
  const destructive = props.type === 'destructive';
  const link = props.type === 'link';
  const value = props.type === 'destructive' ? undefined : props.value;

  const content = (
    <View
      style={[
        styles.root,
        {
          minHeight: ROW_HEIGHT,
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      {props.icon ? <Icon name={props.icon} size={20} /> : null}
      <Text variant="body" tone={destructive ? 'danger' : 'primary'} style={styles.label}>
        {props.label}
      </Text>
      {value ? (
        <Text variant="callout" tone="muted">
          {value}
        </Text>
      ) : null}
      {link ? <Icon name="chevronForward" size={20} /> : null}
    </View>
  );

  if (props.type === 'static') return content;

  return (
    <Pressable onPress={props.onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

const ICON_SIZE = 20; // matches the Icon size rendered above at line 39.

export type RowGroupProps = {
  children: ReactNode;
  /**
   * `edge` (default) insets dividers by `spacing.lg`. `label` insets them past
   * the leading icon too — Figma node 83:697 — for groups whose rows all carry
   * one. A group with mixed icon/no-icon rows should stay on `edge`.
   */
  dividerInset?: 'edge' | 'label';
};

/** Owns the shared surface, radius, clipping and inset dividers between `SettingsRow`s. */
export function RowGroup({ children, dividerInset = 'edge' }: RowGroupProps) {
  const theme = useTheme();
  const items = Children.toArray(children);
  const insetStart =
    dividerInset === 'label'
      ? theme.spacing.lg + ICON_SIZE + theme.spacing.md
      : theme.spacing.lg;

  return (
    <View
      style={[
        styles.group,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          // Figma binds e2 + e1 to every RowGroup card.
          ...theme.elevation.e2,
        },
      ]}
    >
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <View
              style={[
                styles.divider,
                { marginStart: insetStart, backgroundColor: theme.colors.borderSubtle },
              ]}
            />
          ) : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1 },
  group: { overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth },
});
