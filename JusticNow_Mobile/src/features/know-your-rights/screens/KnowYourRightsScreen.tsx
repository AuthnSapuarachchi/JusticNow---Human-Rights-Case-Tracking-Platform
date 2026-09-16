import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import {
  Card,
  IconTile,
  Layout,
  ScreenHeader,
  SearchField,
  SectionHeading,
  Spacing,
  Text,
  useColors,
} from '@/design-system';
import { useTranslation } from '@/i18n';

import { fetchRemoteCategories, getBundledCategories, type ResolvedCategory } from '../data/rights';

export function KnowYourRightsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const [allCategories, setAllCategories] = useState<ResolvedCategory[]>(() => getBundledCategories(t));

  useEffect(() => {
    let isMounted = true;
    // Bundled content first, synchronously - this screen never shows a spinner
    // or a blank list, which matters for someone checking their rights on a bad
    // connection. The admin-editable copy from the backend replaces it if and
    // when it arrives; if it never does, the bundled text simply stays.
    setAllCategories(getBundledCategories(t));
    fetchRemoteCategories(language).then((remote) => {
      if (isMounted && remote) setAllCategories(remote);
    });
    return () => {
      isMounted = false;
    };
    // t's identity only changes when the active language changes (see
    // I18nProvider), so this re-resolves on language switch, not every render.
  }, [t, language]);

  const categories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allCategories;
    return allCategories.filter(
      (category) =>
        category.title.toLowerCase().includes(needle) || category.description.toLowerCase().includes(needle),
    );
  }, [allCategories, query]);

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader title={t('rights.title')} />

      <FlatList
        ListEmptyComponent={
          <View style={styles.centre}>
            <Text variant="bodyStrong">{t('directory.empty')}</Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text color="textSecondary" variant="body">
              {t('rights.intro')}
            </Text>
            <SearchField
              accessibilityLabel={t('rights.searchLabel')}
              onChangeText={setQuery}
              placeholder={t('rights.searchPlaceholder')}
              value={query}
            />
            <SectionHeading title={t('rights.categories')} />
          </View>
        }
        contentContainerStyle={styles.list}
        data={categories}
        keyExtractor={(category) => category.id}
        renderItem={({ item }) => (
          <Card accessibilityLabel={item.title} onPress={() => router.push(`/rights/${item.id}`)} style={styles.tile}>
            <IconTile name={item.icon} />
            <View style={styles.tileCopy}>
              <Text variant="heading">{item.title}</Text>
              <Text color="textSecondary" variant="body">
                {item.description}
              </Text>
            </View>
          </Card>
        )}
      />
      {/* No loading branch: bundled categories are present from first render. */}

      <BottomNavBar activeTab={NavTab.Support} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Layout.bottomNavInset,
    paddingHorizontal: Layout.screenPadding,
  },
  tile: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  tileCopy: {
    flexShrink: 1,
    gap: Spacing.xs,
  },
  centre: {
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
});
