import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AdminOrganization,
  deleteOrganization,
  getAdminOrganizations,
  updateOrganization,
} from '@/api/adminApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Layout, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminHeader, OrganizationFormModal, useAdminTabPress } from '../components';

export function OrganizationManagementScreen() {
  const colors = useColors();
  const handleTabPress = useAdminTabPress();

  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AdminOrganization | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      setOrganizations(await getAdminOrganizations());
    } catch (err: any) {
      setError(err?.message || 'Unable to load organizations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsertOrganization = (saved: AdminOrganization) => {
    setOrganizations((prev) =>
      prev.some((o) => o.id === saved.id) ? prev.map((o) => (o.id === saved.id ? saved : o)) : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const toggleVerified = async (org: AdminOrganization) => {
    try {
      setBusyId(org.id);
      upsertOrganization(await updateOrganization(org.id, { verified: !org.verified }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to update organization.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (org: AdminOrganization) => {
    const referrals = org._count?.referrals ?? 0;
    const officers = org._count?.officers ?? 0;
    const details = [
      referrals > 0 ? `${referrals} past referral${referrals === 1 ? '' : 's'} will keep the organization name but lose the link.` : null,
      officers > 0 ? `${officers} officer${officers === 1 ? '' : 's'} will be unlinked from it.` : null,
    ]
      .filter(Boolean)
      .join('\n');

    Alert.alert('Delete organization?', `${org.name} will be removed permanently.${details ? `\n\n${details}` : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyId(org.id);
            await deleteOrganization(org.id);
            setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Unable to delete organization.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader
        eyebrow="LEGAL SUPPORT"
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
        title="Organizations"
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error && organizations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons color={colors.danger} name="cloud-offline-outline" size={36} />
          <Text color="danger" style={styles.centerText} variant="body">{error}</Text>
          <Button label="Try again" onPress={() => load()} variant="secondary" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={organizations}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons color={colors.textTertiary} name="business-outline" size={42} />
              <Text variant="heading">No organizations yet</Text>
              <Text color="textSecondary" style={styles.centerText} variant="body">
                Add legal-support organizations so officers can refer cases.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl colors={[colors.primary]} onRefresh={() => load(true)} refreshing={refreshing} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardText}>
                  <Text variant="bodyStrong">{item.name}</Text>
                  <Text color="textSecondary" numberOfLines={1} variant="caption">{item.contactEmail}</Text>
                  {item.phone || item.location ? (
                    <Text color="textTertiary" numberOfLines={1} variant="caption">
                      {[item.phone, item.location].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Badge
                  icon={item.verified ? 'shield-checkmark' : undefined}
                  label={item.verified ? 'Verified' : 'Unverified'}
                  tone={item.verified ? 'verified' : 'neutral'}
                />
              </View>

              {item.description ? (
                <Text color="textSecondary" numberOfLines={3} variant="caption">{item.description}</Text>
              ) : null}

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text color="textTertiary" variant="caption">
                  {item._count?.referrals ?? 0} referrals · {item._count?.officers ?? 0} officers
                </Text>
                <View style={styles.actions}>
                  <Button
                    label="Edit"
                    onPress={() => {
                      setEditing(item);
                      setFormVisible(true);
                    }}
                    variant="ghost"
                  />
                  <Button
                    label={item.verified ? 'Unverify' : 'Verify'}
                    loading={busyId === item.id}
                    onPress={() => toggleVerified(item)}
                    variant="secondary"
                  />
                  <Button icon="trash-outline" label="Delete" onPress={() => confirmDelete(item)} variant="ghost" />
                </View>
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <OrganizationFormModal
        onClose={() => setFormVisible(false)}
        onSaved={upsertOrganization}
        organization={editing}
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
  card: { gap: Spacing.sm },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.md },
  cardText: { flex: 1, gap: 2 },
  cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.sm, paddingTop: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
