import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';

import { CustomerPhoneConflictError } from '../api';
import { CustomerForm } from '../components/CustomerForm';
import { useCreateCustomer } from '../hooks';
import type { CreateCustomerInput } from '../types';

/**
 * Module-level, NOT an inline literal: `CustomerForm` re-seeds on a new
 * `initialValues` identity, so a fresh object each render would wipe what the
 * agent has typed.
 */
const EMPTY_CUSTOMER: CreateCustomerInput = {
  fullName: '',
  phone: '',
  email: '',
  secondaryContacts: [],
};

export function CreateCustomerScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const profile = useAgentProfile();
  const create = useCreateCustomer();

  const conflict = create.error instanceof CustomerPhoneConflictError;

  function onSubmit(values: CreateCustomerInput) {
    create.mutate(values, {
      // `replace`, not `push` — backing out of the new customer should land on
      // the Customers list, not on a form for a customer that already exists.
      onSuccess: (customer) =>
        router.replace({ pathname: '/customers/[id]', params: { id: customer.id } }),
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <CustomerForm
        title={t('createCustomer.title')}
        submitLabel={t('createCustomer.save')}
        initialValues={EMPTY_CUSTOMER}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        submitting={create.isPending}
        ready={Boolean(profile.data)}
        phoneConflictAt={conflict ? create.failureCount : null}
        // The phone conflict is reported on its own field; anything else lands
        // here, so a network failure never blames the phone.
        formError={create.isError && !conflict ? t(errorMessageKey(create.error)) : undefined}
      />
    </SafeAreaView>
  );
}
