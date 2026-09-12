import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { closeCase, OfficerCaseDetail } from '@/api/officerApi';
import { Button, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface CloseCaseModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  onSuccess: (updatedCase: OfficerCaseDetail) => void;
}

export function CloseCaseModal({ visible, caseId, onClose, onSuccess }: CloseCaseModalProps) {
  const colors = useColors();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCloseCase = async () => {
    try {
      setLoading(true);
      const res = await closeCase(caseId, reason.trim() || undefined);
      Alert.alert('Case Closed', 'The case has been marked as CLOSED.');
      onSuccess(res.case);
      onClose();
      setReason('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to close case.');
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
              <Ionicons color="#718088" name="lock-closed" size={24} />
              <Text variant="heading">Close Case</Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          <Text color="textSecondary" style={styles.description} variant="body">
            Closing a case indicates that all inquiries, referrals, or legal remedies have concluded. You can optionally document the resolution rationale below.
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
