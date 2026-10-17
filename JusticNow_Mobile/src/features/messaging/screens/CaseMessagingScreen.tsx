import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMessages,
  isImageAttachment,
  markMessageAsRead,
  Message,
  resolveMediaUrl,
  sendMessage,
  subscribeToChat,
  uploadAttachment,
} from '@/api/messagingApi';
import { useAuth } from '@/context/AuthContext';
import { StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { filterMessages } from '@/features/messaging/searchUtils';

interface CaseMessagingScreenProps {
  caseId: string;
  currentUserId: string;
  participantId?: string;
}

/** A message plus local-only state for bubbles that are still sending. */
type ChatMessage = Message & { pending?: boolean; localPreview?: string };

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
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();

  const [isLive, setIsLive] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Adds server messages without duplicates, keeping our own still-sending bubbles at the end.
  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const byId = new Map(current.filter((item) => !item.pending).map((item) => [item.id, item]));
      for (const message of incoming) byId.set(message.id, message);
      const confirmed = [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return [...confirmed, ...current.filter((item) => item.pending)];
    });
  }, []);

  const refresh = useCallback(() => getMessages(caseId).then(mergeMessages), [caseId, mergeMessages]);

  useEffect(() => {
    let isMounted = true;
    getMessages(caseId).then((loadedMessages) => {
      if (isMounted) mergeMessages(loadedMessages);
    }).catch(() => {
      if (isMounted) setError('We could not load your messages. Please try again.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [caseId, mergeMessages]);

  // Live updates. After every (re)join we resync, so nothing sent while offline is lost.
  useEffect(() => subscribeToChat(caseId, {
    onMessage: (message) => mergeMessages([message]),
    onJoined: () => { refresh().catch(() => undefined); },
    onConnectionChange: setIsLive,
  }), [caseId, mergeMessages, refresh]);

  // Fallback for networks that block websockets: poll while the socket is down.
  useEffect(() => {
    if (isLive) return;
    const timer = setInterval(() => { refresh().catch(() => undefined); }, 4000);
    return () => clearInterval(timer);
  }, [isLive, refresh]);

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

  /** Shows the message immediately, then swaps in the server's copy (or removes it on failure). */
  const addPending = (content: string, localPreview?: string): string => {
    const tempId = `pending-${Date.now()}`;
    setMessages((current) => [...current, {
      id: tempId,
      caseId,
      senderId: currentUserId,
      senderName: session?.user.name || 'You',
      senderRole: isOfficer ? 'OFFICER' : 'CITIZEN',
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      pending: true,
      localPreview,
      attachment: localPreview ? { url: localPreview, type: 'image/jpeg' } : null,
    }]);
    return tempId;
  };

  const settlePending = (tempId: string, sent?: Message) => {
    setMessages((current) => current.filter((item) => item.id !== tempId));
    if (sent) mergeMessages([sent]);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError(null);
    setDraft('');
    const tempId = addPending(content);
    try {
      settlePending(tempId, await sendMessage(caseId, { content, recipientId: participantId }));
    } catch {
      settlePending(tempId);
      setDraft(content);
      setError('Your message was not sent. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access in your device settings to share a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setIsUploading(true);
    setError(null);
    const caption = draft.trim();
    setDraft('');
    const tempId = addPending(caption, asset.uri);
    try {
      const attachment = await uploadAttachment(caseId, {
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        file: asset.file,
      });
      settlePending(tempId, await sendMessage(caseId, { content: caption, attachment, recipientId: participantId }));
    } catch (uploadError) {
      settlePending(tempId);
      setDraft(caption);
      setError(uploadError instanceof Error && uploadError.message ? uploadError.message : 'We could not share this photo. Please try again.');
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
              <View style={[styles.liveDot, { backgroundColor: isLive ? colors.success : colors.warning }]} />
              <Text color="textSecondary" numberOfLines={1} variant="caption">
                {isLive ? 'Live' : 'Reconnecting…'} · Case {caseId}
              </Text>
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
                  <Pressable onPress={() => handleMarkRead(item)} style={[styles.messageRow, isSent && styles.sentRow, !isSearchMatch && styles.dimmed, item.pending && styles.sending]}>
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
                      {item.attachment && isImageAttachment(item.attachment) ? (
                        <Pressable
                          accessibilityHint="Opens the photo full screen"
                          accessibilityLabel="Shared photo"
                          accessibilityRole="imagebutton"
                          disabled={item.pending}
                          onPress={() => item.attachment && setViewerUrl(resolveMediaUrl(item.attachment.url))}
                          style={styles.photoWrap}
                        >
                          <Image
                            contentFit="cover"
                            source={{ uri: item.localPreview ?? resolveMediaUrl(item.attachment.url) }}
                            style={[styles.photo, { backgroundColor: colors.surfaceMuted }]}
                            transition={150}
                          />
                          {item.pending ? (
                            <View style={styles.photoOverlay}>
                              <ActivityIndicator color="#FFFFFF" />
                            </View>
                          ) : null}
                        </Pressable>
                      ) : item.attachment ? (
                        <View style={styles.attachment}>
                          <Ionicons name="document-outline" size={18} color={isSent ? colors.textOnPrimary : colors.primary} />
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
                        {isSent ? (
                          <Ionicons
                            accessibilityLabel={item.pending ? 'Sending' : 'Sent'}
                            color={colors.primarySoft}
                            name={item.pending ? 'time-outline' : 'checkmark-done'}
                            size={16}
                          />
                        ) : null}
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

      <Modal animationType="fade" onRequestClose={() => setViewerUrl(null)} transparent visible={viewerUrl !== null}>
        <View style={styles.viewer}>
          {viewerUrl ? <Image contentFit="contain" source={{ uri: viewerUrl }} style={styles.viewerImage} /> : null}
          <Pressable
            accessibilityLabel="Close photo"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setViewerUrl(null)}
            style={({ pressed }) => [styles.viewerClose, pressed && styles.pressed]}
          >
            <Ionicons color="#FFFFFF" name="close" size={28} />
          </Pressable>
        </View>
      </Modal>
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
  sending: { opacity: 0.7 },
  liveDot: { borderRadius: 4, height: 8, width: 8 },
  photoWrap: { borderRadius: Radius.md, marginBottom: Spacing.xs, overflow: 'hidden' },
  photo: { height: 200, width: 220 },
  photoOverlay: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, alignItems: 'center', backgroundColor: 'rgba(13, 27, 42, 0.35)', justifyContent: 'center' },
  viewer: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.94)', flex: 1, justifyContent: 'center' },
  viewerImage: { height: '85%', width: '100%' },
  viewerClose: { alignItems: 'center', height: 48, justifyContent: 'center', position: 'absolute', right: Spacing.lg, top: Spacing.huge, width: 48 },
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
