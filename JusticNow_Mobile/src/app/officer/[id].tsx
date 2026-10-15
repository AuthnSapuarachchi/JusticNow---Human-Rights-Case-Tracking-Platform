import { useLocalSearchParams } from 'expo-router';
import { CaseReviewScreen } from '@/features/officer/screens/CaseReviewScreen';

export default function OfficerCaseReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CaseReviewScreen caseId={id} />;
}
