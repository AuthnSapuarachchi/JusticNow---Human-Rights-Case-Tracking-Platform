import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { escalateCase, OfficerCaseDetail } from '@/api/officerApi';
import { Button, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface EscalateConfirmModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  onSuccess: (updatedCase: OfficerCaseDetail) => void;
}

export function EscalateConfirmModal({ visible, caseId, onClose, onSuccess }: EscalateConfirmModalProps) {
  const colors = useColors();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEscalate = async () => {
    try {
      setLoading(true);
      const res = await escalateCase(caseId, reason.trim() || undefined);
      Alert.alert('Case Escalated', 'The case priority has been set to URGENT and flagged for immediate attention.');
      onSuccess(res.case);
      onClose();
      setReason('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to escalate case.');
    } finally {
      setLoading(false);
    }
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
              <Ionicons color={colors.danger} name="flame" size={24} />
              <Text style={{ color: colors.danger }} variant="heading">
                Escalate to Urgent
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          <View style={[styles.warningBox, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons color={colors.danger} name="alert-circle" size={20} />
            <Text color="danger" style={styles.warningText} variant="caption">
              Escalating flags this case across all officer queues with highest priority and triggers expedited supervision.
            </Text>
          </View>

          <Text color="textSecondary" style={styles.label} variant="caption">
            REASON FOR ESCALATION
          </Text>
          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setReason}
            placeholder="e.g. Imminent risk of reprisal, severe human rights violation, vulnerable victim..."
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
              fullWidth
              label={loading ? 'Escalating...' : 'Confirm Escalation'}
              loading={loading}
              onPress={handleEscalate}
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    lineHeight: 18,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  textArea: {
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
