import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useTranslation, type TranslationKey } from '@/i18n';

import { RIGHTS_CATEGORIES } from '../data/rights';

export function KnowYourRightsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return RIGHTS_CATEGORIES;
    return RIGHTS_CATEGORIES.filter((category) => {
      const title = t(`rights.category.${category.id}` as TranslationKey).toLowerCase();
      const description = t(`rights.category.${category.id}.desc` as TranslationKey).toLowerCase();
      return title.includes(needle) || description.includes(needle);
    });
  }, [query, t]);

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
          <Card
            accessibilityLabel={t(`rights.category.${item.id}` as TranslationKey)}
            onPress={() => router.push(`/rights/${item.id}`)}
            style={styles.tile}
          >
            <IconTile name={item.icon} />
            <View style={styles.tileCopy}>
              <Text variant="heading">{t(`rights.category.${item.id}` as TranslationKey)}</Text>
              <Text color="textSecondary" variant="body">
                {t(`rights.category.${item.id}.desc` as TranslationKey)}
              </Text>
            </View>
          </Card>
        )}
      />

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
