import { useLocalSearchParams } from 'expo-router';

import { TicketsScreen } from '@/features/tickets';

export default function Tickets() {
  const { filter, nonce } = useLocalSearchParams<{ filter?: string; nonce?: string }>();
  return <TicketsScreen requestedFilter={filter} requestedFilterNonce={nonce} />;
}
