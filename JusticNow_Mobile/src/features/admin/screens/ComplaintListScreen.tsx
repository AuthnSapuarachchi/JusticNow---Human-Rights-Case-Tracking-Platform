import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminComplaint, COMPLAINT_STATUS, ComplaintStatus, complaintReasonLabel, getComplaints } from '@/api/conductApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Badge, Card, FilterChip, IconTile, StateView, Text } from '@/design-system/components';
import { Layout, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminHeader, useAdminTabPress } from '../components';

const FILTERS: { key: string; label: string; statuses: ComplaintStatus[] }[] = [
  { key: 'active', label: 'Needs action', statuses: ['OPEN', 'UNDER_REVIEW'] },
  { key: 'taken', label: 'Action taken', statuses: ['ACTION_TAKEN'] },
  { key: 'dismissed', label: 'Dismissed', statuses: ['DISMISSED'] },
  { key: 'all', label: 'All', statuses: [] },
];

const formatDate = (iso: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

/** Citizen reports about officer conduct, newest first. */
export function ComplaintListScreen() {
  const colors = useColors();
  const router = useRouter();
  const handleTabPress = useAdminTabPress();

  const [filter, setFilter] = useState(FILTERS[0]);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [counts, setCounts] = useState<Partial<Record<ComplaintStatus, number>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await getComplaints(filter.statuses);
      setComplaints(result.complaints);
      setCounts(result.counts);
    } catch (err: any) {
      setError(err?.message || 'Unable to load officer reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Reload on focus so a decision made on the detail screen shows up on return.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const countFor = (statuses: ComplaintStatus[]) =>
    (statuses.length ? statuses : (Object.keys(COMPLAINT_STATUS) as ComplaintStatus[])).reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader eyebrow="OFFICER CONDUCT" title="Officer reports" />

      <ScrollView contentContainerStyle={styles.filters} horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {FILTERS.map((item) => (
          <FilterChip key={item.key} label={`${item.label} (${countFor(item.statuses)})`} onPress={() => setFilter(item)} selected={filter.key === item.key} />
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <StateView kind="loading" message="Loading officer reports…" />
      ) : error && complaints.length === 0 ? (
        <StateView actionLabel="Try again" kind="error" message={error} onAction={() => load()} title="Reports unavailable" />
      ) : (
        <FlatList
          contentContainerStyle={complaints.length ? styles.list : styles.emptyList}
          data={complaints}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <StateView
              icon="flag-outline"
              kind="empty"
              message={filter.key === 'active' ? 'No citizen reports are waiting for review.' : 'No reports match this filter.'}
              title="Nothing here"
            />
          }
          refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => load(true)} refreshing={refreshing} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const status = COMPLAINT_STATUS[item.status];
            const needsAction = item.status === 'OPEN';
            return (
              <Card
                accessibilityLabel={`Report about ${item.officer.name || item.officer.email}: ${complaintReasonLabel(item.reason)}, ${status.label}`}
                onPress={() => router.push(`/admin/complaints/${item.id}` as any)}
                style={[styles.card, needsAction && { borderColor: colors.danger, borderWidth: 1 }]}
              >
                <View style={styles.cardTop}>
                  <IconTile name="flag-outline" tone={needsAction ? 'danger' : 'neutral'} />
                  <View style={styles.cardText}>
                    <Text numberOfLines={1} variant="bodyStrong">{item.officer.name || item.officer.email}</Text>
                    <Text color="textSecondary" variant="caption">{complaintReasonLabel(item.reason)}</Text>
                  </View>
                  <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
                </View>
                <Text color="textSecondary" numberOfLines={2}>{item.details}</Text>
                <View style={styles.cardFooter}>
                  <Badge icon={status.icon} label={status.label} tone={needsAction ? 'danger' : status.tone} />
                  <Text color="textTertiary" variant="caption">{item.case.reference} · {formatDate(item.createdAt)}</Text>
                </View>
              </Card>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: { flexGrow: 0 },
  filters: { gap: Spacing.sm, paddingBottom: Spacing.md, paddingHorizontal: Layout.screenPadding },
  list: { gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding },
  emptyList: { flexGrow: 1, paddingBottom: Layout.bottomNavInset },
  card: { gap: Spacing.sm },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  cardText: { flex: 1, gap: 2, minWidth: 0 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
});
