import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseSummary, getMyCases } from '@/api/caseApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Card, StateView, Text, useColors } from '@/design-system';
import { Layout, Spacing } from '@/design-system/spacing';
import { StatusPill } from '@/features/cases/components/StatusPill';
import { formatCaseDate, getStatusConfig } from '@/features/cases/statusUtils';

export function CaseListScreen() {
  const router = useRouter();
  const colors = useColors();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setCases(await getMyCases());
    } catch {
      setError('We could not load your cases. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load: state already starts as `loading`, so only settle it here.
  useEffect(() => {
    let mounted = true;
    getMyCases()
      .then((result) => { if (mounted) setCases(result); })
      .catch(() => { if (mounted) setError('We could not load your cases. Check your connection and try again.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  const renderBody = () => {
    if (loading && !refreshing) return <StateView kind="loading" message="Loading your cases…" />;
    if (error && cases.length === 0) {
      return <StateView actionLabel="Try again" kind="error" message={error} onAction={() => loadCases()} title="Something went wrong" />;
    }

    return (
      <FlatList
        contentContainerStyle={cases.length ? styles.list : styles.emptyList}
        data={cases}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => loadCases(true)} refreshing={refreshing} tintColor={colors.primary} />}
        ListEmptyComponent={
          <StateView
            actionLabel="Report an incident"
            icon="folder-open-outline"
            kind="empty"
            message="When you report an incident, you can follow its progress here."
            onAction={() => router.push('/report')}
            title="No cases yet"
          />
        }
        renderItem={({ item }) => {
          const status = getStatusConfig(item.status);
          return (
            <Card accessibilityLabel={`Case ${item.reference}, ${item.category}, ${status.label}`} onPress={() => router.push(`/cases/${item.id}`)} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardCopy}>
                  <Text color="textSecondary" numberOfLines={1} variant="caption">
                    {item.reference}
                  </Text>
                  <Text numberOfLines={2} variant="bodyStrong">
                    {item.category}
                  </Text>
                </View>
                <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
              </View>
              <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
                <StatusPill background={status.background} color={status.color} icon={status.icon} label={status.label} />
                <Text color="textTertiary" numberOfLines={1} style={styles.updated} variant="caption">
                  Updated {formatCaseDate(item.lastUpdated)}
                </Text>
              </View>
            </Card>
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="screenTitle">Your cases</Text>
          <Text color="textSecondary">
            {loading ? ' ' : cases.length === 1 ? '1 report' : `${cases.length} reports`}
          </Text>
        </View>
      </View>
      {renderBody()}
      <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingBottom: Spacing.lg, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xl },
  headerCopy: { gap: Spacing.xs },
  list: { gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding },
  emptyList: { flexGrow: 1, paddingBottom: Layout.bottomNavInset },
  card: { gap: Spacing.md },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  cardCopy: { flex: 1, gap: 2 },
  cardBottom: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  updated: { flexShrink: 1 },
});
