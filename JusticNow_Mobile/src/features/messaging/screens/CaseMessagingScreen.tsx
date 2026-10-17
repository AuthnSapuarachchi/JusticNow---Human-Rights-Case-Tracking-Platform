import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { connectToChat, getMessages, markMessageAsRead, Message, sendMessage, uploadAttachment } from '@/api/messagingApi';
import { useAuth } from '@/context/AuthContext';
import { StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { filterMessages } from '@/features/messaging/searchUtils';

interface CaseMessagingScreenProps {
  caseId: string;
  currentUserId: string;
  participantId?: string;
}

const formatTime = (createdAt: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(createdAt));

const dayKey = (createdAt: string) => new Date(createdAt).toDateString();

const formatDay = (createdAt: string) => {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

export function CaseMessagingScreen({ caseId, currentUserId, participantId }: CaseMessagingScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    let isMounted = true;
    getMessages(caseId).then((loadedMessages) => {
      if (isMounted) setMessages(loadedMessages);
    }).catch(() => {
      if (isMounted) setError('We could not load your messages. Please try again.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [caseId]);

  useEffect(() => {
    const socket = connectToChat(caseId, (message) => {
      setMessages((currentMessages) => currentMessages.some((item) => item.id === message.id) ? currentMessages : [...currentMessages, message]);
    }, session?.accessToken);
    return () => { socket.emit('chat:leave', caseId); socket.disconnect(); };
  }, [caseId, session?.accessToken]);

  const isOfficer = session?.user.role === 'OFFICER';
  const counterpartName = useMemo(() => {
    const counterpart = messages.find((message) => message.senderId !== currentUserId);
    return counterpart?.senderName ?? (isOfficer ? 'Citizen' : 'Case officer');
  }, [currentUserId, isOfficer, messages]);
  const visibleMessages = useMemo(() => participantId ? messages.filter((message) => message.senderId === participantId || message.senderId === currentUserId) : messages, [currentUserId, messages, participantId]);
  const trimmedQuery = searchQuery.trim();
  const matchingMessages = useMemo(() => filterMessages(visibleMessages, searchQuery), [searchQuery, visibleMessages]);
  const matchingMessageIds = useMemo(() => new Set(matchingMessages.map((message) => message.id)), [matchingMessages]);

  const renderHighlightedContent = (content: string, isSent: boolean) => {
    if (!trimmedQuery) return content;
    const parts = content.split(new RegExp(`(${trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
    return parts.map((part, index) => part.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase()
      ? <Text key={`${part}-${index}`} style={[styles.highlight, isSent && styles.highlightSent]}>{part}</Text>
      : part);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/messages');
  };

  const closeSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSend = async (attachment?: { url: string; name?: string; type?: string }) => {
    const content = draft.trim();
    if ((!content && !attachment) || isSending) return;
    setIsSending(true);
    setError(null);
    setDraft('');
    try {
      const sentMessage = await sendMessage(caseId, { content, attachment, recipientId: participantId });
      setMessages((currentMessages) => currentMessages.some((item) => item.id === sentMessage.id) ? currentMessages : [...currentMessages, sentMessage]);
    } catch {
      setDraft(content);
      setError('Your message was not sent. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setIsUploading(true);
    setError(null);
    try {
      const attachment = await uploadAttachment(caseId, { uri: asset.uri, name: asset.fileName || `attachment-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' }, session?.accessToken);
      await handleSend(attachment);
    } catch {
      setError('We could not share this file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkRead = (message: Message) => {
    if (!message.isRead && message.senderId !== currentUserId) {
      setMessages((currentMessages) => currentMessages.map((item) => item.id === message.id ? { ...item, isRead: true } : item));
      markMessageAsRead(message.id).catch(() => undefined);
    }
  };

  const canSend = Boolean(draft.trim()) && !isSending;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={6} onPress={handleBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} variant="bodyStrong">{counterpartName}</Text>
            <View style={styles.caseLabel}>
              <Ionicons name="lock-closed" size={12} color={colors.success} />
              <Text color="textSecondary" numberOfLines={1} variant="caption">Case {caseId} · Encrypted</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel={isSearchOpen ? 'Close search' : 'Search messages'}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name={isSearchOpen ? 'close' : 'search'} size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {isSearchOpen ? (
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={[styles.searchField, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons color={colors.textTertiary} name="search" size={18} />
              <TextInput
                accessibilityLabel="Search messages"
                autoFocus
                onChangeText={setSearchQuery}
                placeholder="Search this conversation"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={searchQuery}
              />
            </View>
            {trimmedQuery ? (
              <Text color="textSecondary" style={styles.resultCount} variant="caption">
                {matchingMessages.length === 0 ? 'No matches' : `${matchingMessages.length} ${matchingMessages.length === 1 ? 'match' : 'matches'}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        {isLoading ? (
          <StateView kind="loading" message="Loading secure messages…" />
        ) : error && messages.length === 0 ? (
          <StateView kind="error" message={error} title="Messages unavailable" />
        ) : (
          <FlatList
            contentContainerStyle={visibleMessages.length ? styles.messageList : styles.emptyList}
            data={visibleMessages}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(message) => message.id}
            ref={listRef}
            // Keep the newest message in view as the conversation grows.
            onContentSizeChange={() => { if (!trimmedQuery) listRef.current?.scrollToEnd({ animated: true }); }}
            ListEmptyComponent={
              <StateView
                icon="chatbubble-ellipses-outline"
                kind="empty"
                message="Messages here are private between you and the people handling this case."
                title="Start the conversation"
              />
            }
            renderItem={({ item, index }) => {
              const isSent = item.senderId === currentUserId;
              const isSearchMatch = !trimmedQuery || matchingMessageIds.has(item.id);
              const previous = visibleMessages[index - 1];
              const showDay = !previous || dayKey(previous.createdAt) !== dayKey(item.createdAt);
              return (
                <View>
                  {showDay ? (
                    <Text color="textTertiary" style={styles.dayDivider} variant="caption">{formatDay(item.createdAt)}</Text>
                  ) : null}
                  <Pressable onPress={() => handleMarkRead(item)} style={[styles.messageRow, isSent && styles.sentRow, !isSearchMatch && styles.dimmed]}>
                    {!item.isRead && !isSent ? <View accessibilityLabel="Unread" style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                    <View
                      style={[
                        styles.bubble,
                        isSent
                          ? [styles.sentBubble, { backgroundColor: colors.primary }]
                          : [styles.receivedBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                      ]}
                    >
                      {!isSent ? (
                        <Text color="primary" style={styles.senderRole} variant="caption">
                          {item.senderName || item.senderRole}
                        </Text>
                      ) : null}
                      {item.attachment ? (
                        <View style={styles.attachment}>
                          <Ionicons name={item.attachment.type?.startsWith('image/') ? 'image-outline' : 'document-outline'} size={18} color={isSent ? colors.textOnPrimary : colors.primary} />
                          <Text numberOfLines={1} style={[styles.attachmentText, { color: isSent ? colors.textOnPrimary : colors.primary }]} variant="label">
                            {item.attachment.name || 'Shared attachment'}
                          </Text>
                        </View>
                      ) : null}
                      {item.content ? (
                        <Text style={{ color: isSent ? colors.textOnPrimary : colors.textPrimary }}>{renderHighlightedContent(item.content, isSent)}</Text>
                      ) : null}
                      <View style={styles.messageMeta}>
                        <Text style={[styles.timestamp, { color: isSent ? colors.primarySoft : colors.textTertiary }]} variant="caption">
                          {formatTime(item.createdAt)}
                        </Text>
                        {isSent ? <Ionicons name={item.isRead ? 'checkmark-done' : 'checkmark'} size={16} color={colors.primarySoft} /> : null}
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        {error && messages.length > 0 ? (
          <View accessibilityRole="alert" style={[styles.inlineError, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={18} />
            <Text color="danger" style={styles.flex} variant="caption">{error}</Text>
          </View>
        ) : null}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            accessibilityLabel="Attach a photo"
            accessibilityRole="button"
            disabled={isUploading}
            onPress={handleAttachment}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            {isUploading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="attach" size={24} color={colors.primary} />}
          </Pressable>
          <TextInput
            accessibilityLabel="Message"
            multiline
            onChangeText={setDraft}
            placeholder="Write a message"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => handleSend()}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: canSend ? colors.primary : colors.borderStrong },
              pressed && styles.pressed,
            ]}
          >
            {isSending ? <ActivityIndicator color={colors.textOnPrimary} size="small" /> : <Ionicons name="send" size={18} color={colors.textOnPrimary} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  iconButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  headerCopy: { flex: 1, minWidth: 0 },
  caseLabel: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  searchBar: { borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.xs, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm },
  searchField: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, minHeight: Layout.minTapTarget, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.sm },
  resultCount: { paddingHorizontal: Spacing.xs },
  messageList: { paddingBottom: Spacing.lg, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.sm },
  emptyList: { flexGrow: 1 },
  dayDivider: { alignSelf: 'center', marginBottom: Spacing.md, marginTop: Spacing.lg },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', marginBottom: Spacing.sm },
  sentRow: { justifyContent: 'flex-end' },
  dimmed: { opacity: 0.3 },
  unreadDot: { borderRadius: 4, height: 8, marginBottom: Spacing.lg, marginRight: Spacing.xs, width: 8 },
  bubble: { borderRadius: Radius.lg, maxWidth: '82%', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  receivedBubble: { borderBottomLeftRadius: Radius.sm / 2, borderWidth: StyleSheet.hairlineWidth },
  sentBubble: { borderBottomRightRadius: Radius.sm / 2 },
  senderRole: { fontWeight: '700', marginBottom: 2, textTransform: 'capitalize' },
  attachment: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  attachmentText: { flexShrink: 1 },
  highlight: { backgroundColor: '#FBEEDC', color: '#0D1B2A', fontWeight: '700' },
  highlightSent: { backgroundColor: '#FBEEDC' },
  messageMeta: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  timestamp: { fontSize: 14 },
  inlineError: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Layout.screenPadding, marginBottom: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md },
  inputBar: { alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  input: { borderRadius: Radius.xl, flex: 1, fontSize: 16, maxHeight: 120, minHeight: Layout.minTapTarget, paddingHorizontal: Spacing.lg, paddingTop: 12, paddingBottom: 12 },
  sendButton: { alignItems: 'center', borderRadius: Layout.minTapTarget / 2, height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
});
