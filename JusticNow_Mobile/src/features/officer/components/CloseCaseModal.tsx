import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { closeCase, CloseOutcome, OfficerCaseDetail } from '@/api/officerApi';
import { Button, FilterChip, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface CloseCaseModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  onSuccess: (updatedCase: OfficerCaseDetail) => void;
}

const OUTCOME_OPTIONS: { value: CloseOutcome; label: string }[] = [
  { value: 'RESOLVED_FOR_USER', label: 'Resolved for user' },
  { value: 'REFERRED_EXTERNALLY', label: 'Referred externally' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient evidence' },
  { value: 'WITHDRAWN', label: 'Withdrawn by user' },
  { value: 'OTHER', label: 'Other' },
];

export function CloseCaseModal({ visible, caseId, onClose, onSuccess }: CloseCaseModalProps) {
  const colors = useColors();
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState<CloseOutcome>('RESOLVED_FOR_USER');
  const [loading, setLoading] = useState(false);

  const submitClose = async () => {
    try {
      setLoading(true);
      const res = await closeCase(caseId, { reason: reason.trim(), outcome });
      Alert.alert('Case Closed', 'The case has been marked as CLOSED.');
      onSuccess(res.case);
      onClose();
      setReason('');
      setOutcome('RESOLVED_FOR_USER');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to close case.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCase = () => {
    if (reason.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a closing reason (at least 3 characters).');
      return;
    }

    Alert.alert(
      'Close this case?',
      'Closing is final: the case leaves your active workload and no further info requests or referrals can be made.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Case', style: 'destructive', onPress: submitClose },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.canvas }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons color="#718088" name="lock-closed" size={24} />
              <Text variant="heading">Close Case</Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          <Text color="textSecondary" style={styles.description} variant="body">
            Closing a case indicates that all inquiries, referrals, or legal remedies have concluded. Select the outcome and document the closing reason below.
          </Text>

          <Text color="textSecondary" variant="caption">
            OUTCOME *
          </Text>
          <View style={styles.chipRow}>
            {OUTCOME_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                onPress={() => setOutcome(option.value)}
                selected={outcome === option.value}
              />
            ))}
          </View>

          <Text color="textSecondary" variant="caption">
            CLOSING REASON *
          </Text>

          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setReason}
            placeholder="Closing rationale (e.g. Legal settlement reached, referred to external counsel, insufficient evidence)..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={reason}
          />

          <View style={styles.buttonRow}>
            <Button
              disabled={reason.trim().length < 3}
              fullWidth
              label={loading ? 'Closing Case...' : 'Confirm and Close Case'}
              loading={loading}
              onPress={handleCloseCase}
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  textArea: {
    marginTop: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    gap: Spacing.sm,
  },
});
