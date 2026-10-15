import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCategoryCode } from '@/api/adminApi';
import { getOfficerCase, OfficerCaseDetail } from '@/api/officerApi';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDate, formatCaseDateTime, getOfficerStatusConfig } from '@/features/cases/statusUtils';
import { AdminHeader, AssignOfficerModal } from '../components';

const actionLabels: Record<string, string> = {
  ASSIGNED: 'Assigned',
  STATUS_CHANGED: 'Status changed',
  NOTE_ADDED: 'Note added',
  INFO_REQUESTED: 'Information requested',
  REFERRED: 'Referred',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated',
};

/** Action details are stored as JSON for some action types; render them readably. */
const describeActionDetail = (detail: string | null) => {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    if (parsed.assignedOfficerName) return `To ${parsed.assignedOfficerName}`;
    if (parsed.from && parsed.to) {
      const from = getOfficerStatusConfig(parsed.from).label;
      const to = getOfficerStatusConfig(parsed.to).label;
      return `${from} → ${to}${parsed.note ? ` · ${parsed.note}` : ''}`;
    }
  } catch {
    // plain-text detail
  }
  return detail;
};

interface AdminCaseDetailScreenProps {
  caseId?: string;
}

export function AdminCaseDetailScreen({ caseId }: AdminCaseDetailScreenProps) {
  const colors = useColors();
  const [caseDetail, setCaseDetail] = useState<OfficerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const fetchCase = useCallback(
    async (isRefresh = false) => {
      if (!caseId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setCaseDetail(await getOfficerCase(caseId));
      } catch (err: any) {
        setError(err?.message || 'Unable to load case.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text color="textSecondary" variant="body">Loading case...</Text>
      </SafeAreaView>
    );
  }

  if (error || !caseDetail) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
        <AdminHeader backTo="/admin/cases" eyebrow="CASE ADMINISTRATION" title="Case" />
        <View style={styles.center}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={38} />
          <Text color="danger" style={styles.centerText} variant="body">{error || 'Case not found.'}</Text>
          <Button label="Retry" onPress={() => fetchCase()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getOfficerStatusConfig(caseDetail.status);
  const reference = caseDetail.trackingCode?.code || `CASE-${caseDetail.id}`;
  const isClosed = caseDetail.status === 'CLOSED';

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AdminHeader backTo="/admin/cases" eyebrow="CASE ADMINISTRATION" title={reference} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl colors={[colors.primary]} onRefresh={() => fetchCase(true)} refreshing={refreshing} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.background }]}>
              <Ionicons color={statusConfig.color} name={statusConfig.icon} size={14} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            {caseDetail.priority === 'URGENT' && <Badge icon="flame" label="Urgent" tone="danger" />}
            {caseDetail.escalated && <Badge label="Escalated" tone="danger" />}
          </View>

          <View style={styles.metaGrid}>
            <MetaCell label="CATEGORY" value={formatCategoryCode(caseDetail.category)} />
            <MetaCell label="SUBMITTED" value={formatCaseDate(caseDetail.createdAt)} />
            <MetaCell label="LAST UPDATED" value={formatCaseDate(caseDetail.updatedAt)} />
            <MetaCell label="LOCATION" value={caseDetail.location || 'Not specified'} />
            <MetaCell label="REPORT TYPE" value={caseDetail.isAnonymous ? 'Anonymous' : 'Registered user'} />
            <MetaCell label="EVIDENCE FILES" value={String(caseDetail.evidence?.length ?? 0)} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text color="textSecondary" style={styles.sectionLabel} variant="caption">ASSIGNED OFFICER</Text>
          <View style={styles.officerRow}>
            <View style={[styles.officerIcon, { backgroundColor: caseDetail.officer ? colors.primarySoft : colors.warningSoft }]}>
              <Ionicons
                color={caseDetail.officer ? colors.primary : colors.warning}
                name={caseDetail.officer ? 'person' : 'person-add-outline'}
                size={20}
              />
            </View>
            <View style={styles.officerText}>
              <Text variant="bodyStrong">
                {caseDetail.officer ? caseDetail.officer.name || caseDetail.officer.email : 'Unassigned'}
              </Text>
              {caseDetail.officer?.email ? (
                <Text color="textSecondary" variant="caption">{caseDetail.officer.email}</Text>
              ) : null}
            </View>
          </View>
          {!isClosed && (
            <Button
              fullWidth
              icon="person-add-outline"
              label={caseDetail.officer ? 'Reassign Officer' : 'Assign Officer'}
              onPress={() => setShowAssign(true)}
              variant={caseDetail.officer ? 'secondary' : 'primary'}
            />
          )}
        </Card>

        <Card style={styles.section}>
          <Text color="textSecondary" style={styles.sectionLabel} variant="caption">STATUS HISTORY</Text>
          {caseDetail.statusHistory.length === 0 ? (
            <Text color="textSecondary" variant="body">No status changes yet.</Text>
          ) : (
            caseDetail.statusHistory.map((entry) => (
              <View key={entry.id} style={[styles.timelineRow, { borderLeftColor: colors.border }]}>
                <Text variant="bodyStrong">
                  {getOfficerStatusConfig(entry.fromStatus).label} → {getOfficerStatusConfig(entry.toStatus).label}
                </Text>
                {entry.note ? <Text color="textSecondary" variant="caption">{entry.note}</Text> : null}
                <Text color="textTertiary" variant="caption">
                  {entry.changedBy?.name || entry.changedBy?.email} · {formatCaseDateTime(entry.createdAt)}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.section}>
          <Text color="textSecondary" style={styles.sectionLabel} variant="caption">AUDIT LOG</Text>
          {caseDetail.actions.length === 0 ? (
            <Text color="textSecondary" variant="body">No actions recorded yet.</Text>
          ) : (
            caseDetail.actions.map((action) => (
              <View key={action.id} style={[styles.timelineRow, { borderLeftColor: colors.border }]}>
                <Text variant="bodyStrong">{actionLabels[action.actionType] || action.actionType}</Text>
                {action.actionType !== 'NOTE_ADDED' && describeActionDetail(action.detail) ? (
                  <Text color="textSecondary" numberOfLines={3} variant="caption">
                    {describeActionDetail(action.detail)}
                  </Text>
                ) : null}
                <Text color="textTertiary" variant="caption">
                  {action.actor?.name || action.actor?.email} · {formatCaseDateTime(action.createdAt)}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <AssignOfficerModal
        caseId={caseDetail.id}
        caseLabel={reference}
        currentOfficerId={caseDetail.officerId}
        onClose={() => setShowAssign(false)}
        onSuccess={() => fetchCase(true)}
        visible={showAssign}
      />
    </SafeAreaView>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text color="textTertiary" variant="caption">{label}</Text>
      <Text style={styles.metaValue} variant="caption">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', flex: 1, gap: Spacing.md, justifyContent: 'center', padding: Spacing.xl },
  centerText: { textAlign: 'center' },
  content: { gap: Spacing.md, paddingBottom: Spacing.xxxl, paddingHorizontal: Layout.screenPadding },
  section: { gap: Spacing.md },
  sectionLabel: { fontWeight: '700' },
  badgeRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  statusBadge: { alignItems: 'center', borderRadius: Radius.sm, flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaCell: { gap: 2, width: '46%' },
  metaValue: { fontWeight: '700' },
  officerRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  officerIcon: { alignItems: 'center', borderRadius: Radius.md, height: 40, justifyContent: 'center', width: 40 },
  officerText: { flex: 1, gap: 2 },
  timelineRow: { borderLeftWidth: 2, gap: 2, paddingLeft: Spacing.md },
});
