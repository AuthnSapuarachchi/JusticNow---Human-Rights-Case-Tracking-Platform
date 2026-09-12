import { useLocalSearchParams } from 'expo-router';

import { RightsDetailScreen } from '@/features/know-your-rights/screens/RightsDetailScreen';

export default function RightsDetailRoute() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  return <RightsDetailScreen categoryId={categoryId} />;
}
