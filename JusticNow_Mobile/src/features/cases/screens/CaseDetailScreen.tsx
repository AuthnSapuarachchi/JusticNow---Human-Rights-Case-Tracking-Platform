import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseDetail, StatusUpdate, getCaseDetail, getCaseStatus } from '@/api/caseApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { formatCaseDate, formatCaseDateTime, getStatusConfig } from '@/features/cases/statusUtils';

interface CaseDetailScreenProps { caseId: string; }

export function CaseDetailScreen({ caseId }: CaseDetailScreenProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { let mounted = true; Promise.all([getCaseDetail(caseId), getCaseStatus(caseId)]).then(([caseData, statusData]) => { if (mounted) { setDetail(caseData); setTimeline(statusData); } }).catch(() => { if (mounted) setError('Unable to load this case.'); }).finally(() => { if (mounted) setLoading(false); }); return () => { mounted = false; }; }, [caseId]);

  const handleTabPress = (tab: string) => { if (tab === NavTab.Home) router.replace('/'); if (tab === NavTab.Cases) router.replace('/cases'); if (tab === NavTab.Messages) router.push('/messages'); };

  if (loading) return <SafeAreaView style={styles.safeArea}><View style={styles.centerState}><ActivityIndicator color="#2875d0" /><Text style={styles.stateText}>Loading case details...</Text></View></SafeAreaView>;
  if (error || !detail) return <SafeAreaView style={styles.safeArea}><View style={styles.centerState}><Text style={styles.errorText}>{error ?? 'Case not found.'}</Text><Pressable onPress={() => router.replace('/cases')}><Text style={styles.retryText}>Back to cases</Text></Pressable></View></SafeAreaView>;

  const status = getStatusConfig(detail.status);
  return <SafeAreaView edges={['top']} style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable accessibilityLabel="Back to cases" onPress={() => router.replace('/cases')} style={styles.backButton}><Ionicons color="#18303b" name="arrow-back" size={23} /></Pressable><Text style={styles.headerTitle}>Case details</Text><View style={styles.headerSpacer} /></View>
      {detail.requiredAction ? <View style={styles.actionBanner}><Ionicons color="#b96925" name="alert-circle" size={24} /><View style={styles.actionCopy}><Text style={styles.actionTitle}>Action needed</Text><Text style={styles.actionText}>{detail.requiredAction}</Text></View></View> : null}
      <View style={styles.summary}><View style={styles.summaryTop}><View style={styles.caseIcon}><Ionicons color="#2875d0" name="folder-open" size={22} /></View><View style={styles.summaryCopy}><Text style={styles.reference}>{detail.reference}</Text><Text style={styles.category}>{detail.category}</Text></View></View><View style={styles.statusLine}><View style={[styles.statusBadge, { backgroundColor: status.background }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View><Text style={styles.updated}>Updated {formatCaseDate(detail.lastUpdated)}</Text></View><Text style={styles.description}>{detail.description}</Text></View>
      <Text style={styles.sectionTitle}>Case progress</Text>
      <View style={styles.timeline}>{timeline.map((update, index) => { const updateStatus = getStatusConfig(update.status); const isLast = index === timeline.length - 1; return <View key={update.id} style={styles.timelineRow}><View style={styles.timelineRail}>{<View style={[styles.timelineIcon, update.completed ? { backgroundColor: updateStatus.background } : styles.inactiveIcon]}><Ionicons color={update.completed ? updateStatus.color : '#aeb9bd'} name={updateStatus.icon} size={19} /></View>}{!isLast ? <View style={[styles.line, update.completed && styles.completedLine]} /> : null}</View><View style={styles.timelineCopy}><Text style={[styles.timelineLabel, !update.completed && styles.inactiveLabel]}>{update.label}</Text><Text style={styles.timelineTime}>{formatCaseDateTime(update.timestamp)}</Text></View></View>; })}</View>
    </ScrollView>
    <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: '#f5f8f7', flex: 1 }, content: { paddingBottom: 105, paddingHorizontal: 20 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }, backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 }, headerTitle: { color: '#18303b', fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 40 }, actionBanner: { alignItems: 'flex-start', backgroundColor: '#fff0df', borderRadius: 14, flexDirection: 'row', gap: 10, marginBottom: 16, padding: 14 }, actionCopy: { flex: 1 }, actionTitle: { color: '#8d4e1b', fontSize: 13, fontWeight: '800' }, actionText: { color: '#806549', fontSize: 12, lineHeight: 18, marginTop: 4 }, summary: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 }, summaryTop: { alignItems: 'center', flexDirection: 'row' }, caseIcon: { alignItems: 'center', backgroundColor: '#e8f1fb', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 }, summaryCopy: { flex: 1, marginLeft: 12 }, reference: { color: '#718088', fontSize: 11, fontWeight: '700' }, category: { color: '#213943', fontSize: 15, fontWeight: '700', marginTop: 4 }, statusLine: { alignItems: 'center', borderTopColor: '#edf1f0', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12 }, statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { fontSize: 11, fontWeight: '700' }, updated: { color: '#87939b', fontSize: 11 }, description: { color: '#52646d', fontSize: 13, lineHeight: 19, marginTop: 16 }, sectionTitle: { color: '#18303b', fontSize: 18, fontWeight: '800', marginBottom: 16, marginTop: 28 }, timeline: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18 }, timelineRow: { flexDirection: 'row', minHeight: 70 }, timelineRail: { alignItems: 'center', width: 34 }, timelineIcon: { alignItems: 'center', borderRadius: 18, height: 34, justifyContent: 'center', width: 34 }, inactiveIcon: { backgroundColor: '#f0f3f3' }, line: { backgroundColor: '#e3e9e8', flex: 1, marginVertical: 4, width: 2 }, completedLine: { backgroundColor: '#9dd2bf' }, timelineCopy: { flex: 1, paddingLeft: 12, paddingTop: 3 }, timelineLabel: { color: '#213943', fontSize: 14, fontWeight: '700' }, inactiveLabel: { color: '#87939b' }, timelineTime: { color: '#87939b', fontSize: 11, marginTop: 6 }, centerState: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 24 }, stateText: { color: '#87939b', fontSize: 14 }, errorText: { color: '#a33b3b', fontSize: 14, textAlign: 'center' }, retryText: { color: '#2875d0', fontSize: 14, fontWeight: '700', marginTop: 8 } });