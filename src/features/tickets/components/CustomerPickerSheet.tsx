import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, View } from 'react-native';

import {
  Button,
  EmptyState,
  ErrorState,
  BottomSheet,
  SearchField,
  SkeletonList,
} from '@/core/components';
import { useDebounce } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { CustomerRow, useCustomerSearch, type CustomerListItem } from '@/features/customers';

export type CustomerPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerListItem) => void;
  /** Offered from the empty state. `prefill` is the search term when it reads like a name. */
  onRequestCreate: (prefill: string) => void;
};

const LIST_HEIGHT = 360;

/**
 * The search box takes names, phones and emails (story 05's `ilike` over all
 * three), and the form's Full name field takes only the first. A term with a
 * digit in it is almost certainly a partial phone, and a half phone number
 * dropped into Full name is worse than an empty field.
 *
 * The phone case is deliberately NOT routed to the phone field — see story
 * 16's open question 3.
 */
function prefillName(search: string): string {
  return /\d/.test(search) ? '' : search.trim();
}

/**
 * Consumes `useCustomerSearch` from the customers barrel — the seam story 05
 * built and left unused. It resolves to the SAME cache entry as the Customers
 * tab's own query, so a search an agent already ran there is served instantly.
 * Do not write a second customer query here.
 */
export function CustomerPickerSheet({
  visible,
  onClose,
  onSelect,
  onRequestCreate,
}: CustomerPickerSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const search = useDebounce(query, 300);
  const list = useCustomerSearch(search);

  // Reopening onto a stale search is confusing and costs a refetch.
  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const customers = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);

  function handleEndReached() {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('createTicket.customerPicker.title')}>
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t('createTicket.customerPicker.searchPlaceholder')}
        onClear={() => setQuery('')}
      />

      <View style={{ height: LIST_HEIGHT, marginTop: theme.spacing.md }}>
        {list.isPending ? (
          <SkeletonList count={5} />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : customers.length === 0 ? (
          <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
            <EmptyState
              icon="search"
              title={t('createTicket.customerPicker.empty', { query: search })}
            />
            <Button
              variant="link"
              label={t('createTicket.customer.newCustomer')}
              onPress={() => onRequestCreate(prefillName(search))}
            />
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <CustomerRow
                customer={item}
                onPress={() => onSelect(item)}
                divider={index < customers.length - 1}
              />
            )}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              list.isFetchingNextPage ? (
                <View style={{ paddingVertical: theme.spacing.lg }}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </BottomSheet>
  );
}
