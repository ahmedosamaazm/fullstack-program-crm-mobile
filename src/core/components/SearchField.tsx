import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { TextInput } from './TextInput';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
};

const HEIGHT = 44;

export function SearchField({ value, onChangeText, placeholder, onSubmit, onClear, autoFocus }: SearchFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.root,
        {
          height: HEIGHT,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.bgSurfaceSunken,
          borderColor: theme.colors.borderDefault,
        },
      ]}
    >
      <Icon name="search" size={16} color={theme.colors.iconDefault} />
      <TextInput
        variant="callout"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('common.search')}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        accessibilityLabel={t('common.search')}
        style={styles.input}
      />
      {value.length > 0 && onClear ? (
        <IconButton icon="close" onPress={onClear} accessibilityLabel={t('common.clear')} variant="ghost" size={24} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  input: { flex: 1 },
});
