import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Dropzone,
  Icon,
  IconButton,
  ModalHeader,
  Text,
  TextArea,
  TextField,
} from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';
import { CreateCustomerSheet, type CustomerListItem } from '@/features/customers';

import { CategoryPickerSheet } from '../components/CategoryPickerSheet';
import { CustomerPickerSheet } from '../components/CustomerPickerSheet';
import { PriorityChip } from '../components/PriorityChip';
import { useCreateTicket } from '../hooks';
import type { CreateTicketInput, TicketCategory, TicketPriority } from '../types';

const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const CUSTOMER_CARD_HEIGHT = 46; // Figma 7:4049.
const CHIP_CLEAR_SIZE = 24;

export function CreateTicketScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();

  const profile = useAgentProfile();
  const create = useCreateTicket();

  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  // `null` = closed. A string (possibly empty) = open, with that name prefilled.
  // One state, not two — a boolean plus a name can disagree, and the disagreement
  // shows as a sheet that opens blank after the picker prefilled it.
  const [newCustomerName, setNewCustomerName] = useState<string | null>(null);

  // The ids live in the form (validation and submission in one place); the
  // DISPLAY values do not — a chip needs a name, and a name is not an id.
  const [customer, setCustomer] = useState<CustomerListItem | null>(null);
  const [category, setCategory] = useState<TicketCategory | null>(null);
  // Read twice below (the accessibility label and the visible Text) — resolve once.
  const categoryLabel = nameOf(category?.name ?? null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    defaultValues: {
      customerId: '',
      subject: '',
      description: '',
      categoryId: '',
      // BRD `:617` — medium is the default, and it is SELECTED in the UI from
      // the first frame, not applied silently by the column default on save.
      priority: 'medium',
    },
    mode: 'onSubmit',
  });

  const priority = watch('priority');

  function handleCustomerSelect(next: CustomerListItem) {
    setCustomer(next);
    // `shouldValidate` clears a "choose a customer" error the moment one is
    // chosen, rather than leaving it up until the next save attempt.
    setValue('customerId', next.id, { shouldValidate: true });
    setCustomerPickerVisible(false);
  }

  function handleClearCustomer() {
    setCustomer(null);
    setValue('customerId', '');
  }

  function handleCustomerCreated(next: CustomerListItem) {
    setNewCustomerName(null);
    // Reuses the picker's own selection path — chip, form value and validation
    // clear all happen in exactly one place.
    handleCustomerSelect(next);
  }

  function handleCategorySelect(next: TicketCategory) {
    setCategory(next);
    setValue('categoryId', next.id, { shouldValidate: true });
    setCategoryPickerVisible(false);
  }

  function onSubmit(values: CreateTicketInput) {
    create.mutate(values, {
      onSuccess: (ticket) =>
        router.replace({ pathname: '/tickets/[id]', params: { id: ticket.id } }),
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <ModalHeader
        title={t('createTicket.title')}
        onCancel={() => router.back()}
        actionLabel={t('createTicket.create')}
        onAction={handleSubmit(onSubmit)}
        actionDisabled={create.isPending || !profile.data}
        actionLoading={create.isPending}
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
          {/* Customer */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              weight="semibold"
              tone="muted"
              style={[styles.sectionLabel, { letterSpacing: theme.tracking.wide }]}
            >
              {t('createTicket.customer.label')}
            </Text>

            <Controller
              control={control}
              name="customerId"
              rules={{ required: t('createTicket.errors.customerRequired') }}
              render={() => (
                <Pressable
                  onPress={() => setCustomerPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    customer?.fullName ?? t('createTicket.customer.placeholder')
                  }
                  style={[
                    styles.card,
                    {
                      minHeight: CUSTOMER_CARD_HEIGHT,
                      paddingHorizontal: theme.spacing.md,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.bgSurface,
                      borderColor: errors.customerId
                        ? theme.colors.statusDanger
                        : theme.colors.borderDefault,
                    },
                  ]}
                >
                  {customer ? (
                    <View
                      style={[
                        styles.chip,
                        {
                          gap: theme.spacing.xs,
                          paddingStart: theme.spacing.md,
                          paddingEnd: theme.spacing.xs,
                          paddingVertical: theme.spacing.xs,
                          borderRadius: theme.radius.full,
                          backgroundColor: theme.colors.bgPrimarySubtle,
                        },
                      ]}
                    >
                      <Text variant="caption" weight="medium" tone="link" numberOfLines={1}>
                        {customer.fullName}
                      </Text>
                      <IconButton
                        icon="close"
                        size={CHIP_CLEAR_SIZE}
                        variant="ghost"
                        onPress={handleClearCustomer}
                        accessibilityLabel={t('createTicket.customer.clear')}
                      />
                    </View>
                  ) : (
                    // Figma draws this card populated only — the empty state is
                    // this plan's. Story 13 open question 5.
                    <Text variant="callout" tone="muted">
                      {t('createTicket.customer.placeholder')}
                    </Text>
                  )}
                </Pressable>
              )}
            />

            {errors.customerId ? (
              <Text variant="caption" tone="danger">
                {errors.customerId.message}
              </Text>
            ) : null}

            <View style={styles.linkRow}>
              <Button
                variant="link"
                label={t('createTicket.customer.newCustomer')}
                onPress={() => setNewCustomerName('')}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="subject"
            rules={{
              required: t('createTicket.errors.subjectRequired'),
              validate: (value) =>
                value.trim().length > 0 || t('createTicket.errors.subjectRequired'),
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t('createTicket.subject.label')}
                placeholder={t('createTicket.subject.placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.subject?.message}
                required
                // `TextArea` exposes no `inputRef`, so the chain stops here
                // rather than pretending to move focus to Description.
                returnKeyType="done"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextArea
                label={t('createTicket.description.label')}
                placeholder={t('createTicket.description.placeholder')}
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* Category */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              weight="semibold"
              tone="muted"
              style={[styles.sectionLabel, { letterSpacing: theme.tracking.wide }]}
            >
              {t('createTicket.category.label')}
            </Text>

            <Controller
              control={control}
              name="categoryId"
              rules={{ required: t('createTicket.errors.categoryRequired') }}
              render={() => (
                // Styled as a field but rendered as a button: an
                // editable-looking control that opens a sheet on tap is a worse
                // lie than a button that looks like a field.
                <Pressable
                  onPress={() => setCategoryPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: categoryPickerVisible }}
                  accessibilityLabel={categoryLabel ?? t('createTicket.category.placeholder')}
                  style={[
                    styles.select,
                    {
                      height: 48,
                      paddingHorizontal: theme.spacing.md,
                      gap: theme.spacing.sm,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.bgSurface,
                      borderColor: errors.categoryId
                        ? theme.colors.statusDanger
                        : theme.colors.borderDefault,
                    },
                  ]}
                >
                  <Text
                    variant="callout"
                    tone={category ? 'primary' : 'muted'}
                    numberOfLines={1}
                    style={styles.selectValue}
                  >
                    {categoryLabel ?? t('createTicket.category.placeholder')}
                  </Text>
                  <Icon name="chevronDown" size={16} mirrorInRtl={false} />
                </Pressable>
              )}
            />

            {errors.categoryId ? (
              <Text variant="caption" tone="danger">
                {errors.categoryId.message}
              </Text>
            ) : null}
          </View>

          {/* Priority */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              weight="semibold"
              tone="muted"
              style={[styles.sectionLabel, { letterSpacing: theme.tracking.wide }]}
            >
              {t('createTicket.priority.label')}
            </Text>
            <View accessibilityRole="radiogroup" style={[styles.chipRow, { gap: theme.spacing.sm }]}>
              {PRIORITIES.map((value) => (
                <PriorityChip
                  key={value}
                  priority={value}
                  selected={priority === value}
                  onPress={(next) => setValue('priority', next)}
                  disabled={create.isPending}
                />
              ))}
            </View>
          </View>

          {/* Attachments — the Storage bucket and picker packages both exist
              now (story 24, SCRUM-26, built them for customer attachments).
              A ticket-creation upload path is out of that story's scope, not
              blocked by it. Rendered disabled with a hint rather than
              deleted, so the agent knows it is coming. Story 13 open
              question 3. */}
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              weight="semibold"
              tone="muted"
              style={[styles.sectionLabel, { letterSpacing: theme.tracking.wide }]}
            >
              {t('createTicket.attachments.label')}
            </Text>
            <Dropzone
              label={t('createTicket.attachments.placeholder')}
              hint={t('createTicket.attachments.unavailable')}
              disabled
              onPress={() => {}}
            />
          </View>

          {create.isError ? (
            <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite">
              {t(errorMessageKey(create.error))}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomerPickerSheet
        visible={customerPickerVisible}
        onClose={() => setCustomerPickerVisible(false)}
        onSelect={handleCustomerSelect}
        onRequestCreate={(prefill) => {
          setCustomerPickerVisible(false);
          setNewCustomerName(prefill);
        }}
      />

      <CategoryPickerSheet
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        selectedId={category?.id ?? null}
        onSelect={handleCategorySelect}
      />

      <CreateCustomerSheet
        visible={newCustomerName !== null}
        initialFullName={newCustomerName ?? undefined}
        onClose={() => setNewCustomerName(null)}
        onCreated={handleCustomerCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { textTransform: 'uppercase' },
  card: { justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  select: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  selectValue: { flex: 1 },
  chipRow: { flexDirection: 'row' },
  linkRow: { flexDirection: 'row' },
});
