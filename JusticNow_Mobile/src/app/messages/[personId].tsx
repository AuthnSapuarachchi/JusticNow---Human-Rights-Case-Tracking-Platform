import { useLocalSearchParams } from 'expo-router';

import { CaseMessagingScreen } from '@/features/messaging/screens/CaseMessagingScreen';
import { useAuth } from '@/context/AuthContext';

export default function PersonMessagesRoute() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const { session } = useAuth();
  return <CaseMessagingScreen caseId={process.env.EXPO_PUBLIC_CHAT_CASE_ID ?? 'JN-2026-0412'} currentUserId={String(session?.user.id ?? '')} participantId={personId} />;
}