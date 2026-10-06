import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Layout,
  ScreenHeader,
  SectionHeading,
  Spacing,
  Text,
  useColors,
} from '@/design-system';

import { ContentTextField } from '@/design-system';
import { useManageAccess } from '@/hooks/use-manage-access';
import { useTranslation } from '@/i18n/use-translation';
import {
  createFaq,
  createProtection,
  createRightsCategory,
  deleteFaq,
  deleteProtection,
  deleteRightsCategory,
  fetchRightsForManagement,
  updateFaq,
  updateProtection,
  updateRightsCategory,
  type ManagedFaq,
  type ManagedProtection,
  type ManagedRightsCategory,
} from '../data/manageRights';

type CategoryForm = {
  categoryId: string;
  icon: string;
  title: string;
  description: string;
  intro: string;
  sources: string;
  order: string;
};

const EMPTY_CATEGORY: CategoryForm = {
  categoryId: '',
  icon: 'document-text',
  title: '',
  description: '',
  intro: '',
  sources: '',
  order: '0',
};

const STABLE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const isValidOrder = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value));

const toCategoryForm = (category: ManagedRightsCategory): CategoryForm => ({
  categoryId: category.categoryId,
  icon: category.icon,
  title: category.title,
  description: category.description,
  intro: category.intro,
  sources: category.sources,
  order: String(category.order),
});

