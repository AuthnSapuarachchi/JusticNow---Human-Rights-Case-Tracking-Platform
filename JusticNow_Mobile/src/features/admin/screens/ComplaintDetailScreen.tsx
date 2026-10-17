import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AdminComplaintDetail,
  COMPLAINT_STATUS,
  CONDUCT_TEXT_MAX,
  RESOLUTION_NOTE_MIN,
  complaintReasonLabel,
  getComplaint,
  reviewComplaint,
} from '@/api/conductApi';
import { formatCategoryCode } from '@/api/adminApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Badge, Button, Card, StateView, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { AdminHeader, AdminSheet, FormField, useAdminTabPress } from '../components';

type Decision = 'ACTION_TAKEN' | 'DISMISSED';

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const DECISIONS: Record<Decision, { title: string; icon: 'checkmark-circle-outline' | 'close-circle-outline'; description: string; placeholder: string }> = {
  ACTION_TAKEN: {
    title: 'Action taken',
    icon: 'checkmark-circle-outline',
    description: 'Close the report as upheld. The citizen sees your note, so keep it plain and do not name the officer.',
    placeholder: 'For example: We spoke to your officer and they will contact you within 2 working days.',
  },
  DISMISSED: {
    title: 'Close without action',
    icon: 'close-circle-outline',
    description: 'Close the report without action. Tell the citizen why in plain words.',
    placeholder: 'For example: Your officer was waiting for documents from the police and has now updated your case.',
  },
};

