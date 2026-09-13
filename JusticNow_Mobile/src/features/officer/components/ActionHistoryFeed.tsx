import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { CaseActionItem, CaseActionType, createCaseAction } from '@/api/officerApi';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDateTime } from '@/features/cases/statusUtils';

interface ActionHistoryFeedProps {
  caseId: number;
  initialActions: CaseActionItem[];
  onActionCreated?: (newAction: CaseActionItem) => void;
}

export function ActionHistoryFeed({ caseId, initialActions, onActionCreated }: ActionHistoryFeedProps) {
  const colors = useColors();
  const [actions, setActions] = useState<CaseActionItem[]>(initialActions || []);
  const [manualDetail, setManualDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

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
      default:
        return { icon: 'time' as const, color: '#718088', bg: '#edf1f2', label: type };
    }
  };

  const handleCreateManualAction = async () => {
    if (!manualDetail.trim()) {
      Alert.alert('Validation Error', 'Please enter action details.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newAction = await createCaseAction(caseId, {
        actionType: 'NOTE_ADDED',
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
      return rawDetail;
    } catch {
      return rawDetail;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text color="textSecondary" variant="caption">
          CASE AUDIT TRAIL ({actions.length})
        </Text>
        <Button
          label={showManualInput ? 'Cancel' : '+ Log Action'}
          onPress={() => setShowManualInput(!showManualInput)}
          variant="ghost"
        />
      </View>

      {showManualInput && (
        <Card bordered style={styles.manualCard}>
          <Text style={{ fontWeight: '700' }} variant="caption">LOG MANUAL CASE ACTION</Text>
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
