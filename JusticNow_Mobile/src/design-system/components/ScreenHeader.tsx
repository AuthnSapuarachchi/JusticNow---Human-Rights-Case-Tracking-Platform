import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Layout, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { LanguageToggle, type AppLanguage } from './LanguageToggle';
import { Text } from './Text';

export type ScreenHeaderProps = {
  title: string;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  /** Shows a back control. Omit on tab-root screens. */
  onBack?: () => void;
  /** Accessible name for the back control — from an i18n key, e.g. "Go back". */
  backLabel?: string;
  /** Optional trailing notification control. */
  onNotificationsPress?: () => void;
  notificationsLabel?: string;
};

/**
 * The header every screen uses. It exists mainly so the language toggle cannot
 * be forgotten on a screen — our research made it a requirement everywhere.
 */
export function ScreenHeader({
  title,
  language,
  onLanguageChange,
  onBack,
  backLabel = 'Go back',
  onNotificationsPress,
  notificationsLabel = 'Notifications',
}: ScreenHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.leading}>
        {onBack ? (
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="arrow-back" size={22} />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={styles.title} variant="heading">
          {title}
        </Text>
      </View>

      <View style={styles.trailing}>
        <LanguageToggle language={language} onChange={onLanguageChange} />
        {onNotificationsPress ? (
          <Pressable
            accessibilityLabel={notificationsLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onNotificationsPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primary} name="notifications-outline" size={22} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
  },
  leading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
    minWidth: Layout.minTapTarget - 12,
  },
  pressed: {
    opacity: 0.6,
  },
});
