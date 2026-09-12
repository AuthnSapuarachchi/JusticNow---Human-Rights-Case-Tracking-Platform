import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { useTranslation, type TranslationKey } from '@/i18n';

import { getRightsDetail } from '../data/rights';

export type RightsDetailScreenProps = {
  categoryId: string;
};

export function RightsDetailScreen({ categoryId }: RightsDetailScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();

  const detail = getRightsDetail(categoryId);

  if (!detail) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <ScreenHeader onBack={() => router.back()} title={t('rights.title')} />
        <View style={styles.centre}>
          <Text variant="bodyStrong">{t('rights.contentComing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const titleKey = `rights.category.${detail.id}` as TranslationKey;
  const introKey = `rights.detail.${detail.id}.intro` as TranslationKey;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader onBack={() => router.back()} title={t(titleKey)} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.intro}>
          <Text variant="body">{t(introKey)}</Text>
        </Card>

        <View style={styles.section}>
          <SectionHeading title={t('rights.keyProtections')} />
          {detail.protections.map((protection) => (
            <Card key={protection.id} style={styles.protection}>
              <View style={styles.protectionHead}>
                <IconTile name={protection.icon} size="sm" />
                <Text style={styles.protectionTitle} variant="heading">
                  {t(
                    `rights.detail.${detail.id}.protection.${protection.id}.title` as TranslationKey,
                  )}
                </Text>
              </View>
              <Text color="textSecondary" variant="body">
                {t(`rights.detail.${detail.id}.protection.${protection.id}.body` as TranslationKey)}
              </Text>
            </Card>
          ))}
        </View>

        {detail.faqs.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading title={t('rights.faq')} />
            {detail.faqs.map((faq) => (
              <Card key={faq.id} style={styles.faq}>
                <Text variant="bodyStrong">
                  {t(`rights.detail.${detail.id}.faq.${faq.id}.q` as TranslationKey)}
                </Text>
                <Text color="textSecondary" variant="body">
                  {t(`rights.detail.${detail.id}.faq.${faq.id}.a` as TranslationKey)}
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