/** One citizen report: what happened, the officer's record, and the admin's decision. */
export function ComplaintDetailScreen({ complaintId }: { complaintId: string }) {
  const colors = useColors();
  const router = useRouter();
  const handleTabPress = useAdminTabPress();

  const [complaint, setComplaint] = useState<AdminComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      setComplaint(await getComplaint(complaintId));
    } catch (err: any) {
      setError(err?.message || 'Unable to load this report.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  // Reload on focus so warnings sent from the chat screen appear here on return.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const applyStatus = async (status: 'UNDER_REVIEW' | Decision, resolutionNote?: string) => {
    if (!complaint) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await reviewComplaint(complaint.id, { status, resolutionNote });
      setComplaint((current) => (current ? { ...current, ...updated } : current));
      setDecision(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Unable to update this report.');
    } finally {
      setSaving(false);
    }
  };

  const openDecision = (value: Decision) => {
    setNote('');
    setSaveError(null);
    setDecision(value);
  };

  const header = <AdminHeader backTo="/admin/complaints" eyebrow="OFFICER REPORT" title={`Report #${complaintId}`} />;

  if (loading || !complaint) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
        {header}
        {loading ? (
          <StateView kind="loading" message="Loading report…" />
        ) : (
          <StateView actionLabel="Try again" kind="error" message={error ?? 'This report could not be found.'} onAction={() => { setLoading(true); load(); }} title="Report unavailable" />
        )}
      </SafeAreaView>
    );
  }

  const status = COMPLAINT_STATUS[complaint.status];
  const isClosed = complaint.status === 'ACTION_TAKEN' || complaint.status === 'DISMISSED';
  const officerName = complaint.officer.name || complaint.officer.email;
  const reassigned = complaint.case.currentOfficerId !== complaint.officer.id;
  const trimmedNote = note.trim();

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => load(true)} refreshing={refreshing} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* What the citizen reported */}
        <Card style={styles.section}>
          <View style={styles.rowBetween}>
            <Badge icon={status.icon} label={status.label} tone={complaint.status === 'OPEN' ? 'danger' : status.tone} />
            <Text color="textTertiary" variant="caption">{formatDateTime(complaint.createdAt)}</Text>
          </View>
          <Text variant="heading">{complaintReasonLabel(complaint.reason)}</Text>
          <View style={[styles.quote, { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.borderStrong }]}>
            <Text color="textSecondary" variant="caption">In the citizen’s words</Text>
            <Text selectable>{complaint.details}</Text>
          </View>
          <View style={styles.inline}>
            <Ionicons color={colors.textSecondary} name={complaint.reporter ? 'person-outline' : 'eye-off-outline'} size={18} />
            <Text color="textSecondary" style={styles.flex} variant="caption">
              {complaint.reporter
                ? `Reported by ${complaint.reporter.name || complaint.reporter.email}`
                : 'Reported anonymously. The citizen\'s identity is hidden.'}
            </Text>
          </View>
        </Card>

        {/* The officer and their record */}
        <Text style={styles.sectionTitle} variant="heading">Officer</Text>
        <Card style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{officerName}</Text>
              <Text color="textSecondary" variant="caption">{complaint.officer.email}</Text>
            </View>
            {!complaint.officer.isActive ? <Badge label="Deactivated" tone="neutral" /> : null}
          </View>
          <View style={styles.stats}>
            {[
              { label: 'Reports in total', value: complaint.officerRecord.totalComplaints },
              { label: 'Still open', value: complaint.officerRecord.activeComplaints },
              { label: 'Warnings sent', value: complaint.officerRecord.warningsSent },
            ].map((stat) => (
              <View key={stat.label} style={[styles.stat, { backgroundColor: colors.surfaceMuted }]}>
                <Text variant="title">{stat.value}</Text>
                <Text color="textSecondary" variant="caption">{stat.label}</Text>
              </View>
            ))}
          </View>
          <Text color="textSecondary" variant="caption">
            The officer cannot see this report or who sent it. Anything you send them comes from “JusticeNow Admin”.
          </Text>
          <Button
            fullWidth
            icon="warning-outline"
            iconPosition="leading"
            label="Warn or message officer"
            onPress={() => router.push(`/admin/officer-chat/${complaint.officer.id}?complaintId=${complaint.id}` as any)}
            variant="danger"
          />
          <Button fullWidth icon="people-outline" iconPosition="leading" label="Manage officer account" onPress={() => router.push('/admin/officers' as any)} variant="ghost" />
        </Card>

        {complaint.linkedMessages.length ? (
          <>
            <Text style={styles.sectionTitle} variant="heading">Sent about this report</Text>
            <Card style={styles.section}>
              {complaint.linkedMessages.map((message) => (
                <View key={message.id} style={[styles.linked, { borderColor: message.kind === 'WARNING' ? colors.danger : colors.border }]}>
                  <View style={styles.inline}>
                    {message.kind === 'WARNING' ? <Badge icon="warning" label="Formal warning" tone="danger" /> : <Badge label="Message" tone="neutral" />}
                    <Text color="textTertiary" style={styles.flex} variant="caption">{message.senderName} · {formatDateTime(message.createdAt)}</Text>
                  </View>
                  <Text>{message.content}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {/* The case it is about */}
        <Text style={styles.sectionTitle} variant="heading">Case</Text>
        <Card onPress={() => router.push(`/admin/cases/${complaint.case.id}` as any)} style={styles.section}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{complaint.case.reference}</Text>
              <Text color="textSecondary" variant="caption">
                {formatCategoryCode(complaint.case.category)} · {complaint.case.status.replace(/_/g, ' ').toLowerCase()}
              </Text>
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
          </View>
          {reassigned ? (
            <Text color="textSecondary" variant="caption">This case has since been reassigned to another officer.</Text>
          ) : null}
        </Card>

        {/* Decision */}
        <Text style={styles.sectionTitle} variant="heading">Decision</Text>
        <Card style={styles.section}>
          {isClosed ? (
            <>
              <Text color="textSecondary" variant="caption">
                {complaint.reviewedBy?.name ? `Closed by ${complaint.reviewedBy.name}` : 'Closed'}
                {complaint.reviewedAt ? ` · ${formatDateTime(complaint.reviewedAt)}` : ''}
              </Text>
              {complaint.resolutionNote ? (
                <View style={[styles.quote, { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.success }]}>
                  <Text color="textSecondary" variant="caption">Note shown to the citizen</Text>
                  <Text>{complaint.resolutionNote}</Text>
                </View>
              ) : null}
              <Button fullWidth label="Reopen review" loading={saving} onPress={() => applyStatus('UNDER_REVIEW')} variant="secondary" />
            </>
          ) : (
            <>
              <Text color="textSecondary" variant="caption">
                The citizen is told when you start reviewing and when you close the report.
              </Text>
              {complaint.status === 'OPEN' ? (
                <Button fullWidth icon="search-outline" iconPosition="leading" label="Start review" loading={saving} onPress={() => applyStatus('UNDER_REVIEW')} variant="secondary" />
              ) : null}
              <Button fullWidth icon="checkmark-circle-outline" iconPosition="leading" label="Action taken" onPress={() => openDecision('ACTION_TAKEN')} />
              <Button fullWidth icon="close-circle-outline" iconPosition="leading" label="Close without action" onPress={() => openDecision('DISMISSED')} variant="ghost" />
            </>
          )}
          {saveError && !decision ? <Text color="danger" variant="caption">{saveError}</Text> : null}
        </Card>
      </ScrollView>

      <AdminSheet
        description={decision ? DECISIONS[decision].description : undefined}
        icon={decision ? DECISIONS[decision].icon : 'checkmark-circle-outline'}
        onClose={() => setDecision(null)}
        title={decision ? DECISIONS[decision].title : ''}
        visible={decision !== null}
      >
        <FormField
          label="Note for the citizen"
          maxLength={CONDUCT_TEXT_MAX}
          multiline
          onChangeText={setNote}
          placeholder={decision ? DECISIONS[decision].placeholder : undefined}
          value={note}
        />
        <Text color="textTertiary" variant="caption">
          {trimmedNote.length < RESOLUTION_NOTE_MIN ? `At least ${RESOLUTION_NOTE_MIN} characters.` : `${trimmedNote.length}/${CONDUCT_TEXT_MAX}`}
        </Text>
        {saveError ? <Text color="danger" variant="caption">{saveError}</Text> : null}
        <Button
          disabled={trimmedNote.length < RESOLUTION_NOTE_MIN || saving}
          fullWidth
          label="Close report"
          loading={saving}
          onPress={() => decision && applyStatus(decision, trimmedNote)}
        />
      </AdminSheet>

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.sm },
  section: { gap: Spacing.md },
  sectionTitle: { marginBottom: Spacing.md, marginTop: Spacing.xxl },
  rowBetween: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, justifyContent: 'space-between' },
  inline: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  quote: { borderLeftWidth: 3, borderRadius: Radius.md, gap: Spacing.xs, padding: Spacing.md },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: { alignItems: 'center', borderRadius: Radius.md, flex: 1, gap: 2, padding: Spacing.md },
  linked: { borderLeftWidth: 3, borderRadius: Radius.sm, gap: Spacing.xs, paddingLeft: Spacing.md, paddingVertical: Spacing.xs },
});
