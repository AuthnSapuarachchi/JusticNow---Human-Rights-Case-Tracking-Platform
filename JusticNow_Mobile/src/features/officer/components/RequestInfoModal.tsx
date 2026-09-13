import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CaseInfoRequestItem, createCaseInfoRequest, OfficerCaseDetail } from '@/api/officerApi';
import { Button, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface RequestInfoModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  onSuccess: (infoRequest: CaseInfoRequestItem, updatedCase: OfficerCaseDetail) => void;
}

export function RequestInfoModal({ visible, caseId, onClose, onSuccess }: RequestInfoModalProps) {
  const colors = useColors();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a message for the citizen (at least 3 characters).');
      return;
    }

    try {
      setLoading(true);
      const res = await createCaseInfoRequest(caseId, message.trim());
      Alert.alert(
        'Request Sent',
        'Information request sent. Case status updated to WAITING FOR USER.'
      );
      onSuccess(res.infoRequest, res.case);
      setMessage('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to send information request.');
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
              <Ionicons color={colors.primary} name="help-circle-outline" size={24} />
              <Text variant="heading">Request Information</Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          <Text color="textSecondary" style={styles.description} variant="body">
            Ask the citizen for missing details, documentation, or clarification. Sending this request will automatically set the case status to WAITING FOR USER.
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setMessage}
            placeholder="e.g. Please provide dates of communication or copies of notices received..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={message}
          />

          <View style={styles.buttonRow}>
            <Button
              fullWidth
              label={loading ? 'Sending Request...' : 'Send Request to Citizen'}
              loading={loading}
              onPress={handleSubmit}
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
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    gap: Spacing.sm,
  },
});
