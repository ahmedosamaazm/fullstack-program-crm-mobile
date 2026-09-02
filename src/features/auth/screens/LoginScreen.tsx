import { useRef, useState, type ComponentRef } from 'react';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LanguageToggle, Text, TextField, TextInput } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { EMAIL_PATTERN } from '@/core/utils';

import { useSignIn } from '../hooks';
import type { SignInInput } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro's static-asset convention requires `require()`, not an ES import, for local images.
const azmMark = require('../../../../assets/brand/azm-mark.png');

export function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [revealed, setRevealed] = useState(false);
  const { mutate, isPending, error } = useSignIn();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ defaultValues: { email: '', password: '' }, mode: 'onSubmit' });

  function onSubmit(values: SignInInput) {
    mutate(values);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', gap: theme.spacing.lg, marginBottom: theme.spacing.xxl }}>
          <Image
            source={azmMark}
            style={{ width: 64, height: 63 }}
            accessibilityRole="image"
            accessibilityLabel={t('common.appName')}
          />
          <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="display" weight="bold" align="center">
              {t('common.appName')}
            </Text>
            <Text variant="callout" tone="muted" align="center">
              {t('auth.tagline')}
            </Text>
          </View>
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t('auth.errors.emailRequired'),
              pattern: { value: EMAIL_PATTERN, message: t('auth.errors.emailInvalid') },
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            )}
          />

          <View style={{ gap: theme.spacing.sm }}>
            <Controller
              control={control}
              name="password"
              rules={{ required: t('auth.errors.passwordRequired') }}
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t('auth.passwordLabel')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!revealed}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  trailingIcon={revealed ? 'eyeOff' : 'eye'}
                  onTrailingIconPress={() => setRevealed((v) => !v)}
                  trailingIconLabel={t(revealed ? 'auth.hidePassword' : 'auth.showPassword')}
                  inputRef={passwordRef}
                />
              )}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button
                variant="link"
                label={t('auth.forgotPassword')}
                onPress={() => router.push('/(auth)/forgot-password')}
              />
            </View>
          </View>

          <Button
            variant="primary"
            fullWidth
            label={t('auth.signIn')}
            loading={isPending}
            disabled={isPending}
            onPress={handleSubmit(onSubmit)}
          />

          {error ? (
            <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite">
              {t(error.messageKey)}
            </Text>
          ) : null}

          <Text variant="caption" tone="muted" align="center">
            {t('auth.helper')}
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: theme.spacing.xl, alignItems: 'center' }}>
        <LanguageToggle />
      </View>
    </SafeAreaView>
  );
}
