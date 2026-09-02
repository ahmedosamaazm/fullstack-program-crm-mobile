import { useLocalSearchParams } from 'expo-router';

import { CustomerDetailScreen } from '@/features/customers';
// The real `TicketRow`, injected into the screen rather than let the
// `customers` feature import it directly — see
// `features/customers/components/CustomerTicketsTab.tsx`'s doc comment.
// This route file sits outside both feature barrels' reachable module
// graphs, so importing from each here creates no cycle.
import { TicketRow } from '@/features/tickets';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerDetailScreen customerId={id} ticketRowComponent={TicketRow} />;
}
