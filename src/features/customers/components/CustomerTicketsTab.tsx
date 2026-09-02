import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
// TYPE-ONLY — erased at compile time, creates no runtime edge to
// `@/features/tickets`. The VALUE `TicketRow` is deliberately NOT imported
// here; it is injected via the `TicketRowComponent` prop instead. Importing
// it directly would recreate the cross-feature barrel cycle this component
// used to have with `features/tickets/components/CustomerPickerSheet.tsx`
// (which imports `CustomerRow` from this feature's barrel) — see plan
// `14-story-customer-interaction-history-SCRUM-25.md`, open question 1.
import type { TicketListItem } from '@/features/tickets';

import type { CustomerDetail, CustomerTicket } from '../types';

/**
 * The shape `TicketRow` needs to render a ticket. Kept intentionally narrow —
 * `TicketRow`'s real prop type has more optional props (`onClaim`, `claiming`),
 * which this tab never uses, and a component satisfying the wider type is
 * assignable here structurally.
 */
export type TicketRowRenderer = ComponentType<{
  ticket: TicketListItem;
  onPress: (id: string) => void;
}>;

export type CustomerTicketsTabProps = {
  customer: CustomerDetail;
  /**
   * Injected rather than imported — see the note on the `@/features/tickets`
   * import above. The route (`src/app/customers/[id].tsx`) supplies the real
   * `TicketRow` from `@/features/tickets`; it sits outside both feature
   * barrels' reachable module graphs, so nothing there can create a cycle.
   */
  TicketRowComponent: TicketRowRenderer;
};

/**
 * `CustomerTicket` → `TicketListItem`. The only added field is `customerName`,
 * which is this profile's own customer — redundant in context, but Figma
 * (node `7:4400`) prints it on every card and `TicketRow` renders
 * `reference · name` as one meta line. Passing `null` would silently drop the
 * separator too.
 */
function toRowItem(ticket: CustomerTicket, customerName: string): TicketListItem {
  return { ...ticket, customerName };
}

function handleTicketPress(id: string) {
  router.push({ pathname: '/tickets/[id]', params: { id } });
}

export function CustomerTicketsTab({ customer, TicketRowComponent }: CustomerTicketsTabProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // No loading and no error branch here — the tickets arrive in the same
  // response as the header's name, so `CustomerDetailScreen`'s screen-level
  // states already cover both; a tab-level spinner could never fire.
  if (customer.tickets.length === 0) {
    return <EmptyState icon="tickets" title={t('customerDetail.empty.tickets')} />;
  }

  return (
    <FlatList
      data={customer.tickets}
      keyExtractor={(ticket) => ticket.id}
      // White cards need a non-white ground. `CustomerDetailScreen` paints the
      // whole screen `bgSurface` for the header's benefit, which left these cards
      // invisible — worse on Android, where the `overflow: 'hidden'` below also
      // drops their shadow. Story 14's spec table already named bgCanvas.
      style={{ backgroundColor: theme.colors.bgCanvas }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
      }}
      renderItem={({ item }) => (
        <View
          style={{
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.bgSurface,
            // Figma TicketCard is px-14. The rail is now a rounded child inside
            // this padding rather than a border on the row, so the card no
            // longer needs `overflow: 'hidden'` to clip a square corner — which
            // means it keeps its elevation on Android too.
            paddingHorizontal: theme.spacing.md,
            ...theme.elevation.e1,
          }}
        >
          <TicketRowComponent
            ticket={toRowItem(item, customer.fullName)}
            onPress={handleTicketPress}
          />
        </View>
      )}
    />
  );
}
