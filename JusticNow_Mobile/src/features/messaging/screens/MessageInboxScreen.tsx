import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMessages, Message } from '@/api/messagingApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';

const CASE_ID = 'JN-2026-0412';
const CURRENT_USER_ID = 'citizen-001';

interface Conversation {
  participantId: string;
  participantName: string;
  participantRole: Message['senderRole'];
  latestMessage: Message;
  unreadCount: number;
}

export function MessageInboxScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMessages(CASE_ID).then(setMessages).catch(() => setError('Unable to load messages. Please try again.')).finally(() => setIsLoading(false));
  }, []);

  const conversations = useMemo<Conversation[]>(() => {
    const grouped = new Map<string, Conversation>();
    messages.filter((message) => message.senderId !== CURRENT_USER_ID).forEach((message) => {
      const existing = grouped.get(message.senderId);
      if (!existing || new Date(message.createdAt) > new Date(existing.latestMessage.createdAt)) {
        grouped.set(message.senderId, { participantId: message.senderId, participantName: message.senderName, participantRole: message.senderRole, latestMessage: message, unreadCount: existing?.unreadCount ?? 0 });
      }
      if (!message.isRead) {
        const conversation = grouped.get(message.senderId);
        if (conversation) conversation.unreadCount += 1;
      }
    });
    return Array.from(grouped.values()).sort((first, second) => new Date(second.latestMessage.createdAt).getTime() - new Date(first.latestMessage.createdAt).getTime());
  }, [messages]);

  const handleTabPress = (tab: string) => { if (tab === NavTab.Home) router.replace('/'); if (tab === NavTab.Cases) router.push('/cases'); if (tab === NavTab.Support) router.push('/legal-support'); };
  const formatTime = (date: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));

  return <SafeAreaView edges={['top']} style={styles.safeArea}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>SECURE MESSAGES</Text><Text style={styles.title}>Messages</Text></View><View style={styles.lock}><Ionicons color="#28725b" name="lock-closed" size={17} /></View></View>
    <Text style={styles.subtitle}>Choose a person to open their case conversation.</Text>
    {isLoading ? <View style={styles.centerState}><ActivityIndicator color="#28725b" /><Text style={styles.stateText}>Loading messages...</Text></View> : error ? <View style={styles.centerState}><Text style={styles.errorText}>{error}</Text></View> : <FlatList
      contentContainerStyle={conversations.length ? styles.list : styles.emptyList}
      data={conversations}
      keyExtractor={(item) => item.participantId}
      ListEmptyComponent={<View style={styles.centerState}><Ionicons color="#87939b" name="chatbubbles-outline" size={38} /><Text style={styles.emptyTitle}>No conversations yet</Text><Text style={styles.stateText}>Messages from your case team will appear here.</Text></View>}
      renderItem={({ item }) => <Pressable onPress={() => router.push(`/messages/${item.participantId}`)} style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}><View style={styles.avatar}><Text style={styles.avatarText}>{item.participantName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View><View style={styles.conversationCopy}><View style={styles.nameLine}><Text style={styles.name}>{item.participantName}</Text><Text style={styles.time}>{formatTime(item.latestMessage.createdAt)}</Text></View><Text style={styles.role}>{item.participantRole}</Text><Text numberOfLines={1} style={styles.preview}>{item.latestMessage.content}</Text></View>{item.unreadCount > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount}</Text></View> : <Ionicons color="#a2adb1" name="chevron-forward" size={18} />}</Pressable>}
    />}
    <BottomNavBar activeTab={NavTab.Messages} onTabPress={handleTabPress} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: '#f5f8f7', flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 }, eyebrow: { color: '#28725b', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#18303b', fontSize: 27, fontWeight: '800', marginTop: 5 }, lock: { alignItems: 'center', backgroundColor: '#e2f2ed', borderRadius: 20, height: 38, justifyContent: 'center', width: 38 }, subtitle: { color: '#718088', fontSize: 13, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }, list: { gap: 10, paddingBottom: 105, paddingHorizontal: 20 }, emptyList: { flex: 1 }, conversation: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, flexDirection: 'row', padding: 14 }, pressed: { opacity: 0.75 }, avatar: { alignItems: 'center', backgroundColor: '#dcecf8', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 }, avatarText: { color: '#2875d0', fontSize: 15, fontWeight: '800' }, conversationCopy: { flex: 1, marginLeft: 12 }, nameLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, name: { color: '#213943', fontSize: 14, fontWeight: '800' }, role: { color: '#28725b', fontSize: 11, fontWeight: '700', marginTop: 3 }, preview: { color: '#718088', fontSize: 12, marginTop: 7 }, time: { color: '#87939b', fontSize: 10 }, unreadBadge: { alignItems: 'center', backgroundColor: '#d06c43', borderRadius: 10, height: 20, justifyContent: 'center', minWidth: 20, paddingHorizontal: 5 }, unreadText: { color: '#ffffff', fontSize: 10, fontWeight: '800' }, centerState: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 24 }, stateText: { color: '#87939b', fontSize: 14, textAlign: 'center' }, errorText: { color: '#a33b3b', fontSize: 14, textAlign: 'center' }, emptyTitle: { color: '#213943', fontSize: 18, fontWeight: '800' } });