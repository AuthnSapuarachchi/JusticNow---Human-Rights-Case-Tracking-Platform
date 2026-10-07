import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { CaseActionItem, CaseActionType, createCaseAction, ManualCaseActionType } from '@/api/officerApi';
import { Badge, Button, Card, FilterChip, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDateTime } from '@/features/cases/statusUtils';

interface ActionHistoryFeedProps {
  caseId: number;
  initialActions: CaseActionItem[];
  onActionCreated?: (newAction: CaseActionItem) => void;
  /** When false the feed is read-only (e.g. case not assigned to this officer) */
  canRecord?: boolean;
}

const MANUAL_ACTION_OPTIONS: { value: ManualCaseActionType; label: string }[] = [
  { value: 'CONTACTED_USER', label: 'Contacted user' },
  { value: 'CONTACTED_AUTHORITY', label: 'Contacted authority' },
  { value: 'FIELD_VISIT', label: 'Field visit' },
  { value: 'EVIDENCE_REVIEWED', label: 'Evidence reviewed' },
  { value: 'MEETING_HELD', label: 'Meeting held' },
  { value: 'OTHER_ACTION', label: 'Other' },
];

const CLOSE_OUTCOME_LABELS: Record<string, string> = {
  RESOLVED_FOR_USER: 'Resolved for user',
  REFERRED_EXTERNALLY: 'Referred externally',
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  WITHDRAWN: 'Withdrawn by user',
  OTHER: 'Other',
};

