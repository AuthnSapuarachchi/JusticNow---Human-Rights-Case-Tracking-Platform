import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
  approveCase,
  assignCase,
  getOfficerCase,
  OfficerCaseDetail,
} from '@/api/officerApi';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, HorizontalScroller, Text } from '@/design-system/components';
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

/** Order of the section tabs, used to keep the active tab scrolled into view. */
const TAB_ORDER = ['evidence', 'notes', 'info', 'referrals', 'actions'] as const;

interface CaseReviewScreenProps {
  caseId?: string;
}

export function CaseReviewScreen({ caseId: propCaseId }: CaseReviewScreenProps) {
  const colors = useColors();
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string; caseId?: string }>();
  const activeCaseId = propCaseId || params.id || params.caseId;
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/officer/queue' as any);
  };

  const [caseDetail, setCaseDetail] = useState<OfficerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [approving, setApproving] = useState(false);

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

  const silentRefresh = useCallback(() => {
    if (!activeCaseId) return;
    getOfficerCase(activeCaseId)
      .then(setCaseDetail)
      .catch(() => {});
  }, [activeCaseId]);

  // Mutation responses only carry the core case fields, so merge them in and
  // refetch to pull the updated timeline/history
  const applyCaseUpdate = (updatedCase: Partial<OfficerCaseDetail>) => {
    setCaseDetail((prev) => (prev ? { ...prev, ...updatedCase } : prev));
    silentRefresh();
  };

  // Silently refetch when returning from the Update Status screen
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) silentRefresh();
      hasFocusedOnce.current = true;
    }, [silentRefresh])
  );

  const handleAssignToMe = async () => {
    if (!caseDetail) return;
    try {
      setAssigning(true);
      const res = await assignCase(caseDetail.id);
      Alert.alert('Case Assigned', res.message || 'Case assigned to you successfully.');
      applyCaseUpdate(res.case);
    } catch (err: any) {
      Alert.alert('Assignment Failed', err?.message || 'Unable to assign case.');
    } finally {
      setAssigning(false);
    }
  };

  const handleApprove = async () => {
    if (!caseDetail) return;
    try {
      setApproving(true);
      const result = await approveCase(caseDetail.id);
      setCaseDetail((current) => current ? {
        ...current,
        ...result.case,
        statusHistory: [result.statusHistory, ...current.statusHistory],
        actions: [result.action, ...current.actions],
      } : current);
      Alert.alert('Case Approved', result.message);
    } catch (err: any) {
      Alert.alert('Approval Failed', err?.message || 'Unable to approve this case.');
    } finally {
      setApproving(false);
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
  const isClosed = caseDetail.status === 'CLOSED';
  // Mirrors the backend rule: officers may only modify cases assigned to them
  const canModify =
    session?.user.role === 'ADMIN' ||
    (caseDetail.officerId !== null && Number(caseDetail.officerId) === Number(session?.user.id));
  const canAct = canModify && !isClosed;
  const isAssignedOfficer =
    session?.user.role === 'OFFICER' &&
    caseDetail.officerId !== null &&
    Number(caseDetail.officerId) === Number(session.user.id);

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to Queue"
          hitSlop={8}
          onPress={handleBack}
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

            {isAssignedOfficer && !caseDetail.approvedAt ? (
              <Button
                icon="checkmark-circle-outline"
                label={approving ? 'Approving...' : 'Approve Case'}
                loading={approving}
                onPress={handleApprove}
                variant="primary"
              />
            ) : null}

            {isAssignedOfficer && caseDetail.approvedAt ? (
              <Button
                icon="chatbubble-ellipses-outline"
                label="Message Citizen"
                onPress={() => router.push(`/cases/${caseDetail.id}/messages` as any)}
                variant="secondary"
              />
            ) : null}

            {canModify && (
              <Button
                icon="sync-outline"
                label="Update Status"
                onPress={() => router.push(`/officer/${caseDetail.id}/status` as any)}
                variant="primary"
              />
            )}
          </View>

          {!canModify && (
            <View style={[styles.readOnlyNotice, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons color={colors.textSecondary} name="information-circle-outline" size={18} />
              <Text color="textSecondary" style={styles.readOnlyText} variant="caption">
                {caseDetail.officer
                  ? 'This case is assigned to another officer. You can view it but not modify it.'
                  : 'Assign this case to yourself to update status, add notes, request info, refer, or close it.'}
              </Text>
            </View>
          )}

          {isClosed && (
            <View style={[styles.readOnlyNotice, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons color={colors.textSecondary} name="lock-closed-outline" size={18} />
              <Text color="textSecondary" style={styles.readOnlyText} variant="caption">
                This case is closed. You can still add internal notes or reopen it via Update Status.
              </Text>
            </View>
          )}
        </Card>

        {/* Section Tabs Header */}
        <View style={styles.tabsBar}>
          <HorizontalScroller
            accessibilityLabel="Case sections"
            activeIndex={TAB_ORDER.indexOf(activeTab)}
            backgroundColor="#FFFFFF"
            gap={0}
            inset={Spacing.sm}
          >
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
                TIMELINE ({caseDetail.actions?.length || 0})
              </Text>
            </Pressable>
          </HorizontalScroller>
        </View>

        {/* Tab Content Display */}
        <View style={styles.tabContentArea}>
          {activeTab === 'evidence' && (
            <EvidenceViewer evidence={caseDetail.evidence || []} />
          )}

          {activeTab === 'notes' && (
            <CaseNotesPanel
              canAdd={canModify}
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
                {canAct && (
                  <Button
                    icon="help-circle-outline"
                    label="Request Info"
                    onPress={() => setShowInfoModal(true)}
                    variant="secondary"
                  />
                )}
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
                {canAct && (
                  <Button
                    icon="business-outline"
                    label="New Referral"
                    onPress={() => setShowReferralModal(true)}
                    variant="secondary"
                  />
                )}
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
              canRecord={canModify}
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
        {canAct && (
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
        )}
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
          silentRefresh();
        }}
        visible={showInfoModal}
      />

      <ReferralModal
        caseId={caseDetail.id}
        onClose={() => setShowReferralModal(false)}
        onSuccess={(newReferral, reassigned) => {
          if (reassigned && session?.user.role !== 'ADMIN') {
            // Case was handed to another officer, so this officer can no longer act on it
            router.replace('/officer' as any);
            return;
          }
          setCaseDetail((prev) =>
            prev ? { ...prev, referrals: [newReferral, ...(prev.referrals || [])] } : null
          );
          silentRefresh();
        }}
        visible={showReferralModal}
      />

      <CloseCaseModal
        caseId={caseDetail.id}
        onClose={() => setShowCloseModal(false)}
        onSuccess={applyCaseUpdate}
        visible={showCloseModal}
      />

      <EscalateConfirmModal
        caseId={caseDetail.id}
        onClose={() => setShowEscalateModal(false)}
        onSuccess={applyCaseUpdate}
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
    minWidth: Layout.minTapTarget,
    padding: Spacing.xs,
  },
  topBarTitle: {
    alignItems: 'center',
  },
  topRefText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: Layout.bottomNavInset,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  pressed: {
    opacity: 0.75,
  },
  urgentBanner: {
    borderLeftWidth: 4,
    borderLeftColor: '#B3261E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  urgentBannerText: {
    flex: 1,
    gap: 2,
  },
  overviewCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
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
    borderRadius: Radius.pill,
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
    borderRadius: Radius.pill,
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
    borderTopColor: '#E3E7EC',
    paddingTop: Spacing.lg,
  },
  metaCell: {
    width: '46%',
    gap: 2,
  },
  quickOpsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E7EC',
    paddingTop: Spacing.lg,
    justifyContent: 'flex-start',
  },
  tabsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    elevation: 1,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  tabItem: {
    minHeight: Layout.minTapTarget,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
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
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  readOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  readOnlyText: {
    flex: 1,
  },
});
