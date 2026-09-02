import { useLocalSearchParams } from 'expo-router';

import { EditCustomerScreen } from '@/features/customers';

export default function EditCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCustomerScreen customerId={id} />;
}
