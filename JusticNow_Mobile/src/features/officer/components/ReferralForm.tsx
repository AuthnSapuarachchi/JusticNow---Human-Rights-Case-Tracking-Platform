import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  CaseReferralItem,
  createCaseReferral,
  getLegalOrganizations,
  LegalOrganizationItem,
} from '@/api/officerApi';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface ReferralModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  onSuccess: (newReferral: CaseReferralItem) => void;
}

export function ReferralModal({ visible, caseId, onClose, onSuccess }: ReferralModalProps) {
  const colors = useColors();
  const [organizations, setOrganizations] = useState<LegalOrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [customOrgText, setCustomOrgText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

  useEffect(() => {
    if (visible) {
      setFetchingOrgs(true);
      getLegalOrganizations()
        .then((orgs) => {
          setOrganizations(orgs);
          if (orgs.length > 0 && !selectedOrgId) {
            setSelectedOrgId(orgs[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setFetchingOrgs(false));
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a referral reason (at least 3 characters).');
      return;
    }

    if (!selectedOrgId && !customOrgText.trim()) {
      Alert.alert('Validation Error', 'Please select an organization or enter an external organization name.');
      return;
    }

    try {
      setLoading(true);
      const result = await createCaseReferral(caseId, {
        organizationId: selectedOrgId || undefined,
        referredToText: !selectedOrgId ? customOrgText.trim() : undefined,
        reason: reason.trim(),
      });
      Alert.alert('Referral Submitted', result.message || 'Case successfully referred.');
      onSuccess(result.referral);
      onClose();
      setReason('');
      setCustomOrgText('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to submit referral.');
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
              <Ionicons color={colors.primary} name="business" size={22} />
              <Text variant="heading">Refer Case</Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text color="textSecondary" variant="caption">
              SELECT REGISTERED LEGAL ORGANIZATION
            </Text>

            {organizations.length > 0 ? (
              <View style={styles.orgList}>
                {organizations.map((org) => {
                  const isSelected = selectedOrgId === org.id;
                  return (
                    <Pressable
                      key={org.id}
                      onPress={() => {
                        setSelectedOrgId(org.id);
                        setCustomOrgText('');
                      }}
                      style={[
                        styles.orgItem,
                        {
                          backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.orgInfo}>
                        <Text style={{ fontWeight: isSelected ? '700' : '500' }} variant="body">
                          {org.name}
                        </Text>
                        <Text color="textTertiary" variant="caption">
                          {org.contactEmail}
                        </Text>
                      </View>
                      {org.verified ? <Badge label="Verified" tone="verified" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text color="textTertiary" variant="caption">
                {fetchingOrgs ? 'Loading organizations...' : 'No registered organizations found.'}
              </Text>
            )}

            <View style={styles.divider}>
              <Text color="textTertiary" variant="caption">
                OR ENTER EXTERNAL ENTITY
              </Text>
            </View>

            <TextInput
              onChangeText={(text) => {
                setCustomOrgText(text);
                if (text.trim()) setSelectedOrgId(null);
              }}
              placeholder="e.g. Legal Aid Commission Colombo, Bar Association"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: customOrgText ? colors.primary : colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={customOrgText}
            />

            <Text color="textSecondary" style={styles.sectionMargin} variant="caption">
              REASON FOR REFERRAL *
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={setReason}
              placeholder="Detail why this case is being referred and what legal representation or counsel is requested..."
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
                label={loading ? 'Recording Referral...' : 'Confirm Referral'}
                loading={loading}
                onPress={handleSubmit}
                variant="primary"
              />
            </View>
          </ScrollView>
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  orgList: {
    gap: Spacing.xs,
  },
  orgItem: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orgInfo: {
    gap: 2,
    flex: 1,
  },
  divider: {
    marginVertical: Spacing.xs,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  sectionMargin: {
    marginTop: Spacing.sm,
  },
  textArea: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  buttonRow: {
    marginTop: Spacing.md,
  },
});
