import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  AdminOrganization,
  createOrganization,
  OrganizationInput,
  updateOrganization,
} from '@/api/adminApi';
import { Button } from '@/design-system/components';
import { AdminSheet, FormField, FormSwitch } from './AdminSheet';

interface OrganizationFormModalProps {
  visible: boolean;
  organization: AdminOrganization | null;
  onClose: () => void;
  onSaved: (organization: AdminOrganization) => void;
}

export function OrganizationFormModal({ visible, organization, onClose, onSaved }: OrganizationFormModalProps) {
  const isEdit = Boolean(organization);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(organization?.name || '');
    setContactEmail(organization?.contactEmail || '');
    setPhone(organization?.phone || '');
    setLocation(organization?.location || '');
    setDescription(organization?.description || '');
    setVerified(organization?.verified ?? false);
  }, [visible, organization]);

  const handleSubmit = async () => {
    if (!name.trim() || !contactEmail.trim()) {
      Alert.alert('Validation Error', 'Organization name and contact email are required.');
      return;
    }

    const input: OrganizationInput = {
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      phone: phone.trim(),
      location: location.trim(),
      description: description.trim(),
      verified,
    };

    try {
      setSaving(true);
      const saved = organization
        ? await updateOrganization(organization.id, input)
        : await createOrganization(input);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to save organization.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSheet
      description="Organizations listed here can receive case referrals from officers."
      icon="business-outline"
      onClose={onClose}
      title={isEdit ? 'Edit Organization' : 'Add Organization'}
      visible={visible}
    >
      <FormField label="Organization name" onChangeText={setName} placeholder="e.g. Legal Aid Commission" value={name} />
      <FormField
        autoCapitalize="none"
        keyboardType="email-address"
        label="Contact email"
        onChangeText={setContactEmail}
        placeholder="contact@organization.org"
        value={contactEmail}
      />
      <FormField keyboardType="phone-pad" label="Phone (optional)" onChangeText={setPhone} placeholder="+94 11 234 5678" value={phone} />
      <FormField label="Service location (optional)" onChangeText={setLocation} placeholder="e.g. Colombo" value={location} />
      <FormField
        label="Description (optional)"
        multiline
        numberOfLines={3}
        onChangeText={setDescription}
        placeholder="Areas of support, languages, opening hours..."
        value={description}
      />
      <FormSwitch
        hint="Shows a verification badge to officers when referring cases."
        label="Verified organization"
        onValueChange={setVerified}
        value={verified}
      />

      <Button
        fullWidth
        label={saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Organization'}
        loading={saving}
        onPress={handleSubmit}
      />
    </AdminSheet>
  );
}
