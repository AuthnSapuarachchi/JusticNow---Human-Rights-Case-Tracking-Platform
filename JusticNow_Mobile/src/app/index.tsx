import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar'; // Keeping your teammate's nav bar

export default function CitizenLandingPage() {
  const router = useRouter();

  // Safety feature: Instantly closes the app (works on Android)
  const handleQuickExit = () => {
    BackHandler.exitApp();
  };

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace('/');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Ionicons name="hammer-outline" size={24} color="#1D4ED8" />
        <Text style={styles.headerTitle}>JusticeNow</Text>
        <Ionicons name="notifications-outline" size={24} color="#64748B" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your Voice, Your Justice.{"\n"}Reported Securely.</Text>
          <Text style={styles.heroSubtitle}>
            We provide a secure, encrypted platform to report human rights violations and connect with legal professionals.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* 🚀 This links to your multi-step form! */}
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/report')}>
            <Ionicons name="document-text-outline" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Start a Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => console.log("Track Case clicked")}>
            <Ionicons name="search-outline" size={20} color="#334155" style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>Track Existing Case</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <Text style={styles.sectionTitle}>Why JusticeNow?</Text>
        
        <View style={styles.featureCard}>
          <View style={styles.iconBox}><Ionicons name="lock-closed-outline" size={22} color="#334155" /></View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>End-to-End Encryption</Text>
            <Text style={styles.featureDesc}>Your data is secured and anonymized. Only you and authorized legal support can access your reports.</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.iconBox}><Ionicons name="language-outline" size={22} color="#334155" /></View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Local Language Support</Text>
            <Text style={styles.featureDesc}>Report incidents and communicate securely in your native language with built-in translation assistance.</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.iconBox}><Ionicons name="shield-checkmark-outline" size={22} color="#334155" /></View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Verified Legal Support</Text>
            <Text style={styles.featureDesc}>Connect directly with vetted human rights organizations and legal professionals ready to assist.</Text>
          </View>
        </View>

        {/* Quick Exit Safety Button */}
        <TouchableOpacity style={styles.quickExitButton} onPress={handleQuickExit}>
          <Ionicons name="exit-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.quickExitText}>Quick Exit</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Reusing your teammate's Bottom Nav */}
      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  heroSection: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  heroSubtitle: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  
  actionContainer: { marginBottom: 30, gap: 12 },
  primaryButton: { backgroundColor: '#1D4ED8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryButtonText: { color: '#334155', fontSize: 16, fontWeight: '600' },
  btnIcon: { marginRight: 8 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 16 },
  
  featureCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  iconBox: { width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  
  quickExitButton: { backgroundColor: '#DC2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 30, width: 160, alignSelf: 'center', marginTop: 30 },
  quickExitText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});