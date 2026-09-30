import { useLocalSearchParams } from 'expo-router';
import { AdminCaseDetailScreen } from '@/features/admin/screens/AdminCaseDetailScreen';

export default function AdminCaseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdminCaseDetailScreen caseId={id} />;
}
