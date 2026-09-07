import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importing your 4 step components
import StepOneIncident from '../components/StepOneIncident';
import StepTwoCategory from '../components/StepTwoCategory';
import StepThreeEvidence from '../components/StepThreeEvidence';
import StepFourReview from '../components/StepFourReview';

export default function ReportFlowScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    isAnonymous: true,
    category: 'OTHER',
    incidentDate: '',
    location: '',
    description: '',
    files: []
  });

  // Load saved draft when screen opens
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem('reportDraft');
        if (savedDraft) setFormData(JSON.parse(savedDraft));
      } catch (error) {
        console.error("Failed to load draft", error);
      }
    };
    loadDraft();
  }, []);

  // Auto-save draft whenever formData changes
  useEffect(() => {
    AsyncStorage.setItem('reportDraft', JSON.stringify(formData));
  }, [formData]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmitFinal = async () => {
    console.log("Submitting this payload to backend:", formData);
    // We will wire up the actual API fetch here later!
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>Step {currentStep} of 4</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.content}>
        {currentStep === 1 && <StepOneIncident data={formData} updateData={setFormData} onNext={nextStep} />}
        {currentStep === 2 && <StepTwoCategory data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 3 && <StepThreeEvidence data={formData} updateData={setFormData} onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 4 && <StepFourReview data={formData} onPrev={prevStep} onSubmit={handleSubmitFinal} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF' },
  stepText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  progressBarBackground: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },
  content: { flex: 1, padding: 20 }
});