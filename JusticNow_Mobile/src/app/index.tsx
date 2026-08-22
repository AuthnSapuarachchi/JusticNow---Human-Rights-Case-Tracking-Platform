import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNavBar, NavTab } from '@/components/BottomNavBar';

export default function HomeScreen() {
  const router = useRouter();

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Messages) router.push('/messages');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Alex Morgan</Text>
          </View>
          <Pressable accessibilityLabel="Notifications" style={styles.notificationButton}>
            <Ionicons color="#1d3440" name="notifications-outline" size={22} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.welcomePanel}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.eyebrow}>JUSTICENOW</Text>
            <Text style={styles.welcomeTitle}>Your case, clearly in view.</Text>
            <Text style={styles.welcomeText}>Track updates and communicate securely with your case officer.</Text>
          </View>
          <Ionicons color="#b9e4d5" name="shield-checkmark" size={58} />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your active case</Text>
          <Pressable onPress={() => router.push('/messages')}><Text style={styles.viewLink}>View messages</Text></Pressable>
        </View>

        <View style={styles.caseCard}>
          <View style={styles.caseCardTop}>
            <View style={styles.caseIcon}><Ionicons color="#2875d0" name="folder-open" size={22} /></View>
            <View style={styles.caseDetails}>
              <Text style={styles.caseId}>JN-2026-0412</Text>
              <Text style={styles.caseTitle}>Community rights inquiry</Text>
            </View>
            <View style={styles.statusBadge}><Text style={styles.statusText}>In review</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressValue} /></View>
          <View style={styles.caseFooter}><Text style={styles.updatedText}>Updated today</Text><Text style={styles.progressText}>2 of 4 steps complete</Text></View>
        </View>

        <Text style={[styles.sectionTitle, styles.updatesTitle]}>Recent updates</Text>
        <Pressable onPress={() => router.push('/messages')} style={styles.updateRow}>
          <View style={styles.updateIcon}><Ionicons color="#28725b" name="chatbubble-ellipses" size={20} /></View>
          <View style={styles.updateCopy}><Text style={styles.updateTitle}>New message from Maya Perera</Text><Text style={styles.updateSubtitle}>A copy of the incident report would help...</Text></View>
          <Text style={styles.updateTime}>9:20 AM</Text>
        </Pressable>
        <View style={styles.tipRow}>
          <Ionicons color="#d27b3d" name="information-circle-outline" size={22} />
          <Text style={styles.tipText}>Keep your case documents and messages in one secure place.</Text>
        </View>
      </ScrollView>
      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f5f8f7', flex: 1 },
  content: { paddingBottom: 105, paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  greeting: { color: '#718088', fontSize: 14 }, name: { color: '#18303b', fontSize: 25, fontWeight: '800', marginTop: 3 },
  notificationButton: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, notificationDot: { backgroundColor: '#d06c43', borderColor: '#ffffff', borderRadius: 4, borderWidth: 2, height: 10, position: 'absolute', right: 8, top: 8, width: 10 },
  welcomePanel: { alignItems: 'center', backgroundColor: '#1f5d56', borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, padding: 20 }, welcomeCopy: { flex: 1, paddingRight: 12 }, eyebrow: { color: '#b9e4d5', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }, welcomeTitle: { color: '#ffffff', fontSize: 21, fontWeight: '800', lineHeight: 27, marginTop: 8 }, welcomeText: { color: '#d4eee7', fontSize: 13, lineHeight: 19, marginTop: 8 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: '#18303b', fontSize: 18, fontWeight: '800' }, viewLink: { color: '#2875d0', fontSize: 12, fontWeight: '700' }, caseCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 }, caseCardTop: { alignItems: 'center', flexDirection: 'row' }, caseIcon: { alignItems: 'center', backgroundColor: '#e8f1fb', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 }, caseDetails: { flex: 1, marginLeft: 12 }, caseId: { color: '#718088', fontSize: 11, fontWeight: '700' }, caseTitle: { color: '#213943', fontSize: 14, fontWeight: '700', marginTop: 4 }, statusBadge: { backgroundColor: '#e2f2ed', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { color: '#28725b', fontSize: 11, fontWeight: '700' }, progressTrack: { backgroundColor: '#e7eeeb', borderRadius: 3, height: 6, marginTop: 18 }, progressValue: { backgroundColor: '#28725b', borderRadius: 3, height: 6, width: '50%' }, caseFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, updatedText: { color: '#87939b', fontSize: 11 }, progressText: { color: '#52646d', fontSize: 11, fontWeight: '600' }, updatesTitle: { marginBottom: 12, marginTop: 28 }, updateRow: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, flexDirection: 'row', padding: 14 }, updateIcon: { alignItems: 'center', backgroundColor: '#e2f2ed', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, updateCopy: { flex: 1, marginLeft: 11 }, updateTitle: { color: '#213943', fontSize: 13, fontWeight: '700' }, updateSubtitle: { color: '#87939b', fontSize: 11, marginTop: 4 }, updateTime: { color: '#87939b', fontSize: 10, alignSelf: 'flex-start' }, tipRow: { alignItems: 'center', backgroundColor: '#fff8ee', borderRadius: 14, flexDirection: 'row', gap: 10, marginTop: 16, padding: 14 }, tipText: { color: '#806549', flex: 1, fontSize: 12, lineHeight: 18 },
});
