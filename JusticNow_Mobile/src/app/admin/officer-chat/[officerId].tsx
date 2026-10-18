import { useLocalSearchParams } from 'expo-router';
import { StaffChatScreen } from '@/features/staff-chat/screens/StaffChatScreen';

export default function AdminOfficerChatRoute() {
  const { officerId, complaintId } = useLocalSearchParams<{ officerId: string; complaintId?: string }>();
  return <StaffChatScreen complaintId={complaintId ? Number(complaintId) : undefined} officer={Number(officerId)} />;
}
