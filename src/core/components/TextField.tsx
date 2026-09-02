import type { ComponentRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { TextInput, type TextInputProps } from './TextInput';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Hides the label visually while keeping it for accessibility. */
  showLabel?: boolean;
  placeholder?: string;
  trailingIcon?: IconName;
  onTrailingIconPress?: () => void;
  error?: string;
  helper?: string;
  disabled?: boolean;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onBlur?: TextInputProps['onBlur'];
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  /** Announced for the trailing icon button. Defaults to `label`. */
  trailingIconLabel?: string;
};

const FIELD_HEIGHT = 48;

export function TextField({
  label,
  value,
  onChangeText,
  showLabel = true,
  placeholder,
  trailingIcon,
  onTrailingIconPress,
  error,
  helper,
  disabled = false,
  required = false,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  onBlur,
  inputRef,
  trailingIconLabel,
}: TextFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {showLabel ? (
        <Text
          variant="caption"
          weight="semibold"
          tone="muted"
          accessibilityLabel={label}
          style={[styles.label, { letterSpacing: theme.tracking.wide }]}
        >
          {label}
          {required ? ` * (${t('field.required')})` : ''}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            height: FIELD_HEIGHT,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.bgSurface,
            borderColor: error ? theme.colors.statusDanger : theme.colors.borderInteractive,
            opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          editable={!disabled}
          accessibilityLabel={showLabel ? undefined : label}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />
        {trailingIcon ? (
          onTrailingIconPress ? (
            <IconButton
              icon={trailingIcon}
              onPress={onTrailingIconPress}
              accessibilityLabel={trailingIconLabel ?? label}
              variant="ghost"
              size={24}
            />
          ) : (
            <Icon name={trailingIcon} size={16} />
          )
        ) : null}
      </View>

      {error ?? helper ? (
        <Text variant="caption" tone={error ? 'danger' : 'muted'}>
          {error ?? helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1 },
});
