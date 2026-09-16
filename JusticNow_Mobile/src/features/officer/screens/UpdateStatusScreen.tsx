import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getOfficerCase,
  OfficerCaseDetail,
  updateCaseStatus,
} from '@/api/officerApi';
import { Button, Card, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import {
  getOfficerStatusConfig,
  OfficerCaseStatus,
} from '@/features/cases/statusUtils';

interface UpdateStatusScreenProps {
  caseId?: string;
}

export function UpdateStatusScreen({ caseId: propCaseId }: UpdateStatusScreenProps) {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; caseId?: string }>();
  const activeCaseId = propCaseId || params.id || params.caseId;

  const [caseRecord, setCaseRecord] = useState<OfficerCaseDetail | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OfficerCaseStatus | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeCaseId) {
      setLoading(true);
      getOfficerCase(activeCaseId)
        .then((data) => {
          setCaseRecord(data);
          setSelectedStatus(data.status);
        })
        .catch((err) => {
          Alert.alert('Error', err?.message || 'Unable to load case details.');
        })
        .finally(() => setLoading(false));
    }
  }, [activeCaseId]);

  const availableStatuses: Array<{
    status: OfficerCaseStatus;
    label: string;
    description: string;
  }> = [
    {
      status: 'INVESTIGATING',
      label: 'Investigating',
      description: 'Active evidence gathering, interviewing witnesses, or verifying claims.',
    },
    {
      status: 'UNDER_REVIEW',
      label: 'Under Review',
      description: 'Case is being evaluated by officer or senior panel.',
    },
    {
      status: 'WAITING_FOR_USER',
      label: 'Waiting for User',
      description: 'Awaiting further clarification, files, or responses from the reporter.',
    },
    {
      status: 'ACTION_REQUIRED',
      label: 'Action Required',
      description: 'Urgent action pending from citizen, legal aid, or external agency.',
    },
    {
      status: 'RESOLVED',
      label: 'Resolved',
      description: 'Remedies achieved, settlement executed, or protection orders secured.',
    },
    {
      status: 'CLOSED',
      label: 'Closed',
      description: 'Proceedings concluded, withdrawn, or referred to completion.',
    },
  ];

  const handleSubmit = async () => {
    if (!caseRecord || !selectedStatus) return;

    if (selectedStatus === caseRecord.status) {
      Alert.alert('Status Unchanged', 'Please select a different status to perform a transition.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateCaseStatus(caseRecord.id, selectedStatus, note.trim() || undefined);
      Alert.alert(
        'Status Updated',
        res.message || `Case status changed to ${selectedStatus}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Unable to transition case status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text color="textSecondary" variant="body">
          Loading case status data...
        </Text>
      </SafeAreaView>
    );
  }

  const currentStatusConfig = getOfficerStatusConfig(caseRecord?.status);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} variant="heading">
            Update Case Status
          </Text>
          <Text color="textSecondary" variant="caption">
            {caseRecord?.trackingCode?.code || `CASE-${caseRecord?.id}`}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current status display */}
        <Card bordered style={styles.currentStatusCard}>
          <Text color="textSecondary" variant="caption">
            CURRENT STATUS
          </Text>
          <View style={styles.currentStatusRow}>
            <View style={[styles.statusBadge, { backgroundColor: currentStatusConfig.background }]}>
              <Ionicons color={currentStatusConfig.color} name={currentStatusConfig.icon} size={16} />
              <Text style={[styles.statusBadgeText, { color: currentStatusConfig.color }]}>
                {currentStatusConfig.label}
              </Text>
            </View>
            <Text color="textTertiary" variant="caption">
              Priority: {caseRecord?.priority}
            </Text>
          </View>
        </Card>

        {/* Transition Options */}
        <Text style={[styles.sectionHeading, { fontWeight: '700' }]} variant="caption">
          SELECT NEW WORKFLOW STATUS
        </Text>

        <View style={styles.statusOptionsList}>
          {availableStatuses.map((item) => {
            const isSelected = selectedStatus === item.status;
            const isCurrent = caseRecord?.status === item.status;
            const itemConfig = getOfficerStatusConfig(item.status);

            return (
              <Pressable
                key={item.status}
                onPress={() => setSelectedStatus(item.status)}
                style={({ pressed }) => [
                  styles.optionCardWrap,
                  pressed && styles.pressed,
                ]}
              >
                <Card
                  bordered
                  style={[
                    styles.optionCard,
                    isSelected && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                      backgroundColor: colors.surface,
                    },
                    isCurrent && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.optionTopRow}>
                    <View style={styles.optionLabelGroup}>
                      <View style={[styles.statusDot, { backgroundColor: itemConfig.color }]} />
                      <Text style={{ fontWeight: isSelected ? '800' : '600' }} variant="body">
                        {item.label}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentPill, { backgroundColor: colors.surfaceMuted }]}>
                          <Text color="textTertiary" variant="caption">
                            CURRENT
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Ionicons color="#ffffff" name="checkmark" size={14} />}
                    </View>
                  </View>

                  <Text color="textSecondary" style={styles.optionDesc} variant="caption">
                    {item.description}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Rationale / Note Input */}
        <Card bordered style={styles.noteCard}>
          <Text style={{ fontWeight: '700' }} variant="caption">TRANSITION RATIONALE & AUDIT NOTE</Text>
          <Text color="textSecondary" variant="caption">
            Document reason for status transition. This will be recorded in the immutable case history.
          </Text>

          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={setNote}
            placeholder="e.g. Completed initial evidentiary assessment, requesting supporting documents..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={note}
          />
        </Card>

        {/* Submit Button */}
        <View style={styles.submitWrapper}>
          <Button
            disabled={!selectedStatus || selectedStatus === caseRecord?.status}
            fullWidth
            label={submitting ? 'Applying Transition...' : 'Confirm Status Transition'}
            loading={submitting}
            onPress={handleSubmit}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
  },
  headerRightSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  currentStatusCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    marginTop: Spacing.xs,
    color: '#65737b',
  },
  statusOptionsList: {
    gap: Spacing.sm,
  },
  optionCardWrap: {
    marginBottom: 2,
  },
  optionCard: {
    padding: Spacing.md,
    gap: 4,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currentPill: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDesc: {
    paddingLeft: 18,
    lineHeight: 18,
  },
  noteCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  textArea: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  submitWrapper: {
    marginTop: Spacing.sm,
  },
});
