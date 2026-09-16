import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  IconTile,
  Layout,
  Radius,
  ScreenHeader,
  SectionHeading,
  Spacing,
  Text,
  useColors,
} from '@/design-system';
import { useTranslation } from '@/i18n';

import { fetchRemoteRightsDetail, getBundledRightsDetail, type ResolvedRightsDetail } from '../data/rights';

export type RightsDetailScreenProps = {
  categoryId: string;
};

export function RightsDetailScreen({ categoryId }: RightsDetailScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const { t, language } = useTranslation();

  const [detail, setDetail] = useState<ResolvedRightsDetail | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    // Bundled copy first, synchronously, so the page is readable immediately.
    // `undefined` here means this id is not bundled at all - an admin-added
    // category, say - so the spinner stays until the backend answers.
    const bundled = getBundledRightsDetail(categoryId, t);
    setDetail(bundled);
    fetchRemoteRightsDetail(categoryId, language).then((remote) => {
      if (!isMounted) return;
      if (remote) setDetail(remote);
      else if (!bundled) setDetail(null); // neither source has it
    });
    return () => {
      isMounted = false;
    };
    // t's identity only changes when the active language changes (see
    // I18nProvider), so this re-resolves on language switch too, not every render.
  }, [categoryId, t, language]);

  if (detail === undefined) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <ScreenHeader onBack={() => router.back()} title={t('rights.title')} />
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (detail === null) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <ScreenHeader onBack={() => router.back()} title={t('rights.title')} />
        <View style={styles.centre}>
          <Text variant="bodyStrong">{t('rights.contentComing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader onBack={() => router.back()} title={detail.title} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.intro}>
          <Text variant="body">{detail.intro}</Text>
        </Card>

        <View style={styles.section}>
          <SectionHeading title={t('rights.keyProtections')} />
          {detail.protections.map((protection) => (
            <Card key={protection.id} style={styles.protection}>
              <View style={styles.protectionHead}>
                <IconTile name={protection.icon as React.ComponentProps<typeof Ionicons>['name']} size="sm" />
                <Text style={styles.protectionTitle} variant="heading">
                  {protection.title}
                </Text>
              </View>
              <Text color="textSecondary" variant="body">
                {protection.body}
              </Text>
            </Card>
          ))}
        </View>

        {detail.faqs.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading title={t('rights.faq')} />
            {detail.faqs.map((faq) => (
              <Card key={faq.id} style={styles.faq}>
                <Text variant="bodyStrong">{faq.question}</Text>
                <Text color="textSecondary" variant="body">
                  {faq.answer}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Every rights page routes through to reporting — a research rule. */}
        <Card bordered={false} style={[styles.cta, { backgroundColor: colors.primarySoft }]}>
          <Ionicons color={colors.primary} name="alert-circle" size={30} />
          <Text variant="heading">{t('rights.violatedTitle')}</Text>
          <Text color="textSecondary" style={styles.ctaBody} variant="body">
            {t('rights.violatedBody')}
          </Text>
          <Button
            fullWidth
            icon="document-text"
            iconPosition="leading"
            label={t('rights.reportIncident')}
            onPress={() => router.push('/')}
          />
          <Button
            fullWidth
            label={t('rights.findHelp')}
            onPress={() => router.push('/legal-support')}
            variant="secondary"
          />
        </Card>

        {/* Statutes behind the page, so a reader can check it themselves. */}
        <View style={[styles.sources, { borderColor: colors.border }]}>
          <Text color="textTertiary" variant="eyebrow">
            {t('rights.sources')}
          </Text>
          {detail.sources.map((source) => (
            <Text color="textTertiary" key={source} variant="caption">
              {source}
            </Text>
          ))}
          <Text color="textTertiary" style={styles.disclaimer} variant="caption">
            {t('rights.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    gap: Spacing.xl,
    padding: Layout.screenPadding,
    paddingBottom: Spacing.huge,
  },
  intro: { gap: Spacing.sm },
  section: { gap: Spacing.md },
  protection: { gap: Spacing.sm },
  protectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  protectionTitle: { flexShrink: 1 },
  faq: { gap: Spacing.sm },
  cta: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaBody: { textAlign: 'center' },
  sources: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.lg,
  },
  disclaimer: { paddingTop: Spacing.sm },
  centre: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
});
