import { useLocalSearchParams } from 'expo-router';

import { CaseDetailScreen } from '@/features/cases/screens/CaseDetailScreen';

export default function CaseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CaseDetailScreen caseId={id} />;
}