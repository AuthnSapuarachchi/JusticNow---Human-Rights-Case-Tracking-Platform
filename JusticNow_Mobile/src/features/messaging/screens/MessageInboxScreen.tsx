import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyCases } from '@/api/caseApi';
import { getStaffThreads, type StaffThread } from '@/api/conductApi';
import { getOfficerCases } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, IconTile, StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

interface ApprovedCaseConversation {
  id: string;
  reference: string;
  category: string;
  status: string;
  updatedAt: string;
  officerName: string;
}

const formatShortDate = (date: string) => (date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date)) : '');

export function MessageInboxScreen() {
  const router = useRouter();
  const colors = useColors();
  const { session } = useAuth();
  const [cases, setCases] = useState<ApprovedCaseConversation[]>([]);
  // Admin ↔ officer conversations: every officer's thread for admins, the officer's own thread for officers.
  const [staffThreads, setStaffThreads] = useState<StaffThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOfficer = session?.user.role === 'OFFICER';
  const isAdmin = session?.user.role === 'ADMIN';

  const loadConversations = useCallback(async (isActive: () => boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      if (session?.user.role === 'ADMIN') {
        const threads = await getStaffThreads();
        if (isActive()) setStaffThreads(threads);
      } else if (session?.user.role === 'OFFICER') {
        const [result, threads] = await Promise.all([
          getOfficerCases({ assignedToMe: true, limit: 100 }),
          // The admin thread is a bonus here; never let it block the case conversations.
          getStaffThreads().catch(() => [] as StaffThread[]),
        ]);
        if (isActive()) setStaffThreads(threads);
        if (isActive()) {
          setCases(result.cases.filter((item) => item.approvedAt).map((item) => ({
            id: String(item.id),
            reference: item.trackingCode?.code || `CASE-${item.id}`,
            category: item.category.replace(/_/g, ' '),
            status: item.status.replace(/_/g, ' '),
            updatedAt: item.updatedAt,
            officerName: item.reporter?.name || 'Citizen',
          })));
        }
      } else if (session?.user.role === 'CITIZEN') {
        const result = await getMyCases();
        if (isActive()) {
          setCases(result.filter((item) => item.approved).map((item) => ({
            id: item.id,
            reference: item.reference,
            category: item.category,
            status: item.status.replace(/-/g, ' '),
            updatedAt: item.lastUpdated,
            officerName: item.officer?.name || 'Assigned officer',
          })));
        }
      }
    } catch {
      if (isActive()) setError('We could not load your conversations. Check your connection and try again.');
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, [session]);

  // Refresh whenever the tab regains focus, e.g. after a case is approved.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadConversations(() => mounted);
      return () => { mounted = false; };
    }, [loadConversations])
  );

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace(isAdmin ? '/admin' : isOfficer ? '/officer' : '/');
    if (tab === NavTab.Cases) router.push(isAdmin ? '/admin/cases' : isOfficer ? '/officer/queue' : '/cases');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  /** Officer view: the admin team's thread, pinned on top and shown in red. */
  const renderAdminThread = (thread: StaffThread) => {
    const isWarning = thread.hasUnreadWarning || thread.lastMessage.kind === 'WARNING';
    const preview = `${thread.lastMessage.fromAdmin ? '' : 'You: '}${thread.lastMessage.content}`;
    return (
      <Card
        accessibilityLabel={`Messages from JusticeNow Admin${thread.unreadCount ? `, ${thread.unreadCount} unread` : ''}${isWarning ? ', includes a formal warning' : ''}`}
        onPress={() => router.push('/officer/admin-chat')}
        style={[styles.row, styles.pinned, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
      >
        <IconTile name={isWarning ? 'warning-outline' : 'shield-checkmark-outline'} tone="danger" />
        <View style={styles.rowCopy}>
          <View style={styles.rowHeading}>
            <Text color="danger" numberOfLines={1} style={styles.flex} variant="bodyStrong">JusticeNow Admin</Text>
            <Text color="textTertiary" variant="caption">{formatShortDate(thread.lastMessage.createdAt)}</Text>
          </View>
          <Text numberOfLines={1} variant="caption">{preview}</Text>
          <View style={styles.badges}>
            {isWarning ? <Badge icon="warning" label="Warning" tone="danger" /> : <Badge icon="pin" label="Pinned" tone="danger" />}
            {thread.unreadCount ? <Badge label={`${thread.unreadCount} unread`} tone="danger" /> : null}
          </View>
        </View>
        <Ionicons color={colors.danger} name="chevron-forward" size={20} />
      </Card>
    );
  };

  const renderBody = () => {
    if (isLoading) return <StateView kind="loading" message="Loading conversations…" />;
    if (error) {
      return <StateView actionLabel="Try again" kind="error" message={error} onAction={() => loadConversations(() => true)} title="Something went wrong" />;
    }

    if (isAdmin) {
      return (
        <FlatList
          contentContainerStyle={staffThreads.length ? styles.list : styles.emptyList}
          data={staffThreads}
          keyExtractor={(item) => String(item.officerId)}
          ListEmptyComponent={
            <StateView
              icon="chatbubbles-outline"
              kind="empty"
              message="Start a conversation from an officer report or the officer list."
              title="No officer conversations yet"
            />
          }
          renderItem={({ item }) => {
            const flagged = Boolean(item.activeComplaints);
            const preview = `${item.lastMessage.fromAdmin ? `${item.lastMessage.senderName}: ` : ''}${item.lastMessage.content}`;
            return (
              <Card
                accessibilityLabel={`Conversation with ${item.officerName}${item.unreadCount ? `, ${item.unreadCount} unread` : ''}`}
                onPress={() => router.push(`/admin/officer-chat/${item.officerId}` as any)}
                style={[styles.row, flagged && { borderColor: colors.danger, borderWidth: 1 }]}
              >
                <IconTile name="person-outline" tone={flagged ? 'danger' : 'primary'} />
                <View style={styles.rowCopy}>
                  <View style={styles.rowHeading}>
                    <Text numberOfLines={1} style={styles.flex} variant="bodyStrong">{item.officerName}</Text>
                    <Text color="textTertiary" variant="caption">{formatShortDate(item.lastMessage.createdAt)}</Text>
                  </View>
                  <Text color="textSecondary" numberOfLines={1} variant="caption">
                    {item.lastMessage.kind === 'WARNING' ? 'Warning · ' : ''}{preview}
                  </Text>
                  {flagged || item.unreadCount || !item.officerActive ? (
                    <View style={styles.badges}>
                      {flagged ? <Badge icon="flag" label={`${item.activeComplaints} open report${item.activeComplaints === 1 ? '' : 's'}`} tone="danger" /> : null}
                      {item.unreadCount ? <Badge label={`${item.unreadCount} unread`} tone="info" /> : null}
                      {!item.officerActive ? <Badge label="Deactivated" tone="neutral" /> : null}
                    </View>
                  ) : null}
                </View>
                <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
              </Card>
            );
          }}
        />
      );
    }

    const adminThread = isOfficer ? staffThreads[0] : undefined;

    return (
      <FlatList
        contentContainerStyle={cases.length || adminThread ? styles.list : styles.emptyList}
        data={cases}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={adminThread ? renderAdminThread(adminThread) : null}
        ListEmptyComponent={adminThread ? null : (
          <StateView
            icon="chatbubbles-outline"
            kind="empty"
            message="A private conversation opens here once an officer approves a case."
            title="No conversations yet"
          />
        )}
        renderItem={({ item }) => (
          <Card
            accessibilityLabel={`Open messages for case ${item.reference} with ${item.officerName}`}
            onPress={() => router.push(`/cases/${item.id}/messages` as any)}
            style={styles.row}
          >
            <IconTile name="chatbubble-ellipses-outline" />
            <View style={styles.rowCopy}>
              <View style={styles.rowHeading}>
                <Text numberOfLines={1} style={styles.flex} variant="bodyStrong">{item.officerName}</Text>
                <Text color="textTertiary" variant="caption">{formatShortDate(item.updatedAt)}</Text>
              </View>
              <Text color="textSecondary" numberOfLines={1} variant="caption">
                {item.reference} · {item.category}
              </Text>
              <Text color="primary" numberOfLines={1} style={styles.status} variant="caption">{item.status}</Text>
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
          </Card>
        )}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text variant="screenTitle">{isAdmin ? 'Officer messages' : 'Messages'}</Text>
        <View style={styles.secureRow}>
          <Ionicons color={colors.success} name="lock-closed" size={14} />
          <Text color="textSecondary" variant="caption">{isAdmin ? 'Private between the admin team and each officer' : 'Private and encrypted'}</Text>
        </View>
      </View>
      {renderBody()}
      <BottomNavBar activeTab={NavTab.Messages} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { gap: Spacing.xs, paddingBottom: Spacing.lg, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xl },
  secureRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  list: { gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding },
  emptyList: { flexGrow: 1, paddingBottom: Layout.bottomNavInset },
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  pinned: { borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  rowCopy: { flex: 1, gap: 2, minWidth: 0 },
  rowHeading: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  status: { textTransform: 'capitalize' },
});
