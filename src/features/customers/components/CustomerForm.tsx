import { useEffect, useRef, type ComponentRef } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  DetailRow,
  IconButton,
  ModalHeader,
  Skeleton,
  Text,
  TextField,
  TextInput,
} from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { EMAIL_PATTERN, PHONE_PATTERN } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';

import type { CreateCustomerInput } from '../types';

export type CustomerFormProps = {
  /** Modal title. */
  title: string;
  /** Header action label — "Save" on both screens today. */
  submitLabel: string;
  initialValues: CreateCustomerInput;
  onSubmit: (values: CreateCustomerInput) => void;
  onCancel: () => void;
  submitting: boolean;
  /** Blocks submission while the agent's profile is still loading. */
  ready: boolean;
  /**
   * The parent's failure count at the moment the server rejected the phone as a
   * duplicate, or `null` when the last attempt was not a conflict.
   *
   * A BOOLEAN cannot work here. React Hook Form clears field errors at the
   * start of every submit, so the error has to be re-set after each rejection —
   * but a boolean stays `true` across a second identical duplicate submit, the
   * effect never re-runs, and the user is left staring at a form that silently
   * did nothing. The count changes on every failure, so the effect always fires.
   */
  phoneConflictAt: number | null;
  /** Rendered under the form when the failure is not field-specific. */
  formError?: string;
};

/**
 * The one customer form. Create and edit differ only in title, initial values
 * and what `onSubmit` does — everything below is shared, so the fields, the
 * validation and the contacts editor exist exactly once (hard rule 2).
 *
 * The parent owns the mutation and therefore owns the error; this component
 * owns the fields and therefore owns where the message lands.
 */
export function CustomerForm({
  title,
  submitLabel,
  initialValues,
  onSubmit,
  onCancel,
  submitting,
  ready,
  phoneConflictAt,
  formError,
}: CustomerFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();

  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);

  const profile = useAgentProfile();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    defaultValues: initialValues,
    // `defaultValues` alone is captured once on mount, and the edit screen can
    // render before its cache read resolves. `values` re-seeds on a new
    // identity — which is why every caller must pass a STABLE object.
    values: initialValues,
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'secondaryContacts' });

  useEffect(() => {
    if (phoneConflictAt === null) return;
    setError('phone', { type: 'conflict', message: t('createCustomer.errors.phoneDuplicate') });
  }, [phoneConflictAt, setError, t]);

  return (
    <>
      <ModalHeader
        title={title}
        onCancel={onCancel}
        actionLabel={submitLabel}
        onAction={handleSubmit(onSubmit)}
        actionDisabled={submitting || !ready}
        actionLoading={submitting}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.xxxl,
            gap: theme.spacing.xl,
          }}
        >
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: t('createCustomer.errors.nameRequired'),
              validate: (value) =>
                value.trim().length > 0 || t('createCustomer.errors.nameRequired'),
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t('createCustomer.nameLabel')}
                placeholder={t('createCustomer.namePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                required
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            rules={{
              required: t('createCustomer.errors.phoneRequired'),
              pattern: { value: PHONE_PATTERN, message: t('createCustomer.errors.phoneInvalid') },
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t('createCustomer.phoneLabel')}
                placeholder={t('createCustomer.phonePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                required
                keyboardType="phone-pad"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                inputRef={phoneRef}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              validate: (value) =>
                value.trim() === '' ||
                EMAIL_PATTERN.test(value.trim()) ||
                t('createCustomer.errors.emailInvalid'),
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t('createCustomer.emailLabel')}
                placeholder={t('createCustomer.emailPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                inputRef={emailRef}
              />
            )}
          />

          {/* Secondary contacts */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              weight="semibold"
              tone="muted"
              style={[styles.sectionLabel, { letterSpacing: theme.tracking.wide }]}
            >
              {t('createCustomer.secondaryContacts')}
            </Text>

            {fields.length > 0 ? (
              <View
                style={{
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.borderDefault,
                  backgroundColor: theme.colors.bgSurface,
                }}
              >
                {fields.map((field, index) => (
                  <View key={field.id} style={[styles.contactRow, { gap: theme.spacing.sm }]}>
                    <View style={{ flex: 1, gap: theme.spacing.sm }}>
                      <Controller
                        control={control}
                        name={`secondaryContacts.${index}.label`}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <TextField
                            label={t('createCustomer.contactNameLabel')}
                            showLabel={false}
                            placeholder={t('createCustomer.contactNamePlaceholder')}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name={`secondaryContacts.${index}.value`}
                        rules={{
                          validate: (value) =>
                            value.trim() === '' ||
                            PHONE_PATTERN.test(value) ||
                            t('createCustomer.errors.phoneInvalid'),
                        }}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <TextField
                            label={t('createCustomer.contactPhoneLabel')}
                            showLabel={false}
                            placeholder={t('createCustomer.contactPhonePlaceholder')}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={errors.secondaryContacts?.[index]?.value?.message}
                            keyboardType="phone-pad"
                            autoCorrect={false}
                          />
                        )}
                      />
                    </View>

                    {/* Not in Figma — an agent who adds a row by mistake would
                        otherwise have no way back. Story 11 open question 6. */}
                    <IconButton
                      icon="close"
                      size={32}
                      variant="ghost"
                      onPress={() => remove(index)}
                      accessibilityLabel={t('createCustomer.removeContact')}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.linkRow}>
              <Button
                variant="link"
                label={t('createCustomer.addContact')}
                onPress={() => append({ label: '', value: '' })}
              />
            </View>
          </View>

          {/* Department and branch are inherited from the agent, never chosen —
              API §3.3: RLS rejects any other value. Story 11 open question 1. */}
          <View style={{ gap: theme.spacing.xs }}>
            <DetailRow
              label={t('createCustomer.departmentLabel')}
              valueSlot={
                profile.isPending ? (
                  <Skeleton width={120} height={14} />
                ) : (
                  <Text variant="callout">
                    {nameOf(profile.data?.department ?? null) ?? t('customerDetail.info.unknown')}
                  </Text>
                )
              }
            />
            <DetailRow
              label={t('createCustomer.branchLabel')}
              valueSlot={
                profile.isPending ? (
                  <Skeleton width={120} height={14} />
                ) : (
                  <Text variant="callout">
                    {nameOf(profile.data?.branch ?? null) ?? t('customerDetail.info.unknown')}
                  </Text>
                )
              }
            />
            <Text variant="caption" tone="muted">
              {t('createCustomer.inherited')}
            </Text>
          </View>

          {profile.isError ? (
            <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
              <Text variant="caption" tone="danger" align="center">
                {t('states.errorBody')}
              </Text>
              <Button
                variant="secondary"
                label={t('common.retry')}
                onPress={() => void profile.refetch()}
              />
            </View>
          ) : null}

          {formError ? (
            <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { textTransform: 'uppercase' },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start' },
  linkRow: { flexDirection: 'row' },
});
