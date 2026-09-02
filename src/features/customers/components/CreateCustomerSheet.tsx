import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';

import { CustomerPhoneConflictError, toListItemFromDetail } from '../api';
import type { CreateCustomerInput, CustomerListItem } from '../types';
import { useCreateCustomer } from '../hooks';
import { CustomerForm } from './CustomerForm';

export type CreateCustomerSheetProps = {
  visible: boolean;
  /** Cancel, backdrop, or Android back. Does NOT fire after a successful save. */
  onClose: () => void;
  /** The created customer, already narrowed to the shape a list row and a picker need. */
  onCreated: (customer: CustomerListItem) => void;
  /** Prefills Full name — the picker's search term when it found no match. */
  initialFullName?: string;
};

/**
 * Reuses `CustomerForm` and `useCreateCustomer` (story 11) as-is — no field,
 * validation rule or mutation is duplicated here. This is the third host of
 * `CustomerForm`, after `CreateCustomerScreen` and `EditCustomerScreen`; it
 * differs from `CreateCustomerScreen` only in what happens on success.
 *
 * Hosted in a `Modal`, not `BottomSheet`: `CustomerForm` renders its own
 * `ModalHeader` and a `flex: 1` `KeyboardAvoidingView`, while `BottomSheet`
 * puts children in an auto-height padded `View` with no `flex` on the path —
 * a `flex: 1` child there measures to zero height.
 */
export function CreateCustomerSheet({
  visible,
  onClose,
  onCreated,
  initialFullName,
}: CreateCustomerSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {visible ? (
        <CreateCustomerSheetBody
          onClose={onClose}
          onCreated={onCreated}
          initialFullName={initialFullName}
        />
      ) : null}
    </Modal>
  );
}

type CreateCustomerSheetBodyProps = {
  onClose: () => void;
  onCreated: (customer: CustomerListItem) => void;
  initialFullName?: string;
};

/**
 * Split out and gated on `visible` above, so that closing the sheet unmounts
 * this component and everything it holds. Without that, a cancelled draft and
 * a stale `create.isError` both survive into the next open — the agent
 * reopens the form to somebody else's half-typed name and a red duplicate-
 * phone error about a phone they never entered.
 */
function CreateCustomerSheetBody({ onClose, onCreated, initialFullName }: CreateCustomerSheetBodyProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const profile = useAgentProfile();
  const create = useCreateCustomer();

  const conflict = create.error instanceof CustomerPhoneConflictError;

  const initialValues = useMemo<CreateCustomerInput>(
    // A stable identity per `initialFullName` — CustomerForm re-seeds the form
    // whenever this object's identity changes, so an inline literal would wipe
    // every keystroke.
    () => ({ fullName: initialFullName ?? '', phone: '', email: '', secondaryContacts: [] }),
    [initialFullName],
  );

  function onSubmit(values: CreateCustomerInput) {
    create.mutate(values, {
      // The one divergence from CreateCustomerScreen, which router.replace()s
      // to /customers/[id]. Inline creation must return to the ticket form —
      // BRD `:638` — so the caller decides, not this component.
      onSuccess: (customer) => onCreated(toListItemFromDetail(customer)),
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <CustomerForm
        title={t('createCustomer.title')}
        submitLabel={t('createCustomer.save')}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onClose}
        submitting={create.isPending}
        ready={Boolean(profile.data)}
        phoneConflictAt={conflict ? create.failureCount : null}
        formError={create.isError && !conflict ? t(errorMessageKey(create.error)) : undefined}
      />
    </SafeAreaView>
  );
}
