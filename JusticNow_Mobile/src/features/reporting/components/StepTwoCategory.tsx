import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '@/design-system';
import { Spacing } from '@/design-system/spacing';

import { ChoiceCard, FooterSlot, StepFooter, StepLayout } from './StepLayout';

interface StepTwoProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

// These match the ViolationCategory Enum we put in the Prisma database!
const CATEGORIES: { id: string; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'WORKPLACE_DISCRIMINATION', title: 'Workplace discrimination', description: 'Unfair treatment at work or when applying for a job.', icon: 'briefcase-outline' },
  { id: 'HUMAN_RIGHTS_VIOLATION', title: 'Human rights violation', description: 'Abuse of power, unlawful arrest, violence or threats.', icon: 'shield-outline' },
  { id: 'DIGITAL_PRIVACY', title: 'Digital privacy breach', description: 'Personal data or images shared without consent.', icon: 'finger-print-outline' },
  { id: 'OTHER', title: 'Other or not sure', description: 'An officer will help find the right category.', icon: 'help-circle-outline' },
];

export default function StepTwoCategory({ data, updateData, onNext, onPrev }: StepTwoProps) {
  return (
    <StepLayout
      footer={
        <StepFooter>
          <FooterSlot><Button fullWidth label="Back" onPress={onPrev} variant="secondary" /></FooterSlot>
          <FooterSlot grow={2}><Button fullWidth icon="arrow-forward" label="Continue" onPress={onNext} /></FooterSlot>
        </StepFooter>
      }
      subtitle="Choose the option that fits best. If you are unsure, pick “Other”."
      title="What kind of incident?"
    >
      <View accessibilityRole="radiogroup" style={styles.group}>
        {CATEGORIES.map((cat) => (
          <ChoiceCard
            description={cat.description}
            icon={cat.icon}
            key={cat.id}
            onPress={() => updateData({ ...data, category: cat.id })}
            selected={data.category === cat.id}
            title={cat.title}
          />
        ))}
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.md },
});
