import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { quickExit } from '@/components/quickExit';
import { Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

import StepOneIncident from '../components/StepOneIncident';
import StepTwoCategory from '../components/StepTwoCategory';
import StepThreeEvidence from '../components/StepThreeEvidence';
import StepFourReview from '../components/StepFourReview';

const DRAFT_KEY = 'reportDraft';
const STEP_LABELS = ['Details', 'Category', 'Evidence', 'Review'];

const emptyReportDraft = {
  isAnonymous: true,
  category: 'OTHER',
  incidentDate: '',
  location: '',
  description: '',
  pin: '',
  officerId: null as number | null,
  files: [] as any[],
};

export default function ReportFlowScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [formData, setFormData] = useState(emptyReportDraft);
  // Once submitted, stop auto-saving so the sent report is not restored next time.
  const isSubmitted = useRef(false);

  // Load saved draft when screen opens
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          setFormData({
            ...emptyReportDraft,
            ...parsedDraft,
            isAnonymous: parsedDraft.isAnonymous !== false,
            category: typeof parsedDraft.category === 'string' ? parsedDraft.category : 'OTHER',
            incidentDate: typeof parsedDraft.incidentDate === 'string' ? parsedDraft.incidentDate : '',
            location: typeof parsedDraft.location === 'string' ? parsedDraft.location : '',
            description: typeof parsedDraft.description === 'string' ? parsedDraft.description : '',
            pin: typeof parsedDraft.pin === 'string' ? parsedDraft.pin.replace(/\D/g, '').slice(0, 12) : '',
            officerId: Number.isInteger(parsedDraft.officerId) ? parsedDraft.officerId : null,
            // Browser object URLs and File objects cannot be restored from AsyncStorage.
            // Drop old blob-backed attachments so users are prompted to select them again.
            files: Array.isArray(parsedDraft.files)
              ? parsedDraft.files.filter((file: any) => Platform.OS !== 'web' || !String(file?.uri || '').startsWith('blob:'))
              : [],
          });
        }
      } catch (error) {
        console.error('Failed to load draft', error);
      } finally {
        setIsDraftLoaded(true);
      }
    };
    loadDraft();
  }, []);

  // Auto-save draft whenever formData changes
  useEffect(() => {
    if (!isDraftLoaded || isSubmitted.current) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(formData)).catch(() => undefined);
  }, [formData, isDraftLoaded]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmitted = () => {
    isSubmitted.current = true;
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityHint="Your draft is saved"
            accessibilityLabel="Close report"
            accessibilityRole="button"
            hitSlop={6}
            onPress={handleClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="close" size={26} />
          </Pressable>
          <Text variant="pageTitle">Report an incident</Text>
          <Pressable
            accessibilityHint="Leaves the app immediately"
            accessibilityLabel="Quick exit"
            accessibilityRole="button"
            hitSlop={6}
            onPress={quickExit}
            style={({ pressed }) => [styles.exitPill, { backgroundColor: colors.dangerSoft }, pressed && styles.pressed]}
          >
            <Ionicons color={colors.danger} name="exit-outline" size={18} />
            <Text color="danger" style={styles.exitText} variant="caption">Exit</Text>
          </Pressable>
        </View>

        <View accessibilityLabel={`Step ${currentStep} of 4: ${STEP_LABELS[currentStep - 1]}`} accessible style={styles.progress}>
          <View style={styles.segments}>
            {STEP_LABELS.map((label, index) => (
              <View
                key={label}
                style={[styles.segment, { backgroundColor: index < currentStep ? colors.primary : colors.border }]}
              />
            ))}
          </View>
          <Text color="textSecondary" variant="caption">
            Step {currentStep} of 4 · {STEP_LABELS[currentStep - 1]}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {currentStep === 1 && <StepOneIncident data={formData} updateData={setFormData} onNext={nextStep} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
        {currentStep === 2 && <StepTwoCategory data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 3 && <StepThreeEvidence data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 4 && <StepFourReview data={formData} onPrev={prevStep} onSelectOfficer={(officerId) => setFormData((current) => ({ ...current, officerId }))} onSubmit={handleSubmitted} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.sm, paddingBottom: Spacing.md, paddingHorizontal: Spacing.sm },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs },
  iconButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  pressed: { opacity: 0.6 },
  exitPill: { alignItems: 'center', borderRadius: Radius.pill, flexDirection: 'row', gap: Spacing.xs, minHeight: 36, paddingHorizontal: Spacing.md },
  exitText: { fontWeight: '700' },
  progress: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  segments: { flexDirection: 'row', gap: Spacing.xs },
  segment: { borderRadius: 2, flex: 1, height: 4 },
  content: { flex: 1 },
});
