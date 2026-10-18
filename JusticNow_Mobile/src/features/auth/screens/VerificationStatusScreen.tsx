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
  const isRejected = session?.user.verificationStatus === 'REJECTED';
  const tone = isRejected ? 'danger' : 'warning';
  const icon = isRejected ? 'close-circle-outline' : 'time-outline';
  const copy = isRejected
    ? 'An administrator reviewed your application and could not approve it. Check the reason below, then contact the JusticeNow team or register again with updated documents.'
    : 'Your account is waiting for verification. An administrator must review your identity and professional documents before protected functionality is enabled.';
  return <View style={[styles.container, { backgroundColor: colors.canvas }]}><View style={[styles.icon, { backgroundColor: colors[`${tone}Soft`] }]}><Ionicons color={colors[tone]} name={icon} size={34} /></View><Text style={styles.title} variant="heading">Verification status</Text><Text color="textSecondary" style={styles.copy} variant="body">{copy}</Text><Card style={styles.card}><Text color="textSecondary" variant="caption">ACCOUNT</Text><Text variant="bodyStrong">{session?.user.email || 'Your submitted account'}</Text><View style={[styles.status, { backgroundColor: colors[`${tone}Soft`] }]}><Ionicons color={colors[tone]} name={icon} size={17} /><Text color={tone} variant="bodyStrong">{isRejected ? 'Application rejected' : 'Pending administrator review'}</Text></View>{isRejected && session?.user.rejectionReason ? <View style={styles.reason}><Text color="textSecondary" variant="caption">REASON</Text><Text variant="body">{session.user.rejectionReason}</Text></View> : null}</Card><Button fullWidth label="Sign in again to check status" onPress={goToLogin} variant="secondary" /></View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Layout.screenPadding }, icon: { alignItems: 'center', borderRadius: 40, height: 72, justifyContent: 'center', marginBottom: Spacing.xxl, width: 72 }, title: { textAlign: 'center' }, copy: { marginBottom: Spacing.xxl, marginTop: Spacing.md, maxWidth: 440, textAlign: 'center' }, card: { alignSelf: 'stretch', gap: Spacing.md, marginBottom: Spacing.lg }, status: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md }, reason: { gap: Spacing.xs } });