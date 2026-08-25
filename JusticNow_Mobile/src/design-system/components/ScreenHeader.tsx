import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n';

import { Layout, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { LanguageToggle } from './LanguageToggle';
import { Text } from './Text';

export type ScreenHeaderProps = {
  /** Already-translated title, e.g. `t('directory.title')`. */
  title: string;
  /** Shows a back control. Omit on tab-root screens. */
  onBack?: () => void;
  /** Optional trailing notification control. */
  onNotificationsPress?: () => void;
};

/**
 * The header every screen uses.
 *
 * It reads the language from `useTranslation()` itself rather than taking it as
 * a prop, so a screen physically cannot render a header without the toggle —
 * which our user research made a requirement on every screen.
 */
export function ScreenHeader({ title, onBack, onNotificationsPress }: ScreenHeaderProps) {
  const colors = useColors();
  const { t, language, setLanguage } = useTranslation();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.leading}>
        {onBack ? (
          <Pressable
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.textPrimary} name="arrow-back" size={22} />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={styles.title} variant={onBack ? 'pageTitle' : 'screenTitle'}>
          {title}
        </Text>
      </View>

      <View style={styles.trailing}>
        <LanguageToggle language={language} onChange={setLanguage} />
        {onNotificationsPress ? (
          <Pressable
            accessibilityLabel={t('common.notifications')}
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
