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
  getActiveOfficers,
  getLegalOrganizations,
  LegalOrganizationItem,
  OfficerSummary,
} from '@/api/officerApi';
import { Badge, Button, Card, FilterChip, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface ReferralModalProps {
  visible: boolean;
  caseId: number;
  onClose: () => void;
  /** `reassigned` is true when the case was handed to another officer */
  onSuccess: (newReferral: CaseReferralItem, reassigned?: boolean) => void;
}

export function ReferralModal({ visible, caseId, onClose, onSuccess }: ReferralModalProps) {
  const colors = useColors();
  const [targetType, setTargetType] = useState<'organization' | 'officer'>('organization');
  const [organizations, setOrganizations] = useState<LegalOrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [customOrgText, setCustomOrgText] = useState('');
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [fetchingOfficers, setFetchingOfficers] = useState(false);
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

  useEffect(() => {
    if (visible && targetType === 'officer' && officers.length === 0) {
      setFetchingOfficers(true);
      getActiveOfficers()
        .then(setOfficers)
        .catch(() => {})
        .finally(() => setFetchingOfficers(false));
    }
  }, [visible, targetType]);

  const submitReferral = async () => {
    try {
      setLoading(true);
      const result = await createCaseReferral(
        caseId,
        targetType === 'officer'
          ? { officerId: selectedOfficerId!, reason: reason.trim() }
          : {
              organizationId: selectedOrgId || undefined,
              referredToText: !selectedOrgId ? customOrgText.trim() : undefined,
              reason: reason.trim(),
            }
      );
      Alert.alert('Referral Submitted', result.message || 'Case successfully referred.');
      onSuccess(result.referral, result.reassigned);
      onClose();
      setReason('');
      setCustomOrgText('');
      setSelectedOfficerId(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to submit referral.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a referral reason (at least 3 characters).');
      return;
    }

    if (targetType === 'officer') {
      if (!selectedOfficerId) {
        Alert.alert('Validation Error', 'Please select the officer to refer this case to.');
        return;
      }
      // Handing over removes this officer's access, so confirm first
      Alert.alert(
        'Hand Over Case?',
        'The case will be reassigned to the selected officer and you will no longer be able to modify it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Refer & Reassign', style: 'destructive', onPress: submitReferral },
        ]
      );
      return;
    }

    if (!selectedOrgId && !customOrgText.trim()) {
      Alert.alert('Validation Error', 'Please select an organization or enter an external organization name.');
      return;
    }

    await submitReferral();
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
              REFER TO
            </Text>
            <View style={styles.chipRow}>
              <FilterChip
                label="Organization / Department"
                onPress={() => setTargetType('organization')}
                selected={targetType === 'organization'}
              />
              <FilterChip
                label="Another Officer"
                onPress={() => setTargetType('officer')}
                selected={targetType === 'officer'}
              />
            </View>

            {targetType === 'officer' ? (
              <View style={styles.orgList}>
                {officers.length > 0 ? (
                  officers.map((officer) => {
                    const isSelected = selectedOfficerId === officer.id;
                    return (
                      <Pressable
                        key={officer.id}
                        onPress={() => setSelectedOfficerId(officer.id)}
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
                            {officer.name || officer.email}
                          </Text>
                          <Text color="textTertiary" variant="caption">
                            {officer.email}
                          </Text>
                        </View>
                        {isSelected ? <Ionicons color={colors.primary} name="checkmark-circle" size={20} /> : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <Text color="textTertiary" variant="caption">
                    {fetchingOfficers ? 'Loading officers...' : 'No other active officers found.'}
                  </Text>
                )}
              </View>
            ) : (
            <>
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
            </>
            )}

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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
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
