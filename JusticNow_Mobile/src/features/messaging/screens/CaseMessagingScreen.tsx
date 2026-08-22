import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMessages, markMessageAsRead, Message, sendMessage } from '@/api/messagingApi';

interface CaseMessagingScreenProps {
  caseId: string;
  currentUserId: string;
  participantId?: string;
}

const formatTime = (createdAt: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(createdAt));

export function CaseMessagingScreen({ caseId, currentUserId, participantId }: CaseMessagingScreenProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getMessages(caseId).then((loadedMessages) => {
      if (isMounted) setMessages(loadedMessages);
    }).catch(() => {
      if (isMounted) setError('Unable to load messages. Please try again.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [caseId]);

  const officerName = useMemo(() => messages.find((message) => message.senderRole === 'Officer')?.senderName ?? 'Case Officer', [messages]);
  const visibleMessages = useMemo(() => participantId ? messages.filter((message) => message.senderId === participantId || message.senderId === currentUserId) : messages, [currentUserId, messages, participantId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setDraft('');
    try {
      const sentMessage = await sendMessage(caseId, { content });
      setMessages((currentMessages) => [...currentMessages, { ...sentMessage, senderId: currentUserId }]);
    } catch {
      setDraft(content);
      setError('Unable to send your message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkRead = (message: Message) => {
    if (!message.isRead && message.senderId !== currentUserId) {
      setMessages((currentMessages) => currentMessages.map((item) => item.id === message.id ? { ...item, isRead: true } : item));
      markMessageAsRead(message.id).catch(() => undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back to messages" onPress={() => router.replace('/messages')} style={styles.iconButton}><Ionicons name="arrow-back" size={24} color="#12212b" /></Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.officerName}>{officerName}</Text>
            <View style={styles.caseLabel}><Ionicons name="lock-closed" size={12} color="#6c7b84" /><Text style={styles.caseId}>{caseId}</Text></View>
          </View>
          <Pressable accessibilityLabel="More options" style={styles.iconButton}><Ionicons name="ellipsis-vertical" size={22} color="#12212b" /></Pressable>
        </View>
        <View style={styles.encryptionPill}><Ionicons name="lock-closed" size={13} color="#28725b" /><Text style={styles.encryptionText}>End-to-end encrypted chat started</Text></View>

        {isLoading ? <View style={styles.centerState}><ActivityIndicator color="#28725b" /><Text style={styles.stateText}>Loading secure messages...</Text></View> : error && messages.length === 0 ? <View style={styles.centerState}><Text style={styles.errorText}>{error}</Text></View> : <FlatList
          contentContainerStyle={styles.messageList}
          data={visibleMessages}
          keyExtractor={(message) => message.id}
          ListHeaderComponent={<Text style={styles.dateDivider}>Today</Text>}
          renderItem={({ item }) => {
            const isSent = item.senderId === currentUserId;
            return <Pressable onPress={() => handleMarkRead(item)} style={[styles.messageRow, isSent && styles.sentRow]}>
              {!item.isRead && !isSent ? <View style={styles.unreadDot} /> : null}
              <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
                {!isSent ? <Text style={styles.senderRole}>{item.senderRole}</Text> : null}
                <Text style={[styles.messageText, isSent && styles.sentMessageText]}>{item.content}</Text>
                <View style={styles.messageMeta}><Text style={[styles.timestamp, isSent && styles.sentTimestamp]}>{formatTime(item.createdAt)}</Text>{isSent ? <Ionicons name="checkmark-done" size={16} color="#b8e4d7" /> : null}</View>
              </View>
            </Pressable>;
          }}
        />}
        {error && messages.length > 0 ? <Text style={styles.inlineError}>{error}</Text> : null}
        <View style={styles.inputBar}>
          <Pressable accessibilityLabel="Add attachment" style={styles.addButton}><Ionicons name="add" size={24} color="#28725b" /></Pressable>
          <TextInput multiline onChangeText={setDraft} placeholder="Type a secure message..." placeholderTextColor="#8a989e" style={styles.input} value={draft} />
          <Pressable accessibilityLabel="Send message" disabled={!draft.trim() || isSending} onPress={handleSend} style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}><Ionicons name="send" size={18} color="#ffffff" /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f8f7' }, container: { flex: 1 },
  header: { alignItems: 'center', backgroundColor: '#ffffff', borderBottomColor: '#e5ebe8', borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12 }, iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 }, headerCopy: { flex: 1, marginLeft: 4 }, officerName: { color: '#12212b', fontSize: 17, fontWeight: '700' }, caseLabel: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 }, caseId: { color: '#6c7b84', fontSize: 12, fontWeight: '600' },
  encryptionPill: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#e2f2ed', borderRadius: 20, flexDirection: 'row', gap: 6, marginTop: 18, paddingHorizontal: 13, paddingVertical: 8 }, encryptionText: { color: '#28725b', fontSize: 12, fontWeight: '600' }, centerState: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 24 }, stateText: { color: '#6c7b84', fontSize: 14 }, errorText: { color: '#a33b3b', fontSize: 14, textAlign: 'center' },
  messageList: { paddingBottom: 12, paddingHorizontal: 16, paddingTop: 18 }, dateDivider: { alignSelf: 'center', color: '#7b898f', fontSize: 12, fontWeight: '700', marginBottom: 18, textTransform: 'uppercase' }, messageRow: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 14 }, sentRow: { justifyContent: 'flex-end' }, unreadDot: { backgroundColor: '#d06c43', borderRadius: 4, height: 8, marginRight: 6, marginTop: 10, width: 8 }, bubble: { borderRadius: 18, maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 }, receivedBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 5 }, sentBubble: { backgroundColor: '#1f5d56', borderBottomRightRadius: 5 }, senderRole: { color: '#28725b', fontSize: 11, fontWeight: '700', marginBottom: 4 }, messageText: { color: '#23343d', fontSize: 15, lineHeight: 21 }, sentMessageText: { color: '#ffffff' }, messageMeta: { alignItems: 'center', flexDirection: 'row', gap: 5, justifyContent: 'flex-end', marginTop: 5 }, timestamp: { color: '#8a989e', fontSize: 11 }, sentTimestamp: { color: '#b8d0cb' }, inlineError: { color: '#a33b3b', fontSize: 12, paddingBottom: 6, paddingHorizontal: 16 },
  inputBar: { alignItems: 'center', backgroundColor: '#ffffff', borderTopColor: '#e5ebe8', borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }, addButton: { alignItems: 'center', justifyContent: 'center', width: 32 }, input: { backgroundColor: '#f0f4f2', borderRadius: 22, color: '#23343d', flex: 1, fontSize: 14, maxHeight: 96, paddingHorizontal: 16, paddingVertical: 11 }, sendButton: { alignItems: 'center', backgroundColor: '#28725b', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, sendButtonDisabled: { backgroundColor: '#a8c3bb' },
});