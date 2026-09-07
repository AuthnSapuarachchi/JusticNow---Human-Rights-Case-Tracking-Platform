import { useLocalSearchParams } from 'expo-router';

import { RequestSupportScreen } from '@/features/legal-directory/screens/RequestSupportScreen';

export default function RequestSupportRoute() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  return <RequestSupportScreen organizationId={orgId} />;
}
