import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  Layout,
  ScreenHeader,
  SectionHeading,
  Spacing,
  Text,
  useColors,
} from '@/design-system';
import type { Organization } from '@/features/legal-directory/types';

import { ContentTextField } from '../components/ContentTextField';
import { useRequireAdmin } from '../hooks/use-require-admin';
import {
  createOrganization,
  deleteOrganization,
  fetchOrganizations,
  updateOrganization,
  type OrganizationInput,
} from '../data/contentApi';

/** Form state is all strings — the API layer converts on submit. */
type FormState = {
  name: string;
  description: string;
  contactEmail: string;
  phone: string;
  location: string;
  distanceKm: string;
  languages: string;
  categories: string;
  isFree: boolean;
  verified: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  contactEmail: '',
  phone: '',
  location: '',
  distanceKm: '',
  languages: '',
  categories: '',
  isFree: true,
  verified: false,
};

const toForm = (organization: Organization): FormState => ({
  name: organization.name,
  description: organization.description,
  contactEmail: organization.contact.email ?? '',
  phone: organization.contact.phone ?? '',
  location: organization.location,
  distanceKm: String(organization.distanceKm ?? ''),
  languages: organization.languages.join(', '),
  categories: organization.categories.join(', '),
  isFree: organization.isFree,
  verified: organization.verified,
});

const splitList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const toPayload = (form: FormState): Partial<OrganizationInput> => ({
  name: form.name.trim(),
  description: form.description.trim(),
  contactEmail: form.contactEmail.trim(),
  phone: form.phone.trim(),
  location: form.location.trim(),
  distanceKm: Number(form.distanceKm) || 0,
  languages: splitList(form.languages),
  categories: splitList(form.categories) as Organization['categories'],
  isFree: form.isFree,
  verified: form.verified,
});

export function ManageOrganizationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isAdmin = useRequireAdmin();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // null = nothing open, 'new' = create form, otherwise the id being edited.
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setOrganizations(await fetchOrganizations());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load organisations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for the guard so a non-admin never fires an admin-only request.
    if (isAdmin) load();
  }, [isAdmin, load]);

  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setOpenId('new');
  };

  const openEdit = (organization: Organization) => {
    setForm(toForm(organization));
    setOpenId(organization.id);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.contactEmail.trim()) {
      setError('Name and contact email are required.');
      return;
    }

    setIsSaving(true);
    try {
      setError('');
      if (openId === 'new') {
        await createOrganization(toPayload(form));
      } else if (openId) {
        await updateOrganization(openId, toPayload(form));
      }
      setOpenId(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this organisation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (organization: Organization) => {
    Alert.alert('Delete organisation', `Remove ${organization.name} from the directory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setError('');
            await deleteOrganization(organization.id);
            await load();
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete.');
          }
        },
      },
    ]);
  };

  const renderForm = () => (
    <Card style={styles.form}>
      <ContentTextField label="Name" onChangeText={(v) => setField('name', v)} value={form.name} />
      <ContentTextField
        label="Description"
        multiline
        onChangeText={(v) => setField('description', v)}
        value={form.description}
      />
      <ContentTextField
        label="Contact email"
        onChangeText={(v) => setField('contactEmail', v)}
        value={form.contactEmail}
      />
      <ContentTextField label="Phone" onChangeText={(v) => setField('phone', v)} value={form.phone} />
      <ContentTextField label="Location" onChangeText={(v) => setField('location', v)} value={form.location} />
      <ContentTextField
        hint="Kilometres, never miles."
        keyboardType="numeric"
        label="Distance (km)"
        onChangeText={(v) => setField('distanceKm', v)}
        value={form.distanceKm}
      />
      <ContentTextField
        hint="Comma separated codes, e.g. si, ta, en"
        label="Languages"
        onChangeText={(v) => setField('languages', v)}
        value={form.languages}
      />
      <ContentTextField
        hint="Comma separated, e.g. legalAid, humanRights"
        label="Categories"
        onChangeText={(v) => setField('categories', v)}
        value={form.categories}
      />

      <View style={styles.toggleRow}>
        <Button
          label={form.isFree ? 'Free service' : 'Paid service'}
          onPress={() => setField('isFree', !form.isFree)}
          variant="secondary"
        />
        <Button
          label={form.verified ? 'Verified' : 'Not verified'}
          onPress={() => setField('verified', !form.verified)}
          variant="secondary"
        />
      </View>

      <View style={styles.formActions}>
        <Button label="Cancel" onPress={() => setOpenId(null)} variant="ghost" />
        <Button label="Save" loading={isSaving} onPress={handleSave} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader onBack={() => router.back()} title="Manage organisations" />

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <Card style={[styles.error, { borderColor: colors.danger }]}>
            <Text color="danger" variant="bodyStrong">
              {error}
            </Text>
          </Card>
        ) : null}

        {openId === 'new' ? (
          renderForm()
        ) : (
          <Button fullWidth icon="add" iconPosition="leading" label="Add organisation" onPress={openCreate} />
        )}

        <SectionHeading title={`${organizations.length} organisations`} />

        {isLoading ? (
          <View style={styles.centre}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          organizations.map((organization) => (
            <View key={organization.id} style={styles.row}>
              <Card>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle} variant="bodyStrong">
                    {organization.name}
                  </Text>
                  <Badge
                    icon={organization.verified ? 'checkmark-circle' : 'help-circle-outline'}
                    label={organization.verified ? 'Verified' : 'Unverified'}
                    tone={organization.verified ? 'verified' : 'neutral'}
                  />
                </View>
                <Text color="textSecondary" variant="caption">
                  {organization.location} · {organization.distanceKm} km · {organization.isFree ? 'Free' : 'Paid'}
                </Text>

                <View style={styles.rowActions}>
                  <Button
                    icon="create-outline"
                    iconPosition="leading"
                    label="Edit"
                    onPress={() => openEdit(organization)}
                    variant="secondary"
                  />
                  <Button
                    icon="trash-outline"
                    iconPosition="leading"
                    label="Delete"
                    onPress={() => handleDelete(organization)}
                    variant="ghost"
                  />
                </View>
              </Card>

              {openId === organization.id ? renderForm() : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
  },
  row: { gap: Spacing.sm },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  rowTitle: { flexShrink: 1 },
  rowActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  form: { gap: Spacing.md },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  error: { borderWidth: 1 },
  centre: { paddingVertical: Spacing.xxxl },
});
