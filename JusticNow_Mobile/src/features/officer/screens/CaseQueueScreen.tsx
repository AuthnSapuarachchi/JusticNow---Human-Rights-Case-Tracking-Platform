import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOfficerCases, OfficerCaseItem } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import {
  Badge,
  Card,
  FilterChip,
  SearchField,
  Text,
} from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDate, getOfficerStatusConfig } from '@/features/cases/statusUtils';

export function CaseQueueScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    assignedToMe?: string;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>();

  const [cases, setCases] = useState<OfficerCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state initialized from route params if present
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'mine' | 'unassigned'>(
    params.assignedToMe === 'true'
      ? 'mine'
      : params.assignedToMe === 'false'
      ? 'unassigned'
      : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>(params.status || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT'>(
    params.priority === 'URGENT' ? 'URGENT' : 'ALL'
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCases = useCallback(
    async (isRefresh = false, targetPage = 1) => {
      if (isRefresh) setRefreshing(true);
      else if (targetPage === 1) setLoading(true);
      setError(null);

      try {
        const assignedParam =
          assignedFilter === 'mine' ? true : assignedFilter === 'unassigned' ? false : undefined;

        const res = await getOfficerCases({
          page: targetPage,
          limit: 15,
          assignedToMe: assignedParam,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          search: searchQuery.trim() || undefined,
          sortBy: params.sortBy || 'updatedAt',
          sortOrder: params.sortOrder || 'desc',
        });

        if (targetPage === 1) {
          setCases(res.cases);
        } else {
          setCases((prev) => [...prev, ...res.cases]);
        }

        setHasMore(res.pagination.page < res.pagination.totalPages);
        setPage(targetPage);
      } catch (err: any) {
        setError(err?.message || 'Unable to load case queue.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [assignedFilter, statusFilter, priorityFilter, searchQuery, params.sortBy, params.sortOrder]
  );

  useEffect(() => {
    fetchCases(false, 1);
  }, [fetchCases]);

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/officer' as any);
    if (tab === NavTab.Cases) router.replace('/officer/queue' as any);
    if (tab === NavTab.Messages) router.push('/messages' as any);
    if (tab === NavTab.Support) router.push('/legal-support' as any);
  };

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'New', value: 'NEW,SUBMITTED' },
    { label: 'Investigating', value: 'INVESTIGATING,UNDER_REVIEW' },
    { label: 'Waiting User', value: 'WAITING_FOR_USER,ACTION_REQUIRED' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeading}>
          <Pressable
            accessibilityLabel="Back to Dashboard"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.replace('/officer' as any)}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
          </Pressable>
          <View>
            <Text color="primary" variant="eyebrow">
              CASE TRIAGE
            </Text>
            <Text style={styles.title} variant="heading">
              Officer Queue
            </Text>
          </View>
        </View>

        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary, fontWeight: '800' }} variant="caption">
            {cases.length} cases
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <SearchField
          accessibilityLabel="Search cases by reference, description or location"
          onChangeText={setSearchQuery}
          placeholder="Search reference, description, location..."
          value={searchQuery}
        />
      </View>

      {/* Filter Row 1: Assignment & Priority */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.chipGroup}>
            <FilterChip
              label="All Cases"
              onPress={() => setAssignedFilter('all')}
              selected={assignedFilter === 'all'}
            />
            <FilterChip
              label="Assigned to Me"
              onPress={() => setAssignedFilter('mine')}
              selected={assignedFilter === 'mine'}
            />
            <FilterChip
              label="Unassigned"
              onPress={() => setAssignedFilter('unassigned')}
              selected={assignedFilter === 'unassigned'}
            />
            <FilterChip
              label="Urgent Only"
              onPress={() => setPriorityFilter(priorityFilter === 'URGENT' ? 'ALL' : 'URGENT')}
              selected={priorityFilter === 'URGENT'}
            />
          </View>
        </ScrollView>
      </View>

      {/* Filter Row 2: Status Chips */}
      <View style={styles.filterBarSecondary}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.chipGroupSecondary}>
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
      </View>

      {/* Case List */}
      {loading && !refreshing && cases.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text color="textSecondary" style={styles.centerText} variant="body">
            Loading cases in queue...
          </Text>
        </View>
      ) : error && cases.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons color={colors.danger} name="cloud-offline-outline" size={36} />
          <Text color="danger" style={styles.centerText} variant="body">
            {error}
          </Text>
          <Pressable onPress={() => fetchCases(true, 1)}>
            <Text color="primary" variant="bodyStrong">
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={cases.length > 0 ? styles.listContent : styles.emptyContent}
          data={cases}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons color={colors.textTertiary} name="folder-open-outline" size={42} />
              <Text style={styles.emptyTitle} variant="heading">
                No cases match filters
              </Text>
              <Text color="textSecondary" style={styles.centerText} variant="body">
                Try selecting a different status or clear search query.
              </Text>
            </View>
          }
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchCases(false, page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => fetchCases(true, 1)}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const statusConfig = getOfficerStatusConfig(item.status);
            const isUrgent = item.priority === 'URGENT';

            return (
              <Pressable
                accessibilityLabel={`Case ${item.trackingCode?.code || item.id}`}
                accessibilityRole="button"
                onPress={() => router.push(`/officer/${item.id}` as any)}
                style={({ pressed }) => [styles.caseCardWrap, pressed && styles.pressed]}
              >
                <Card bordered style={styles.caseCard}>
                  {/* Card Top: Reference + Status & Priority Badges */}
                  <View style={styles.cardTop}>
                    <View style={styles.refWrap}>
                      <View style={[styles.cardFolderIcon, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons color={colors.primary} name="document-text" size={18} />
                      </View>
                      <View>
                        <Text style={[styles.referenceText, { fontWeight: '800' }]} variant="caption">
                          {item.trackingCode?.code || `CASE-${item.id}`}
                        </Text>
                        <Text color="textSecondary" variant="caption">
                          {item.category?.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badgeGroup}>
                      {isUrgent && (
                        <View style={[styles.priorityBadge, { backgroundColor: colors.dangerSoft }]}>
                          <Ionicons color={colors.danger} name="flame" size={12} />
                          <Text color="danger" variant="caption">
                            URGENT
                          </Text>
                        </View>
                      )}
                      {item.escalated && (
                        <Badge label="ESCALATED" tone="danger" />
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.background }]}>
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description snippet */}
                  <Text numberOfLines={2} style={styles.cardDesc} variant="body">
                    {item.description}
                  </Text>

                  {/* Details Bar: Location, Officer, Date */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.metaCol}>
                      <View style={styles.metaItem}>
                        <Ionicons color={colors.textTertiary} name="person-outline" size={13} />
                        <Text color="textSecondary" numberOfLines={1} variant="caption">
                          {item.officer ? item.officer.name || item.officer.email : 'Unassigned'}
                        </Text>
                      </View>
                      {item.location ? (
                        <View style={styles.metaItem}>
                          <Ionicons color={colors.textTertiary} name="location-outline" size={13} />
                          <Text color="textSecondary" numberOfLines={1} variant="caption">
                            {item.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.rightFooter}>
                      <Text color="textTertiary" variant="caption">
                        {formatCaseDate(item.updatedAt)}
                      </Text>
                      <Ionicons color={colors.textTertiary} name="chevron-forward" size={16} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  headerLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    marginTop: 2,
  },
  countPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  searchWrapper: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.sm,
  },
  filterBar: {
    paddingBottom: Spacing.xs,
  },
  filterBarSecondary: {
    paddingBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Layout.screenPadding,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.xl,
  },
  chipGroupSecondary: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.xl,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 110,
    gap: Spacing.sm,
  },
  emptyContent: {
    flex: 1,
  },
  caseCardWrap: {
    marginBottom: 2,
  },
  caseCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cardFolderIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
  },
  statusBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDesc: {
    lineHeight: 19,
    color: '#495861',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    marginTop: 2,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 17,
  },
});
