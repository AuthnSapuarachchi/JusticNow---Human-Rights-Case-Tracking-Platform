import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/design-system/components';
import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { useAuth, type UserRole } from '@/context/AuthContext';
import { useColors } from '@/design-system/use-colors';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

const dashboardContent: Record<Exclude<UserRole, 'CITIZEN'>, { title: string; subtitle: string; icon: 'briefcase-outline' | 'settings-outline'; actions: string[] }> = {
  OFFICER: {
    title: 'Officer workspace',
    subtitle: 'Review assigned cases, follow up with citizens, and keep case progress moving.',
    icon: 'briefcase-outline',
    actions: ['Case queue', 'Citizen messages', 'Reports'],
  },
  ADMIN: {
    title: 'Admin console',
    subtitle: 'Manage platform access, organizations, and system activity from one place.',
    icon: 'settings-outline',
    actions: ['User accounts', 'Organizations', 'System activity'],
  },
};

export function RoleDashboard({ role }: { role: Exclude<UserRole, 'CITIZEN'> }) {
  const colors = useColors();
  const router = useRouter();
  const { session, logout } = useAuth();
  const content = dashboardContent[role];
  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };
  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Home) router.replace(role === 'OFFICER' ? '/officer' : '/admin');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons color={colors.primary} name={content.icon} size={28} /></View><Pressable accessibilityLabel="Log out" accessibilityRole="button" hitSlop={8} onPress={handleLogout}><Ionicons color={colors.textSecondary} name="log-out-outline" size={24} /></Pressable></View>
    <Text color="primary" style={styles.eyebrow} variant="eyebrow">{role} PORTAL</Text>
    <Text style={styles.title} variant="display">{content.title}</Text>
    <Text color="textSecondary" style={styles.subtitle}>{content.subtitle}</Text>
    <Card style={styles.welcome}><Text color="textSecondary" variant="caption">SIGNED IN AS</Text><Text style={styles.name} variant="heading">{session?.user.name || session?.user.email}</Text><Text color="textSecondary">{session?.user.email}</Text></Card>
    <Text style={styles.sectionTitle} variant="heading">Quick access</Text>
    {content.actions.map((action, index) => <Pressable key={action} style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => index === 1 && router.push('/messages')}><View style={[styles.actionIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons color={colors.primary} name={index === 0 ? 'folder-open-outline' : index === 1 ? 'chatbubbles-outline' : 'bar-chart-outline'} size={21} /></View><Text style={styles.actionText} variant="bodyStrong">{action}</Text><Ionicons color={colors.textTertiary} name="chevron-forward" size={20} /></Pressable>)}
    <Button fullWidth label="Sign out" onPress={handleLogout} variant="secondary" icon="log-out-outline" />
  </ScrollView><BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} /></SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: Layout.screenPadding, paddingBottom: 120, paddingTop: Spacing.xxxl }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxxl }, icon: { alignItems: 'center', borderRadius: Radius.lg, height: 60, justifyContent: 'center', width: 60 }, eyebrow: { marginBottom: Spacing.sm }, title: { marginBottom: Spacing.sm }, subtitle: { marginBottom: Spacing.xxxl }, welcome: { marginBottom: Spacing.xxxl, padding: Spacing.xl }, name: { marginVertical: Spacing.sm }, sectionTitle: { marginBottom: Spacing.lg }, action: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, minHeight: 70, padding: Spacing.md }, actionIcon: { alignItems: 'center', borderRadius: Radius.sm, height: 42, justifyContent: 'center', width: 42 }, actionText: { flex: 1 }, });
