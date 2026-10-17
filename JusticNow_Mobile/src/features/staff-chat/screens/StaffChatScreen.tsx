import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CONDUCT_TEXT_MAX,
  getStaffMessages,
  sendStaffMessage,
  subscribeToStaffThread,
  type StaffMessage,
  type ThreadKey,
} from '@/api/conductApi';
import { Badge, StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useAuth } from '@/context/AuthContext';

interface StaffChatScreenProps {
  /** `'me'` for an officer's own thread; the officer's id when an admin opens it. */
  officer: ThreadKey;
  /** Admin only: the report this conversation is about. Never shown to the officer. */
  complaintId?: number;
}

const formatTime = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
const formatDay = (iso: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
const dayKey = (iso: string) => new Date(iso).toDateString();

/** Confirms before a formal warning goes out — it is a record against the officer. */
function confirmWarning(officerName: string): Promise<boolean> {
  const message = `${officerName} will see this as a formal warning, and it stays on their record.`;
  if (Platform.OS === 'web') return Promise.resolve(typeof window === 'undefined' || window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert('Send a formal warning?', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Send warning', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/**
 * The admin ↔ officer conversation. Both roles use this screen: admins see the
 * officer's name and can send formal warnings; officers see "JusticeNow Admin".
 */
export function StaffChatScreen({ officer, complaintId }: StaffChatScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const { session } = useAuth();
  const isAdmin = session?.user.role === 'ADMIN';
  const listRef = useRef<FlatList<StaffMessage>>(null);

  const [officerInfo, setOfficerInfo] = useState<{ id: number; name: string | null; email: string; isActive: boolean } | null>(null);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [asWarning, setAsWarning] = useState(Boolean(complaintId));
  const [sending, setSending] = useState(false);
  const stickToBottom = useRef(true);

  const mergeMessages = useCallback((incoming: StaffMessage[]) => {
    setMessages((current) => {
      const byId = new Map(current.map((m) => [m.id, m]));
      for (const message of incoming) byId.set(message.id, message);
      return [...byId.values()].sort((a, b) => a.id - b.id);
    });
  }, []);

  // Fetching also marks the other side's messages as read on the server.
  const load = useCallback(async () => {
    try {
      const result = await getStaffMessages(officer);
      setOfficerInfo(result.officer);
      setHasMore(result.hasMore);
      mergeMessages(result.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'We could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, [officer, mergeMessages]);

  // Load on focus, so returning to the screen also catches up and marks new messages read.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const officerId = officerInfo?.id;
  useEffect(() => {
    if (!officerId) return;
    return subscribeToStaffThread(officerId, (message) => {
      stickToBottom.current = true;
      mergeMessages([message]);
      // A message from the other side arrived while open: re-fetch so it is marked read.
      if (message.fromAdmin !== isAdmin) load();
    });
  }, [officerId, isAdmin, mergeMessages, load]);

  const loadEarlier = async () => {
    if (!messages.length || loadingEarlier) return;
    setLoadingEarlier(true);
    stickToBottom.current = false;
    try {
      const result = await getStaffMessages(officer, messages[0].id);
      setHasMore(result.hasMore);
      mergeMessages(result.messages);
    } catch {
      setSendError('We could not load earlier messages.');
    } finally {
      setLoadingEarlier(false);
    }
  };

  const officerName = officerInfo?.name || officerInfo?.email || 'this officer';
  const content = draft.trim();
  const canSend = Boolean(content) && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const kind = isAdmin && asWarning ? 'WARNING' : 'MESSAGE';
    if (kind === 'WARNING' && !(await confirmWarning(officerName))) return;
    setSending(true);
    setSendError(null);
    try {
      const sent = await sendStaffMessage(officer, { content, kind, ...(isAdmin && complaintId ? { complaintId } : {}) });
      stickToBottom.current = true;
      mergeMessages([sent]);
      setDraft('');
      if (kind === 'WARNING') setAsWarning(false);
    } catch (err) {
      setSendError(err instanceof Error && err.message ? err.message : 'Your message was not sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/messages');
  };

  const title = isAdmin ? officerName : 'JusticeNow Admin';
  const subtitle = isAdmin ? 'Private conversation with this officer' : 'Messages and warnings from the admin team';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={6} onPress={handleBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
          </Pressable>
          <View style={[styles.avatar, { backgroundColor: isAdmin ? colors.primarySoft : colors.dangerSoft }]}>
            <Ionicons color={isAdmin ? colors.primary : colors.danger} name={isAdmin ? 'person-outline' : 'shield-checkmark'} size={20} />
          </View>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} variant="bodyStrong">{title}</Text>
            <Text color="textSecondary" numberOfLines={1} variant="caption">{subtitle}</Text>
          </View>
          {isAdmin && officerInfo && !officerInfo.isActive ? <Badge label="Deactivated" tone="neutral" /> : null}
        </View>

        {isAdmin && complaintId ? (
          <View style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
            <Ionicons color={colors.warning} name="flag-outline" size={18} />
            <Text style={styles.flex} variant="caption">
              Linked to citizen report #{complaintId}. The officer will not see the report or who sent it.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <StateView kind="loading" message="Loading conversation…" />
        ) : error && messages.length === 0 ? (
          <StateView actionLabel="Try again" kind="error" message={error} onAction={() => { setLoading(true); load(); }} title="Conversation unavailable" />
        ) : (
          <FlatList
            contentContainerStyle={messages.length ? styles.list : styles.emptyList}
            data={messages}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              <StateView
                icon="chatbubbles-outline"
                kind="empty"
                message={isAdmin ? `Messages you send here go only to ${officerName}.` : 'Messages from the JusticeNow admin team will appear here.'}
                title="No messages yet"
              />
            }
            ListHeaderComponent={
              hasMore ? (
                <Pressable accessibilityRole="button" disabled={loadingEarlier} onPress={loadEarlier} style={({ pressed }) => [styles.earlier, pressed && styles.pressed]}>
                  {loadingEarlier ? <ActivityIndicator color={colors.primary} /> : <Text color="primary" variant="label">Load earlier messages</Text>}
                </Pressable>
              ) : null
            }
            onContentSizeChange={() => { if (stickToBottom.current) listRef.current?.scrollToEnd({ animated: true }); }}
            ref={listRef}
            renderItem={({ item, index }) => {
              const isMine = item.fromAdmin === isAdmin;
              const isWarning = item.kind === 'WARNING';
              const previous = messages[index - 1];
              const showDay = !previous || dayKey(previous.createdAt) !== dayKey(item.createdAt);
              const bubbleColors = isWarning
                ? { backgroundColor: colors.dangerSoft, borderColor: colors.danger }
                : isMine
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border };
              const textColor = isMine && !isWarning ? colors.textOnPrimary : colors.textPrimary;
              return (
                <View>
                  {showDay ? <Text color="textTertiary" style={styles.dayDivider} variant="caption">{formatDay(item.createdAt)}</Text> : null}
                  <View style={[styles.row, isMine && styles.rowMine]}>
                    <View
                      accessibilityLabel={isWarning ? `Formal warning: ${item.content}` : undefined}
                      style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, isWarning && styles.bubbleWarning, bubbleColors]}
                    >
                      {isWarning ? (
                        <View style={styles.warningLabel}>
                          <Ionicons color={colors.danger} name="warning" size={16} />
                          <Text color="danger" style={styles.warningText} variant="caption">FORMAL WARNING</Text>
                        </View>
                      ) : null}
                      {/* Several admins share a thread, so admins see who wrote each admin message. */}
                      {!isMine || (isAdmin && item.fromAdmin) ? (
                        <Text style={[styles.sender, { color: isWarning ? colors.danger : isMine ? colors.primarySoft : colors.primary }]} variant="caption">
                          {item.senderName}
                        </Text>
                      ) : null}
                      <Text selectable style={{ color: textColor }}>{item.content}</Text>
                      <View style={styles.meta}>
                        {isAdmin && item.complaintId ? (
                          <Text style={{ color: isMine && !isWarning ? colors.primarySoft : colors.textTertiary }} variant="caption">Report #{item.complaintId} ·</Text>
                        ) : null}
                        <Text style={{ color: isMine && !isWarning ? colors.primarySoft : colors.textTertiary }} variant="caption">{formatTime(item.createdAt)}</Text>
                        {isMine ? (
                          <Ionicons
                            accessibilityLabel={item.readAt ? 'Read' : 'Sent'}
                            color={isWarning ? colors.danger : colors.primarySoft}
                            name={item.readAt ? 'checkmark-done' : 'checkmark'}
                            size={16}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {sendError ? (
          <View accessibilityRole="alert" style={[styles.inlineError, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={18} />
            <Text color="danger" style={styles.flex} variant="caption">{sendError}</Text>
          </View>
        ) : null}

        <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {isAdmin ? (
            <View style={styles.warningToggle}>
              <Ionicons color={asWarning ? colors.danger : colors.textSecondary} name="warning-outline" size={18} />
              <Text color={asWarning ? 'danger' : 'textSecondary'} style={styles.flex} variant="label">
                {asWarning ? 'Sending as a formal warning' : 'Send as formal warning'}
              </Text>
              <Switch
                accessibilityLabel="Send as formal warning"
                onValueChange={setAsWarning}
                thumbColor={colors.surface}
                trackColor={{ false: colors.borderStrong, true: colors.danger }}
                value={asWarning}
              />
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel={asWarning ? 'Warning message' : 'Message'}
              maxLength={CONDUCT_TEXT_MAX}
              multiline
              onChangeText={setDraft}
              placeholder={asWarning ? 'Explain what must change' : isAdmin ? `Write to ${officerName}` : 'Reply to the admin team'}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { backgroundColor: colors.surfaceMuted, borderColor: asWarning ? colors.danger : 'transparent', color: colors.textPrimary }]}
              value={draft}
            />
            <Pressable
              accessibilityLabel={asWarning ? 'Send warning' : 'Send message'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={handleSend}
              style={({ pressed }) => [
                styles.send,
                { backgroundColor: !canSend ? colors.borderStrong : asWarning ? colors.danger : colors.primary },
                pressed && styles.pressed,
              ]}
            >
              {sending ? <ActivityIndicator color={colors.textOnPrimary} size="small" /> : <Ionicons color={colors.textOnPrimary} name="send" size={18} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  iconButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  avatar: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  headerCopy: { flex: 1, minWidth: 0 },
  banner: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm },
  list: { paddingBottom: Spacing.lg, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.sm },
  emptyList: { flexGrow: 1 },
  earlier: { alignItems: 'center', minHeight: Layout.minTapTarget, justifyContent: 'center' },
  dayDivider: { alignSelf: 'center', marginBottom: Spacing.md, marginTop: Spacing.lg },
  row: { flexDirection: 'row', marginBottom: Spacing.sm },
  rowMine: { justifyContent: 'flex-end' },
  bubble: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, maxWidth: '85%', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  bubbleMine: { borderBottomRightRadius: Radius.sm / 2 },
  bubbleTheirs: { borderBottomLeftRadius: Radius.sm / 2 },
  bubbleWarning: { borderLeftWidth: 4 },
  warningLabel: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
  warningText: { fontWeight: '800', letterSpacing: 0.5 },
  sender: { fontWeight: '700', marginBottom: 2 },
  meta: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  inlineError: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, marginHorizontal: Layout.screenPadding, padding: Spacing.md },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  warningToggle: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.sm },
  inputRow: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.xs },
  input: { borderRadius: Radius.xl, borderWidth: 1, flex: 1, fontSize: 16, maxHeight: 120, minHeight: Layout.minTapTarget, paddingBottom: 12, paddingHorizontal: Spacing.lg, paddingTop: 12 },
  send: { alignItems: 'center', borderRadius: Layout.minTapTarget / 2, height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
});