export function ManageRightsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const canManage = useManageAccess();

  const [categories, setCategories] = useState<ManagedRightsCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Which category's panel is expanded, and whether the create form is open.
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);

  // Draft rows for the "add protection" / "add FAQ" inputs, keyed by category.
  const [protectionDraft, setProtectionDraft] = useState({ id: '', title: '', body: '' });
  const [faqDraft, setFaqDraft] = useState({ id: '', question: '', answer: '' });

  const load = useCallback(async () => {
    try {
      setError('');
      setCategories(await fetchRightsForManagement());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load rights content.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for the guard so a non-admin never fires an admin-only request.
    if (canManage) load();
  }, [canManage, load]);

  // Every mutation follows the same shape: run it, surface failures, reload.
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setIsSaving(true);
    try {
      setError('');
      await action();
      await load();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'That action failed.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const setCategoryField = (key: keyof CategoryForm, value: string) =>
    setCategoryForm((current) => ({ ...current, [key]: value }));

  const categoryPayload = (form: CategoryForm, includeStableId = true) => ({
    ...(includeStableId ? { categoryId: form.categoryId.trim() } : {}),
    icon: form.icon.trim(),
    title: form.title.trim(),
    description: form.description,
    intro: form.intro,
    sources: form.sources,
    order: Number(form.order),
  });

  const handleSaveCategory = async (existing?: ManagedRightsCategory) => {
    if (!STABLE_ID_PATTERN.test(categoryForm.categoryId.trim())) {
      setError(t('manage.validation.categoryId'));
      return;
    }
    if (!existing && categories.some((category) => category.locale === 'en' && category.categoryId === categoryForm.categoryId.trim())) {
      setError(t('manage.validation.categoryIdDuplicate'));
      return;
    }
    if (categoryForm.title.trim().length < 2 || categoryForm.title.trim().length > 160) {
      setError(t('manage.validation.categoryTitle'));
      return;
    }
    if (!categoryForm.description.trim() || categoryForm.description.trim().length > 1000) {
      setError(t('manage.validation.categoryDescription'));
      return;
    }
    if (!categoryForm.intro.trim() || categoryForm.intro.trim().length > 5000) {
      setError(t('manage.validation.categoryIntro'));
      return;
    }
    if (!categoryForm.sources.trim() || categoryForm.sources.trim().length > 5000) {
      setError(t('manage.validation.categorySources'));
      return;
    }
    if (!isValidOrder(categoryForm.order)) {
      setError(t('manage.validation.order'));
      return;
    }
    if (!(categoryForm.icon.trim() in Ionicons.glyphMap)) {
      setError(t('manage.validation.icon'));
      return;
    }
    await run(async () => {
      if (existing) {
        await updateRightsCategory(existing.id, categoryPayload(categoryForm, false));
      } else {
        await createRightsCategory(categoryPayload(categoryForm));
        setIsCreating(false);
      }
    });
  };

  const confirmDelete = (message: string, onConfirm: () => void) =>
    Alert.alert('Delete', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);

  const renderCategoryForm = (existing?: ManagedRightsCategory) => (
    <Card style={styles.form}>
      {existing ? (
        <Text color="textSecondary" variant="label">Category id: {existing.categoryId}</Text>
      ) : (
        <ContentTextField
          hint="Stable ID used in the app URL, e.g. workplace"
          label="Category id"
          onChangeText={(v) => setCategoryField('categoryId', v)}
          value={categoryForm.categoryId}
        />
      )}
      <ContentTextField label="Title" onChangeText={(v) => setCategoryField('title', v)} value={categoryForm.title} />
      <ContentTextField
        hint="Plain language — this is the tile subtitle."
        label="Description"
        multiline
        onChangeText={(v) => setCategoryField('description', v)}
        value={categoryForm.description}
      />
      <ContentTextField
        label="Intro"
        multiline
        onChangeText={(v) => setCategoryField('intro', v)}
        value={categoryForm.intro}
      />
      <ContentTextField
        hint="One citation per line. Sri Lankan law only."
        label="Sources"
        multiline
        onChangeText={(v) => setCategoryField('sources', v)}
        value={categoryForm.sources}
      />
      <ContentTextField
        hint="Ionicons name, e.g. briefcase"
        label="Icon"
        onChangeText={(v) => setCategoryField('icon', v)}
        value={categoryForm.icon}
      />
      <ContentTextField
        hint="Lower numbers appear first."
        keyboardType="numeric"
        label="Display order"
        onChangeText={(v) => setCategoryField('order', v)}
        value={categoryForm.order}
      />

      <View style={styles.formActions}>
        <Button
          label="Cancel"
          onPress={() => {
            setIsCreating(false);
            setExpandedId(null);
          }}
          variant="ghost"
        />
        <Button label="Save" loading={isSaving} onPress={() => handleSaveCategory(existing)} />
      </View>
    </Card>
  );

  const renderProtections = (category: ManagedRightsCategory) => (
    <View style={styles.subSection}>
      <SectionHeading title={`Key protections (${category.protections.length})`} />
      {category.protections.map((protection: ManagedProtection) => (
        <Card key={protection.id} style={styles.subRow}>
          <Text variant="bodyStrong">{protection.title}</Text>
          <Text color="textSecondary" variant="caption">
            {protection.body}
          </Text>
          <View style={styles.subActions}>
            <Button
              icon="trash-outline"
              iconPosition="leading"
              label="Remove"
              onPress={() =>
                confirmDelete(`Remove "${protection.title}"?`, () => run(() => deleteProtection(protection.id)))
              }
              variant="ghost"
            />
          </View>
        </Card>
      ))}

      <Card style={styles.form}>
        <Text variant="label">Add a protection</Text>
        <ContentTextField
          label="Id"
          onChangeText={(v) => setProtectionDraft((d) => ({ ...d, id: v }))}
          value={protectionDraft.id}
        />
        <ContentTextField
          label="Title"
          onChangeText={(v) => setProtectionDraft((d) => ({ ...d, title: v }))}
          value={protectionDraft.title}
        />
        <ContentTextField
          label="Body"
          multiline
          onChangeText={(v) => setProtectionDraft((d) => ({ ...d, body: v }))}
          value={protectionDraft.body}
        />
        <Button
          label="Add protection"
          loading={isSaving}
          onPress={async () => {
            if (!STABLE_ID_PATTERN.test(protectionDraft.id.trim())) {
              setError(t('manage.validation.protectionId'));
              return;
            }
            if (category.protections.some((item) => item.protectionId === protectionDraft.id.trim())) {
              setError(t('manage.validation.protectionIdDuplicate'));
              return;
            }
            if (protectionDraft.title.trim().length < 2 || protectionDraft.title.trim().length > 160) {
              setError(t('manage.validation.protectionTitle'));
              return;
            }
            if (protectionDraft.body.trim().length < 10 || protectionDraft.body.trim().length > 5000) {
              setError(t('manage.validation.protectionBody'));
              return;
            }
            const saved = await run(() =>
              createProtection(category.id, {
                protectionId: protectionDraft.id.trim(),
                title: protectionDraft.title.trim(),
                body: protectionDraft.body.trim(),
                order: category.protections.length,
              }),
            );
            if (saved) setProtectionDraft({ id: '', title: '', body: '' });
          }}
          variant="secondary"
        />
      </Card>
    </View>
  );

  const renderFaqs = (category: ManagedRightsCategory) => (
    <View style={styles.subSection}>
      <SectionHeading title={`FAQs (${category.faqs.length})`} />
      {category.faqs.map((faq: ManagedFaq) => (
        <Card key={faq.id} style={styles.subRow}>
          <Text variant="bodyStrong">{faq.question}</Text>
          <Text color="textSecondary" variant="caption">
            {faq.answer}
          </Text>
          <View style={styles.subActions}>
            <Button
              icon="trash-outline"
              iconPosition="leading"
              label="Remove"
              onPress={() => confirmDelete(`Remove "${faq.question}"?`, () => run(() => deleteFaq(faq.id)))}
              variant="ghost"
            />
          </View>
        </Card>
      ))}

      <Card style={styles.form}>
        <Text variant="label">Add a FAQ</Text>
        <ContentTextField label="Id" onChangeText={(v) => setFaqDraft((d) => ({ ...d, id: v }))} value={faqDraft.id} />
        <ContentTextField
          label="Question"
          onChangeText={(v) => setFaqDraft((d) => ({ ...d, question: v }))}
          value={faqDraft.question}
        />
        <ContentTextField
          label="Answer"
          multiline
          onChangeText={(v) => setFaqDraft((d) => ({ ...d, answer: v }))}
          value={faqDraft.answer}
        />
        <Button
          label="Add FAQ"
          loading={isSaving}
          onPress={async () => {
            if (!STABLE_ID_PATTERN.test(faqDraft.id.trim())) {
              setError(t('manage.validation.faqId'));
              return;
            }
            if (category.faqs.some((item) => item.faqId === faqDraft.id.trim())) {
              setError(t('manage.validation.faqIdDuplicate'));
              return;
            }
            if (faqDraft.question.trim().length < 5 || faqDraft.question.trim().length > 300) {
              setError(t('manage.validation.faqQuestion'));
              return;
            }
            if (faqDraft.answer.trim().length < 10 || faqDraft.answer.trim().length > 5000) {
              setError(t('manage.validation.faqAnswer'));
              return;
            }
            const saved = await run(() =>
              createFaq(category.id, {
                faqId: faqDraft.id.trim(),
                question: faqDraft.question.trim(),
                answer: faqDraft.answer.trim(),
                order: category.faqs.length,
              }),
            );
            if (saved) setFaqDraft({ id: '', question: '', answer: '' });
          }}
          variant="secondary"
        />
      </Card>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScreenHeader onBack={() => router.back()} title="Manage rights content" />

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <Card style={[styles.error, { borderColor: colors.danger }]}>
            <Text color="danger" variant="bodyStrong">
              {error}
            </Text>
          </Card>
        ) : null}

        {isCreating ? (
          renderCategoryForm()
        ) : (
          <Button
            fullWidth
            icon="add"
            iconPosition="leading"
            label="Add category"
            onPress={() => {
              setCategoryForm(EMPTY_CATEGORY);
              setExpandedId(null);
              setIsCreating(true);
            }}
          />
        )}

        <SectionHeading title={`${categories.length} categories`} />

        {isLoading ? (
          <View style={styles.centre}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.id} style={styles.row}>
              <Card>
                <Text variant="bodyStrong">{category.title}</Text>
                <Text color="textSecondary" variant="caption">
                  {category.protections.length} protections · {category.faqs.length} FAQs · order {category.order}
                </Text>

                <View style={styles.rowActions}>
                  <Button
                    icon={expandedId === category.id ? 'chevron-up' : 'create-outline'}
                    iconPosition="leading"
                    label={expandedId === category.id ? 'Close' : 'Edit'}
                    onPress={() => {
                      const next = expandedId === category.id ? null : category.id;
                      setExpandedId(next);
                      setIsCreating(false);
                      if (next) setCategoryForm(toCategoryForm(category));
                    }}
                    variant="secondary"
                  />
                  <Button
                    icon="trash-outline"
                    iconPosition="leading"
                    label="Delete"
                    onPress={() =>
                      confirmDelete(
                        `Delete "${category.title}" and all its protections and FAQs?`,
                        () => run(() => deleteRightsCategory(category.id)),
                      )
                    }
                    variant="ghost"
                  />
                </View>
              </Card>

              {expandedId === category.id ? (
                <View style={styles.panel}>
                  {renderCategoryForm(category)}
                  {renderProtections(category)}
                  {renderFaqs(category)}
                </View>
              ) : null}
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
  rowActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  panel: { gap: Spacing.md },
  subSection: { gap: Spacing.sm },
  subRow: { gap: Spacing.xs },
  subActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  form: { gap: Spacing.md },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  error: { borderWidth: 1 },
  centre: { paddingVertical: Spacing.xxxl },
});
