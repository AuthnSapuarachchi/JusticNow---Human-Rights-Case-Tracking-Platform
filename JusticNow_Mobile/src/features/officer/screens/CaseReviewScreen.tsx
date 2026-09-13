import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  assignCase,
  getOfficerCase,
  OfficerCaseDetail,
} from '@/api/officerApi';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import {
  formatCaseDate,
  formatCaseDateTime,
  getOfficerStatusConfig,
} from '@/features/cases/statusUtils';
import {
  ActionHistoryFeed,
  CaseNotesPanel,
  CloseCaseModal,
  EscalateConfirmModal,
  EvidenceViewer,
  ReferralModal,
  RequestInfoModal,
} from '../components';

interface CaseReviewScreenProps {
  caseId?: string;
}

export function CaseReviewScreen({ caseId: propCaseId }: CaseReviewScreenProps) {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; caseId?: string }>();
  const activeCaseId = propCaseId || params.id || params.caseId;

  const [caseDetail, setCaseDetail] = useState<OfficerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'evidence' | 'notes' | 'info' | 'referrals' | 'actions'>(
    'evidence'
  );

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const fetchCaseDetail = useCallback(
    async (isRefresh = false) => {
      if (!activeCaseId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await getOfficerCase(activeCaseId);
        setCaseDetail(data);
      } catch (err: any) {
        setError(err?.message || 'Unable to load case details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCaseId]
  );

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  const handleAssignToMe = async () => {
    if (!caseDetail) return;
    try {
      setAssigning(true);
      const res = await assignCase(caseDetail.id);
      Alert.alert('Case Assigned', res.message || 'Case assigned to you successfully.');
      setCaseDetail(res.case);
    } catch (err: any) {
      Alert.alert('Assignment Failed', err?.message || 'Unable to assign case.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text color="textSecondary" variant="body">
          Loading case review...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !caseDetail) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.canvas }]}>
        <Ionicons color={colors.danger} name="alert-circle-outline" size={38} />
        <Text color="danger" style={styles.centerError} variant="body">
          {error || 'Case not found.'}
        </Text>
        <Button label="Back to Queue" onPress={() => router.replace('/officer/queue' as any)} variant="secondary" />
      </SafeAreaView>
    );
  }

  const statusConfig = getOfficerStatusConfig(caseDetail.status);
  const isUrgent = caseDetail.priority === 'URGENT';

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to Queue"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
        </Pressable>

        <View style={styles.topBarTitle}>
          <Text style={styles.topRefText} variant="heading">
            {caseDetail.trackingCode?.code || `CASE-${caseDetail.id}`}
          </Text>
          <Text color="textSecondary" variant="caption">
            {caseDetail.category?.replace(/_/g, ' ')}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Refresh Case"
          hitSlop={8}
          onPress={() => fetchCaseDetail(true)}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="refresh" size={20} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => fetchCaseDetail(true)}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent / Escalated Banner */}
        {isUrgent && (
          <View style={[styles.urgentBanner, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons color={colors.danger} name="flame" size={20} />
            <View style={styles.urgentBannerText}>
              <Text color="danger" style={{ fontWeight: '700' }} variant="caption">
                HIGH PRIORITY CASE {caseDetail.escalated ? '• ESCALATED' : ''}
              </Text>
              <Text color="danger" variant="caption">
                Requires expedited officer attention and swift supervisory update.
              </Text>
            </View>
          </View>
        )}

        {/* Case Overview Card */}
        <Card bordered style={styles.overviewCard}>
          <View style={styles.overviewTopRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.background }]}>
                <Ionicons color={statusConfig.color} name={statusConfig.icon} size={14} />
                <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>

              {isUrgent && (
                <View style={[styles.priorityPill, { backgroundColor: colors.dangerSoft }]}>
                  <Text color="danger" style={{ fontWeight: '800' }} variant="caption">
                    URGENT
                  </Text>
                </View>
              )}
            </View>

            <Text color="textTertiary" variant="caption">
              Updated {formatCaseDate(caseDetail.updatedAt)}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descBlock}>
            <Text color="textSecondary" variant="caption">
              INCIDENT REPORT
            </Text>
            <Text style={styles.descriptionText} variant="body">
              {caseDetail.description}
            </Text>
          </View>

          {/* Required Action if any */}
          {caseDetail.actionRequest ? (
            <View style={[styles.actionRequestBox, { backgroundColor: colors.surfaceMuted }]}>
              <Text color="primary" style={{ fontWeight: '700' }} variant="caption">
                CITIZEN ACTION REQUESTED:
              </Text>
              <Text color="textSecondary" style={styles.actionRequestText} variant="body">
                {caseDetail.actionRequest}
              </Text>
            </View>
          ) : null}

          {/* Metadata Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text color="textTertiary" variant="caption">
                INCIDENT DATE
              </Text>
              <Text style={{ fontWeight: '700' }} variant="caption">
                {formatCaseDate(caseDetail.incidentDate || '')}
              </Text>
            </View>

            <View style={styles.metaCell}>
              <Text color="textTertiary" variant="caption">
                LOCATION
              </Text>
              <Text style={{ fontWeight: '700' }} variant="caption">
                {caseDetail.location || 'Not specified'}
              </Text>
            </View>

            <View style={styles.metaCell}>
              <Text color="textTertiary" variant="caption">
                REPORTER
              </Text>
              <Text style={{ fontWeight: '700' }} variant="caption">
                {caseDetail.isAnonymous
                  ? 'Anonymous Citizen'
                  : caseDetail.reporter?.name || caseDetail.reporter?.email || 'Registered User'}
              </Text>
            </View>

            <View style={styles.metaCell}>
              <Text color="textTertiary" variant="caption">
                ASSIGNED OFFICER
              </Text>
              <Text style={{ fontWeight: '700' }} variant="caption">
                {caseDetail.officer ? caseDetail.officer.name || caseDetail.officer.email : 'Unassigned'}
              </Text>
            </View>
          </View>

          {/* Quick Actions Bar */}
          <View style={styles.quickOpsRow}>
            {!caseDetail.officer && (
              <Button
                icon="person-add-outline"
                label={assigning ? 'Assigning...' : 'Assign to Me'}
                loading={assigning}
                onPress={handleAssignToMe}
                variant="secondary"
              />
            )}

            <Button
              icon="sync-outline"
              label="Update Status"
              onPress={() => router.push(`/officer/${caseDetail.id}/status` as any)}
              variant="primary"
            />
          </View>
        </Card>

        {/* Section Tabs Header */}
        <View style={styles.tabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            <Pressable
              onPress={() => setActiveTab('evidence')}
              style={[
                styles.tabItem,
                activeTab === 'evidence' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'evidence' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                }}
                variant="caption"
              >
                EVIDENCE ({caseDetail.evidence?.length || 0})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('notes')}
              style={[
                styles.tabItem,
                activeTab === 'notes' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'notes' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                }}
                variant="caption"
              >
                NOTES ({caseDetail.notes?.length || 0})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('info')}
              style={[
                styles.tabItem,
                activeTab === 'info' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'info' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                }}
                variant="caption"
              >
                INFO REQUESTS ({caseDetail.infoRequests?.length || 0})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('referrals')}
              style={[
                styles.tabItem,
                activeTab === 'referrals' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'referrals' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                }}
                variant="caption"
              >
                REFERRALS ({caseDetail.referrals?.length || 0})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('actions')}
              style={[
                styles.tabItem,
                activeTab === 'actions' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'actions' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                }}
                variant="caption"
              >
                AUDIT LOG ({caseDetail.actions?.length || 0})
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Tab Content Display */}
        <View style={styles.tabContentArea}>
          {activeTab === 'evidence' && (
            <EvidenceViewer evidence={caseDetail.evidence || []} />
          )}

          {activeTab === 'notes' && (
            <CaseNotesPanel
              caseId={caseDetail.id}
              initialNotes={caseDetail.notes || []}
              onNoteAdded={(newNote) => {
                setCaseDetail((prev) => (prev ? { ...prev, notes: [newNote, ...(prev.notes || [])] } : null));
              }}
            />
          )}

          {activeTab === 'info' && (
            <View style={styles.infoTabContainer}>
              <View style={styles.infoTabHeader}>
                <Text color="textSecondary" variant="caption">
                  COMMUNICATIONS & REQUESTS TO CITIZEN
                </Text>
                <Button
                  icon="help-circle-outline"
                  label="Request Info"
                  onPress={() => setShowInfoModal(true)}
                  variant="secondary"
                />
              </View>

              {(!caseDetail.infoRequests || caseDetail.infoRequests.length === 0) ? (
                <Card style={[styles.emptyTabCard, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons color={colors.textTertiary} name="mail-outline" size={32} />
                  <Text color="textSecondary" style={styles.centerText} variant="body">
                    No information requests sent for this case.
                  </Text>
                </Card>
              ) : (
                caseDetail.infoRequests.map((req) => (
                  <Card bordered key={req.id} style={styles.infoReqCard}>
                    <View style={styles.infoReqHeader}>
                      <Badge
                        label={req.status === 'RESOLVED' ? 'Resolved' : 'Pending Citizen Response'}
                        tone={req.status === 'RESOLVED' ? 'success' : 'warning'}
                      />
                      <Text color="textTertiary" variant="caption">
                        {formatCaseDateTime(req.createdAt)}
                      </Text>
                    </View>
                    <Text variant="body">{req.message}</Text>
                    <Text color="textSecondary" variant="caption">
                      Sent by {req.requestedBy?.name || req.requestedBy?.email}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {activeTab === 'referrals' && (
            <View style={styles.referralsContainer}>
              <View style={styles.infoTabHeader}>
                <Text color="textSecondary" variant="caption">
                  LEGAL ORGANIZATIONS & EXTERNAL COUNSEL
                </Text>
                <Button
                  icon="business-outline"
                  label="New Referral"
                  onPress={() => setShowReferralModal(true)}
                  variant="secondary"
                />
              </View>

              {(!caseDetail.referrals || caseDetail.referrals.length === 0) ? (
                <Card style={[styles.emptyTabCard, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons color={colors.textTertiary} name="business-outline" size={32} />
                  <Text color="textSecondary" style={styles.centerText} variant="body">
                    No referrals recorded for this case.
                  </Text>
                </Card>
              ) : (
                caseDetail.referrals.map((ref) => (
                  <Card bordered key={ref.id} style={styles.referralCard}>
                    <View style={styles.refCardHeader}>
                      <View style={styles.refOrgWrap}>
                        <Ionicons color={colors.primary} name="business" size={18} />
                        <Text variant="bodyStrong">
                          {ref.referredToOrganization?.name || ref.referredToText || 'Legal Entity'}
                        </Text>
                      </View>
                      <Text color="textTertiary" variant="caption">
                        {formatCaseDate(ref.createdAt)}
                      </Text>
                    </View>

                    <Text color="textSecondary" style={styles.refReason} variant="body">
                      {ref.reason}
                    </Text>

                    <Text color="textTertiary" variant="caption">
                      Referred by {ref.referredBy?.name || ref.referredBy?.email}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {activeTab === 'actions' && (
            <ActionHistoryFeed
              caseId={caseDetail.id}
              initialActions={caseDetail.actions || []}
              onActionCreated={(newAction) => {
                setCaseDetail((prev) =>
                  prev ? { ...prev, actions: [newAction, ...(prev.actions || [])] } : null
                );
              }}
            />
          )}
        </View>

        {/* Case Administration Footer Operations */}
        <Card bordered style={styles.adminFooterCard}>
          <Text style={{ fontWeight: '700' }} variant="caption">CASE SUPERVISION & REMEDIES</Text>
          <View style={styles.adminButtonsRow}>
            {!isUrgent && (
              <Button
                icon="flame-outline"
                label="Escalate Case"
                onPress={() => setShowEscalateModal(true)}
                variant="secondary"
              />
            )}
            {caseDetail.status !== 'CLOSED' && (
              <Button
                icon="lock-closed-outline"
                label="Close Case"
                onPress={() => setShowCloseModal(true)}
                variant="secondary"
              />
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Modals */}
      <RequestInfoModal
        caseId={caseDetail.id}
        onClose={() => setShowInfoModal(false)}
        onSuccess={(newInfoReq, updatedCase) => {
          setCaseDetail((prev) =>
            prev
              ? {
                  ...prev,
                  status: updatedCase.status,
                  infoRequests: [newInfoReq, ...(prev.infoRequests || [])],
                }
              : null
          );
        }}
        visible={showInfoModal}
      />

      <ReferralModal
        caseId={caseDetail.id}
        onClose={() => setShowReferralModal(false)}
        onSuccess={(newReferral) => {
          setCaseDetail((prev) =>
            prev ? { ...prev, referrals: [newReferral, ...(prev.referrals || [])] } : null
          );
        }}
        visible={showReferralModal}
      />

      <CloseCaseModal
        caseId={caseDetail.id}
        onClose={() => setShowCloseModal(false)}
        onSuccess={(updatedCase) => {
          setCaseDetail(updatedCase);
        }}
        visible={showCloseModal}
      />

      <EscalateConfirmModal
        caseId={caseDetail.id}
        onClose={() => setShowEscalateModal(false)}
        onSuccess={(updatedCase) => {
          setCaseDetail(updatedCase);
        }}
        visible={showEscalateModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  centerError: {
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  topBarTitle: {
    alignItems: 'center',
  },
  topRefText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  urgentBannerText: {
    flex: 1,
    gap: 2,
  },
  overviewCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  descBlock: {
    gap: 4,
  },
  descriptionText: {
    lineHeight: 21,
  },
  actionRequestBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 4,
  },
  actionRequestText: {
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#edf1f0',
    paddingTop: Spacing.md,
  },
  metaCell: {
    width: '46%',
    gap: 2,
  },
  quickOpsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#edf1f0',
    paddingTop: Spacing.md,
    justifyContent: 'flex-end',
  },
  tabsBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d6dfdf',
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tabItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  tabContentArea: {
    paddingVertical: Spacing.xs,
  },
  infoTabContainer: {
    gap: Spacing.md,
  },
  infoTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoReqCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoReqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralsContainer: {
    gap: Spacing.md,
  },
  referralCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  refCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refOrgWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  refReason: {
    marginVertical: 4,
    lineHeight: 20,
  },
  emptyTabCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  adminFooterCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
