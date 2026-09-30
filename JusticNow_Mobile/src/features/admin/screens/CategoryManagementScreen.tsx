import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminCategory, getAdminCategories, updateCategory } from '@/api/adminApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Button, Card, Text } from '@/design-system/components';
import { Layout, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminHeader, CategoryFormModal, useAdminTabPress } from '../components';

export function CategoryManagementScreen() {
  const colors = useColors();
  const handleTabPress = useAdminTabPress();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      setCategories(await getAdminCategories());
    } catch (err: any) {
      setError(err?.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replaceCategory = (saved: AdminCategory) => {
    setCategories((prev) => prev.map((c) => (c.code === saved.code ? saved : c)));
  };

  const toggleActive = async (category: AdminCategory, isActive: boolean) => {
    replaceCategory({ ...category, isActive });
    try {
      const saved = await updateCategory(category.code, { isActive });
      replaceCategory({ ...saved, caseCount: category.caseCount });
    } catch (err: any) {
      replaceCategory(category);
      Alert.alert('Error', err?.message || 'Unable to update category.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader eyebrow="REPORTING SETUP" title="Violation Categories" />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error && categories.length === 0 ? (
        <View style={styles.center}>
          <Ionicons color={colors.danger} name="cloud-offline-outline" size={36} />
          <Text color="danger" style={styles.centerText} variant="body">{error}</Text>
          <Button label="Try again" onPress={() => load()} variant="secondary" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={categories}
          keyExtractor={(item) => item.code}
          ListHeaderComponent={
            <Text color="textSecondary" variant="caption">
              Edit the label and explanation citizens see, or switch a category off for new reports.
            </Text>
          }
          refreshControl={
            <RefreshControl colors={[colors.primary]} onRefresh={() => load(true)} refreshing={refreshing} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <Card style={[styles.card, !item.isActive && styles.inactive]}>
              <View style={styles.cardTop}>
                <View style={styles.cardText}>
                  <Text variant="bodyStrong">{item.label}</Text>
                  <Text color="textTertiary" variant="caption">{item.code}</Text>
                </View>
                <Switch
                  accessibilityLabel={`${item.label} available for new reports`}
                  onValueChange={(value) => toggleActive(item, value)}
                  thumbColor={colors.surface}
                  trackColor={{ false: colors.borderStrong, true: colors.primary }}
                  value={item.isActive}
                />
              </View>
              {item.description ? (
                <Text color="textSecondary" variant="caption">{item.description}</Text>
              ) : null}
              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text color="textSecondary" variant="caption">
                  {item.caseCount} case{item.caseCount === 1 ? '' : 's'} · {item.isActive ? 'Available' : 'Hidden from new reports'}
                </Text>
                <Button icon="create-outline" label="Edit" onPress={() => setEditing(item)} variant="ghost" />
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CategoryFormModal
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={replaceCategory}
        visible={editing !== null}
      />

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', flex: 1, gap: Spacing.sm, justifyContent: 'center', padding: Spacing.xl },
  centerText: { textAlign: 'center' },
  listContent: { gap: Spacing.md, paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding },
  card: { gap: Spacing.sm },
  inactive: { opacity: 0.7 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  cardText: { flex: 1, gap: 2 },
  cardFooter: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs },
});
