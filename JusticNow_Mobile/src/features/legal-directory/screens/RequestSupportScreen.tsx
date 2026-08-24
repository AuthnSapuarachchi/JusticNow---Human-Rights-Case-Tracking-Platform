import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  FilterChip,
  IconTile,
  Layout,
  Radius,
  ScreenHeader,
  Spacing,
  Text,
  Typography,
  useColors,
} from '@/design-system';
import { useTranslation, type TranslationKey } from '@/i18n';

import { getOrganizationById } from '../data/organizations';
import type { Organization, SupportType } from '../types';

const SUPPORT_TYPES: SupportType[] = [
  'LEGAL_ADVICE',
  'REPRESENTATION',
  'DOCUMENT_REVIEW',
  'STRATEGIC_CONSULTATION',
];

const SUPPORT_TYPE_KEYS: Record<SupportType, TranslationKey> = {
  LEGAL_ADVICE: 'request.legalAdvice',
  REPRESENTATION: 'request.representation',
  DOCUMENT_REVIEW: 'request.documentReview',
  STRATEGIC_CONSULTATION: 'request.strategicConsultation',
};

export type RequestSupportScreenProps = {
  organizationId: string;
};

/**
 * EP-06 / US-14 — organisation profile and the request form on one screen.
 *
 * The plan document splits these into JN-59 (Sprint 2) and US-14 (Sprint 3),
 * but the approved Figma puts them on a single screen, so they are built
 * together. Figma wins on that mismatch.
 */
export function RequestSupportScreen({ organizationId }: RequestSupportScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supportType, setSupportType] = useState<SupportType>('LEGAL_ADVICE');
  const [message, setMessage] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getOrganizationById(organizationId)
      .then((found) => {
        if (isMounted) setOrganization(found ?? null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  const handleSend = async () => {
    if (!message.trim()) {
      setValidationError(t('request.messageRequired'));
      return;
    }
    if (!consentGiven) {
      setValidationError(t('request.consentRequired'));
      return;
    }
    setValidationError(null);
    setIsSending(true);
    // Mock submit. Replaced by a POST to /api/legal-support-requests once the
    // backend models LegalSupportRequest — no such model exists today.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSending(false);
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <ScreenHeader onBack={() => router.back()} title={t('request.title')} />
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!organization) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        <ScreenHeader onBack={() => router.back()} title={t('request.title')} />
        <View style={styles.centre}>
          <Text variant="bodyStrong">{t('directory.empty')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader onBack={() => router.back()} title={t('request.title')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Organisation profile */}
          <Card style={styles.profile}>
            <View style={styles.profileHead}>
              <IconTile name="business" />
              <View style={styles.profileCopy}>
                <Text variant="heading">{organization.name}</Text>
                <Badge
                  icon={organization.verified ? 'checkmark-circle' : 'help-circle-outline'}
                  label={organization.verified ? t('directory.verified') : t('directory.unverified')}
                  tone={organization.verified ? 'verified' : 'neutral'}
                />
              </View>
            </View>

            <Text color="textSecondary" variant="body">
              {organization.description}
            </Text>

            <Text color="textSecondary" variant="caption">
              {organization.location} · {t('directory.distance', { km: organization.distanceKm })}
            </Text>

            <Text color="textSecondary" variant="caption">
              {t('directory.languages', {
                languages: organization.languages
                  .map((code) => t(`lang.${code}` as TranslationKey))
                  .join(' · '),
              })}
            </Text>
          </Card>

          {/* Support type */}
          <View style={styles.section}>
            <Text variant="bodyStrong">{t('request.supportType')}</Text>
            <View style={styles.chipWrap}>
              {SUPPORT_TYPES.map((type) => (
                <FilterChip
                  key={type}
                  label={t(SUPPORT_TYPE_KEYS[type])}
                  onPress={() => setSupportType(type)}
                  selected={supportType === type}
                />
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text variant="bodyStrong">{t('request.message')}</Text>
            <TextInput
              accessibilityLabel={t('request.message')}
              multiline
              onChangeText={(value) => {
                setMessage(value);
                if (validationError) setValidationError(null);
              }}
              placeholder={t('request.messagePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderStrong,
                  color: colors.textPrimary,
                },
              ]}
              textAlignVertical="top"
              value={message}
            />
          </View>

          {/* Privacy and consent */}
          <Card bordered={false} style={[styles.privacy, { backgroundColor: colors.surfaceMuted }]}>
            <View style={styles.privacyHead}>
              <Ionicons color={colors.textPrimary} name="lock-closed" size={18} />
              <Text variant="bodyStrong">{t('request.privacyTitle')}</Text>
            </View>

            <Text color="textSecondary" variant="body">
              {t('request.privacyBody', { organisation: organization.name })}
            </Text>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentGiven }}
              onPress={() => {
                setConsentGiven((current) => !current);
                if (validationError) setValidationError(null);
              }}
              style={styles.consentRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: consentGiven ? colors.primary : colors.surface,
                    borderColor: consentGiven ? colors.primary : colors.borderStrong,
                  },
                ]}
              >
                {consentGiven ? <Ionicons color={colors.textOnPrimary} name="checkmark" size={16} /> : null}
              </View>
              <Text style={styles.consentLabel} variant="body">
                {t('request.consent')}
              </Text>
            </Pressable>
          </Card>

          {validationError ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons color={colors.danger} name="alert-circle" size={18} />
              <Text style={{ color: colors.danger, flexShrink: 1 }} variant="body">
                {validationError}
              </Text>
            </View>
          ) : null}

          <Button
            fullWidth
            label={isSending ? t('request.sending') : t('request.send')}
            loading={isSending}
            onPress={handleSend}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    gap: Spacing.xl,
    padding: Layout.screenPadding,
    paddingBottom: Spacing.huge,
  },
  centre: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  profile: { gap: Spacing.sm },
  profileHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  profileCopy: {
    alignItems: 'flex-start',
    flexShrink: 1,
    gap: Spacing.xs,
  },
  section: { gap: Spacing.md },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  textArea: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    minHeight: 130,
    padding: Spacing.lg,
  },
  privacy: { gap: Spacing.md },
  privacyHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: Layout.minTapTarget,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    marginTop: 2,
    width: 26,
  },
  consentLabel: { flexShrink: 1 },
  errorBox: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
});
