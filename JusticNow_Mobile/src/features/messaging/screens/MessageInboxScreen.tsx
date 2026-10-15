import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyCases } from '@/api/caseApi';
import { getOfficerCases } from '@/api/officerApi';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';

interface ApprovedCaseConversation {
  id: string;
  reference: string;
  category: string;
  status: string;
  updatedAt: string;
  officerName: string;
}

export function MessageInboxScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [cases, setCases] = useState<ApprovedCaseConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setIsLoading(true);
      setError(null);

      const loadConversations = async () => {
      try {
        if (session?.user.role === 'OFFICER') {
          const result = await getOfficerCases({ assignedToMe: true, limit: 100 });
          if (mounted) {
            setCases(result.cases.filter((item) => item.approvedAt).map((item) => ({
              id: String(item.id),
              reference: item.trackingCode?.code || `CASE-${item.id}`,
              category: item.category.replace(/_/g, ' '),
              status: item.status.replace(/_/g, ' '),
              updatedAt: item.updatedAt,
              officerName: item.reporter?.name || 'Citizen',
            })));
          }
        } else if (session?.user.role === 'CITIZEN') {
          const result = await getMyCases();
          if (mounted) {
            setCases(result.filter((item) => item.approved).map((item) => ({
              id: item.id,
              reference: item.reference,
              category: item.category,
              status: item.status.replace(/-/g, ' '),
              updatedAt: item.lastUpdated,
              officerName: item.officer?.name || 'Assigned officer',
            })));
          }
        }
      } catch {
        if (mounted) setError('Unable to load approved case conversations. Please try again.');
      } finally {
        if (mounted) setIsLoading(false);
      }
      };

      loadConversations();
      return () => { mounted = false; };
    }, [session])
  );

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SECURE MESSAGES</Text>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.lock}>
          <Ionicons color="#28725b" name="lock-closed" size={17} />
        </View>
      </View>
      <Text style={styles.subtitle}>Private conversations are available for approved cases.</Text>
      <Text style={styles.sectionTitle}>Approved cases</Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#28725b" />
          <Text style={styles.stateText}>Loading approved cases...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={cases.length ? styles.list : styles.emptyList}
          data={cases}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons color="#87939b" name="chatbubbles-outline" size={38} />
              <Text style={styles.emptyTitle}>No approved cases</Text>
              <Text style={styles.stateText}>A private conversation will appear here after an officer approves a case.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open messages for case ${item.reference}`}
              onPress={() => router.push(`/cases/${item.id}/messages` as any)}
              style={({ pressed }) => [styles.caseRow, pressed && styles.pressed]}
            >
              <View style={styles.caseIcon}>
                <Ionicons color="#28725b" name="chatbubble-ellipses-outline" size={20} />
              </View>
              <View style={styles.caseCopy}>
                <View style={styles.caseHeading}>
                  <Text numberOfLines={1} style={styles.caseReference}>{item.reference}</Text>
                  <Text style={styles.caseDate}>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(item.updatedAt))}</Text>
                </View>
                <Text numberOfLines={1} style={styles.caseCategory}>{item.category}</Text>
                <Text numberOfLines={1} style={styles.caseParticipant}>{item.officerName} · {item.status}</Text>
              </View>
              <Ionicons color="#a2adb1" name="chevron-forward" size={18} />
            </Pressable>
          )}
        />
      )}
      <BottomNavBar activeTab={NavTab.Messages} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f5f8f7', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 },
  eyebrow: { color: '#28725b', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#18303b', fontSize: 27, fontWeight: '800', marginTop: 5 },
  lock: { alignItems: 'center', backgroundColor: '#e2f2ed', borderRadius: 20, height: 38, justifyContent: 'center', width: 38 },
  subtitle: { color: '#718088', fontSize: 13, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  sectionTitle: { color: '#213943', fontSize: 16, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 10 },
  list: { gap: 10, paddingBottom: 105, paddingHorizontal: 20, paddingTop: 6 },
  emptyList: { flexGrow: 1, justifyContent: 'center', paddingBottom: 105, paddingHorizontal: 20 },
  caseRow: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, flexDirection: 'row', gap: 12, minHeight: 82, paddingHorizontal: 14, paddingVertical: 12 },
  pressed: { opacity: 0.75 },
  caseIcon: { alignItems: 'center', backgroundColor: '#e2f2ed', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  caseCopy: { flex: 1, minWidth: 0 },
  caseHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  caseReference: { color: '#213943', flex: 1, fontSize: 14, fontWeight: '800' },
  caseDate: { color: '#87939b', fontSize: 11 },
  caseCategory: { color: '#52646d', fontSize: 12, fontWeight: '600', marginTop: 4 },
  caseParticipant: { color: '#28725b', fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  centerState: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 24 },
  stateText: { color: '#718088', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { color: '#213943', fontSize: 16, fontWeight: '800', marginTop: 4 },
  errorText: { color: '#a33b3b', fontSize: 14, textAlign: 'center' },
});