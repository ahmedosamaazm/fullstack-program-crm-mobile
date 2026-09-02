import { useLocalSearchParams } from 'expo-router';

import { TicketDetailScreen } from '@/features/tickets';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TicketDetailScreen ticketId={id} />;
}
