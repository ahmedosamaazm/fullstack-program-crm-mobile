import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, ModalHeader, SkeletonList } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';

import { CustomerNotEditableError, CustomerPhoneConflictError, toCustomerInput } from '../api';
import { CustomerForm } from '../components/CustomerForm';
import { useCustomerDetail, useUpdateCustomer } from '../hooks';
import type { CreateCustomerInput } from '../types';

export type EditCustomerScreenProps = { customerId: string };

function formErrorKey(error: unknown): string {
  if (error instanceof CustomerNotEditableError) return 'editCustomer.errors.notEditable';
  return errorMessageKey(error);
}

export function EditCustomerScreen({ customerId }: EditCustomerScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // The SAME query the profile screen already ran, so opening the editor from
  // the profile is a cache hit and the form is populated on the first frame.
  const detail = useCustomerDetail(customerId);
  const update = useUpdateCustomer(customerId);

  // Memoised: `CustomerForm` re-seeds on a new `initialValues` identity, and an
  // unmemoised mapper returns a new object every render — which would wipe
  // whatever the agent is typing.
  const initialValues = useMemo(
    () => (detail.data ? toCustomerInput(detail.data) : null),
    [detail.data],
  );

  const conflict = update.error instanceof CustomerPhoneConflictError;

  function onSubmit(values: CreateCustomerInput) {
    // `back()`, not `replace` — the editor was pushed over the profile, and the
    // profile is exactly where the agent should land to see their change.
    update.mutate(values, { onSuccess: () => router.back() });
  }

  if (detail.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
        {/* The header renders first so Cancel works while the read is in
            flight. The form is NOT mounted with empty values — an agent who
            types into a field that is about to be re-seeded loses the keystroke. */}
        <ModalHeader title={t('editCustomer.title')} onCancel={() => router.back()} />
        <View style={{ padding: theme.spacing.lg }}>
          <SkeletonList count={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail.isError && !initialValues) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
        <ModalHeader title={t('editCustomer.title')} onCancel={() => router.back()} />
        <ErrorState title={t('customerDetail.notFound')} />
      </SafeAreaView>
    );
  }

  if (detail.isError || !initialValues) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
        <ModalHeader title={t('editCustomer.title')} onCancel={() => router.back()} />
        <ErrorState onRetry={() => detail.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <CustomerForm
        title={t('editCustomer.title')}
        submitLabel={t('createCustomer.save')}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        submitting={update.isPending}
        // No org fields are sent on update, so there is nothing to wait for.
        ready
        phoneConflictAt={conflict ? update.failureCount : null}
        formError={update.isError && !conflict ? t(formErrorKey(update.error)) : undefined}
      />
    </SafeAreaView>
  );
}
