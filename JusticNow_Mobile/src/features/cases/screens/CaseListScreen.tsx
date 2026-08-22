import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaseSummary, getMyCases } from '@/api/caseApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { formatCaseDate, getStatusConfig } from '@/features/cases/statusUtils';

export function CaseListScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try { setCases(await getMyCases()); } catch { setError('Unable to load your cases. Please try again.'); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const handleTabPress = (tab: string) => { if (tab === NavTab.Home) router.replace('/'); if (tab === NavTab.Messages) router.push('/messages'); };

  return <SafeAreaView edges={['top']} style={styles.safeArea}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>JUSTICENOW</Text><Text style={styles.title}>Your cases</Text></View><View style={styles.countBadge}><Text style={styles.countText}>{cases.length}</Text></View></View>
    {loading && !refreshing ? <View style={styles.centerState}><ActivityIndicator color="#2875d0" /><Text style={styles.stateText}>Loading cases...</Text></View> : error && cases.length === 0 ? <View style={styles.centerState}><Ionicons color="#b96925" name="cloud-offline-outline" size={32} /><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => loadCases()}><Text style={styles.retryText}>Try again</Text></Pressable></View> : <FlatList
      contentContainerStyle={cases.length ? styles.list : styles.emptyList}
      data={cases}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl colors={['#2875d0']} onRefresh={() => loadCases(true)} refreshing={refreshing} tintColor="#2875d0" />}
      ListEmptyComponent={<View style={styles.centerState}><Ionicons color="#87939b" name="folder-open-outline" size={38} /><Text style={styles.emptyTitle}>No cases yet</Text><Text style={styles.stateText}>Your submitted cases will appear here.</Text></View>}
      renderItem={({ item }) => { const status = getStatusConfig(item.status); return <Pressable onPress={() => router.push(`/cases/${item.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.cardTop}><View style={styles.folderIcon}><Ionicons color="#2875d0" name="folder-open" size={21} /></View><View style={styles.cardCopy}><Text style={styles.reference}>{item.reference}</Text><Text style={styles.category}>{item.category}</Text></View><View style={[styles.statusBadge, { backgroundColor: status.background }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></View><View style={styles.cardBottom}><Text style={styles.updated}>Last updated {formatCaseDate(item.lastUpdated)}</Text><Ionicons color="#9aa6ab" name="chevron-forward" size={18} /></View></Pressable>; }}
    />}
    <BottomNavBar activeTab={NavTab.Cases} onTabPress={handleTabPress} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { backgroundColor: '#f5f8f7', flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 }, eyebrow: { color: '#28725b', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, title: { color: '#18303b', fontSize: 27, fontWeight: '800', marginTop: 5 }, countBadge: { alignItems: 'center', backgroundColor: '#e7f0fc', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 }, countText: { color: '#2875d0', fontSize: 14, fontWeight: '800' }, list: { paddingHorizontal: 20, paddingBottom: 105, gap: 12 }, emptyList: { flex: 1 }, card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 }, pressed: { opacity: 0.75 }, cardTop: { alignItems: 'center', flexDirection: 'row' }, folderIcon: { alignItems: 'center', backgroundColor: '#e8f1fb', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 }, cardCopy: { flex: 1, marginLeft: 12 }, reference: { color: '#718088', fontSize: 11, fontWeight: '700' }, category: { color: '#213943', fontSize: 14, fontWeight: '700', marginTop: 4 }, statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { fontSize: 11, fontWeight: '700' }, cardBottom: { alignItems: 'center', borderTopColor: '#edf1f0', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12 }, updated: { color: '#87939b', fontSize: 11 }, centerState: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 24 }, stateText: { color: '#87939b', fontSize: 14, textAlign: 'center' }, errorText: { color: '#a33b3b', fontSize: 14, textAlign: 'center' }, retryText: { color: '#2875d0', fontSize: 14, fontWeight: '700', marginTop: 4 }, emptyTitle: { color: '#213943', fontSize: 18, fontWeight: '800' } });