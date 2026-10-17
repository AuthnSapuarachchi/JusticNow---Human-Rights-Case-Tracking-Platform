import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar, NavTab } from '@/components/BottomNavBar';
import { quickExit } from '@/components/quickExit';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo, Button, Card, IconTile, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const shortcuts: { title: string; hint: string; icon: IoniconName; href: Href }[] = [
  { title: 'Know your rights', hint: 'Plain-language guides', icon: 'book-outline', href: '/rights' },
  { title: 'Find legal help', hint: 'Verified organisations', icon: 'people-outline', href: '/legal-support' },
  { title: 'Messages', hint: 'Talk to your officer', icon: 'chatbubbles-outline', href: '/messages' },
];

const assurances: { title: string; text: string; icon: IoniconName }[] = [
  { title: 'Private and encrypted', text: 'Only you and the people helping you can see your report.', icon: 'lock-closed-outline' },
  { title: 'Report anonymously', text: 'You choose whether to share your name.', icon: 'eye-off-outline' },
  { title: 'Verified support', text: 'Every organisation is checked before it is listed.', icon: 'shield-checkmark-outline' },
];

export default function CitizenHomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { session, logout } = useAuth();
  const firstName = session?.user.name?.trim().split(/\s+/)[0];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleTabPress = (tab: string) => {
    if (tab === NavTab.Cases) router.push('/cases');
    if (tab === NavTab.Messages) router.push('/messages');
    if (tab === NavTab.Support) router.push('/legal-support');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.brand}>
          <BrandLogo size={36} />
          <Text variant="heading">JusticeNow</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityHint="Leaves the app immediately"
            accessibilityLabel="Quick exit"
            accessibilityRole="button"
            hitSlop={6}
            onPress={quickExit}
            style={({ pressed }) => [styles.exitPill, { backgroundColor: colors.dangerSoft }, pressed && styles.pressed]}
          >
            <Ionicons color={colors.danger} name="exit-outline" size={18} />
            <Text color="danger" style={styles.exitText} variant="caption">
              Quick exit
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Log out"
            accessibilityRole="button"
            hitSlop={6}
            onPress={handleLogout}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textSecondary} name="log-out-outline" size={24} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text color="textSecondary" variant="bodyStrong">
            {firstName ? `Hello, ${firstName}` : 'Welcome'}
          </Text>
          <Text variant="display">Your voice matters.</Text>
          <Text color="textSecondary">
            Report a human rights concern safely, follow its progress, and get trusted help.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button fullWidth icon="create-outline" iconPosition="leading" label="Report an incident" onPress={() => router.push('/report')} />
          <Button fullWidth icon="folder-open-outline" iconPosition="leading" label="Track my cases" onPress={() => router.push('/cases')} variant="secondary" />
        </View>

        <Text style={styles.sectionTitle} variant="heading">
          Get help
        </Text>
        <View style={styles.shortcuts}>
          {shortcuts.map((item) => (
            <Card accessibilityLabel={item.title} key={item.title} onPress={() => router.push(item.href)} style={styles.shortcut}>
              <IconTile name={item.icon} />
              <View style={styles.shortcutCopy}>
                <Text variant="bodyStrong">{item.title}</Text>
                <Text color="textSecondary" variant="caption">
                  {item.hint}
                </Text>
              </View>
              <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
            </Card>
          ))}
        </View>

        <Text style={styles.sectionTitle} variant="heading">
          How we protect you
        </Text>
        <Card style={styles.assurances}>
          {assurances.map((item, index) => (
            <View
              key={item.title}
              style={[styles.assurance, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Ionicons color={colors.success} name={item.icon} size={22} />
              <View style={styles.shortcutCopy}>
                <Text variant="bodyStrong">{item.title}</Text>
                <Text color="textSecondary" variant="caption">
                  {item.text}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      <BottomNavBar activeTab={NavTab.Home} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: Spacing.xs },
  exitPill: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  exitText: { fontWeight: '700' },
  iconButton: {
    alignItems: 'center',
    height: Layout.minTapTarget,
    justifyContent: 'center',
    width: Layout.minTapTarget,
  },
  pressed: { opacity: 0.6 },
  content: {
    paddingBottom: Layout.bottomNavInset,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xxl,
  },
  hero: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  actions: { gap: Spacing.md, marginBottom: Spacing.xxxl },
  sectionTitle: { marginBottom: Spacing.md },
  shortcuts: { gap: Spacing.md, marginBottom: Spacing.xxxl },
  shortcut: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md },
  shortcutCopy: { flex: 1, gap: 2 },
  assurances: { paddingVertical: 0 },
  assurance: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.lg },
});
