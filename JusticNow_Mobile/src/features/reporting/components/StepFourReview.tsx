import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

interface StepFourProps {
  data: any;
  onPrev: () => void;
  onSubmit: () => void;
}

export default function StepFourReview({ data, onPrev, onSubmit }: StepFourProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleFinalSubmit = () => {
    if (!isConfirmed) {
      Alert.alert('Action Required', 'Please confirm that the information provided is accurate.');
      return;
    }
    onSubmit();
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
          <Text style={styles.valueText}>{data.category.replace(/_/g, ' ')}</Text>

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

        {/* Confirmation Checkbox (Custom UI) */}
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setIsConfirmed(!isConfirmed)}
          activeOpacity={0.7}
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
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Text style={styles.prevButtonText}>← Edit Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, !isConfirmed && styles.submitButtonDisabled]} 
          onPress={handleFinalSubmit}
        >
          <Text style={styles.submitButtonText}>Submit Securely</Text>
        </TouchableOpacity>
      </View>
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
  submitButton: { padding: 16, borderRadius: 8, backgroundColor: '#16A34A', flex: 2, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#86EFAC' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});