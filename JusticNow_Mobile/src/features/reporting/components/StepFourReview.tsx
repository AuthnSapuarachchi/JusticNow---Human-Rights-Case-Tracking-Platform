import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Modal, Platform } from 'react-native';

import { requestMultipart } from '@/api/client';
import { getOfficers, Officer } from '@/api/messagingApi';
import { Button, Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

import { FooterSlot, StepFooter, StepLayout } from './StepLayout';

interface StepFourProps {
  data: any;
  onPrev: () => void;
  onSelectOfficer: (officerId: number) => void;
  /** Called once the report is accepted by the server, so the draft can be cleared. */
  onSubmit: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  WORKPLACE_DISCRIMINATION: 'Workplace discrimination',
  HUMAN_RIGHTS_VIOLATION: 'Human rights violation',
  DIGITAL_PRIVACY: 'Digital privacy breach',
  OTHER: 'Other or not sure',
};

export default function StepFourReview({ data, onPrev, onSelectOfficer, onSubmit }: StepFourProps) {
  const router = useRouter();
  const colors = useColors();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<{ caseId: number; trackingCode: string } | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(true);
  const [officersError, setOfficersError] = useState('');
  const [isOfficerPickerOpen, setIsOfficerPickerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getOfficers()
      .then((results) => {
        if (mounted) setOfficers(results);
      })
      .catch(() => {
        if (mounted) setOfficersError('We could not load officers. Please try again later.');
      })
      .finally(() => {
        if (mounted) setIsLoadingOfficers(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedOfficer = officers.find((officer) => officer.id === data.officerId);

  const handleFinalSubmit = async () => {
    if (!/^\d{4,12}$/.test(data.pin || '')) {
      setSubmitError('Your private PIN must be 4 to 12 digits. Go back to the first step to set it.');
      return;
    }
    if (!selectedOfficer) {
      setSubmitError('Choose an officer to receive your report.');
      return;
    }
    if (!isConfirmed) {
      setSubmitError('Please confirm the information is accurate.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('description', data.description || '');
      formData.append('pin', data.pin || '');
      formData.append('category', data.category || 'OTHER');
      formData.append('incidentDate', data.incidentDate || '');
      formData.append('location', data.location || '');
      formData.append('isAnonymous', String(data.isAnonymous !== false));
      formData.append('officerId', String(selectedOfficer.id));

      if (data.files && data.files.length > 0) {
        const firstFile = data.files[0];

        if (Platform.OS === 'web') {
          if (String(firstFile.uri || '').startsWith('blob:') && !(firstFile.file instanceof Blob)) {
            throw new Error('This evidence photo is no longer available. Go back to Add evidence and select it again.');
          }
          const fileBlob = typeof Blob !== 'undefined' && firstFile.file instanceof Blob
            ? firstFile.file
            : await fetch(firstFile.uri).then(async (response) => {
                if (!response.ok) throw new Error('Unable to read the selected evidence file.');
                return response.blob();
              });

          formData.append('evidenceFile', fileBlob, firstFile.name);
        } else {
          // iOS/Android require the URI object map
          formData.append('evidenceFile', {
            uri: firstFile.uri,
            name: firstFile.name,
            type: firstFile.type,
          } as any);
        }
      }

      const result = await requestMultipart<{ data?: { caseId?: number; trackingCode?: string } }>('/api/cases', formData);

      if (!result.data?.caseId || !result.data?.trackingCode) {
        throw new Error('The report was submitted, but its case reference was missing.');
      }

      setSubmittedCase({ caseId: Number(result.data.caseId), trackingCode: result.data.trackingCode });
      onSubmit();
    } catch (error) {
      console.error('Submission Error:', error);
      setSubmitError(error instanceof Error ? error.message : 'We could not submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const officerLabel = isLoadingOfficers
    ? 'Loading officers…'
    : selectedOfficer?.name || selectedOfficer?.email || 'Choose an officer';

  const rows: { label: string; value: string }[] = [
    { label: 'Reporting as', value: data.isAnonymous ? 'Anonymous' : 'Named (your details are shared)' },
    { label: 'Category', value: CATEGORY_LABELS[data.category] ?? String(data.category || 'Not selected').replace(/_/g, ' ') },
    { label: 'When', value: data.incidentDate || 'Not provided' },
    { label: 'Where', value: data.location || 'Not provided' },
    { label: 'Evidence', value: data.files?.length > 0 ? `${data.files.length} photo${data.files.length === 1 ? '' : 's'}` : 'None' },
  ];

  return (
    <>
      <StepLayout
        footer={
          <View style={styles.footer}>
            {submitError ? (
              <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons color={colors.danger} name="alert-circle-outline" size={20} />
                <Text color="danger" style={styles.flex} variant="caption">{submitError}</Text>
              </View>
            ) : null}
            <StepFooter>
              <FooterSlot><Button disabled={isSubmitting} fullWidth label="Back" onPress={onPrev} variant="secondary" /></FooterSlot>
              <FooterSlot grow={2}>
                <Button fullWidth icon="lock-closed" iconPosition="leading" label="Submit securely" loading={isSubmitting} onPress={handleFinalSubmit} />
              </FooterSlot>
            </StepFooter>
          </View>
        }
        subtitle="Check everything looks right. You can go back to change anything."
        title="Review and send"
      >
        <Card style={styles.summary}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text color="textSecondary" style={styles.rowLabel} variant="caption">{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
          <View style={[styles.descriptionRow, { borderTopColor: colors.border }]}>
            <Text color="textSecondary" variant="caption">What happened</Text>
            <Text>{data.description}</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text variant="label">Send to officer</Text>
          <Pressable
            accessibilityLabel={`Officer: ${officerLabel}. Tap to change.`}
            accessibilityRole="button"
            disabled={isLoadingOfficers || officers.length === 0 || isSubmitting}
            onPress={() => setIsOfficerPickerOpen(true)}
            style={({ pressed }) => [
              styles.select,
              { backgroundColor: colors.surface, borderColor: selectedOfficer ? colors.primary : colors.borderStrong },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons color={selectedOfficer ? colors.primary : colors.textTertiary} name="person-circle-outline" size={24} />
            <Text color={selectedOfficer ? 'textPrimary' : 'textTertiary'} numberOfLines={1} style={styles.flex}>{officerLabel}</Text>
            <Ionicons color={colors.textSecondary} name="chevron-down" size={20} />
          </Pressable>
          {officersError ? <Text color="danger" variant="caption">{officersError}</Text> : null}
          {!isLoadingOfficers && officers.length === 0 && !officersError ? (
            <Text color="textSecondary" variant="caption">No officers are available right now. Your draft is saved — please try again later.</Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isConfirmed, disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={() => setIsConfirmed(!isConfirmed)}
          style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
        >
          <View style={[styles.checkbox, { borderColor: isConfirmed ? colors.primary : colors.borderStrong, backgroundColor: isConfirmed ? colors.primary : colors.surface }]}>
            {isConfirmed ? <Ionicons color={colors.textOnPrimary} name="checkmark" size={18} /> : null}
          </View>
          <Text style={styles.flex}>The information is accurate to the best of my knowledge.</Text>
        </Pressable>

        <View style={[styles.secureNote, { backgroundColor: colors.successSoft }]}>
          <Ionicons color={colors.success} name="lock-closed-outline" size={20} />
          <Text style={[styles.flex, { color: colors.success }]} variant="caption">
            Your report is encrypted. Only the officer handling it can see the details.
          </Text>
        </View>
      </StepLayout>

      <Modal animationType="fade" onRequestClose={() => undefined} transparent visible={submittedCase !== null}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons color={colors.success} name="checkmark" size={36} />
            </View>
            <Text style={styles.center} variant="title">Report sent</Text>
            <Text color="textSecondary" style={styles.center}>
              Your report was received securely. Save your tracking code — you will need it with your PIN.
            </Text>
            <View style={[styles.codeBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text color="textSecondary" style={styles.center} variant="eyebrow">TRACKING CODE</Text>
              <Text selectable style={[styles.center, styles.code]} variant="title">{submittedCase?.trackingCode}</Text>
            </View>
            <View style={styles.dialogActions}>
              <Button
                fullWidth
                icon="folder-open-outline"
                iconPosition="leading"
                label="View my case"
                onPress={() => {
                  if (submittedCase) router.replace(`/cases/${submittedCase.caseId}`);
                }}
              />
              <Button
                fullWidth
                label="Back to home"
                onPress={() => {
                  setSubmittedCase(null);
                  router.replace('/');
                }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setIsOfficerPickerOpen(false)} transparent visible={isOfficerPickerOpen}>
        <Pressable accessibilityLabel="Close" onPress={() => setIsOfficerPickerOpen(false)} style={styles.sheetBackdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.sheetHeader}>
            <Text variant="heading">Choose an officer</Text>
            <Pressable accessibilityLabel="Close officer list" accessibilityRole="button" hitSlop={6} onPress={() => setIsOfficerPickerOpen(false)} style={styles.closeButton}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetList}>
            {officers.map((officer) => {
              const isSelected = selectedOfficer?.id === officer.id;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  key={officer.id}
                  onPress={() => {
                    onSelectOfficer(officer.id);
                    setIsOfficerPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: isSelected ? colors.primarySoft : 'transparent' },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.flex}>
                    <Text variant="bodyStrong">{officer.name || 'Case officer'}</Text>
                    <Text color="textSecondary" numberOfLines={1} variant="caption">{officer.email}</Text>
                  </View>
                  {isSelected ? <Ionicons color={colors.primary} name="checkmark-circle" size={24} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
  footer: { gap: Spacing.md },
  errorBox: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  summary: { paddingVertical: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md },
  rowLabel: { paddingTop: 2, width: 96 },
  rowValue: { flex: 1 },
  descriptionRow: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.xs, paddingVertical: Spacing.md },
  section: { gap: Spacing.sm },
  select: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 56, paddingHorizontal: Spacing.lg },
  checkRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, minHeight: Layout.minTapTarget },
  checkbox: { alignItems: 'center', borderRadius: Radius.sm - 2, borderWidth: 2, height: 28, justifyContent: 'center', width: 28 },
  secureNote: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(13, 27, 42, 0.55)', flex: 1, justifyContent: 'center', padding: Spacing.xxl },
  dialog: { borderRadius: Radius.xl, gap: Spacing.md, maxWidth: 420, padding: Spacing.xxl, width: '100%' },
  successIcon: { alignItems: 'center', alignSelf: 'center', borderRadius: 40, height: 72, justifyContent: 'center', width: 72 },
  codeBox: { borderRadius: Radius.md, gap: Spacing.xs, marginVertical: Spacing.sm, padding: Spacing.lg },
  code: { letterSpacing: 1 },
  dialogActions: { gap: Spacing.md },
  sheetBackdrop: { backgroundColor: 'rgba(13, 27, 42, 0.45)', flex: 1 },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '75%', paddingBottom: Spacing.xxl },
  handle: { alignSelf: 'center', borderRadius: 2, height: 4, marginTop: Spacing.sm, width: 40 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm },
  closeButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  sheetList: { gap: Spacing.xs, paddingHorizontal: Spacing.md },
  option: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.md, minHeight: 64, paddingHorizontal: Spacing.md },
});
