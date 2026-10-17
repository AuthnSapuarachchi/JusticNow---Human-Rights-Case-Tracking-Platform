import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '@/design-system';
import { Spacing } from '@/design-system/spacing';

import { ChoiceCard, FormField, StepLayout } from './StepLayout';

interface StepOneProps {
  data: any; // Contains our formData
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepOneIncident({ data, updateData, onNext }: StepOneProps) {
  const hasDescription = Boolean(data.description?.trim());
  const hasValidPin = /^\d{4,12}$/.test(data.pin || '');
  // Tell people exactly what is missing instead of a silently disabled button.
  const nextLabel = !hasDescription ? 'Describe what happened to continue' : !hasValidPin ? 'Create a 4–12 digit PIN to continue' : 'Continue';

  return (
    <StepLayout
      footer={
        <Button
          fullWidth
          disabled={!hasDescription || !hasValidPin}
          icon={hasDescription && hasValidPin ? 'arrow-forward' : undefined}
          label={nextLabel}
          onPress={onNext}
        />
      }
      subtitle="Tell us what happened. Take your time — your draft is saved as you type."
      title="What happened?"
    >
      <View style={styles.group} accessibilityRole="radiogroup">
        <ChoiceCard
          description="Your name is never shared."
          icon="eye-off-outline"
          onPress={() => updateData({ ...data, isAnonymous: true })}
          selected={data.isAnonymous}
          title="Report anonymously"
        />
        <ChoiceCard
          description="Lets the officer contact you directly."
          icon="person-outline"
          onPress={() => updateData({ ...data, isAnonymous: false })}
          selected={!data.isAnonymous}
          title="Include my name"
        />
      </View>

      <FormField
        label="Describe what happened"
        multiline
        numberOfLines={6}
        onChangeText={(text) => updateData({ ...data, description: text })}
        placeholder="Who was involved, what was said or done, and anything else you feel comfortable sharing."
        value={typeof data.description === 'string' ? data.description : ''}
      />

      <FormField
        hint="For example 03/14/2026. An approximate date is fine."
        label="Date of incident"
        onChangeText={(text) => updateData({ ...data, incidentDate: text })}
        optional
        placeholder="MM/DD/YYYY"
        value={typeof data.incidentDate === 'string' ? data.incidentDate : ''}
      />

      <FormField
        label="Where did it happen?"
        onChangeText={(text) => updateData({ ...data, location: text })}
        optional
        placeholder="Town, workplace or area"
        value={typeof data.location === 'string' ? data.location : ''}
      />

      <FormField
        hint="4–12 digits. You will need this PIN with your tracking code to open your case later."
        keyboardType="number-pad"
        label="Create a private PIN"
        maxLength={12}
        onChangeText={(text) => updateData({ ...data, pin: text.replace(/\D/g, '') })}
        placeholder="••••"
        secureTextEntry
        value={typeof data.pin === 'string' ? data.pin : ''}
      />
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.md },
});