export function ActionHistoryFeed({
  caseId,
  initialActions,
  onActionCreated,
  canRecord = true,
}: ActionHistoryFeedProps) {
  const colors = useColors();
  const [actions, setActions] = useState<CaseActionItem[]>(initialActions || []);
  const [manualDetail, setManualDetail] = useState('');
  const [manualType, setManualType] = useState<ManualCaseActionType>('CONTACTED_USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Keep the feed in sync when the parent refetches the case
  useEffect(() => {
    setActions(initialActions || []);
  }, [initialActions]);

  const getActionMeta = (type: CaseActionType) => {
    switch (type) {
      case 'ASSIGNED':
        return { icon: 'person-add' as const, color: '#2875d0', bg: '#e7f0fc', label: 'Assigned' };
      case 'STATUS_CHANGED':
        return { icon: 'sync' as const, color: '#5b3fc7', bg: '#efeafd', label: 'Status Changed' };
      case 'NOTE_ADDED':
        return { icon: 'document-text' as const, color: '#28725b', bg: '#e2f2ed', label: 'Note Added' };
      case 'INFO_REQUESTED':
        return { icon: 'help-circle' as const, color: '#b96925', bg: '#fff0df', label: 'Info Requested' };
      case 'REFERRED':
        return { icon: 'business' as const, color: '#3178c6', bg: '#e8f0fe', label: 'Referred' };
      case 'CLOSED':
        return { icon: 'lock-closed' as const, color: '#718088', bg: '#edf1f2', label: 'Closed' };
      case 'ESCALATED':
        return { icon: 'alert-circle' as const, color: '#d04f28', bg: '#fcebe7', label: 'Escalated' };
      case 'CONTACTED_USER':
        return { icon: 'call' as const, color: '#28725b', bg: '#e2f2ed', label: 'Contacted User' };
      case 'CONTACTED_AUTHORITY':
        return { icon: 'shield' as const, color: '#2875d0', bg: '#e7f0fc', label: 'Contacted Authority' };
      case 'FIELD_VISIT':
        return { icon: 'location' as const, color: '#5b3fc7', bg: '#efeafd', label: 'Field Visit' };
      case 'EVIDENCE_REVIEWED':
        return { icon: 'images' as const, color: '#3178c6', bg: '#e8f0fe', label: 'Evidence Reviewed' };
      case 'MEETING_HELD':
        return { icon: 'people' as const, color: '#b96925', bg: '#fff0df', label: 'Meeting Held' };
      case 'OTHER_ACTION':
        return { icon: 'checkmark-done' as const, color: '#718088', bg: '#edf1f2', label: 'Action Taken' };
      default:
        return { icon: 'time' as const, color: '#718088', bg: '#edf1f2', label: type };
    }
  };

  const handleCreateManualAction = async () => {
    if (manualDetail.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter action details (at least 3 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      const newAction = await createCaseAction(caseId, {
        actionType: manualType,
        detail: manualDetail.trim(),
      });
      setActions((prev) => [newAction, ...prev]);
      setManualDetail('');
      setShowManualInput(false);
      onActionCreated?.(newAction);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to log action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDetail = (rawDetail: string | null) => {
    if (!rawDetail) return '';
    try {
      const parsed = JSON.parse(rawDetail);
      if (parsed.from && parsed.to) {
        return `Status changed from ${parsed.from} to ${parsed.to}${parsed.note ? ` — "${parsed.note}"` : ''}`;
      }
      if (parsed.assignedOfficerName) {
        return `Assigned to ${parsed.assignedOfficerName}`;
      }
      if (parsed.outcome && parsed.reason) {
        return `Outcome: ${CLOSE_OUTCOME_LABELS[parsed.outcome] || parsed.outcome} — ${parsed.reason}`;
      }
      return rawDetail;
    } catch {
      return rawDetail;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text color="textSecondary" variant="caption">
          CASE TIMELINE ({actions.length})
        </Text>
        {canRecord && (
          <Button
            label={showManualInput ? 'Cancel' : '+ Record Action'}
            onPress={() => setShowManualInput(!showManualInput)}
            variant="ghost"
          />
        )}
      </View>

      {canRecord && showManualInput && (
        <Card bordered style={styles.manualCard}>
          <Text style={{ fontWeight: '700' }} variant="caption">RECORD ACTION TAKEN</Text>
          <View style={styles.chipRow}>
            {MANUAL_ACTION_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                onPress={() => setManualType(option.value)}
                selected={manualType === option.value}
              />
            ))}
          </View>
          <TextInput
            multiline
            numberOfLines={2}
            onChangeText={setManualDetail}
            placeholder="Record phone call, meeting with legal aid, or field investigation step..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={manualDetail}
          />
          <Button
            disabled={!manualDetail.trim()}
            fullWidth
            label={isSubmitting ? 'Logging...' : 'Save to Audit Log'}
            loading={isSubmitting}
            onPress={handleCreateManualAction}
            variant="primary"
          />
        </Card>
      )}

      {actions.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons color={colors.textTertiary} name="time-outline" size={28} />
          <Text color="textSecondary" style={styles.emptyText} variant="body">
            No actions recorded for this case yet.
          </Text>
        </Card>
      ) : (
        <View style={styles.feed}>
          {actions.map((item, index) => {
            const meta = getActionMeta(item.actionType);
            const isLast = index === actions.length - 1;

            return (
              <View key={item.id || index} style={styles.feedRow}>
                {/* Timeline rail */}
                <View style={styles.rail}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                    <Ionicons color={meta.color} name={meta.icon} size={15} />
                  </View>
                  {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
                </View>

                {/* Content */}
                <Card bordered style={styles.actionCard}>
                  <View style={styles.actionHeader}>
                    <View style={styles.tagWrap}>
                      <Badge label={meta.label} tone="neutral" />
                    </View>
                    <Text color="textTertiary" variant="caption">
                      {formatCaseDateTime(item.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.actionDetail} variant="body">
                    {formatDetail(item.detail)}
                  </Text>

                  <Text color="textSecondary" variant="caption">
                    By {item.actor?.name || item.actor?.email}
                  </Text>
                </Card>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  feed: {
    gap: Spacing.xs,
  },
  feedRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  rail: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagWrap: {
    flexDirection: 'row',
  },
  actionDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});
