import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  BottomSheet,
  EmptyState,
  ErrorState,
  RowGroup,
  SettingsRow,
  SkeletonList,
} from '@/core/components';
import { useLocalisedName } from '@/core/hooks';

import { useCategories } from '../hooks';
import type { TicketCategory } from '../types';

export type CategoryPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (category: TicketCategory) => void;
};

const LIST_MIN_HEIGHT = 200;

export function CategoryPickerSheet({
  visible,
  onClose,
  selectedId,
  onSelect,
}: CategoryPickerSheetProps) {
  const { t } = useTranslation();
  const nameOf = useLocalisedName();
  const categories = useCategories(visible);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('createTicket.category.title')}>
      <View style={{ minHeight: LIST_MIN_HEIGHT }}>
        {categories.isPending ? (
          <SkeletonList count={5} />
        ) : categories.isError ? (
          <ErrorState onRetry={() => categories.refetch()} />
        ) : (categories.data ?? []).length === 0 ? (
          // Real whenever a department has no categories and no shared ones —
          // the form is unsubmittable, and an empty sheet with no explanation is
          // indistinguishable from a broken query.
          <EmptyState icon="inbox" title={t('createTicket.category.empty')} />
        ) : (
          <RowGroup dividerInset="label">
            {(categories.data ?? []).map((category) => (
              <SettingsRow
                key={category.id}
                type="link"
                icon={category.id === selectedId ? 'check' : undefined}
                label={nameOf(category.name) ?? ''}
                onPress={() => onSelect(category)}
              />
            ))}
          </RowGroup>
        )}
      </View>
    </BottomSheet>
  );
}
