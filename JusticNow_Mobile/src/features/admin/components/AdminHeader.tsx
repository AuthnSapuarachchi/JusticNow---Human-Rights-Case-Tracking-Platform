import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { NavTab } from '@/components/BottomNavBar';
import { Text } from '@/design-system/components';
import { Layout, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface AdminHeaderProps {
  eyebrow: string;
  title: string;
  /** Where the back arrow goes. Defaults to the admin dashboard. */
  backTo?: string;
  right?: React.ReactNode;
}

export function AdminHeader({ eyebrow, title, backTo = '/admin', right }: AdminHeaderProps) {
  const colors = useColors();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(backTo as any);
  };

  return (
    <View style={styles.header}>
      <View style={styles.leading}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textPrimary} name="arrow-back" size={24} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text color="primary" variant="eyebrow">
            {eyebrow}
          </Text>
          <Text numberOfLines={1} variant="heading">
            {title}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

/**
 * Bottom-nav handler shared by every admin screen.
 */
export function useAdminTabPress() {
  const router = useRouter();
  return (tab: string) => {
    if (tab === NavTab.Home) router.replace('/admin' as any);
    if (tab === NavTab.Cases) router.push('/admin/cases' as any);
    if (tab === NavTab.Messages) router.push('/messages' as any);
    if (tab === NavTab.Support) router.push('/legal-support' as any);
  };
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  leading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  titleWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
