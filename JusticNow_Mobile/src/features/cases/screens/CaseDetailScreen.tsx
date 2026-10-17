import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseDetail, StatusUpdate, getCaseDetail, getCaseStatus } from '@/api/caseApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { Button, Card, StateView, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { StatusPill } from '@/features/cases/components/StatusPill';
import { formatCaseDate, formatCaseDateTime, getStatusConfig } from '@/features/cases/statusUtils';

interface CaseDetailScreenProps { caseId: string; }

export function CaseDetailScreen({ caseId }: CaseDetailScreenProps) {
  const router = useRouter();
  const colors = useColors();
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCaseDetail(caseId), getCaseStatus(caseId)])
      .then(([caseData, statusData]) => {
        if (mounted) {
          setDetail(caseData);
          setTimeline(statusData);
        }
      })
      .catch(() => { if (mounted) setError('We could not load this case. Please try again.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [caseId]);

  const goToCases = () => router.replace('/cases');

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Cases) goToCases();
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  const header = (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable
        accessibilityLabel="Back to cases"
        accessibilityRole="button"
        hitSlop={6}
        onPress={goToCases}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
      </Pressable>
      <Text variant="pageTitle">Case details</Text>
      <View style={styles.iconButton} />
    </View>
  );

  if (loading || error || !detail) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
        {header}
        {loading ? (
          <StateView kind="loading" message="Loading case details…" />
        ) : (
          <StateView actionLabel="Back to cases" kind="error" message={error ?? 'This case could not be found.'} onAction={goToCases} title="Case unavailable" />
        )}
      </SafeAreaView>
    );
  }

  const status = getStatusConfig(detail.status);
  const canMessageOfficer = Boolean(detail.approved && detail.officer);
  const officerName = detail.officer?.name || 'your officer';

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      {header}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {detail.requiredAction ? (
          <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
            <Ionicons color={colors.warning} name="alert-circle" size={24} />
            <View style={styles.flex}>
              <Text style={{ color: colors.warning }} variant="bodyStrong">Action needed</Text>
              <Text color="textPrimary">{detail.requiredAction}</Text>
            </View>
          </View>
        ) : null}

        <Card style={styles.summary}>
          <View style={styles.summaryTop}>
            <View style={styles.flex}>
              <Text color="textSecondary" selectable variant="caption">{detail.reference}</Text>
              <Text variant="title">{detail.category}</Text>
            </View>
          </View>
          <View style={styles.statusLine}>
            <StatusPill background={status.background} color={status.color} icon={status.icon} label={status.label} />
            <Text color="textTertiary" variant="caption">Updated {formatCaseDate(detail.lastUpdated)}</Text>
          </View>
          {detail.description ? (
            <View style={[styles.description, { borderTopColor: colors.border }]}>
              <Text color="textSecondary" variant="caption">What you reported</Text>
              <Text>{detail.description}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.messageAction}>
          {canMessageOfficer ? (
            <Button
              fullWidth
              icon="chatbubble-ellipses-outline"
              iconPosition="leading"
              label={`Message ${officerName}`}
              onPress={() => router.push(`/cases/${caseId}/messages` as any)}
            />
          ) : (
            <View style={[styles.lockedNote, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons color={colors.textSecondary} name="lock-closed-outline" size={20} />
              <Text color="textSecondary" style={styles.flex}>
                {detail.officer
                  ? 'Messaging opens once your officer approves the case.'
                  : 'Messaging opens once an officer is assigned to your case.'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle} variant="heading">Progress</Text>
        <Card>
          {timeline.length === 0 ? (
            <Text color="textSecondary">No updates yet. We will show each step here as your case moves forward.</Text>
          ) : (
            timeline.map((update, index) => {
              const updateStatus = getStatusConfig(update.status);
              const isLast = index === timeline.length - 1;
              return (
                <View key={update.id} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, { backgroundColor: update.completed ? updateStatus.background : colors.surfaceMuted }]}>
                      <Ionicons color={update.completed ? updateStatus.color : colors.textTertiary} name={updateStatus.icon} size={18} />
                    </View>
                    {!isLast ? <View style={[styles.line, { backgroundColor: update.completed ? colors.success : colors.border }]} /> : null}
                  </View>
                  <View style={[styles.timelineCopy, !isLast && styles.timelineGap]}>
                    <Text color={update.completed ? 'textPrimary' : 'textTertiary'} variant="bodyStrong">{update.label}</Text>
                    <Text color="textTertiary" variant="caption">
                      {formatCaseDateTime(update.timestamp)}{update.updatedBy === 'OFFICER' ? ' · Officer update' : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
      <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  iconButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  pressed: { opacity: 0.6 },
  content: { paddingBottom: Layout.bottomNavInset, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.xl },
  banner: { alignItems: 'flex-start', borderRadius: Radius.lg, flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg, padding: Spacing.lg },
  summary: { gap: Spacing.lg },
  summaryTop: { flexDirection: 'row', gap: Spacing.md },
  statusLine: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  description: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.xs, paddingTop: Spacing.lg },
  messageAction: { marginTop: Spacing.lg },
  lockedNote: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  sectionTitle: { marginBottom: Spacing.md, marginTop: Spacing.xxxl },
  timelineRow: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 36 },
  dot: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  line: { flex: 1, marginVertical: Spacing.xs, minHeight: 20, width: 2 },
  timelineCopy: { flex: 1, gap: 2, paddingLeft: Spacing.md, paddingTop: Spacing.xs },
  timelineGap: { paddingBottom: Spacing.xl },
});
