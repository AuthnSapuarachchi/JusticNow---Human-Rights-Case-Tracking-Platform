import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import {
  Badge,
  Button,
  Card,
  FilterChip,
  IconTile,
  Layout,
  ScreenHeader,
  SearchField,
  Spacing,
  Tag,
  Text,
  useColors,
} from '@/design-system';
import { useTranslation, type TranslationKey } from '@/i18n';

import { getOrganizations } from '../data/organizations';
import type { DirectoryFilters, Organization, OrganizationCategory } from '../types';

/** Category filters offered on the chip row, in priority order from our research. */
const CATEGORY_FILTERS: (OrganizationCategory | 'all')[] = [
  'all',
  'legalAid',
  'workplaceRights',
  'humanRights',
  'womensRights',
  'childRights',
  'landRights',
  'counselling',
];

const COST_FILTERS: DirectoryFilters['cost'][] = ['all', 'free', 'paid'];
const LANGUAGE_FILTERS: string[] = ['all', 'si', 'ta', 'en'];

export function LegalDirectoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DirectoryFilters>({
    query: '',
    category: 'all',
    cost: 'all',
    language: 'all',
  });

  useEffect(() => {
    let isMounted = true;
    getOrganizations()
      .then((loaded) => {
        if (isMounted) setOrganizations(loaded);
      })
      .catch(() => {
        if (isMounted) setError(t('common.error'));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [t]);

  const results = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return organizations.filter((organization) => {
      if (query) {
        const haystack = `${organization.name} ${organization.location}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.category !== 'all' && !organization.categories.includes(filters.category)) return false;
      if (filters.cost === 'free' && !organization.isFree) return false;
      if (filters.cost === 'paid' && organization.isFree) return false;
      if (filters.language !== 'all' && !organization.languages.includes(filters.language)) return false;
      return true;
    });
  }, [filters, organizations]);

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Messages) router.push('/messages');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader title={t('directory.title')} />

      <View style={styles.body}>
        <SearchField
          accessibilityLabel={t('directory.searchLabel')}
          onChangeText={(query) => setFilters((current) => ({ ...current, query }))}
          placeholder={t('directory.searchPlaceholder')}
          value={filters.query}
        />

        <FilterRow
          items={CATEGORY_FILTERS}
          labelFor={(value) =>
            value === 'all' ? t('directory.filterAll') : t(`category.${value}` as TranslationKey)
          }
          onSelect={(category) => setFilters((current) => ({ ...current, category }))}
          selected={filters.category}
        />

        <FilterRow
          items={COST_FILTERS}
          labelFor={(value) =>
            value === 'all'
              ? t('directory.filterAll')
              : value === 'free'
                ? t('directory.free')
                : t('directory.paid')
          }
          onSelect={(cost) => setFilters((current) => ({ ...current, cost }))}
          selected={filters.cost}
        />

        <FilterRow
          items={LANGUAGE_FILTERS}
          labelFor={(value) =>
            value === 'all' ? t('directory.anyLanguage') : t(`lang.${value}` as TranslationKey)
          }
          onSelect={(language) => setFilters((current) => ({ ...current, language }))}
          selected={filters.language}
        />
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
          <Text color="textSecondary" variant="caption">
            {t('common.loading')}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centre}>
          <Text color="danger" variant="body">
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          ListEmptyComponent={
            <View style={styles.centre}>
              <Text variant="bodyStrong">{t('directory.empty')}</Text>
              <Text color="textSecondary" variant="caption">
                {t('directory.emptyHint')}
              </Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Know Your Rights lives under the same Support tab, so the
                  directory is where people find their way to it. */}
              <Card
                accessibilityLabel={t('rights.title')}
                onPress={() => router.push('/rights')}
                style={[styles.rightsLink, { backgroundColor: colors.primarySoft }]}
              >
                <IconTile name="book" size="sm" />
                <View style={styles.rightsLinkCopy}>
                  <Text variant="bodyStrong">{t('rights.title')}</Text>
                  <Text color="textSecondary" numberOfLines={2} variant="caption">
                    {t('rights.intro')}
                  </Text>
                </View>
                <Ionicons color={colors.primary} name="chevron-forward" size={20} />
              </Card>

              <Text color="textSecondary" style={styles.count} variant="caption">
                {results.length === 1
                  ? t('directory.resultCountOne')
                  : t('directory.resultCount', { count: results.length })}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          data={results}
          keyExtractor={(organization) => organization.id}
          renderItem={({ item }) => (
            <OrganizationCard
              onRequestSupport={() => router.push(`/legal-support/${item.id}`)}
              organization={item}
            />
          )}
        />
      )}

      <BottomNavBar activeTab={NavTab.Support} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

/** Horizontally scrolling chip row. Generic so all four filters share it. */
function FilterRow<T extends string>({
  items,
  selected,
  onSelect,
  labelFor,
}: {
  items: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  labelFor: (value: T) => string;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.filterRow}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {items.map((value) => (
        <FilterChip
          key={value}
          label={labelFor(value)}
          onPress={() => onSelect(value)}
          selected={selected === value}
        />
      ))}
    </ScrollView>
  );
}

function OrganizationCard({
  organization,
  onRequestSupport,
}: {
  organization: Organization;
  onRequestSupport: () => void;
}) {
  const { t } = useTranslation();

  const spokenLanguages = organization.languages
    .map((code) => t(`lang.${code}` as TranslationKey))
    .join(' · ');

  return (
    <Card style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle} variant="heading">
          {organization.name}
        </Text>
        <Badge
          icon={organization.verified ? 'checkmark-circle' : 'help-circle-outline'}
          label={organization.verified ? t('directory.verified') : t('directory.unverified')}
          tone={organization.verified ? 'verified' : 'neutral'}
        />
      </View>

      <Text color="textSecondary" variant="body">
        {organization.description}
      </Text>

      <Text color="textSecondary" variant="caption">
        {organization.location} · {t('directory.distance', { km: organization.distanceKm })}
      </Text>

      <Text color="textSecondary" variant="caption">
        {t('directory.languages', { languages: spokenLanguages })}
      </Text>

      <View style={styles.tagRow}>
        {organization.categories.map((category) => (
          <Tag key={category} label={t(`category.${category}` as TranslationKey)} />
        ))}
        <Tag label={organization.isFree ? t('directory.free') : t('directory.paid')} />
      </View>

      <Button
        fullWidth
        icon="arrow-forward"
        label={t('directory.requestSupport')}
        onPress={onRequestSupport}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    gap: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingRight: Layout.screenPadding,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Layout.bottomNavInset,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
  },
  listHeader: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  rightsLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rightsLinkCopy: {
    flexShrink: 1,
    gap: Spacing.xs,
  },
  count: {
    paddingBottom: Spacing.xs,
  },
  card: {
    gap: Spacing.sm,
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cardTitle: {
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  centre: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xxxl,
  },
});
