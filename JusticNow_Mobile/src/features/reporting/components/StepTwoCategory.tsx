import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface StepTwoProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

// These match the ViolationCategory Enum we put in the Prisma database!
const CATEGORIES = [
  { id: 'WORKPLACE_DISCRIMINATION', title: 'Workplace Discrimination', icon: '🏢' },
  { id: 'HUMAN_RIGHTS_VIOLATION', title: 'Human Rights Violation', icon: '⚖️' },
  { id: 'DIGITAL_PRIVACY', title: 'Digital Privacy Breach', icon: '💻' },
  { id: 'OTHER', title: 'Other / Not Sure', icon: '❓' }
];

export default function StepTwoCategory({ data, updateData, onNext, onPrev }: StepTwoProps) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Incident Category</Text>
        <Text style={styles.subtitle}>Select the option that best describes the situation.</Text>

        <View style={styles.cardContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = data.category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => updateData({ ...data, category: cat.id })}
                activeOpacity={0.7}
              >
                <Text style={styles.cardIcon}>{cat.icon}</Text>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Text style={styles.prevButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next: Evidence →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  cardContainer: { gap: 12, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA'
  },
  cardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },
  cardIcon: { fontSize: 24, marginRight: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#334155' },
  cardTitleSelected: { color: '#1D4ED8' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  prevButton: { padding: 16, borderRadius: 8, backgroundColor: '#F1F5F9', flex: 1, marginRight: 8, alignItems: 'center' },
  prevButtonText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  nextButton: { padding: 16, borderRadius: 8, backgroundColor: '#2563EB', flex: 2, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});