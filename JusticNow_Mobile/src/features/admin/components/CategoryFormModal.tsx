import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AdminCategory, updateCategory } from '@/api/adminApi';
import { Button } from '@/design-system/components';
import { AdminSheet, FormField, FormSwitch } from './AdminSheet';

interface CategoryFormModalProps {
  visible: boolean;
  category: AdminCategory | null;
  onClose: () => void;
  onSaved: (category: AdminCategory) => void;
}

export function CategoryFormModal({ visible, category, onClose, onSaved }: CategoryFormModalProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !category) return;
    setLabel(category.label);
    setDescription(category.description || '');
    setIsActive(category.isActive);
  }, [visible, category]);

  const handleSubmit = async () => {
    if (!category) return;
    if (!label.trim()) {
      Alert.alert('Validation Error', 'Category label is required.');
      return;
    }

    try {
      setSaving(true);
      const saved = await updateCategory(category.code, {
        label: label.trim(),
        description: description.trim(),
        isActive,
      });
      onSaved({ ...saved, caseCount: category.caseCount });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSheet
      description={category ? `System code: ${category.code}` : undefined}
      icon="pricetags-outline"
      onClose={onClose}
      title="Edit Category"
      visible={visible}
    >
      <FormField label="Display label" onChangeText={setLabel} placeholder="e.g. Workplace discrimination" value={label} />
      <FormField
        label="Simple explanation"
        multiline
        numberOfLines={3}
        onChangeText={setDescription}
        placeholder="Shown to citizens when choosing a category"
        value={description}
      />
      <FormSwitch
        hint="Inactive categories are hidden from new reports. Existing cases keep their category."
        label="Available for new reports"
        onValueChange={setIsActive}
        value={isActive}
      />

      <Button fullWidth label={saving ? 'Saving...' : 'Save Category'} loading={saving} onPress={handleSubmit} />
    </AdminSheet>
  );
}
