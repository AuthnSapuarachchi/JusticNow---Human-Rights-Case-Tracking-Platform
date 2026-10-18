import { useLocalSearchParams } from 'expo-router';
import { ComplaintDetailScreen } from '@/features/admin/screens/ComplaintDetailScreen';

export default function AdminComplaintDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComplaintDetailScreen complaintId={id} />;
}
