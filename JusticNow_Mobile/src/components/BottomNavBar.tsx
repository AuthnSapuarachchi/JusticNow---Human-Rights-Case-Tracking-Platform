import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/design-system/components';
import { Layout, Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

export enum NavTab {
  Home = 'Home',
  Cases = 'Cases',
  Messages = 'Messages',
  Support = 'Support',
}

interface BottomNavBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

// Extracts the exact valid icon names from Ionicons to prevent TypeScript errors
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { label: NavTab; activeIcon: IoniconName; inactiveIcon: IoniconName }[] = [
  { label: NavTab.Home, activeIcon: 'home', inactiveIcon: 'home-outline' },
  { label: NavTab.Cases, activeIcon: 'folder', inactiveIcon: 'folder-outline' },
  { label: NavTab.Messages, activeIcon: 'chatbubble', inactiveIcon: 'chatbubble-outline' },
  { label: NavTab.Support, activeIcon: 'help-circle', inactiveIcon: 'help-circle-outline' },
];

/** Total height above the safe-area inset. Screens pad their scroll content by `Layout.bottomNavInset`. */
const BAR_HEIGHT = 68;

export function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, Spacing.sm) },
      ]}
    >
      <View style={styles.bar}>
        {tabs.map(({ label, activeIcon, inactiveIcon }) => {
          const isActive = activeTab === label;

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={label}
              onPress={() => onTabPress(label)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={[styles.indicator, isActive && { backgroundColor: colors.primarySoft }]}>
                <Ionicons
                  color={isActive ? colors.primary : colors.textTertiary}
                  name={isActive ? activeIcon : inactiveIcon}
                  size={22}
                />
              </View>
              <Text
                color={isActive ? 'primary' : 'textSecondary'}
                numberOfLines={1}
                style={[styles.label, isActive && styles.activeLabel]}
                variant="caption"
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: BAR_HEIGHT,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minHeight: Layout.minTapTarget,
  },
  indicator: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 56,
  },
  label: {
    fontSize: 14,
  },
  activeLabel: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
