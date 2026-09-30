import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategoryCode } from '@/api/adminApi';
import { getOfficerCases, OfficerCaseItem } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Badge, Button, Card, FilterChip, SearchField, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDate, getOfficerStatusConfig } from '@/features/cases/statusUtils';
import { AdminHeader, AssignOfficerModal, useAdminTabPress } from '../components';

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'New', value: 'NEW,SUBMITTED' },
  { label: 'Investigating', value: 'INVESTIGATING,UNDER_REVIEW' },
  { label: 'Waiting User', value: 'WAITING_FOR_USER,ACTION_REQUIRED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Resolved + Closed', value: 'RESOLVED,CLOSED' },
];

export function AdminCaseListScreen() {
  const colors = useColors();
  const router = useRouter();
  const handleTabPress = useAdminTabPress();
  const params = useLocalSearchParams<{ assignment?: string; status?: string; priority?: string }>();

  const [cases, setCases] = useState<OfficerCaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(params.assignment === 'unassigned');
  const [statusFilter, setStatusFilter] = useState(params.status || 'ALL');
  const [urgentOnly, setUrgentOnly] = useState(params.priority === 'URGENT');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [assignTarget, setAssignTarget] = useState<OfficerCaseItem | null>(null);

  const fetchCases = useCallback(
    async (isRefresh = false, targetPage = 1) => {
      if (isRefresh) setRefreshing(true);
      else if (targetPage === 1) setLoading(true);
      setError(null);

      try {
        const res = await getOfficerCases({
          page: targetPage,
          limit: 15,
          assignedToMe: unassignedOnly ? false : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: urgentOnly ? 'URGENT' : undefined,
          search: searchQuery.trim() || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        });

        setCases((prev) => (targetPage === 1 ? res.cases : [...prev, ...res.cases]));
        setTotal(res.pagination.total);
        setHasMore(res.pagination.page < res.pagination.totalPages);
        setPage(targetPage);
      } catch (err: any) {
        setError(err?.message || 'Unable to load cases.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [unassignedOnly, statusFilter, urgentOnly, searchQuery]
  );

  useEffect(() => {
    fetchCases(false, 1);
  }, [fetchCases]);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader
        eyebrow="CASE ADMINISTRATION"
        right={
          <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontWeight: '800' }} variant="caption">
              {total} cases
            </Text>
          </View>
        }
        title="All Cases"
      />

      <View style={styles.searchWrapper}>
        <SearchField
          accessibilityLabel="Search cases by reference, description or location"
          onChangeText={setSearchQuery}
          placeholder="Search reference, description, location..."
          value={searchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.chipGroup}>
          <FilterChip label="All Cases" onPress={() => setUnassignedOnly(false)} selected={!unassignedOnly} />
          <FilterChip label="Unassigned" onPress={() => setUnassignedOnly(true)} selected={unassignedOnly} />
          <FilterChip label="Urgent Only" onPress={() => setUrgentOnly((v) => !v)} selected={urgentOnly} />
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.chipGroup}>
          {statusOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              onPress={() => setStatusFilter(opt.value)}
              selected={statusFilter === opt.value}
            />
          ))}
        </View>
      </ScrollView>

      {loading && !refreshing && cases.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text color="textSecondary" variant="body">Loading cases...</Text>
        </View>
      ) : error && cases.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons color={colors.danger} name="cloud-offline-outline" size={36} />
          <Text color="danger" style={styles.centerText} variant="body">{error}</Text>
          <Button label="Try again" onPress={() => fetchCases(false, 1)} variant="secondary" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={cases.length > 0 ? styles.listContent : styles.emptyContent}
          data={cases}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons color={colors.textTertiary} name="folder-open-outline" size={42} />
              <Text variant="heading">No cases match filters</Text>
              <Text color="textSecondary" style={styles.centerText} variant="body">
                Try a different status or clear the search.
              </Text>
            </View>
          }
          onEndReached={() => {
            if (hasMore && !loading) fetchCases(false, page + 1);
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl colors={[colors.primary]} onRefresh={() => fetchCases(true, 1)} refreshing={refreshing} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const statusConfig = getOfficerStatusConfig(item.status);
            const isUrgent = item.priority === 'URGENT';
            const isClosed = item.status === 'CLOSED';

            return (
              <Card onPress={() => router.push(`/admin/cases/${item.id}` as any)} style={styles.caseCard}>
                <View style={styles.cardTop}>
                  <View style={styles.refWrap}>
                    <Text style={{ fontWeight: '800' }} variant="caption">
                      {item.trackingCode?.code || `CASE-${item.id}`}
                    </Text>
                    <Text color="textSecondary" variant="caption">{formatCategoryCode(item.category)}</Text>
                  </View>
                  <View style={styles.badgeGroup}>
                    {isUrgent && <Badge icon="flame" label="Urgent" tone="danger" />}
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.background }]}>
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.metaCol}>
                    <View style={styles.metaItem}>
                      <Ionicons color={item.officer ? colors.textTertiary : colors.warning} name="person-outline" size={13} />
                      <Text color={item.officer ? 'textSecondary' : 'warning'} numberOfLines={1} variant="caption">
                        {item.officer ? item.officer.name || item.officer.email : 'Unassigned'}
                      </Text>
                    </View>
                    <Text color="textTertiary" variant="caption">Updated {formatCaseDate(item.updatedAt)}</Text>
                  </View>
                  {!isClosed && (
                    <Button
                      icon="person-add-outline"
                      label={item.officer ? 'Reassign' : 'Assign'}
                      onPress={() => setAssignTarget(item)}
                      variant={item.officer ? 'secondary' : 'primary'}
                    />
                  )}
                </View>
              </Card>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AssignOfficerModal
        caseId={assignTarget?.id ?? null}
        caseLabel={assignTarget?.trackingCode?.code}
        currentOfficerId={assignTarget?.officerId}
        onClose={() => setAssignTarget(null)}
        onSuccess={(updated) => {
          setCases((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, officerId: updated.officerId, officer: updated.officer } : c))
          );
        }}
        visible={assignTarget !== null}
      />

      <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  countPill: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  searchWrapper: { paddingHorizontal: Layout.screenPadding, paddingBottom: Spacing.sm },
  filterScroll: { flexGrow: 0, paddingBottom: Spacing.sm },
  chipGroup: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Layout.screenPadding },
  centerBox: { alignItems: 'center', flex: 1, gap: Spacing.sm, justifyContent: 'center', padding: Spacing.xl },
  centerText: { textAlign: 'center' },
  listContent: { gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xs },
  emptyContent: { flexGrow: 1 },
  caseCard: { gap: Spacing.md },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  refWrap: { flex: 1, gap: 2 },
  badgeGroup: { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardFooter: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between', paddingTop: Spacing.md },
  metaCol: { flex: 1, gap: 2 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
});
