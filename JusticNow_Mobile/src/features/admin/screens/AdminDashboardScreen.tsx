import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminStats, formatCategoryCode, getAdminStats } from '@/api/adminApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { formatCaseDate, getOfficerStatusConfig } from '@/features/cases/statusUtils';
import { useAdminTabPress } from '../components';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const shortcuts: { label: string; hint: string; icon: IconName; href: string }[] = [
  { label: 'Verify accounts', hint: 'Review pending officer and lawyer registrations', icon: 'shield-checkmark-outline', href: '/admin/verifications' },
  { label: 'Manage cases', hint: 'View all cases and assign officers', icon: 'briefcase-outline', href: '/admin/cases' },
  { label: 'Manage officers', hint: 'Create, edit and deactivate accounts', icon: 'people-outline', href: '/admin/officers' },
  { label: 'Organizations', hint: 'Legal-support organizations for referrals', icon: 'business-outline', href: '/admin/organizations' },
  { label: 'Violation categories', hint: 'Labels and availability for reports', icon: 'pricetags-outline', href: '/admin/categories' },
];

export function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session, logout } = useAuth();
  const handleTabPress = useAdminTabPress();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      setStats(await getAdminStats());
    } catch (err: any) {
      setError(err?.message || 'Unable to load admin statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const metrics: { label: string; value: number; icon: IconName; tone: 'primary' | 'warning' | 'danger' | 'success'; soft: 'primarySoft' | 'warningSoft' | 'dangerSoft' | 'successSoft'; href: string }[] = [
    { label: 'Total cases', value: stats?.totalCases ?? 0, icon: 'folder-open-outline', tone: 'primary', soft: 'primarySoft', href: '/admin/cases' },
    { label: 'Unassigned', value: stats?.unassigned ?? 0, icon: 'person-add-outline', tone: 'warning', soft: 'warningSoft', href: '/admin/cases?assignment=unassigned' },
    { label: 'Urgent open', value: stats?.urgent ?? 0, icon: 'flame-outline', tone: 'danger', soft: 'dangerSoft', href: '/admin/cases?priority=URGENT' },
    { label: 'Resolved this month', value: stats?.resolvedThisMonth ?? 0, icon: 'checkmark-circle-outline', tone: 'success', soft: 'successSoft', href: '/admin/cases?status=RESOLVED,CLOSED' },
  ];

  const maxStatus = Math.max(1, ...(stats?.byStatus.map((s) => s.count) ?? [1]));
  const maxCategory = Math.max(1, ...(stats?.byCategory.map((c) => c.count) ?? [1]));

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl colors={[colors.primary]} onRefresh={() => loadStats(true)} refreshing={refreshing} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text color="primary" style={styles.eyebrow} variant="eyebrow">JUSTICENOW ADMIN</Text>
            <Text style={styles.title} variant="pageTitle">Admin dashboard</Text>
            <Text color="textSecondary" style={styles.subtitle}>A quick view of platform activity and case workload.</Text>
          </View>
          <Pressable accessibilityLabel="Log out" accessibilityRole="button" hitSlop={8} onPress={handleLogout}>
            <Ionicons color={colors.textSecondary} name="log-out-outline" size={23} />
          </Pressable>
        </View>

        <Card style={styles.welcome}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={23} />
          </View>
          <View style={styles.welcomeCopy}>
            <Text color="textSecondary" variant="caption">SIGNED IN AS</Text>
            <Text style={styles.name} variant="bodyStrong">{session?.user.name || 'Platform administrator'}</Text>
            <Text color="textSecondary" variant="caption">{session?.user.email}</Text>
          </View>
        </Card>

        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text color="textSecondary" variant="body">Loading platform statistics...</Text>
          </View>
        ) : error && !stats ? (
          <Card style={styles.errorBox}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={28} />
            <Text color="danger" style={styles.centerText} variant="body">{error}</Text>
            <Button label="Retry" onPress={() => loadStats()} variant="secondary" />
          </Card>
        ) : stats ? (
          <>
            <View style={styles.metricGrid}>
              {metrics.map((metric) => (
                <Pressable
                  accessibilityLabel={`${metric.label}: ${metric.value}`}
                  accessibilityRole="button"
                  key={metric.label}
                  onPress={() => router.push(metric.href as any)}
                  style={({ pressed }) => [styles.metricWrap, pressed && styles.pressed]}
                >
                  <Card style={styles.metricCard}>
                    <View style={[styles.metricIcon, { backgroundColor: colors[metric.soft] }]}>
                      <Ionicons color={colors[metric.tone]} name={metric.icon} size={19} />
                    </View>
                    <Text style={styles.metricValue} variant="title">{metric.value}</Text>
                    <Text color="textSecondary" variant="caption">{metric.label}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionHeading}>
              <Text variant="heading">Case overview</Text>
              <Text color="textSecondary" variant="caption">{stats.newThisWeek} new this week</Text>
            </View>
            <Card style={styles.overviewCard}>
              {stats.byStatus.length === 0 ? (
                <Text color="textSecondary" variant="body">No cases have been reported yet.</Text>
              ) : (
                stats.byStatus
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const config = getOfficerStatusConfig(item.status);
                    return (
                      <View key={item.status} style={styles.barRow}>
                        <View style={styles.statusRow}>
                          <View style={styles.statusLabel}>
                            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                            <Text variant="body">{config.label}</Text>
                          </View>
                          <Text variant="bodyStrong">{item.count}</Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                          <View style={[styles.barFill, { backgroundColor: config.color, width: `${(item.count / maxStatus) * 100}%` }]} />
                        </View>
                      </View>
                    );
                  })
              )}
            </Card>

            <View style={styles.sectionHeading}>
              <Text variant="heading">By category</Text>
              <Text color="textSecondary" variant="caption">Anonymized</Text>
            </View>
            <Card style={styles.overviewCard}>
              {stats.byCategory.length === 0 ? (
                <Text color="textSecondary" variant="body">No category data yet.</Text>
              ) : (
                stats.byCategory
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <View key={item.category} style={styles.barRow}>
                      <View style={styles.statusRow}>
                        <Text variant="body">{formatCategoryCode(item.category)}</Text>
                        <Text variant="bodyStrong">{item.count}</Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                        <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${(item.count / maxCategory) * 100}%` }]} />
                      </View>
                    </View>
                  ))
              )}
            </Card>

            <View style={styles.sectionHeading}>
              <Text variant="heading">Needs attention</Text>
              <Text color="primary" variant="caption">{stats.needsAttention.length} cases</Text>
            </View>
            {stats.needsAttention.length === 0 ? (
              <Card style={styles.caseCard}>
                <Text color="textSecondary" variant="body">No urgent or unassigned cases. Nice work.</Text>
              </Card>
            ) : (
              stats.needsAttention.map((item) => {
                const config = getOfficerStatusConfig(item.status);
                const isUrgent = item.priority === 'URGENT';
                return (
                  <Card key={item.id} onPress={() => router.push(`/admin/cases/${item.id}` as any)} style={styles.caseCard}>
                    <View style={styles.caseTopLine}>
                      <Text color="textSecondary" variant="caption">{item.trackingCode?.code || `CASE-${item.id}`}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: isUrgent ? colors.dangerSoft : colors.warningSoft }]}>
                        <Text color={isUrgent ? 'danger' : 'warning'} variant="caption">{isUrgent ? 'Urgent' : 'Unassigned'}</Text>
                      </View>
                    </View>
                    <Text style={styles.caseCategory} variant="bodyStrong">{formatCategoryCode(item.category)}</Text>
                    <View style={[styles.caseMeta, { borderTopColor: colors.border }]}>
                      <Text style={{ color: config.color }} variant="caption">{config.label}</Text>
                      <Text color="textTertiary" variant="caption">
                        {item.officer ? item.officer.name || item.officer.email : 'Unassigned'} · {formatCaseDate(item.updatedAt)}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}

            <View style={styles.sectionHeading}>
              <Text variant="heading">Officer workload</Text>
              <Text color="textSecondary" variant="caption">Open cases</Text>
            </View>
            <Card style={styles.overviewCard}>
              {stats.officerWorkload.length === 0 ? (
                <Text color="textSecondary" variant="body">No active officers yet.</Text>
              ) : (
                stats.officerWorkload.map((officer) => (
                  <View key={officer.id} style={styles.statusRow}>
                    <View style={styles.statusLabel}>
                      <Ionicons color={colors.textTertiary} name="person-circle-outline" size={20} />
                      <Text numberOfLines={1} variant="body">{officer.name || officer.email}</Text>
                    </View>
                    <Text variant="bodyStrong">{officer.openCases}</Text>
                  </View>
                ))
              )}
            </Card>
          </>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text variant="heading">Quick management</Text>
        </View>
        <View style={styles.shortcutGrid}>
          {shortcuts.map((shortcut) => (
            <Pressable
              accessibilityRole="button"
              key={shortcut.label}
              onPress={() => router.push(shortcut.href as any)}
              style={({ pressed }) => [styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons color={colors.primary} name={shortcut.icon} size={20} />
              </View>
              <View style={styles.shortcutLabel}>
                <Text variant="bodyStrong">{shortcut.label}</Text>
                <Text color="textSecondary" variant="caption">{shortcut.hint}</Text>
              </View>
              <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Layout.screenPadding, paddingBottom: 120, paddingTop: Spacing.xl },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  headerCopy: { flex: 1 },
  eyebrow: { marginBottom: Spacing.xs },
  title: { marginBottom: Spacing.xs },
  subtitle: { maxWidth: 310 },
  welcome: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  avatar: { alignItems: 'center', borderRadius: Radius.md, height: 48, justifyContent: 'center', width: 48 },
  welcomeCopy: { flex: 1, gap: 3 },
  name: { marginTop: 2 },
  centerBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxxl },
  errorBox: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  centerText: { textAlign: 'center' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  metricWrap: { flexBasis: '47%', flexGrow: 1 },
  metricCard: { minHeight: 126 },
  metricIcon: { alignItems: 'center', borderRadius: Radius.sm, height: 34, justifyContent: 'center', marginBottom: Spacing.md, width: 34 },
  metricValue: { marginBottom: Spacing.xs },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, marginTop: Spacing.sm },
  overviewCard: { gap: Spacing.md, marginBottom: Spacing.lg },
  barRow: { gap: 6 },
  barTrack: { borderRadius: 4, height: 6, overflow: 'hidden' },
  barFill: { borderRadius: 4, height: 6 },
  statusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: Spacing.sm },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  caseCard: { marginBottom: Spacing.md },
  caseTopLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priorityBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  caseCategory: { marginBottom: Spacing.md, marginTop: Spacing.sm },
  caseMeta: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm },
  shortcutGrid: { gap: Spacing.md },
  shortcut: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 62, padding: Spacing.md },
  shortcutIcon: { alignItems: 'center', borderRadius: Radius.sm, height: 38, justifyContent: 'center', width: 38 },
  shortcutLabel: { flex: 1, gap: 2 },
  pressed: { opacity: 0.75 },
});
