import { useLocalSearchParams } from 'expo-router';
import { UpdateStatusScreen } from '@/features/officer/screens/UpdateStatusScreen';

export default function OfficerUpdateStatusRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UpdateStatusScreen caseId={id} />;
}
