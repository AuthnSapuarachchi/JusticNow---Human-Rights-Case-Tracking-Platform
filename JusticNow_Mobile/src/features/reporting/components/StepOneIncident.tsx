import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface StepOneProps {
  data: any; // Contains our formData
  updateData: (data: any) => void;
  onNext: () => void;
}

export default function StepOneIncident({ data, updateData, onNext }: StepOneProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incident Details</Text>
      <Text style={styles.subtitle}>Provide information about what happened. Take your time.</Text>

      {/* Anonymity Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.radioOption, data.isAnonymous && styles.radioSelected]}
          onPress={() => updateData({ ...data, isAnonymous: true })}
        >
          <Text style={styles.radioText}>🛡️ Report Anonymously</Text>
          <Text style={styles.radioSubText}>Your identity will not be shared.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.radioOption, !data.isAnonymous && styles.radioSelected]}
          onPress={() => updateData({ ...data, isAnonymous: false })}
        >
          <Text style={styles.radioText}>👤 Identify Myself</Text>
          <Text style={styles.radioSubText}>Provides contact info for direct follow-up.</Text>
        </TouchableOpacity>
      </View>

      {/* Date Input */}
      <Text style={styles.label}>Date of Incident</Text>
      <TextInput
        style={styles.input}
        placeholder="mm/dd/yyyy"
        value={data.incidentDate}
        onChangeText={(text) => updateData({ ...data, incidentDate: text })}
      />

      {/* Location Input */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Main Office, Floor 3"
        value={data.location}
        onChangeText={(text) => updateData({ ...data, location: text })}
      />

      {/* Description Input */}
      <Text style={styles.label}>Description (Required)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened in as much detail as you feel comfortable sharing..."
        multiline
        numberOfLines={6}
        value={data.description}
        onChangeText={(text) => updateData({ ...data, description: text })}
      />

      {/* Next Button */}
      <TouchableOpacity 
        style={[styles.nextButton, !data.description && styles.nextButtonDisabled]} 
        onPress={onNext}
        disabled={!data.description} // Prevents moving forward if description is empty!
      >
        <Text style={styles.nextButtonText}>Next Step: Category Details →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  toggleContainer: { marginBottom: 20 },
  radioOption: { padding: 15, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 10 },
  radioSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radioText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  radioSubText: { fontSize: 12, color: '#64748B', marginTop: 4 },

  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },

  nextButton: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  nextButtonDisabled: { backgroundColor: '#94A3B8' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});