import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { CaseMessagingScreen } from '@/features/messaging/screens/CaseMessagingScreen';

export default function CaseMessagesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  return <CaseMessagingScreen caseId={id} currentUserId={String(session?.user.id ?? '')} />;
}