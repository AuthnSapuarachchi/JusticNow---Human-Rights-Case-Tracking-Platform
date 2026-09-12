import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardStats, getDashboardStats } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

export function OfficerDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session, logout } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load dashboard stats.');
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
    router.replace('/login' as any);
  };

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/officer' as any);
    if (tab === NavTab.Cases) router.push('/officer/queue' as any);
    if (tab === NavTab.Messages) router.push('/messages' as any);
    if (tab === NavTab.Support) router.push('/legal-support' as any);
  };

  const navigateToQueue = (filterParams: Record<string, string | undefined>) => {
    router.push({
      pathname: '/officer/queue' as any,
      params: filterParams as any,
    });
  };

  const statCards = [
    {
      id: 'assigned',
      label: 'Assigned to Me',
      value: stats?.totalAssigned ?? 0,
      icon: 'person-outline' as const,
      color: '#2875d0',
      bg: '#e7f0fc',
      params: { assignedToMe: 'true' },
    },
    {
      id: 'new',
      label: 'New Cases',
      value: stats?.newCases ?? 0,
      icon: 'sparkles-outline' as const,
      color: '#28725b',
      bg: '#e2f2ed',
      params: { status: 'NEW,SUBMITTED' },
    },
    {
      id: 'urgent',
      label: 'Urgent Cases',
      value: stats?.urgent ?? 0,
      icon: 'flame-outline' as const,
      color: '#d04f28',
      bg: '#fcebe7',
      params: { priority: 'URGENT' },
    },
    {
      id: 'waiting',
      label: 'Waiting for User',
      value: stats?.waitingForUser ?? 0,
      icon: 'time-outline' as const,
      color: '#b96925',
      bg: '#fff0df',
      params: { status: 'WAITING_FOR_USER,ACTION_REQUIRED' },
    },
    {
      id: 'investigating',
      label: 'Investigating',
      value: stats?.investigating ?? 0,
      icon: 'search-outline' as const,
      color: '#5b3fc7',
      bg: '#efeafd',
      params: { status: 'INVESTIGATING,UNDER_REVIEW' },
    },
    {
      id: 'recent',
      label: 'Recently Updated',
      value: stats?.recentlyUpdated ?? 0,
      icon: 'sync-outline' as const,
      color: '#3178c6',
      bg: '#e8f0fe',
      params: { sortBy: 'updatedAt', sortOrder: 'desc' },
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => loadStats(true)}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarBox, { backgroundColor: colors.primarySoft }]}>
              <Ionicons color={colors.primary} name="shield-checkmark" size={26} />
            </View>
            <View>
              <Text color="primary" variant="eyebrow">
                OFFICER PORTAL
              </Text>
              <Text style={styles.headerTitle} variant="heading">
                Case Management
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Log out"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textSecondary} name="log-out-outline" size={22} />
          </Pressable>
        </View>

        {/* Officer Welcome Card */}
        <Card bordered style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeInfo}>
              <Text color="textSecondary" variant="caption">
                OFFICER IN CHARGE
              </Text>
              <Text style={styles.officerName} variant="heading">
                {session?.user.name || session?.user.email}
              </Text>
              <Text color="textTertiary" variant="caption">
                {session?.user.email}
              </Text>
            </View>
            <Badge label="OFFICER" tone="verified" />
          </View>
        </Card>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} variant="heading">
            Triage & Case Overview
          </Text>
          <Text color="textSecondary" variant="caption">
            Tap any card to view filtered cases
          </Text>
        </View>

        {/* Loading / Error state */}
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text color="textSecondary" variant="body">
              Loading dashboard statistics...
            </Text>
          </View>
        ) : error && !stats ? (
          <Card bordered style={styles.errorBox}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={28} />
            <Text color="danger" variant="body">
              {error}
            </Text>
            <Button label="Retry" onPress={() => loadStats()} variant="secondary" />
          </Card>
        ) : (
          /* Six Stat Cards Grid */
          <View style={styles.statsGrid}>
            {statCards.map((card) => (
              <Pressable
                accessibilityLabel={`${card.label}: ${card.value} cases`}
                accessibilityRole="button"
                key={card.id}
                onPress={() => navigateToQueue(card.params)}
                style={({ pressed }) => [
                  styles.statCardWrapper,
                  pressed && styles.pressed,
                ]}
              >
                <Card bordered style={styles.statCard}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.statIconCircle, { backgroundColor: card.bg }]}>
                      <Ionicons color={card.color} name={card.icon} size={20} />
                    </View>
                    <Ionicons color={colors.textTertiary} name="chevron-forward" size={16} />
                  </View>
                  <Text style={[styles.statValue, { color: card.color }]} variant="display">
                    {card.value}
                  </Text>
                  <Text color="textSecondary" numberOfLines={1} style={{ fontWeight: '700' }} variant="caption">
                    {card.label}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.actionSectionTitle} variant="heading">
          Quick Operations
        </Text>

        <View style={styles.quickActionsList}>
          <Pressable
            onPress={() => router.push('/officer/queue' as any)}
            style={({ pressed }) => [
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primarySoft }]}>
              <Ionicons color={colors.primary} name="folder-open" size={22} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text variant="bodyStrong">All Case Queue</Text>
              <Text color="textSecondary" variant="caption">
                Search, filter, assign, and review all citizen reports
              </Text>
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/messages' as any)}
            style={({ pressed }) => [
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e2f2ed' }]}>
              <Ionicons color="#28725b" name="chatbubbles" size={22} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text variant="bodyStrong">Citizen Messages</Text>
              <Text color="textSecondary" variant="caption">
                Direct communications and incident inquiries
              </Text>
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/legal-support' as any)}
            style={({ pressed }) => [
              styles.actionItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#efeafd' }]}>
              <Ionicons color="#5b3fc7" name="business" size={22} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text variant="bodyStrong">Legal Directory</Text>
              <Text color="textSecondary" variant="caption">
                Browse verified legal aid and advocacy organizations
              </Text>
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
          </Pressable>
        </View>

        <View style={styles.signOutWrapper}>
          <Button
            fullWidth
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>
      </ScrollView>

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginTop: 2,
  },
  logoutButton: {
    padding: Spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  welcomeCard: {
    padding: Spacing.lg,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  welcomeInfo: {
    gap: 4,
    flex: 1,
  },
  officerName: {
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
  },
  centerLoading: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorBox: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  actionSectionTitle: {
    fontSize: 18,
    marginTop: Spacing.md,
  },
  quickActionsList: {
    gap: Spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  signOutWrapper: {
    marginTop: Spacing.lg,
  },
});
