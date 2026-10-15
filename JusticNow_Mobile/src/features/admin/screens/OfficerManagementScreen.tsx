import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AdminOfficer,
  AdminOrganization,
  getAdminOfficers,
  getAdminOrganizations,
  updateOfficer,
} from '@/api/adminApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Layout, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminHeader, OfficerFormModal, useAdminTabPress } from '../components';

export function OfficerManagementScreen() {
  const colors = useColors();
  const handleTabPress = useAdminTabPress();

  const [officers, setOfficers] = useState<AdminOfficer[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AdminOfficer | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [officerList, orgList] = await Promise.all([getAdminOfficers(), getAdminOrganizations()]);
      setOfficers(officerList);
      setOrganizations(orgList);
    } catch (err: any) {
      setError(err?.message || 'Unable to load officers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsertOfficer = (saved: AdminOfficer) => {
    setOfficers((prev) =>
      prev.some((o) => o.id === saved.id) ? prev.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...prev]
    );
  };

  const setActive = async (officer: AdminOfficer, isActive: boolean) => {
    try {
      setTogglingId(officer.id);
      upsertOfficer(await updateOfficer(officer.id, { isActive }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to update officer.');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmToggleActive = (officer: AdminOfficer) => {
    const displayName = officer.name || officer.email;
    if (!officer.isActive) {
      setActive(officer, true);
      return;
    }
    const openCaseWarning =
      officer.openCases > 0
        ? `\n\n${displayName} still has ${officer.openCases} open case${officer.openCases === 1 ? '' : 's'}. Reassign them from the case list.`
        : '';
    Alert.alert(
      'Deactivate officer?',
      `${displayName} will no longer be able to log in or receive new cases.${openCaseWarning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => setActive(officer, false) },
      ]
    );
  };

  const activeCount = officers.filter((o) => o.isActive).length;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader
        eyebrow="ACCOUNT MANAGEMENT"
        right={
          <Button
            icon="add"
            label="Add"
            onPress={() => {
              setEditing(null);
              setFormVisible(true);
            }}
          />
        }
        title="Officers"
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error && officers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons color={colors.danger} name="cloud-offline-outline" size={36} />
          <Text color="danger" style={styles.centerText} variant="body">{error}</Text>
          <Button label="Try again" onPress={() => load()} variant="secondary" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={officers}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons color={colors.textTertiary} name="people-outline" size={42} />
              <Text variant="heading">No officers yet</Text>
              <Text color="textSecondary" style={styles.centerText} variant="body">
                Add an officer account so cases can be assigned.
              </Text>
            </View>
          }
          ListHeaderComponent={
            officers.length > 0 ? (
              <Text color="textSecondary" style={styles.summary} variant="caption">
                {activeCount} active · {officers.length - activeCount} deactivated
              </Text>
            ) : null
          }
          refreshControl={
            <RefreshControl colors={[colors.primary]} onRefresh={() => load(true)} refreshing={refreshing} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <Card style={[styles.card, !item.isActive && styles.inactive]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: item.isActive ? colors.primarySoft : colors.surfaceMuted }]}>
                  <Ionicons color={item.isActive ? colors.primary : colors.textTertiary} name="person" size={20} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="bodyStrong">{item.name || item.email}</Text>
                  <Text color="textSecondary" numberOfLines={1} variant="caption">{item.email}</Text>
                  {item.organization ? (
                    <Text color="textTertiary" numberOfLines={1} variant="caption">{item.organization.name}</Text>
                  ) : null}
                </View>
                <Badge label={item.isActive ? 'Active' : 'Deactivated'} tone={item.isActive ? 'success' : 'neutral'} />
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text color="textSecondary" variant="caption">
                  {item.openCases} open case{item.openCases === 1 ? '' : 's'}
                </Text>
                <View style={styles.actions}>
                  <Button
                    icon="create-outline"
                    label="Edit"
                    onPress={() => {
                      setEditing(item);
                      setFormVisible(true);
                    }}
                    variant="ghost"
                  />
                  <Button
                    label={item.isActive ? 'Deactivate' : 'Reactivate'}
                    loading={togglingId === item.id}
                    onPress={() => confirmToggleActive(item)}
                    variant="secondary"
                  />
                </View>
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <OfficerFormModal
        officer={editing}
        onClose={() => setFormVisible(false)}
        onSaved={upsertOfficer}
        organizations={organizations}
        visible={formVisible}
      />

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', flex: 1, gap: Spacing.sm, justifyContent: 'center', padding: Spacing.xl },
  centerText: { textAlign: 'center' },
  listContent: { flexGrow: 1, gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding },
  summary: { marginBottom: -Spacing.xs },
  card: { gap: Spacing.md },
  inactive: { opacity: 0.7 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  avatar: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  cardText: { flex: 1, gap: 2 },
  cardFooter: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm },
  actions: { flexDirection: 'row', gap: Spacing.xs },
});
