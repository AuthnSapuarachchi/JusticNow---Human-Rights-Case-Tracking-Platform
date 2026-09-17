import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

const metrics = [
  { label: 'Total cases', value: '248', icon: 'folder-open-outline' as const, tone: 'primary' as const, soft: 'primarySoft' as const },
  { label: 'Unassigned', value: '18', icon: 'person-add-outline' as const, tone: 'warning' as const, soft: 'warningSoft' as const },
  { label: 'Under review', value: '96', icon: 'search-outline' as const, tone: 'success' as const, soft: 'successSoft' as const },
  { label: 'Resolved this month', value: '42', icon: 'checkmark-circle-outline' as const, tone: 'verified' as const, soft: 'primarySoft' as const },
];

const statusBreakdown = [
  { label: 'Submitted', value: 34, color: 'warning' as const },
  { label: 'Under review', value: 96, color: 'primary' as const },
  { label: 'Action required', value: 22, color: 'danger' as const },
  { label: 'Resolved', value: 74, color: 'success' as const },
];

const priorityCases = [
  { reference: 'JN-2026-0418', category: 'Workplace discrimination', status: 'Action required', priority: 'High', officer: 'Unassigned' },
  { reference: 'JN-2026-0412', category: 'Human rights violation', status: 'Under review', priority: 'Medium', officer: 'Maya Perera' },
  { reference: 'JN-2026-0407', category: 'Digital privacy', status: 'Submitted', priority: 'High', officer: 'Unassigned' },
];

// `route` is optional - shortcuts without one are not built yet.
const shortcuts = [
  { label: 'Manage cases', icon: 'briefcase-outline' as const },
  { label: 'Manage officers', icon: 'people-outline' as const },
  { label: 'Organizations', icon: 'business-outline' as const, route: '/admin/organizations' as const },
  { label: 'Know Your Rights', icon: 'book-outline' as const, route: '/admin/rights' as const },
];

export function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/admin');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
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

        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <Card key={metric.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: colors[metric.soft] }]}>
                <Ionicons color={colors[metric.tone]} name={metric.icon} size={19} />
              </View>
              <Text style={styles.metricValue} variant="title">{metric.value}</Text>
              <Text color="textSecondary" variant="caption">{metric.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text variant="heading">Case overview</Text>
          <Text color="textSecondary" variant="caption">Current workload</Text>
        </View>
        <Card style={styles.overviewCard}>
          {statusBreakdown.map((item) => (
            <View key={item.label} style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <View style={[styles.statusDot, { backgroundColor: colors[item.color] }]} />
                <Text variant="body">{item.label}</Text>
              </View>
              <Text variant="bodyStrong">{item.value}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.sectionHeading}>
          <Text variant="heading">Needs attention</Text>
          <Text color="primary" variant="caption">3 cases</Text>
        </View>
        {priorityCases.map((item) => (
          <Card key={item.reference} style={styles.caseCard}>
            <View style={styles.caseTopLine}>
              <Text color="textSecondary" variant="caption">{item.reference}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'High' ? colors.dangerSoft : colors.warningSoft }]}>
                <Text color={item.priority === 'High' ? 'danger' : 'warning'} variant="caption">{item.priority}</Text>
              </View>
            </View>
            <Text style={styles.caseCategory} variant="bodyStrong">{item.category}</Text>
            <View style={styles.caseMeta}>
              <Text color="textSecondary" variant="caption">{item.status}</Text>
              <Text color="textTertiary" variant="caption">{item.officer}</Text>
            </View>
          </Card>
        ))}

        <View style={styles.sectionHeading}>
          <Text variant="heading">Quick management</Text>
        </View>
        <View style={styles.shortcutGrid}>
          {shortcuts.map((shortcut) => (
            <Pressable key={shortcut.label} accessibilityRole="button" onPress={() => shortcut.route && router.push(shortcut.route)} style={({ pressed }) => [styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
              <View style={[styles.shortcutIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons color={colors.primary} name={shortcut.icon} size={20} />
              </View>
              <Text style={styles.shortcutLabel} variant="bodyStrong">{shortcut.label}</Text>
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
  eyebrow: { marginBottom: Spacing.xs },
  title: { marginBottom: Spacing.xs },
  subtitle: { maxWidth: 310 },
  welcome: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  avatar: { alignItems: 'center', borderRadius: Radius.md, height: 48, justifyContent: 'center', width: 48 },
  welcomeCopy: { flex: 1, gap: 3 },
  name: { marginTop: 2 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  metricCard: { flexBasis: '47%', flexGrow: 1, minHeight: 126 },
  metricIcon: { alignItems: 'center', borderRadius: Radius.sm, height: 34, justifyContent: 'center', marginBottom: Spacing.md, width: 34 },
  metricValue: { marginBottom: Spacing.xs },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, marginTop: Spacing.sm },
  overviewCard: { gap: Spacing.md, marginBottom: Spacing.lg },
  statusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  caseCard: { marginBottom: Spacing.md },
  caseTopLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priorityBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  caseCategory: { marginBottom: Spacing.md, marginTop: Spacing.sm },
  caseMeta: { borderTopColor: '#E3E7EC', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm },
  shortcutGrid: { gap: Spacing.md },
  shortcut: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 62, padding: Spacing.md },
  shortcutIcon: { alignItems: 'center', borderRadius: Radius.sm, height: 38, justifyContent: 'center', width: 38 },
  shortcutLabel: { flex: 1 },
  pressed: { opacity: 0.75 },
});