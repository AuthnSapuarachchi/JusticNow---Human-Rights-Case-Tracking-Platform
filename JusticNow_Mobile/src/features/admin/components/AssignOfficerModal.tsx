import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AdminOfficer, getAdminOfficers } from '@/api/adminApi';
import { assignCase, OfficerCaseDetail } from '@/api/officerApi';
import { Button, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminSheet } from './AdminSheet';

interface AssignOfficerModalProps {
  visible: boolean;
  caseId: number | null;
  caseLabel?: string;
  currentOfficerId?: number | null;
  onClose: () => void;
  onSuccess: (updatedCase: OfficerCaseDetail) => void;
}

export function AssignOfficerModal({
  visible,
  caseId,
  caseLabel,
  currentOfficerId,
  onClose,
  onSuccess,
}: AssignOfficerModalProps) {
  const colors = useColors();
  const [officers, setOfficers] = useState<AdminOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedId(currentOfficerId ?? null);
    setLoadingOfficers(true);
    setLoadError(null);
    getAdminOfficers({ active: true })
      .then(setOfficers)
      .catch((err: any) => setLoadError(err?.message || 'Unable to load officers.'))
      .finally(() => setLoadingOfficers(false));
  }, [visible, currentOfficerId]);

  const handleAssign = async () => {
    if (!caseId || !selectedId) {
      Alert.alert('Select an officer', 'Please choose an officer to assign this case to.');
      return;
    }
    if (selectedId === currentOfficerId) {
      Alert.alert('No change', 'This case is already assigned to that officer.');
      return;
    }

    try {
      setSaving(true);
      const res = await assignCase(caseId, selectedId);
      Alert.alert('Case Assigned', res.message || 'Case assigned successfully.');
      onSuccess(res.case);
      onClose();
    } catch (err: any) {
      Alert.alert('Assignment Failed', err?.message || 'Unable to assign case.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSheet
      description={caseLabel ? `Choose the officer responsible for ${caseLabel}.` : 'Choose the officer responsible for this case.'}
      icon="person-add-outline"
      onClose={onClose}
      title={currentOfficerId ? 'Reassign Officer' : 'Assign Officer'}
      visible={visible}
    >
      {loadingOfficers ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError ? (
        <Text color="danger" variant="body">
          {loadError}
        </Text>
      ) : officers.length === 0 ? (
        <Text color="textSecondary" variant="body">
          No active officers yet. Create an officer account first.
        </Text>
      ) : (
        officers.map((officer) => {
          const isSelected = officer.id === selectedId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              key={officer.id}
              onPress={() => setSelectedId(officer.id)}
              style={({ pressed }) => [
                styles.officerRow,
                {
                  backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                color={isSelected ? colors.primary : colors.textTertiary}
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
              />
              <View style={styles.officerText}>
                <Text variant="bodyStrong">{officer.name || officer.email}</Text>
                <Text color="textSecondary" variant="caption">
                  {officer.organization?.name || officer.email}
                </Text>
              </View>
              <Text color="textSecondary" variant="caption">
                {officer.openCases} open
              </Text>
            </Pressable>
          );
        })
      )}

      <Button
        disabled={!selectedId || loadingOfficers}
        fullWidth
        label={saving ? 'Assigning...' : 'Confirm Assignment'}
        loading={saving}
        onPress={handleAssign}
      />
    </AdminSheet>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  officerRow: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  officerText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
