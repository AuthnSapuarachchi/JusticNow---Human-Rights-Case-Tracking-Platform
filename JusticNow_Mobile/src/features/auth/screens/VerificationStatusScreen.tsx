import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useAuth } from '@/context/AuthContext';

export function VerificationStatusScreen() {
  const colors = useColors();
  const router = useRouter();
  const { logout, session } = useAuth();
  const goToLogin = async () => {
    await logout();
    router.replace('/login');
  };
  return <View style={[styles.container, { backgroundColor: colors.canvas }]}><View style={[styles.icon, { backgroundColor: colors.warningSoft }]}><Ionicons color={colors.warning} name="time-outline" size={34} /></View><Text style={styles.title} variant="heading">Verification status</Text><Text color="textSecondary" style={styles.copy} variant="body">Your account is currently marked as PENDING_VERIFICATION. An administrator must review your identity and professional documents before protected functionality is enabled.</Text><Card style={styles.card}><Text color="textSecondary" variant="caption">ACCOUNT</Text><Text variant="bodyStrong">{session?.user.email || 'Your submitted account'}</Text><View style={[styles.status, { backgroundColor: colors.warningSoft }]}><Ionicons color={colors.warning} name="time-outline" size={17} /><Text color="warning" variant="bodyStrong">Pending administrator review</Text></View></Card><Button fullWidth label="Back to Login" onPress={goToLogin} variant="secondary" /></View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Layout.screenPadding }, icon: { alignItems: 'center', borderRadius: 40, height: 72, justifyContent: 'center', marginBottom: Spacing.xxl, width: 72 }, title: { textAlign: 'center' }, copy: { marginBottom: Spacing.xxl, marginTop: Spacing.md, maxWidth: 440, textAlign: 'center' }, card: { alignSelf: 'stretch', gap: Spacing.md, marginBottom: Spacing.lg }, status: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md } });