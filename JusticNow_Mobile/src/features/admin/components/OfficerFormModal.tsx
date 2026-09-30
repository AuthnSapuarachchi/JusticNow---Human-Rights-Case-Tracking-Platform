import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import {
  AdminOfficer,
  AdminOrganization,
  createOfficer,
  OfficerInput,
  updateOfficer,
} from '@/api/adminApi';
import { Button, FilterChip, Text } from '@/design-system/components';
import { Spacing } from '@/design-system/spacing';
import { AdminSheet, FormField } from './AdminSheet';

interface OfficerFormModalProps {
  visible: boolean;
  /** When provided the form edits this officer; otherwise it creates a new one. */
  officer: AdminOfficer | null;
  organizations: AdminOrganization[];
  onClose: () => void;
  onSaved: (officer: AdminOfficer) => void;
}

export function OfficerFormModal({ visible, officer, organizations, onClose, onSaved }: OfficerFormModalProps) {
  const isEdit = Boolean(officer);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(officer?.name || '');
    setEmail(officer?.email || '');
    setPassword('');
    setOrganizationId(officer?.organizationId ?? null);
  }, [visible, officer]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and email are required.');
      return;
    }
    if (!isEdit && password.length < 8) {
      Alert.alert('Validation Error', 'Temporary password must be at least 8 characters.');
      return;
    }
    if (isEdit && password && password.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters.');
      return;
    }

    const input: OfficerInput = {
      name: name.trim(),
      email: email.trim(),
      organizationId,
      ...(password ? { password } : {}),
    };

    try {
      setSaving(true);
      const saved = officer ? await updateOfficer(officer.id, input) : await createOfficer(input);
      Alert.alert(
        isEdit ? 'Officer Updated' : 'Officer Created',
        isEdit
          ? `${saved.name || saved.email} was updated.`
          : `${saved.name || saved.email} can now log in with the temporary password.`
      );
      onSaved(saved);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to save officer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSheet
      description={
        isEdit
          ? 'Update account details. Leave the password blank to keep the current one.'
          : 'Create an officer account. Share the temporary password securely with the officer.'
      }
      icon={isEdit ? 'create-outline' : 'person-add-outline'}
      onClose={onClose}
      title={isEdit ? 'Edit Officer' : 'Add Officer'}
      visible={visible}
    >
      <FormField label="Full name" onChangeText={setName} placeholder="e.g. Maya Perera" value={name} />
      <FormField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="officer@justicenow.org"
        value={email}
      />
      <FormField
        autoCapitalize="none"
        label={isEdit ? 'New password (optional)' : 'Temporary password'}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        value={password}
      />

      <Text color="textSecondary" style={styles.orgLabel} variant="caption">
        Organization (optional)
      </Text>
      <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}>
        <FilterChip label="None" onPress={() => setOrganizationId(null)} selected={organizationId === null} />
        {organizations.map((org) => (
          <FilterChip
            key={org.id}
            label={org.name}
            onPress={() => setOrganizationId(org.id)}
            selected={organizationId === org.id}
          />
        ))}
      </ScrollView>

      <Button
        fullWidth
        label={saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Officer'}
        loading={saving}
        onPress={handleSubmit}
      />
    </AdminSheet>
  );
}

const styles = StyleSheet.create({
  orgLabel: {
    fontWeight: '700',
    marginBottom: -Spacing.xs,
  },
  chipRow: {
    gap: Spacing.sm,
  },
});
