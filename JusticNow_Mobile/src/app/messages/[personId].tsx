import { useLocalSearchParams } from 'expo-router';

import { CaseMessagingScreen } from '@/features/messaging/screens/CaseMessagingScreen';

export default function PersonMessagesRoute() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  return <CaseMessagingScreen caseId="JN-2026-0412" currentUserId="citizen-001" participantId={personId} />;
}