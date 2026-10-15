import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// 🚨 Added Platform to the imports here
import { View, Text, Pressable, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Platform } from 'react-native';

import { requestMultipart } from '@/api/client';
import { getOfficers, Officer } from '@/api/messagingApi';

interface StepFourProps {
  data: any;
  onPrev: () => void;
  onSelectOfficer: (officerId: number) => void;
  onSubmit: () => void;
}

export default function StepFourReview({ data, onPrev, onSelectOfficer, onSubmit }: StepFourProps) {
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<{ caseId: number; trackingCode: string } | null>(null);
  const [submitStatus, setSubmitStatus] = useState('');
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
        if (mounted) setOfficersError('Unable to load active officers. Please try again later.');
      })
      .finally(() => {
        if (mounted) setIsLoadingOfficers(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedOfficer = officers.find((officer) => officer.id === data.officerId);

  const handleFinalSubmit = async () => {
    console.info('[Report] Submit Securely pressed', { isConfirmed, isSubmitting, hasPin: Boolean(data.pin) });
    if (!isConfirmed) {
      setSubmitStatus('Please confirm that the report information is accurate.');
      Alert.alert('Action Required', 'Please confirm that the information provided is accurate.');
      return;
    }
    if (!/^\d{4,12}$/.test(data.pin || '')) {
      setSubmitStatus('Please enter a private PIN between 4 and 12 digits.');
      Alert.alert('Action Required', 'Please enter a private PIN between 4 and 12 digits in the incident details step.');
      return;
    }
    if (!selectedOfficer) {
      setSubmitStatus('Please select an active officer for this case.');
      Alert.alert('Action Required', 'Please select an active officer before submitting.');
      return;
    }

    setSubmitStatus('Submitting your report securely...');
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 1. Append text data
      formData.append('description', data.description || '');
      formData.append('pin', data.pin || '');
      formData.append('category', data.category || 'OTHER');
      formData.append('incidentDate', data.incidentDate || '');
      formData.append('location', data.location || '');
      formData.append('isAnonymous', String(data.isAnonymous !== false));
      formData.append('officerId', String(selectedOfficer.id));

      // 2. Append the file based on the platform (Web vs Mobile)
      if (data.files && data.files.length > 0) {
        const firstFile = data.files[0];

        if (Platform.OS === 'web') {
          // 🚨 Web requires the raw HTML5 File object AND the file name as the 3rd parameter
          formData.append('evidenceFile', firstFile.file, firstFile.name);
        } else {
          // iOS/Android require the URI object map
          formData.append('evidenceFile', {
            uri: firstFile.uri,
            name: firstFile.name,
            type: firstFile.type,
          } as any);
        }
      }

      // 3. Send to backend
      const result = await requestMultipart<{ data?: { caseId?: number; trackingCode?: string } }>('/api/cases', formData);

      if (!result.data?.caseId || !result.data?.trackingCode) {
        throw new Error('The report was submitted, but its case reference was missing.');
      }

      setSubmittedCase({ caseId: Number(result.data.caseId), trackingCode: result.data.trackingCode });
      setSubmitStatus('Report submitted successfully.');
    } catch (error) {
      console.error('Submission Error:', error);
      setSubmitStatus(error instanceof Error ? error.message : 'Unable to submit your report.');
      Alert.alert(
        'Submission Error',
        error instanceof Error ? error.message : 'Could not submit your report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Final Review</Text>
        <Text style={styles.subtitle}>Please review your report details before submitting.</Text>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            All information is encrypted end-to-end. Access is strictly restricted.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionHeader}>Reporting As</Text>
          <Text style={styles.valueText}>
            {data.isAnonymous ? '🛡️ Anonymous Citizen' : '👤 Identified User'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Incident Category</Text>
          <Text style={styles.valueText}>{data.category ? data.category.replace(/_/g, ' ') : 'Not selected'}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Assigned Officer</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Officer"
            disabled={isLoadingOfficers || officers.length === 0 || isSubmitting}
            onPress={() => setIsOfficerPickerOpen(true)}
            style={styles.officerSelect}
          >
            <Text style={styles.officerSelectText}>
              {isLoadingOfficers ? 'Loading active officers...' : selectedOfficer?.name || selectedOfficer?.email || 'Select Officer'}
            </Text>
            <Ionicons color="#475569" name="chevron-down" size={18} />
          </Pressable>
          {officersError ? <Text style={styles.officerError}>{officersError}</Text> : null}
          {!isLoadingOfficers && officers.length === 0 && !officersError ? <Text style={styles.officerError}>No active officers are currently available.</Text> : null}

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Location & Date</Text>
          <Text style={styles.valueText}>
            {data.location || 'Not provided'} • {data.incidentDate || 'Date not specified'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Description</Text>
          <Text style={styles.valueText}>{data.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Attached Evidence</Text>
          <Text style={styles.valueText}>
            {data.files?.length > 0 ? `${data.files.length} file(s) attached` : 'No evidence attached'}
          </Text>
        </View>

        {/* Confirmation Checkbox */}
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
            {isConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm that the information provided is accurate to the best of my knowledge.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev} disabled={isSubmitting}>
          <Text style={styles.prevButtonText}>← Edit Data</Text>
        </TouchableOpacity>
        
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleFinalSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Submit securely"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Securely</Text>
          )}
        </Pressable>
      </View>

      {submitStatus ? <Text accessibilityLiveRegion="polite" style={styles.submitStatus}>{submitStatus}</Text> : null}

      <Modal animationType="fade" onRequestClose={() => undefined} transparent visible={submittedCase !== null}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons color="#15803D" name="checkmark" size={34} />
            </View>
            <Text style={styles.successTitle}>Case submitted</Text>
            <Text style={styles.successMessage}>
              Your report was submitted securely. Keep your tracking code and PIN safe.
            </Text>
            <View style={styles.trackingCodeBox}>
              <Text style={styles.trackingCodeLabel}>Tracking code</Text>
              <Text selectable style={styles.trackingCode}>{submittedCase?.trackingCode}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="View my case"
              onPress={() => {
                if (submittedCase) router.replace(`/cases/${submittedCase.caseId}`);
              }}
              style={styles.viewCaseButton}
            >
              <Ionicons color="#fff" name="folder-open-outline" size={19} />
              <Text style={styles.viewCaseButtonText}>View my case</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go to home"
              onPress={() => {
                setSubmittedCase(null);
                onSubmit();
                router.replace('/');
              }}
              style={styles.homeButton}
            >
              <Ionicons color="#1D4ED8" name="home-outline" size={19} />
              <Text style={styles.homeButtonText}>Go home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal animationType="fade" onRequestClose={() => setIsOfficerPickerOpen(false)} transparent visible={isOfficerPickerOpen}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.officerModal}>
            <View style={styles.officerModalHeader}>
              <Text style={styles.officerModalTitle}>Select Officer</Text>
              <Pressable accessibilityLabel="Close officer selection" onPress={() => setIsOfficerPickerOpen(false)}>
                <Ionicons color="#475569" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView>
              {officers.map((officer) => (
                <Pressable
                  accessibilityRole="button"
                  key={officer.id}
                  onPress={() => {
                    onSelectOfficer(officer.id);
                    setIsOfficerPickerOpen(false);
                  }}
                  style={styles.officerOption}
                >
                  <View>
                    <Text style={styles.officerOptionName}>{officer.name || 'Case Officer'}</Text>
                    <Text style={styles.officerOptionEmail}>{officer.email}</Text>
                  </View>
                  {selectedOfficer?.id === officer.id ? <Ionicons color="#16A34A" name="checkmark-circle" size={21} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  
  securityBadge: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
    alignItems: 'center'
  },
  securityIcon: { fontSize: 18, marginRight: 8 },
  securityText: { fontSize: 12, color: '#166534', flex: 1, fontWeight: '500' },

  summaryCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  sectionHeader: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  valueText: { fontSize: 15, color: '#1E293B', marginBottom: 12 },
  officerSelect: { alignItems: 'center', borderColor: '#CBD5E1', borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, minHeight: 46, paddingHorizontal: 12 },
  officerSelectText: { color: '#1E293B', flex: 1, fontSize: 14, marginRight: 8 },
  officerError: { color: '#B91C1C', fontSize: 12, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingRight: 20 },
  checkbox: {
    width: 24, height: 24, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 6, 
    marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  checkboxLabel: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  prevButton: { padding: 16, borderRadius: 8, backgroundColor: '#F1F5F9', flex: 1, marginRight: 8, alignItems: 'center' },
  prevButtonText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  submitButton: { padding: 16, borderRadius: 8, backgroundColor: '#16A34A', flex: 2, alignItems: 'center', justifyContent: 'center' },
  submitButtonDisabled: { backgroundColor: '#86EFAC' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitStatus: { color: '#475569', fontSize: 13, marginTop: 10, textAlign: 'center' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.55)', flex: 1, justifyContent: 'center', padding: 24 },
  successModal: { backgroundColor: '#fff', borderRadius: 18, maxWidth: 420, padding: 24, width: '100%' },
  officerModal: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '75%', maxWidth: 420, padding: 18, width: '100%' },
  officerModalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  officerModalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  officerOption: { alignItems: 'center', borderBottomColor: '#E2E8F0', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingVertical: 9 },
  officerOptionName: { color: '#1E293B', fontSize: 14, fontWeight: '600' },
  officerOptionEmail: { color: '#64748B', fontSize: 12, marginTop: 3 },
  successIcon: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#DCFCE7', borderRadius: 40, height: 72, justifyContent: 'center', marginBottom: 16, width: 72 },
  successTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  successMessage: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 18, textAlign: 'center' },
  trackingCodeBox: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 10, borderWidth: 1, marginBottom: 18, padding: 12 },
  trackingCodeLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center', textTransform: 'uppercase' },
  trackingCode: { color: '#1E293B', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  viewCaseButton: { alignItems: 'center', backgroundColor: '#1D4ED8', borderRadius: 9, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  viewCaseButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  homeButton: { alignItems: 'center', borderColor: '#BFDBFE', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 10, minHeight: 50, paddingHorizontal: 16 },
  homeButtonText: { color: '#1D4ED8', fontSize: 15, fontWeight: '700' }
});