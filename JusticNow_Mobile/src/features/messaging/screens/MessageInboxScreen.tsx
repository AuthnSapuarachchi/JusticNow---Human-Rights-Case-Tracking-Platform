import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyCases } from '@/api/caseApi';
import { getOfficerCases } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { Card, IconTile, StateView, Text, useColors } from '@/design-system';
import { Layout, Spacing } from '@/design-system/spacing';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOfficer = session?.user.role === 'OFFICER';

  const loadConversations = useCallback(async (isActive: () => boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      if (session?.user.role === 'OFFICER') {
        const result = await getOfficerCases({ assignedToMe: true, limit: 100 });
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
    if (tab === NavTab.Home) router.replace(isOfficer ? '/officer' : '/');
    if (tab === NavTab.Cases) router.push(isOfficer ? '/officer/queue' : '/cases');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  const renderBody = () => {
    if (isLoading) return <StateView kind="loading" message="Loading conversations…" />;
    if (error) {
      return <StateView actionLabel="Try again" kind="error" message={error} onAction={() => loadConversations(() => true)} title="Something went wrong" />;
    }

    return (
      <FlatList
        contentContainerStyle={cases.length ? styles.list : styles.emptyList}
        data={cases}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <StateView
            icon="chatbubbles-outline"
            kind="empty"
            message="A private conversation opens here once an officer approves a case."
            title="No conversations yet"
          />
        }
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
        <Text variant="screenTitle">Messages</Text>
        <View style={styles.secureRow}>
          <Ionicons color={colors.success} name="lock-closed" size={14} />
          <Text color="textSecondary" variant="caption">Private and encrypted</Text>
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
  rowCopy: { flex: 1, gap: 2, minWidth: 0 },
  rowHeading: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  status: { textTransform: 'capitalize' },
});
